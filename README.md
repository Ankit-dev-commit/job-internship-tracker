# Job & Internship Tracker

A full-stack web application designed to help users track job and internship applications throughout the recruitment lifecycle.

## Live Demo
[Job & Internship Tracker](https://job-internship-tracker-lemon.vercel.app)

> **Project Phase**: Initial Setup & Scaffolding  
> *Note: Database models, authentication, and full application features will be implemented in subsequent phases.*

---

## 📁 Project Structure

```text
Job & Internship Tracker/
├── client/          # Frontend application (React + Vite)
├── server/          # Backend REST API (Node.js + Express)
├── database/        # Database scripts and PostgreSQL schemas
├── .gitignore       # Root git ignore rules
└── README.md        # Project documentation
```

### Directory Details
- **`client/`**: Built with React and Vite. Provides a lightweight, fast frontend with API proxying to avoid CORS complications in local development.
- **`server/`**: Built with Node.js and Express. Provides a REST API with CORS and environment variable support. Includes a `/api/health` health-check endpoint.
- **`database/`**: Contains SQL schema scripts (`schema.sql`) for PostgreSQL database tables.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended; verified on v24)
- **npm** (comes with Node.js)

---

### 1. Backend Setup (`server/`)

Open a terminal in the root directory and navigate to the `server` folder:

```bash
cd server
npm install
```

Start the backend server:

```bash
# Production / standard mode
npm start

# Development mode with hot-reloading (Node.js watch mode)
npm run dev
```

The backend will start at:
- Root: `http://localhost:5000/`
- Health Check: `http://localhost:5000/api/health`

---

### 2. Frontend Setup (`client/`)

Open a separate terminal in the root directory and navigate to the `client` folder:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will start at `http://localhost:5173/`. Open this URL in your browser to view the test page and test backend connectivity.

---

## 📡 API Endpoints (Current)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Basic API confirmation message |
| `GET` | `/api/health` | Health-check endpoint returning service status & timestamp |

---

## 🛠️ Next Steps
1. Design PostgreSQL database tables in `database/schema.sql`.
2. Connect Express backend to PostgreSQL using a connection pool (e.g., `pg`).
3. Add CRUD API routes for managing job/internship applications.
4. Build out the frontend application tracking dashboard.
