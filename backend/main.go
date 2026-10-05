package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"verifly/internal/handlers"
	"verifly/internal/middleware"
	"verifly/internal/storage"
)

const (
	defaultPort   = "8080"
	dataStorePath = "data/store.json"
	frontendDist  = "../frontend/dist"
)

func main() {
	secret := loadJWTSecret()

	store, err := storage.NewJSONStore(dataStorePath)
	if err != nil {
		log.Fatalf("failed to initialize storage: %v", err)
	}

	api := &handlers.API{
		Store:     store,
		JWTSecret: secret,
	}

	mux := http.NewServeMux()

	// Public routes.
	mux.HandleFunc("POST /api/auth/register", api.Register)
	mux.HandleFunc("POST /api/auth/login", api.Login)
	mux.HandleFunc("GET /api/healthz", healthz)

	// Authenticated routes.
	requireAuth := middleware.RequireAuth(secret)

	mux.Handle(
		"GET /api/auth/me",
		requireAuth(http.HandlerFunc(api.Me)),
	)

	mux.Handle(
		"GET /api/verify",
		requireAuth(http.HandlerFunc(api.Verify)),
	)

	mux.Handle(
		"POST /api/bulk-verify",
		requireAuth(http.HandlerFunc(api.BulkVerify)),
	)

	mux.Handle(
		"GET /api/history",
		requireAuth(http.HandlerFunc(api.History)),
	)

	mux.Handle(
		"GET /api/analytics",
		requireAuth(http.HandlerFunc(api.Analytics)),
	)

	// Admin-only route.
	mux.Handle(
		"GET /api/admin/users",
		requireAuth(
			middleware.RequireAdmin(
				http.HandlerFunc(api.AdminListUsers),
			),
		),
	)

	// Serve the React SPA for non-API routes.
	mux.Handle("/", spaFileServer(frontendDist))

	handler := middleware.CORS(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 60 * time.Second, // bulk verification streams can run a while
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("VERIFLY API listening on :%s", port)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}

func spaFileServer(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			writeNotFoundJSON(w)
			return
		}

		cleanPath := filepath.Clean(r.URL.Path)
		fullPath := filepath.Join(dir, cleanPath)

		if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, filepath.Join(dir, "index.html"))
	})
}

func writeNotFoundJSON(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	_, _ = w.Write([]byte(`{"error":"not found"}`))
}

func healthz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeNotFoundJSON(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func loadJWTSecret() []byte {
	if v := os.Getenv("JWT_SECRET"); v != "" {
		return []byte(v)
	}

	buf := make([]byte, 32)

	if _, err := rand.Read(buf); err != nil {
		log.Fatalf("failed to generate a fallback JWT secret: %v", err)
	}

	log.Printf(
		"WARNING: JWT_SECRET is not set. Using a random secret for this "+
			"process only (%s...) — every session will be invalidated on restart. "+
			"Set JWT_SECRET before deploying anywhere real.",
		hex.EncodeToString(buf[:4]),
	)

	return buf
}
