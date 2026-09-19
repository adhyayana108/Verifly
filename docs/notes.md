## 1. Problem

VERIFLY helps users determine whether a domain has
the DNS configuration expected for authenticated email
It checks MX, SPF and DMARC and presents the results
in a usable dashboard

## 2. Goals

- User registration
- User login
- Authentication
- RBAC
- Domain verification
- Bulk verification
- Daily quota
- Verification history
- Analytics
- Admin dashboard

## 3. Non-goals

- Sending email
- Editing DNS
- Guaranteeing deliverability
- Mailbox existence verification
- SMTP verification

## 4. Domain Model

User
- ID
- Username
- Email
- PasswordHash
- Role
- CreatedAt

Verification
- ID
- UserID
- Domain
- MX result
- SPF result
- DMARC result
- Overall status
- Error
- CreatedAt

Relationship:

User 1 ---- N Verification

## 5. System Boundary 

                ┌───────────────┐
                │    Browser    │
                └───────┬───────┘
                        │
                      HTTPS
                        │
                        ▼
        ┌────────────────────────────────┐
        │            VERIFLY             │
        │ HTTP API                       │
        │ Authentication                 │
        │ Authorization                  │
        │ Validation                     │
        │ Verification                   │
        │ Quota                          │
        │ Persistence                    │
        │ Analytics                      │
        └───────────────┬────────────────┘
                        │
                       DNS
                        │
                        ▼
                ┌───────────────┐
                │ DNS ecosystem │
                └───────────────┘

Outside:
- Browser/client
- DNS infrastructure

The browser is untrusted
DNS is an external dependency

## 6. Request Architecture

                         CLIENT
                           │
                           │ HTTP
                           ▼
                  ┌──────────────────┐
                  │    HTTP Server   │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │     Routing      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Authentication   │
                  │   Middleware     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Authorization    │
                  │   / RBAC         │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │     Handler      │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Application Logic│
                  └─────┬────────┬───┘
                        │        │
                        ▼        ▼
                   DNS checker  Store
                        │        │
                        ▼        ▼
                      DNS      Data


# Handler should know

GET /api/verify?domain=google.com
- HTTP request
- query parameter
- authenticated user
- HTTP response

DESIGN 

Handler
   │
   ▼
Verification operation
   │
   ├── quota
   ├── domain validation
   ├── DNS checker
   └── persistence

# Authentication boundary

HTTP request
     │
     ▼
Authentication middleware
     │
     ├── no token → 401
     │
     └── valid token
              │
              ▼
         authenticated
              │
              ▼
           handler


# Authorization boundary

Authenticated user
       │
       ▼
Authorization
       │
       ├── user → normal endpoints
       │
       └── admin → admin endpoints


# Internal Architecture 

                    HTTP
                     │
                     ▼
              ┌─────────────┐        # Architecture style
              │   Handlers  │
              └──────┬──────┘           Modular monolith
                     │
                     ▼
              ┌─────────────┐
              │  Services   │
              └──┬───────┬──┘
                 │       │
                 ▼       ▼
             DNSCheck   Store
                 │       │
                 ▼       ▼
               DNS     JSON DB


# Data flow

request -> GET /api/verify?domain=google.com

Browser
   │
   │ Authorization: Bearer <JWT>
   │ domain=google.com
   ▼
HTTP server
   │
   ▼
JWT verification
   │
   ▼
User identity
   │
   ▼
Domain validation
   │
   ▼
Quota validation
   │
   ▼
DNS checker
   │
   ├── MX lookup
   ├── SPF lookup
   └── DMARC lookup
   │
   ▼
VerificationResult
   │
   ▼
Storage
   │
   ▼
JSON response
   │
   ▼
Browser

## 7. Core invariants

- Passwords are never stored plaintext
- Unauthenticated users cannot access protected API's
- Users cannot access other users' data
- Normal users cannot access admin APIs
- Quota cannot be exceeded
- DNS failures do not crash the server
- Stored data survives restart