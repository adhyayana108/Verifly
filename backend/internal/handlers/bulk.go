package handlers

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
	"verifly/internal/dnscheck"
	"verifly/internal/middleware"
	"verifly/internal/models"
	"verifly/internal/storage"
)

const (
	maxBulkDomains = 500
	maxUploadBytes = 5 << 20 // 5 MB
)

// ExtractDomainsFromCSV

func ExtractDomainsFromCSV(r io.Reader) ([]string, error) {
	reader := csv.NewReader(bufio.NewReader(r))
	reader.FieldsPerRecord = -1 // allow ragged rows (plain lists have 1 column)
	reader.TrimLeadingSpace = true

	var rows [][]string
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("parsing CSV: %w", err)
		}
		if rowIsBlank(record) {
			continue
		}
		rows = append(rows, record)
	}
	if len(rows) == 0 {
		return nil, nil
	}

	domainCol, startRow := 0, 0
	for i, field := range rows[0] {
		if strings.EqualFold(strings.TrimSpace(field), "domain") {
			domainCol, startRow = i, 1
			break
		}
	}

	seen := make(map[string]bool)
	var domains []string
	for _, row := range rows[startRow:] {
		if domainCol >= len(row) {
			continue
		}
		d := strings.ToLower(strings.TrimSpace(row[domainCol]))
		d = strings.TrimSuffix(d, ".")
		if d == "" || seen[d] {
			continue
		}
		seen[d] = true
		domains = append(domains, d)
	}
	return domains, nil
}

func rowIsBlank(row []string) bool {
	for _, field := range row {
		if strings.TrimSpace(field) != "" {
			return false
		}
	}
	return true
}

// bulkEvent

type bulkEvent struct {
	Type      string                     `json:"type"`
	Record    *models.VerificationRecord `json:"record,omitempty"`
	Completed int                        `json:"completed"`
	Total     int                        `json:"total"`
}

// BulkVerify

func (a *API) BulkVerify(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	user, err := a.Store.GetUserByID(claims.UserID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "user not found")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		writeError(w, http.StatusBadRequest, "could not parse upload (file too large or malformed multipart form): "+err.Error())
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing 'file' field in the uploaded form")
		return
	}
	defer file.Close()

	domains, err := ExtractDomainsFromCSV(file)
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to parse CSV: "+err.Error())
		return
	}
	if len(domains) == 0 {
		writeError(w, http.StatusBadRequest, "no domains found in the uploaded file")
		return
	}
	if len(domains) > maxBulkDomains {
		writeError(w, http.StatusBadRequest, fmt.Sprintf("too many domains: got %d, max is %d per upload", len(domains), maxBulkDomains))
		return
	}

	flusher, canFlush := w.(http.Flusher)
	w.Header().Set("Content-Type", "application/x-ndjson")
	w.WriteHeader(http.StatusOK)

	encoder := json.NewEncoder(w)
	total := len(domains)
	completed := 0

	emit := func(ev bulkEvent) {
		if err := encoder.Encode(ev); err != nil {
			log.Printf("handlers: bulk verify: failed writing stream event: %v", err)
			return
		}
		if canFlush {
			flusher.Flush()
		}
	}

	for result := range dnscheck.CheckBulk(r.Context(), domains) {
		rec := result.Record
		rec.UserID = user.ID
		rec.CheckedAt = time.Now().UTC()

		if _, err := a.Store.IncrementQuota(user.ID, user.DailyQuota, time.Now()); err != nil {
			if err == storage.ErrQuotaExceeded {
				emit(bulkEvent{Type: "quota_exceeded", Completed: completed, Total: total})
				break
			}
			log.Printf("handlers: bulk verify: quota check failed: %v", err)
			continue
		}

		if err := a.Store.AddVerificationCode(rec); err != nil {
			log.Printf("handlers: bulk verify: failed saving result for %s: %v", rec.Domain, err)
		}

		completed++
		emit(bulkEvent{Type: "result", Record: &rec, Completed: completed, Total: total})
	}

	emit(bulkEvent{Type: "done", Completed: completed, Total: total})
}
