package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"verifly/internal/auth"
)

type contextKey string

const claimsContextKey contextKey = "claims"

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})

}

// RequireAuth

func RequireAuth(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				writeUnauthorized(w, "missing or malformed Authorization header")
				return
			}
			token := strings.TrimPrefix(header, "Bearer ")

			claims, err := auth.ParseToken(secret, token)
			if err != nil {
				if err == auth.ErrExpiredToken {
					writeUnauthorized(w, "session expired, please log in again")
					return
				}
				writeUnauthorized(w, "invalid token")
				return
			}

			ctx := context.WithValue(r.Context(), claimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := ClaimsFromContext(r.Context())
		if claims == nil || claims.Role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "admin access required"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// ClaimsFromContext

func ClaimsFromContext(ctx context.Context) *auth.Claims {
	claims, _ := ctx.Value(claimsContextKey).(*auth.Claims)
	return claims
}

func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
