package handlers

import (
	"strings"
	"testing"
)

func TestExtractDomainsFromCSVWithHeaderColumn(t *testing.T) {
	input := "domain,notes\ngithub.com,primary\ngoogle.com,secondary\n"
	got, err := ExtractDomainsFromCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"github.com", "google.com"}
	assertDomainsEqual(t, got, want)
}

func TestExtractDomainsFromCSVHeaderDetectionIsCaseInsensitive(t *testing.T) {
	input := "Domain\nexample.com\n"
	got, err := ExtractDomainsFromCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	assertDomainsEqual(t, got, []string{"example.com"})
}

func TestExtractDomainsFromCSVPlainOnePerLine(t *testing.T) {
	input := "github.com\ngoogle.com\nanthropic.com\n"
	got, err := ExtractDomainsFromCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"github.com", "google.com", "anthropic.com"}
	assertDomainsEqual(t, got, want)
}

func TestExtractDomainsFromCSVCaseInsensitiveDedup(t *testing.T) {
	input := "GitHub.com\ngithub.com\nGITHUB.COM\ngoogle.com\n"
	got, err := ExtractDomainsFromCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"github.com", "google.com"}
	assertDomainsEqual(t, got, want)
}

func TestExtractDomainsFromCSVSkipsBlankLines(t *testing.T) {
	input := "domain\n\ngithub.com\n\n\ngoogle.com\n\n"
	got, err := ExtractDomainsFromCSV(strings.NewReader(input))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	want := []string{"github.com", "google.com"}
	assertDomainsEqual(t, got, want)
}

func TestExtractDomainsFromCSVEmptyInput(t *testing.T) {
	got, err := ExtractDomainsFromCSV(strings.NewReader(""))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 0 {
		t.Fatalf("expected no domains from empty input, got %v", got)
	}
}
 
func assertDomainsEqual(t *testing.T, got, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("expected %v, got %v", want, got)
		}
	}
}
