package handlers

import (
	"net/http"
	"time"

	"verifly/internal/middleware"
	"verifly/internal/models"
)

// Analytics handles GET /api/analytics.
func (a *API) Analytics(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	history, err := a.Store.GetHistory(claims.UserID, 0)
	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"failed to load history",
		)
		return
	}

	summary := buildAnalyticsSummary(history)

	writeJSON(w, http.StatusOK, summary)
}

func buildAnalyticsSummary(
	history []models.VerificationRecord,
) models.AnalyticsSummary {
	summary := models.AnalyticsSummary{
		CheckedByDay: make(map[string]int),
		RecentDomains: make([]string, 0, 8),
	}

	seenDomains := make(map[string]struct{})

	var (
		mxCount    int
		spfCount   int
		dmarcCount int
	)

	for _, rec := range history {
		summary.TotalChecked++

		if rec.Valid {
			summary.ValidCount++
		} else {
			summary.InvalidCount++
		}

		if rec.HasMX {
			mxCount++
		}

		if rec.HasSPF {
			spfCount++
		}

		if rec.HasDMARC {
			dmarcCount++
		}

		// Build daily activity data.
		if !rec.CheckedAt.IsZero() {
			day := analyticsDay(rec.CheckedAt)
			summary.CheckedByDay[day]++
		}

		// Keep the first 8 unique recently checked domains.
		if len(summary.RecentDomains) < 8 {
			if _, exists := seenDomains[rec.Domain]; !exists {
				seenDomains[rec.Domain] = struct{}{}
				summary.RecentDomains = append(
					summary.RecentDomains,
					rec.Domain,
				)
			}
		}
	}

	// Calculate record adoption percentages.
	if summary.TotalChecked > 0 {
		total := float64(summary.TotalChecked)

		summary.MXPresentRate = round2(
			float64(mxCount)/total*100,
		)

		summary.SPFPresentRate = round2(
			float64(spfCount)/total*100,
		)

		summary.DMARCPresentRate = round2(
			float64(dmarcCount)/total*100,
		)
	}

	return summary
}

func round2(f float64) float64 {
	return float64(int(f*100+0.5)) / 100
}

func analyticsDay(t time.Time) string {
	return t.UTC().Format("2006-01-02")
}
