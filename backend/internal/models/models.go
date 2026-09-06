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
	UserID      string    `json:"userId"`
	Domain      string    `json:"domain"`
	HasMX       bool      `json:"hasMX"`
	HasSPF      bool      `json:"hasSPF"`
	HasDMARC    bool      `json:"hasDMARC"`
	SPFRecord   string    `json:"spfRecord,omitempty"`
	DMARCRecord string    `json:"dmarcRecord,omitempty"`
	MXHosts     []string  `json:"mxHosts,omitempty"`
	Valid       bool      `json:"valid"`
	Error       string    `json:"error,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
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
