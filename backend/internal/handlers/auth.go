package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
	"verifly/internal/auth"
	"verifly/internal/middleware"
	"verifly/internal/models"
	"verifly/internal/storage"
)

type API struct {
	Store     storage.Store
	JWTSecret []byte
}

const tokenTTL = 24 * time.Hour

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResponse struct {
	Token string            `json:"token"`
	User  models.PublicUser `json:"user"`
}

// Register handles POST /api/auth/register

func (a *API) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)

	if req.Username == "" || req.Email == "" || len(req.Password) < 8 {
		writeError(w, http.StatusBadRequest, "username and email are required, and password must be at least 8 characters")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	role := "user"
	if existing, err := a.Store.ListUsers(); err == nil && len(existing) == 0 {
		role = "admin"
	}

	user, err := a.Store.CreateUser(req.Username, req.Email, hash, role)
	if err != nil {
		switch err {
		case storage.ErrDuplicateUsername:
			writeError(w, http.StatusConflict, "username already taken")
		case storage.ErrDuplicateEmail:
			writeError(w, http.StatusConflict, "email already registered")
		default:
			writeError(w, http.StatusInternalServerError, "failed to create user")
		}
		return
	}

	token, err := auth.GenerateToken(a.JWTSecret, user.ID, user.Username, user.Role, tokenTTL)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	writeJSON(w, http.StatusCreated, authResponse{Token: token, User: user.Public()})
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login handles POST /api/auth/login
func (a *API) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	user, err := a.Store.GetUserByUsername(strings.TrimSpace(req.Username))
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}

	ok, err := auth.VerifyPassword(req.Password, user.PasswordHash)
	if err != nil || !ok {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}

	token, err := auth.GenerateToken(a.JWTSecret, user.ID, user.Username, user.Role, tokenTTL)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to issue token")
		return
	}

	writeJSON(w, http.StatusOK, authResponse{Token: token, User: user.Public()})
}

// Me handles GET /api/auth/me
func (a *API) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	user, err := a.Store.GetUserByID(claims.UserID)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, user.Public())
}
