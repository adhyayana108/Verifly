package handlers

import (
	"net/http"
	"time"
	"verifly/internal/models"
)

type adminUserView struct {
	models.PublicUser
	QuotaUsedToday int `json:"quotaUsedToday"`
}

// AdminListUsers handles GET /api/admin/users

func (a *API) AdminListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := a.Store.ListUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}

	views := make([]adminUserView, 0, len(users))
	for _, u := range users {
		used, _ := a.Store.GetQuotaUsage(u.ID, time.Now())
		views = append(views, adminUserView{
			PublicUser:     u.Public(),
			QuotaUsedToday: used,
		})
	}

	writeJSON(w, http.StatusOK, views)
}
