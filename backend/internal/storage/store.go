package storage

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
	"verifly/internal/models"
)

var (
	ErrDuplicateUsername = errors.New("storage: username already taken")
	ErrDuplicateEmail    = errors.New("storage: email already registered")
	ErrUserNotFound      = errors.New("storage: user not found")
	ErrQuotaExceeded     = errors.New("storage: daily quota exceeded")
)

const DefaultDailyQuota = 100

type Store interface {
	CreateUser(username, email, passwordHash, role string) (models.User, error)
	GetUserByUsername(username string) (models.User, error)
	GetUserByID(id string) (models.User, error)
	ListUsers() ([]models.User, error)
	AddVerificationCode(rec models.VerificationRecord) error
	GetHistory(userID string, limit int) ([]models.VerificationRecord, error)
	IncrementQuota(userID string, quota int, day time.Time) (used int, err error)
	GetQuotaUsage(userID string, day time.Time) (used int, err error)
}

type storeData struct {
	Users        map[string]models.User
	UsernameToID map[string]string
	EmailToID    map[string]string
	Records      []models.VerificationRecord
	Quota        map[string]int
	NextUserSeq  int
	NextRecSeq   int
}

func newStoreData() *storeData {
	return &storeData{
		Users:        make(map[string]models.User),
		UsernameToID: make(map[string]string),
		EmailToID:    make(map[string]string),
		Records:      make([]models.VerificationRecord, 0),
		Quota:        make(map[string]int),
	}
}

type JSONStore struct {
	mu   sync.RWMutex
	path string
	data *storeData
}

func NewJSONStore(path string) (*JSONStore, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("storage: creating data directory: %w", err)
	}

	s := &JSONStore{path: path}

	raw, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		s.data = newStoreData()
		if err := s.persistLocked(); err != nil {
			return nil, err
		}
		return s, nil
	}
	if err != nil {
		return nil, fmt.Errorf("storage: reading store file: %w", err)
	}

	var d storeData
	if err := json.Unmarshal(raw, &d); err != nil { // JSON into Go structures
		return nil, fmt.Errorf("storage: parsing store file: %w", err)
	}
	if d.Users == nil {
		d.Users = make(map[string]models.User)
	}
	if d.UsernameToID == nil {
		d.UsernameToID = make(map[string]string)
	}
	if d.EmailToID == nil {
		d.EmailToID = make(map[string]string)
	}
	if d.Quota == nil {
		d.Quota = make(map[string]int)
	}
	s.data = &d
	return s, nil
}

func (s *JSONStore) persistLocked() error {
	tmp := s.path + ".tmp"
	f, err := os.Create(tmp)
	if err != nil {
		return fmt.Errorf("storage: creating temp file: %w", err)
	}
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(s.data); err != nil {
		f.Close()
		os.Remove(tmp)
		return fmt.Errorf("storage: encoding store: %w", err)
	}
	if err := f.Close(); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("storage: closing temp file: %w", err)
	}
	if err := os.Rename(tmp, s.path); err != nil {
		return fmt.Errorf("storage: renaming temp file into place: %w", err)
	}
	return nil
}

func quotaKey(userID string, day time.Time) string {
	return userID + "|" + day.UTC().Format("2006-01-02")
}

// create user

func (s *JSONStore) CreateUser(username, email, passwordHash, role string) (models.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	lowerUser := strings.ToLower(username)
	lowerEmail := strings.ToLower(email)

	if _, exists := s.data.UsernameToID[lowerUser]; exists {
		return models.User{}, ErrDuplicateUsername
	}
	if _, exists := s.data.EmailToID[lowerEmail]; exists {
		return models.User{}, ErrDuplicateEmail
	}

	s.data.NextUserSeq++
	id := fmt.Sprintf("u_%d", s.data.NextUserSeq)

	u := models.User{
		ID:           id,
		Username:     username,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
		CreatedAt:    time.Now().UTC(),
		DailyQuota:   DefaultDailyQuota,
	}

	s.data.Users[id] = u
	s.data.UsernameToID[lowerUser] = id
	s.data.EmailToID[lowerEmail] = id

	if err := s.persistLocked(); err != nil {
		return models.User{}, err
	}
	return u, nil
}

func (s *JSONStore) GetUserByUsername(username string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	id, ok := s.data.UsernameToID[strings.ToLower(username)]
	if !ok {
		return models.User{}, ErrUserNotFound
	}
	u, ok := s.data.Users[id]
	if !ok {
		return models.User{}, ErrUserNotFound
	}
	return u, nil
}

func (s *JSONStore) GetUserByID(id string) (models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, ok := s.data.Users[id]
	if !ok {
		return models.User{}, ErrUserNotFound
	}
	return u, nil
}

func (s *JSONStore) ListUsers() ([]models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.User, 0, len(s.data.Users))
	for _, u := range s.data.Users {
		out = append(out, u)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.Before(out[j].CreatedAt) })
	return out, nil
}

func (s *JSONStore) AddVerificationCode(rec models.VerificationRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.data.NextRecSeq++
	rec.ID = fmt.Sprintf("v_%d", s.data.NextRecSeq)
	s.data.Records = append(s.data.Records, rec)
	return s.persistLocked()
}

func (s *JSONStore) GetHistory(userID string, limit int) ([]models.VerificationRecord, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	matched := make([]models.VerificationRecord, 0)
	for _, r := range s.data.Records {
		if r.UserID == userID {
			matched = append(matched, r)
		}
	}

	sort.Slice(matched, func(i, j int) bool {
    return matched[i].CheckedAt.After(matched[j].CheckedAt)
})

	if limit > 0 && limit < len(matched) {
		matched = matched[:limit]
	}
	return matched, nil
}

func (s *JSONStore) IncrementQuota(userID string, quota int, day time.Time) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := quotaKey(userID, day)
	used := s.data.Quota[key]
	if used >= quota {
		return used, ErrQuotaExceeded
	}
	used++
	s.data.Quota[key] = used
	if err := s.persistLocked(); err != nil {
		return used - 1, err
	}
	return used, nil
}

func (s *JSONStore) GetQuotaUsage(userID string, day time.Time) (int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.Quota[quotaKey(userID, day)], nil
}
