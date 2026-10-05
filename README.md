# VERIFLY

A domain verification system built with Go and React.

VERIFLY checks a domain's **MX, SPF, and DMARC DNS records** and reports whether the domain is configured for authenticated email.

It wraps the DNS verification engine in a small product with authentication, daily verification quotas, bulk CSV verification, verification history, analytics and an admin dashboard.

## Stack

**Backend:** Go 1.26.5  
**Backend dependencies:** Go standard library only  
**Frontend:** React + TypeScript + Vite + Tailwind CSS  
**Authentication:** JWT (HS256)  
**Password hashing:** PBKDF2-HMAC-SHA256  
**Storage:** JSON file  
**DNS:** MX, SPF, and DMARC lookups

## Architecture

```text
                    ┌──────────────────┐
                    │     React UI     │
                    │ TypeScript/Vite  │
                    └────────┬─────────┘
                             │ HTTP / JSON
                             ▼
                    ┌──────────────────┐
                    │   Go HTTP API    │
                    │    net/http      │
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
       ┌───────────┐   ┌───────────┐   ┌────────────┐
       │   Auth    │   │  Handlers │   │ Middleware │
       │ JWT / pwd │   │ API logic │   │ Auth / RBAC│
       └───────────┘   └─────┬─────┘   └────────────┘
                             │
                ┌────────────┴────────────┐
                ▼                         ▼
        ┌────────────────┐       ┌────────────────┐
        │    DNS Check   │       │   JSON Store   │
        │ MX/SPF/DMARC   │       │ users/history  │
        └────────────────┘       └────────────────┘
```

The backend uses Go's standard library rather than a web framework or external database.

## Project Structure

```text
verifly/
├── backend/
│   ├── go.mod
│   ├── main.go
│   ├── data/
│   │   └── store.json          # runtime data, gitignored
│   └── internal/
│       ├── auth/
│       │   ├── password.go
│       │   ├── password_test.go
│       │   ├── jwt.go
│       │   └── jwt_test.go
│       │
│       ├── dnscheck/
│       │   ├── checker.go
│       │   └── checker_test.go
│       │
│       ├── handlers/
│       │   ├── response.go
│       │   ├── auth.go
│       │   ├── verify.go
│       │   ├── bulk.go
│       │   ├── analytics.go
│       │   └── admin.go
│       │
│       ├── middleware/
│       │   └── middleware.go
│       │
│       ├── models/
│       │   └── models.go
│       │
│       └── storage/
│           ├── store.go
│           └── store_test.go
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── lib/
│       ├── routes/
│       ├── components/
│       └── pages/
│
├── docs/
│   ├── engineering-notes.md
│   └── decisions.md
│
├── .gitignore
└── README.md
```

## Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Log in and receive a JWT |
| GET | `/api/auth/me` | User | Get the current user |
| GET | `/api/verify?domain=` | User | Verify one domain |
| POST | `/api/bulk-verify` | User | Verify domains from a CSV file |
| GET | `/api/history?limit=` | User | Get verification history |
| GET | `/api/analytics` | User | Get verification analytics |
| GET | `/api/admin/users` | Admin | List users and quota usage |
| GET | `/api/healthz` | — | Health check |

## How It Works

For a domain such as:

```text
example.com
```

VERIFLY checks:

```text
example.com
    │
    ├── MX       → Does the domain publish mail servers?
    │
    ├── SPF      → Does it publish an SPF TXT record?
    │
    └── DMARC    → Does it publish a DMARC policy?
```

The results are stored as verification records and exposed through the API and dashboard.

VERIFLY checks DNS configuration. It does **not**:

- send email
- verify whether a mailbox exists
- perform SMTP mailbox verification
- modify DNS records
- guarantee email deliverability

## Run Locally

### Requirements

- Go 1.26.5
- Node.js
- npm

### 1. Clone

```bash
git clone https://github.com/adhyayana108/verifly.git
cd verifly
```

### 2. Build the frontend

```bash
cd frontend
npm install
npm run build
```

### 3. Run the backend

```bash
cd ../backend
```

Set a JWT secret:

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

Run the server:

```bash
go run .
```

The server starts at:

```text
http://localhost:8080
```

Open it in your browser:

```text
http://localhost:8080
```

## Frontend Development

For frontend development with Vite hot reload:

### Terminal 1

```bash
cd backend
JWT_SECRET=dev-secret go run .
```

### Terminal 2

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

The Vite development server proxies `/api` requests to the Go backend.

## Testing

### Backend

```bash
cd backend

go fmt ./...
go build ./...
go vet ./...
go test ./...
go test -race ./...
```

### Frontend

```bash
cd frontend

npm run build
npm run lint
```

## Example API Usage

### Health check

```bash
curl http://localhost:8080/api/healthz
```

### Register

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "password123"
  }'
```

Use the returned JWT as:

```text
Authorization: Bearer <token>
```

### Verify a domain

```bash
curl "http://localhost:8080/api/verify?domain=google.com" \
  -H "Authorization: Bearer <token>"
```

### History

```bash
curl http://localhost:8080/api/history \
  -H "Authorization: Bearer <token>"
```

### Analytics

```bash
curl http://localhost:8080/api/analytics \
  -H "Authorization: Bearer <token>"
```

## What This Project Demonstrates

- Building an HTTP API with Go's standard library
- Go `net/http` routing
- JWT authentication
- Password hashing
- Authentication middleware
- Role-based access control
- DNS lookups
- MX, SPF, and DMARC verification
- Concurrent bulk processing
- NDJSON streaming over HTTP
- Daily usage quotas
- JSON persistence
- Thread-safe storage
- HTTP and JSON API design
- React + TypeScript frontend integration
- Protected client-side routes
- Analytics derived from verification history
- Backend and frontend testing

## Status

**Prototype — working locally, not deployed.**

## License

MIT


