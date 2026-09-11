-- Job & Internship Tracker - PostgreSQL Database Schema

-- Optional cleanup if re-running schema script (dropped in reverse dependency order)
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table: Stores student and applicant profile details
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    degree VARCHAR(255),
    graduation_year INTEGER,
    skills TEXT,
    linkedin VARCHAR(255),
    github VARCHAR(255),
    portfolio VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Applications table: Stores tracked applications submitted by users
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT')),
    location VARCHAR(255),
    salary VARCHAR(100),
    application_url TEXT,
    application_date DATE DEFAULT CURRENT_DATE,
    deadline DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Saved jobs table: Stores bookmarked jobs that a user is interested in applying to later
CREATE TABLE saved_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) CHECK (job_type IN ('INTERNSHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT')),
    location VARCHAR(255),
    salary VARCHAR(100),
    job_url TEXT,
    deadline DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Interviews table: Stores interview rounds associated with a specific job application
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round VARCHAR(100),
    date DATE,
    time TIME,
    type VARCHAR(100),
    meeting_link TEXT,
    notes TEXT,
    result VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
