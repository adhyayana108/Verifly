package dnscheck

import (
	"context"
	"net"
	"strings"
	"time"
	"verifly/internal/models"
)

const lookupTimeout = 8 * time.Second

type BulkResult struct {
	Index  int
	Record models.VerificationRecord
}

func Check(ctx context.Context, domain string) models.VerificationRecord {

	rec := models.VerificationRecord{Domain: domain}

	ctx, cancel := context.WithTimeout(ctx, lookupTimeout)
	defer cancel()

	resolver := net.DefaultResolver

	// mx records

	mxRecords, err := resolver.LookupMX(ctx, domain)
	if err != nil {
		if !isNoSuchHost(err) {
			rec.Error = appendErr(rec.Error, "MX: "+err.Error())
		}
	} else if len(mxRecords) > 0 {
		rec.HasMX = true
		for _, mx := range mxRecords {
			rec.MXHosts = append(rec.MXHosts, strings.TrimSuffix(mx.Host, "."))
		}
	}

	//spf records

	txtRecords, err := resolver.LookupTXT(ctx, domain)
	if err != nil {
		if !isNoSuchHost(err) {
			rec.Error = appendErr(rec.Error, "TXT: "+err.Error())
		}
	} else {
		for _, txt := range txtRecords {
			if strings.HasPrefix(strings.ToLower(txt), "v=spf1") {
				rec.HasSPF = true
				rec.SPFRecord = txt
				break
			}
		}
	}

	//dmarc records

	dmarcRecords, err := resolver.LookupTXT(ctx, "_dmarc."+domain)
	if err != nil {
		if !isNoSuchHost(err) {
			rec.Error = appendErr(rec.Error, "DMARC: "+err.Error())
		}
	} else {
		for _, txt := range dmarcRecords {
			if strings.HasPrefix(strings.ToUpper(txt), "V=DMARC1") {
				rec.HasDMARC = true
				rec.DMARCRecord = txt
				break
			}
		}
	}

	rec.Valid = rec.HasMX && rec.HasSPF && rec.HasDMARC

	return rec
}

func isNoSuchHost(err error) bool {
	var dnsErr *net.DNSError
	if ok := asDNSError(err, &dnsErr); ok {
		return dnsErr.IsNotFound
	}
	return false
}

func asDNSError(err error, target **net.DNSError) bool {
	for err != nil {
		if de, ok := err.(*net.DNSError); ok {
			*target = de
			return true
		}
		unwrapper, ok := err.(interface{ Unwrap() error })
		if !ok {
			return false
		}
		err = unwrapper.Unwrap()
	}
	return false
}

func appendErr(existing, next string) string {
	if existing == "" {
		return next
	}
	return existing + "; " + next
}

// bulk results

const maxConcurrency = 10

func CheckBulk(ctx context.Context, domains []string) <-chan BulkResult {
	out := make(chan BulkResult)
	sem := make(chan struct{}, maxConcurrency)

	go func() {
		defer close(out)
		done := make(chan struct{})
		remaining := len(domains)
		if remaining == 0 {
			return
		}

		for i, domain := range domains {
			sem <- struct{}{}
			go func(i int, domain string) {
				defer func() {
					<-sem
					done <- struct{}{}
				}()
				rec := Check(ctx, domain)
				select {
				case out <- BulkResult{Index: i, Record: rec}:
				case <-ctx.Done():
				}
			}(i, domain)
		}

		for remaining > 0 {
			<-done
			remaining--
		}
	}()

	return out
}
