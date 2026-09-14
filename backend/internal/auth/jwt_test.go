package auth

import (
	"testing"
	"time"
)

func TestJWTRoundTrip(t *testing.T) {
	secret := []byte("test-secret")
	token, err := GenerateToken(secret, "user-1", "alice", "user", time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}
	claims, err := ParseToken(secret, token)
	if err != nil {
		t.Fatalf("ParseToken failed: %v", err)
	}
	if claims.UserID != "user-1" || claims.Username != "alice" || claims.Role != "user" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestJWTRejectsWrongSecret(t *testing.T) {
	token, err := GenerateToken([]byte("secret-a"), "user-1", "alice", "user", time.Hour)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := ParseToken([]byte("secret-b"), token); err != ErrInvalidToken {
		t.Fatalf("expected ErrInvalidToken for a token signed with a different secret, got %v", err)
	}
}

func TestJWTRejectsExpiredToken(t *testing.T) {
	secret := []byte("test-secret")
	token, err := GenerateToken(secret, "user-1", "alice", "user", -time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := ParseToken(secret, token); err != ErrExpiredToken {
		t.Fatalf("expected ErrExpiredToken, got %v", err)
	}
}

func TestJWTRejectsMalformedToken(t *testing.T) {
	secret := []byte("test-secret")
	cases := []string{"", "not-a-jwt", "a.b", "a.b.c.d", "!!!.###.$$$"}
	for _, c := range cases {
		if _, err := ParseToken(secret, c); err == nil {
			t.Fatalf("expected an error for malformed token %q", c)
		}
	}
}