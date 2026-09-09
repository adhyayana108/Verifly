package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"createdAt"`
	DailyQuota   int       `json:"dailyQuota"`
}

type PublicUser struct {
	ID         string    `json:"id"`
	Username   string    `json:"username"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	CreatedAt  time.Time `json:"createdAt"`
	DailyQuota int       `json:"dailyQuota"`
}

func (u User) Public() PublicUser {
	return PublicUser{
		ID:         u.ID,
		Username:   u.Username,
		Email:      u.Email,
		Role:       u.Role,
		CreatedAt:  u.CreatedAt,
		DailyQuota: u.DailyQuota,
	}
}

type VerificationRecord struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Domain      string    `json:"domain"`
	HasMX       bool      `json:"has_mx"`
	MXHosts     []string  `json:"mx_hosts,omitempty"`
	HasSPF      bool      `json:"has_spf"`
	SPFRecord   string    `json:"spf_record,omitempty"`
	HasDMARC    bool      `json:"has_dmarc"`
	DMARCRecord string    `json:"dmarc_record,omitempty"`
	Valid       bool      `json:"valid"`
	Error       string    `json:"error,omitempty"`
	CheckedAt   time.Time `json:"checked_at"`
}

type AnalyticsSummary struct {
	TotalChecked     int            `json:"totalChecked"`
	ValidCount       int            `json:"validCount"`
	InvalidCount     int            `json:"invalidCount"`
	MXPresentRate    float64        `json:"mxPresentRate"`
	SPFPresentRate   float64        `json:"spfPresentRate"`
	DMARCPresentRate float64        `json:"dmarcPresentRate"`
	CheckedByDate    map[string]int `json:"checkedByDate"`
	RecentDpmain     []string       `json:"recentDomains"`
}
