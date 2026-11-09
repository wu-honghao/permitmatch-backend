# PermitMatch — Backend

Backend API for **PermitMatch**, a web application that helps software job seekers in Ireland compare their skills with job requirements, identify gaps, and review previous analyses.

PermitMatch focuses on **explainable skill matching**, not predicting hiring outcomes or determining eligibility for an Irish employment permit. Permit-related information is presented as supporting context, not an immigration decision.

> **Project status:** MVP backend implemented; automated testing and deployment hardening are in progress.

## Features

- **Authentication:** account registration, login and JWT-protected endpoints.
- **Candidate profile:** stores career targets, skills, experience, education, preferred location and permit needs.
- **Job management:** create, list, view, update and delete job records, including structured requirements and the original job description.
- **Skill matching:** normalizes skills and aliases, supports `all` (AND) and `any` (OR) requirement groups, and distinguishes required from preferred skills.
- **Explainable scoring:** reports matched, covered and missing skills; uses an 80/20 required/preferred weighting when both categories are available, with `required_only` and `unavailable` results where appropriate.
- **Analysis history:** saves snapshots of the candidate profile and job at analysis time, preserving the context of past results.
- **Cross-job skill gaps:** summarizes skills repeatedly missing across a user's analyzed jobs.
- **Ownership checks:** restricts jobs and analyses to their respective users.
- **Atomic analysis creation:** uses a MongoDB transaction to save an analysis and update the job's latest analysis reference together.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Runtime | Node.js, TypeScript |
| API | Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Validation | Zod, Mongoose schema validation |
| Tests | Vitest, Supertest |
| Tooling | tsx, Docker |

## Getting Started

### Prerequisites

- Node.js compatible with the project's `package.json` (Node.js 22 is used in the Dockerfile)
- npm
- A MongoDB connection (MongoDB Atlas or a compatible MongoDB deployment)

### Installation

```bash
npm ci
```

### Environment variables

Create a `.env` file in the backend root directory:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/permitmatch
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
```

**Do not commit `.env`, `.env.test`, passwords, tokens or API keys.** The exact variable names should match your current server configuration. Optional experimental job-extraction code may require `GEMINI_API_KEY` and `GEMINI_MODEL`; it is not part of the core manual-entry skill-matching workflow.

### Development

```bash
npm run dev
```

The API typically listens on `http://localhost:3000`. Verify the port against your local `src/server.ts` configuration.

### Production build

```bash
npm run build
```

If you have separated application initialization (`src/app.ts`) from server startup (`src/server.ts`), run the compiled server entry point:

```bash
node dist/server.js
```

Ensure `package.json` and the Dockerfile use the same server entry point. The earlier project archive used `src/app.ts` as its entry point, so check these scripts before deploying.

## API Overview

Routes other than registration and login require a bearer token:

```http
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Log in |
| GET | `/auth/me` | Get authenticated user |
| GET | `/profile` | Get candidate profile |
| PUT | `/profile` | Update candidate profile |
| GET | `/jobs` | List owned jobs |
| POST | `/jobs` | Create a job |
| GET | `/jobs/:id` | Get an owned job |
| PATCH | `/jobs/:id` | Update a job |
| DELETE | `/jobs/:id` | Delete a job |
| POST | `/jobs/:id/analyses` | Create a skill analysis |
| GET | `/jobs/:id/analyses` | List analyses for a job |
| GET | `/analyses` | List analysis history |
| GET | `/analyses/:id` | Get a saved analysis |
| GET | `/skillsGap` | Aggregate cross-job skill gaps |

Endpoints and request bodies are subject to the application's current validators and schemas. Some routes in the repository may be experimental rather than part of the supported MVP.

## How Skill Analysis Works

1. A user maintains a candidate profile containing their skills.
2. They save a job and confirm its required and preferred skill groups.
3. Skills and aliases are normalized; `all` groups require every member while `any` groups accept an alternative.
4. The scoring service calculates coverage and missing skills and returns a score when sufficient requirements are available.
5. The analysis is stored with profile and job snapshots; the job's `latestAnalysisId` is updated in the same database transaction.

**Important:** Skill scores indicate rule-based requirement coverage. They do **not** measure proficiency, guarantee an interview or job offer, or constitute an employment-permit eligibility assessment.

## Testing

The test suite includes pure skill-matching tests, schema validation tests and database-backed API tests. Recent local runs confirmed existing tests plus successful creation, rollback and ownership checks for analyses; the latest changes should be retested after checkout.

```bash
npm run test:run
npm run build
```

Integration tests use a **separate database**. Create `.env.test` locally, for example:

```dotenv
MONGODB_TEST_URI=mongodb+srv://<user>:<password>@<cluster>/permitmatch_test
JWT_SECRET=replace-with-a-test-only-secret
```

- Never point integration tests at the development or production database.
- Test data may be created and deleted during a test run.
- MongoDB transactions require a deployment that supports transactions, such as an Atlas replica set.
- Exclude `dist/` from Vitest discovery to avoid running compiled tests twice.

## Project Layout

```text
src/
├── app.ts                # Express setup and routing
├── server.ts             # Database connection and HTTP listener (after split)
├── controller/           # Request handlers
├── middleware/           # JWT authentication and error handling
├── models/               # Mongoose schemas
├── routes/               # HTTP routes
├── services/             # Matching, analysis and business logic
├── test/                 # Vitest and Supertest tests
├── types/                # Type declarations
└── validators/           # Request validation
```

## Frontend

The frontend is developed in a separate React + TypeScript repository: **`permitmatch-frontend`**. Add its GitHub URL here after publication.

## Deployment Notes

- Provide secrets and the MongoDB URI through environment variables or your hosting platform's secret manager.
- Restrict CORS to the deployed frontend origin.
- Ensure your MongoDB network access and permissions are configured appropriately.
- Run build and tests before deployment, and point the Docker entry point at the compiled server file.

## Disclaimer

PermitMatch is a portfolio and decision-support project. Its skill analysis is informational, and any employment permit guidance should be verified against current official Irish government sources.
