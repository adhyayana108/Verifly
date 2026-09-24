package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"
	"verifly/internal/dnscheck"
	"verifly/internal/middleware"
	"verifly/internal/storage"
)

// Verify handles GET /api/verify?domain=example.com

func (a *API) Verify(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	domain := strings.TrimSpace(r.URL.Query().Get("domain"))
	domain = strings.ToLower(strings.TrimSuffix(domain, "."))
	if domain == "" {
		writeError(w, http.StatusBadRequest, "missing required query parameter: domain")
		return
	}

	user, err := a.Store.GetUserByID(claims.UserID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "user not found")
		return
	}

	if _, err := a.Store.IncrementQuota(user.ID, user.DailyQuota, time.Now()); err != nil {
		if err == storage.ErrQuotaExceeded {
			writeError(w, http.StatusTooManyRequests, "daily verification quota exceeded")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to check quota")
		return
	}

	rec := dnscheck.Check(r.Context(), domain)
	rec.UserID = user.ID
	rec.CheckedAt = time.Now().UTC()

	if err := a.Store.AddVerificationCode(rec); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save verification result")
		return
	}

	writeJSON(w, http.StatusOK, rec)
}

// History handles GET /api/history?limit=50

func (a *API) History(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	limit := 0 // 0 == no limit
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	history, err := a.Store.GetHistory(claims.UserID, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load history")
		return
	}
	writeJSON(w, http.StatusOK, history)
}
