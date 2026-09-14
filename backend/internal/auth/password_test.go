package auth

import "testing"

func TestPBDKF2IsDeterministicForSameOutput(t *testing.T) {
	salt := []byte("a-fixed-16b-salt")
	h1 := pbkdf2([]byte("hunter2"), salt, 1000, 32)
	h2 := pbkdf2([]byte("hunter2"), salt, 1000, 32)
	if string(h1) != string(h2) {
		t.Fatal("expected identical output for identical password+salt+iterations+length")
	}
}

func TestHashPasswordThenVerifyCorrectPassword(t *testing.T){
	hash, err := HashPassword("correct-horse-battery-staple")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	ok, err := VerifyPassword("correct-horse-battery-staple", hash)
	if err != nil {
		t.Fatalf("VerifyPassword returned error: %v", err)
	}
	if !ok {
		t.Fatal("expected the correct password to verify successfully")
	}
}


func TestVerifyRejectsIncorrectPassword(t *testing.T){
	hash, err := HashPassword("correct-horse-battery-staple")
	if err!= nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	ok, err := VerifyPassword("wrong-password" , hash)
	if err != nil {
		t.Fatalf("VerifyPassword returned error: %v", err)
	}
	if ok {
		t.Fatal("expected an incorrect password to fail verification")
	}
}

func TestDistinctSaltsProduceDistinctHashes(t *testing.T) {
	h1, err := HashPassword("same-password")
	if err != nil {
		t.Fatal(err)
	}
	h2, err := HashPassword("same-password")
	if err != nil {
		t.Fatal(err)
	}
	if h1 == h2 {
		t.Fatal("expected two hashes of the same password to differ due to random salts")
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T){
	cases := []string{"", "not-a-hash", "pbkdf2-sha256$abc$x$y", "wrong-scheme$1$x$y"}
	for _, c := range cases {
		if ok, err := VerifyPassword("anything", c); ok || err == nil {
			t.Fatalf("expected malformed hash %q to be rejected with an error", c)
		}
}
}