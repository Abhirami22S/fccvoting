# CloudVote - Online E-Voting System

This document outlines the implementation plan for the **CloudVote** secure online e-voting system, a full-stack application built for cloud deployment.

## User Review Required

> [!IMPORTANT]
> Please review the chosen dependencies and the database schema. 
> 
> **Key Decisions Made:**
> 1.  **Frontend:** I will use Vanilla HTML/CSS/JS with modern CSS features (Grid/Flexbox, CSS variables for dark theme/gradients). I will use **Chart.js** for the results visualization and **Toastify-js** (or similar vanilla library) for toast notifications.
> 2.  **Authentication:** I will use **JSON Web Tokens (JWT)** for secure, stateless authentication, which is ideal for cloud deployments. Passwords will be heavily hashed using **bcryptjs**.
> 3.  **Admin:** To satisfy the "separate secure login" requirement for Admins, I propose adding a small `admins` table to the database alongside `voters`, `candidates`, and `votes`.

## Proposed Changes

We will build the application using an Express.js backend and a separate `/public` folder containing the static frontend files.

---

### Backend Setup & Configuration

We'll initialize the Node.js project and set up the server.

#### [NEW] package.json
Initialize the Node project with dependencies (`express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`).

#### [NEW] .env.example
Template for environment variables (Database credentials, JWT secret, server port) to ensure cloud deployability.

#### [NEW] server.js
Basic Express server setup, middleware configuration (JSON parsing, static files serving), and routing entry points.

---

### Database Implementation

We will use the `mysql2` package with connection pooling for better performance in the cloud.

#### [NEW] db/db.js
Database configuration and connection pooling module.

#### [NEW] db/schema.sql
SQL script to initialize the tables (`voters`, `candidates`, `votes`, `admins`) and insert default data (e.g., initial admin account).

---

### Application Logic (Backend)

We will structure the backend using the MVC pattern (Model, View/Frontend, Controller).

#### [NEW] controllers/authController.js
Logic for user registration, user login, and admin login.

#### [NEW] controllers/voteController.js
Logic for safely fetching candidates and casting a vote (using a transaction to ensure `has_voted` and the `votes` table are updated atomically).

#### [NEW] controllers/adminController.js
Logic for adding/editing/deleting candidates, fetching voter lists, and gathering result statistics.

#### [NEW] routes/authRoutes.js
API routes for authentication `/api/auth/register`, `/api/auth/login`, `/api/auth/admin-login`.

#### [NEW] routes/voteRoutes.js
API routes protected by user JWT for voting `/api/votes`.

#### [NEW] routes/adminRoutes.js
API routes protected by admin JWT for management `/api/admin/...`

---

### Frontend Pages (Public Directory)

The UI will be built with a "modern startup-style" dark theme and responsive layout.

#### [NEW] public/css/style.css
Global styles, CSS variables for dark theme with gradients, responsive media queries, button animations.

#### [NEW] public/index.html
Landing page with modern UI, navigation to login/register sections.

#### [NEW] public/register.html
Voter Registration form with client-side validation.

#### [NEW] public/login.html & public/admin-login.html
Login forms for users and administrators.

#### [NEW] public/dashboard.html
Voter dashboard showing candidates list and a clear, single-use voting interface.

#### [NEW] public/admin.html
Admin dashboard to manage candidates (CRUD) and view registered voters.

#### [NEW] public/results.html
Public (or admin-only) view showing live vote counts using Chart.js.

#### [NEW] public/js/app.js & public/js/admin.js
Client-side JavaScript to handle API requests (fetch), token storage (localStorage/sessionStorage), UI interactions, and Chart rendering.

## Open Questions

> [!WARNING]
> Do you have a local MySQL instance running to test this during development, and can you provide credentials to connect to it? 

## Verification Plan

### Automated Tests
- Running the Node server (`node server.js`) to ensure it boots without errors.
- Using a test database connection to verify SQL schema creation.

### Manual Verification
1.  **Voter Flow:** Register a new user -> Login -> View Candidates -> Cast Vote -> Try scanning/clicking vote again (should be blocked) -> Logout.
2.  **Admin Flow:** Login as Admin -> Add Candidate -> Verify Candidate appears in Voter dashboard -> View live results.
3.  **Cloud Readiness:** Ensure all hardcoded configurations are moved to `.env` variables (e.g., `DB_HOST`, `DB_USER`, `DB_PASS`, `PORT`).
