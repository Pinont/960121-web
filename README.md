# 960121-web — Full-Stack E-Commerce Platform

> A full-stack e-commerce web application built with **HTML/CSS/JavaScript** on the frontend and **Node.js + Express** on the backend, backed by a **SQLite** relational database. Designed with a modular, microservice-ready architecture following the Controller–Route–Service–Repository pattern.

---

## Live Demo

> _Deploy to GitHub Pages (frontend) or a cloud provider (backend) and update this link._

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Design](#security-design)
- [Database Schema](#database-schema)
- [Roadmap / Microservice Migration](#roadmap--microservice-migration)
- [License](#license)

---

## Architecture Overview

The application follows a **3-Tier Architecture**:

| Tier | Responsibility | Technologies |
|---|---|---|
| **Presentation** | UI rendering, DOM events, client-side state | HTML5, CSS3, JavaScript, Bootstrap |
| **Application** | Business logic, auth, validation, REST API | Node.js, Express.js, JWT |
| **Persistence** | Relational data storage & query integrity | SQLite, parameterized SQL |

The backend is internally structured as a **Clean Monolith** using a strict separation of concerns. Each layer has one job:

- **Routes** — declare HTTP endpoints and delegate to controllers  
- **Controllers** — orchestrate the request/response cycle  
- **Services** — contain business logic (auth, checkout, pricing rules)  
- **Repositories** — encapsulate all SQL queries (single access point to the DB)  
- **Models** — define data schemas and validation rules  
- **Middleware** — cross-cutting concerns (JWT verification, error handling)

This structure is designed so each service domain (`Identity`, `Catalog`, `Orders`) can be extracted into an independent microservice with minimal refactoring.

---

## Project Structure

```
960121-web/
├── index.html               # Home / product listing page
├── card-detail.html         # Product detail page
├── checkout.html            # Checkout page
├── credential.html          # Login / registration page
├── style.css                # Global styles
├── shop.js                  # Frontend cart & UI logic
├── server.js                # Express entry point
├── package.json
├── .env                     # Local secrets (git-ignored)
├── .env.example             # Safe template to share with team
├── .gitignore
│
├── css/                     # Additional stylesheets
├── js/                      # Additional frontend scripts
├── images/                  # Static product images
├── public/                  # Publicly served static assets
├── data/                    # SQLite database file & seed data
├── Document/                # UML diagrams, API contracts, session docs
│
└── src/                     # All backend source code
    ├── controllers/         # Request/response orchestration
    ├── routes/              # Express route definitions
    ├── services/            # Business logic layer
    ├── repositories/        # Database query abstraction (Repository pattern)
    ├── models/              # Data schema & validation
    ├── middleware/          # JWT auth guard, error handling
    └── db/                  # SQLite connection & migration scripts
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Bootstrap |
| Backend | Node.js, Express.js |
| Database | SQLite (via `better-sqlite3` or `sqlite3`) |
| Authentication | JWT (JSON Web Tokens), bcrypt password hashing |
| Architecture | REST API, Controller–Route–Service–Repository |
| Version Control | Git, GitHub |

---

## Getting Started

### Prerequisites

- Node.js v18+ installed
- Git installed

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Pinont/960121-web.git
cd 960121-web

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your own values (see Environment Variables section)

# 4. Run the database migration / seed
node src/db/migrate.js

# 5. Start the development server
node server.js
```

The server will start on `http://localhost:3000` (or the port defined in `.env`).

Open `index.html` via Live Server (VS Code) or point the frontend's `fetch` base URL to `http://localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. **Never commit `.env` to Git.**

```env
# Server
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRY=24h

# Future microservice URLs (mock / local)
PRODUCT_SERVICE_URL=http://localhost:3001
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the Express server listens on |
| `NODE_ENV` | Yes | `development` or `production` |
| `JWT_SECRET` | **Critical** | Secret key for signing JWTs — use a 256-bit random string in production |
| `JWT_EXPIRY` | Yes | Token lifetime (e.g. `24h`, `7d`) |
| `PRODUCT_SERVICE_URL` | Optional | Base URL for the future Product microservice |

> **Tip:** Generate a secure `JWT_SECRET` with:  
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## API Reference

All API routes are prefixed with `/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/login` | None | Login and receive a JWT |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | None | Retrieve all products |
| GET | `/api/products/:id` | None | Retrieve a single product |

### Orders & Checkout

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/checkout` | JWT | Submit a new order |
| GET | `/api/orders` | JWT | Retrieve orders for the logged-in user |

---

## Security Design

- **Password Hashing** — Passwords are hashed with `bcrypt` before storage; plaintext is never persisted.
- **JWT Authentication** — Stateless sessions using signed tokens. Protected routes verify the token via the `authMiddleware` before any controller logic executes.
- **Server-Side Validation** — All POST/PUT request bodies are validated on the backend. The frontend is treated as untrusted.
- **Parameterized SQL Queries** — All database queries use parameterized statements to prevent SQL injection.
- **CORS Configuration** — Express is configured to allow requests only from trusted origins.

---

## Database Schema

The SQLite database contains three core tables:

```
users       — id, username, email, password_hash, created_at
products    — id, name, description, price, stock, image_url, category
orders      — id, user_id (FK), total, status, created_at
order_items — id, order_id (FK), product_id (FK), quantity, unit_price
```

Relationships are enforced via **foreign keys**, ensuring referential integrity between users → orders → order_items → products.

---

## Roadmap / Microservice Migration

The current architecture is a **Clean Monolith** — modular enough to be decomposed. Planned service boundaries:

| Domain | Current Location | Future Microservice |
|---|---|---|
| Identity | `src/services/AuthService.js` | `identity-service` (port 3001) |
| Catalog | `src/services/ProductService.js` | `catalog-service` (port 3002) |
| Orders | `src/services/OrderService.js` | `order-service` (port 3003) |

Each service communicates via HTTP REST, allowing independent deployment and technology choices per domain.

---

## License

This project is for educational purposes as part of course **960121 — Digital Industry Process I**.
