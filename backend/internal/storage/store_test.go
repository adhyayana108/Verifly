package storage

import (
	"path/filepath"
	"testing"
	"time"

	"verifly/internal/models"
)

func newTestStore(t *testing.T) (*JSONStore, string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "store.json")
	s, err := NewJSONStore(path)
	if err != nil {
		t.Fatalf("NewJSONStore failed: %v", err)
	}
	return s, path
}

func TestCreateAndGetUser(t *testing.T) {
	s, _ := newTestStore(t)

	u, err := s.CreateUser("alice", "alice@example.com", "hashed-pw", "user")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if u.ID == "" {
		t.Fatal("expected a non-empty generated user ID")
	}

	byName, err := s.GetUserByUsername("ALICE") // case-insensitive lookup
	if err != nil {
		t.Fatalf("GetUserByUsername failed: %v", err)
	}
	if byName.ID != u.ID {
		t.Fatal("expected case-insensitive username lookup to find the same user")
	}

	byID, err := s.GetUserByID(u.ID)
	if err != nil {
		t.Fatalf("GetUserByID failed: %v", err)
	}
	if byID.Username != "alice" {
		t.Fatalf("expected username 'alice', got %q", byID.Username)
	}
}

func TestCreateUserRejectsDuplicateUsername(t *testing.T) {
	s, _ := newTestStore(t)

	if _, err := s.CreateUser("bob", "bob@example.com", "hash1", "user"); err != nil {
		t.Fatalf("first CreateUser failed: %v", err)
	}
	_, err := s.CreateUser("Bob", "bob2@example.com", "hash2", "user")
	if err != ErrDuplicateUsername {
		t.Fatalf("expected ErrDuplicateUsername, got %v", err)
	}
}

func TestCreateUserRejectsDuplicateEmail(t *testing.T) {
	s, _ := newTestStore(t)

	if _, err := s.CreateUser("carol", "carol@example.com", "hash1", "user"); err != nil {
		t.Fatalf("first CreateUser failed: %v", err)
	}
	_, err := s.CreateUser("carol2", "Carol@Example.com", "hash2", "user")
	if err != ErrDuplicateEmail {
		t.Fatalf("expected ErrDuplicateEmail, got %v", err)
	}
}

func TestDailyQuotaEnforcement(t *testing.T) {
	s, _ := newTestStore(t)
	u, err := s.CreateUser("dave", "dave@example.com", "hash", "user")
	if err != nil {
		t.Fatal(err)
	}

	day := time.Now()
	quota := 3

	for i := 1; i <= quota; i++ {
		used, err := s.IncrementQuota(u.ID, quota, day)
		if err != nil {
			t.Fatalf("unexpected error on increment %d: %v", i, err)
		}
		if used != i {
			t.Fatalf("expected used=%d, got %d", i, used)
		}
	}

	if _, err := s.IncrementQuota(u.ID, quota, day); err != ErrQuotaExceeded {
		t.Fatalf("expected ErrQuotaExceeded once quota is used up, got %v", err)
	}

	usage, err := s.GetQuotaUsage(u.ID, day)
	if err != nil {
		t.Fatal(err)
	}
	if usage != quota {
		t.Fatalf("expected recorded usage to stay at %d after a rejected increment, got %d", quota, usage)
	}
}

func TestVerificationHistoryOrderingAndFilter(t *testing.T) {
	s, _ := newTestStore(t)
	u, err := s.CreateUser("erin", "erin@example.com", "hash", "user")
	if err != nil {
		t.Fatal(err)
	}
	other, err := s.CreateUser("frank", "frank@example.com", "hash", "user")
	if err != nil {
		t.Fatal(err)
	}

	base := time.Now().Add(-time.Hour)
	domains := []string{"a.com", "b.com", "c.com"}
	for i, d := range domains {
		rec := models.VerificationRecord{
			UserID:    u.ID,
			Domain:    d,
			Valid:     true,
			CheckedAt: base.Add(time.Duration(i) * time.Minute),
		}
		if err := s.AddVerificationCode(rec); err != nil {
			t.Fatalf("AddVerificationRecord failed: %v", err)
		}
	}
	if err := s.AddVerificationCode(models.VerificationRecord{UserID: other.ID, Domain: "other.com", CheckedAt: base}); err != nil {
		t.Fatal(err)
	}

	hist, err := s.GetHistory(u.ID, 0)
	if err != nil {
		t.Fatalf("GetHistory failed: %v", err)
	}
	if len(hist) != len(domains) {
		t.Fatalf("expected %d records for user, got %d", len(domains), len(hist))
	}
	want := []string{"c.com", "b.com", "a.com"}
	for i, w := range want {
		if hist[i].Domain != w {
			t.Fatalf("history[%d]: expected domain %q, got %q", i, w, hist[i].Domain)
		}
	}

	limited, err := s.GetHistory(u.ID, 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(limited) != 2 {
		t.Fatalf("expected limit=2 to return 2 records, got %d", len(limited))
	}
}

func TestPersistenceAcrossReload(t *testing.T) {
	path := filepath.Join(t.TempDir(), "store.json")

	s1, err := NewJSONStore(path)
	if err != nil {
		t.Fatalf("NewJSONStore failed: %v", err)
	}
	u, err := s1.CreateUser("grace", "grace@example.com", "hash", "admin")
	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}
	if err := s1.AddVerificationCode(models.VerificationRecord{
		UserID:    u.ID,
		Domain:    "persisted.com",
		HasMX:     true,
		Valid:     true,
		CheckedAt: time.Now(),
	}); err != nil {
		t.Fatalf("RecordVerification failed: %v", err)
	}
	if _, err := s1.IncrementQuota(u.ID, 100, time.Now()); err != nil {
		t.Fatalf("IncrementQuota failed: %v", err)
	}

	s2, err := NewJSONStore(path)
	if err != nil {
		t.Fatalf("reopening store failed: %v", err)
	}

	reloadedUser, err := s2.GetUserByUsername("grace")
	if err != nil {
		t.Fatalf("expected user to survive reload: %v", err)
	}
	if reloadedUser.Role != "admin" {
		t.Fatalf("expected role 'admin' to survive reload, got %q", reloadedUser.Role)
	}

	hist, err := s2.GetHistory(u.ID, 0)
	if err != nil {
		t.Fatal(err)
	}
	if len(hist) != 1 || hist[0].Domain != "persisted.com" {
		t.Fatalf("expected verification history to survive reload, got %+v", hist)
	}

	usage, err := s2.GetQuotaUsage(u.ID, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if usage != 1 {
		t.Fatalf("expected quota usage to survive reload as 1, got %d", usage)
	}
}
