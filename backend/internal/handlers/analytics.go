package handlers

import (
	"net/http"
	"verifly/internal/middleware"
	"verifly/internal/models"
)

// Analytics handles GET /api/analytics

func (a *API) Analytics(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	history, err := a.Store.GetHistory(claims.UserID, 0)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load history")
		return
	}

	summary := buildAnalyticsSummary(history)
	writeJSON(w, http.StatusOK, summary)
}

func buildAnalyticsSummary(history []models.VerificationRecord) models.AnalyticsSummary {
	summary := models.AnalyticsSummary{}

	var mxCount, spfCount, dmarcCount int

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

	}

	if summary.TotalChecked > 0 {
		total := float64(summary.TotalChecked)
		summary.MXPresentRate = round2(float64(mxCount) / total * 100)
		summary.SPFPresentRate = round2(float64(spfCount) / total * 100)
		summary.DMARCPresentRate = round2(float64(dmarcCount) / total * 100)
	}

	return summary
}

func round2(f float64) float64 {
	return float64(int(f*100+0.5)) / 100
}
