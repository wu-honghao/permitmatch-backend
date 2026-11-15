# PermitMatch — Backend

REST API for **PermitMatch**, a web application that helps software job seekers in Ireland compare their skills with job requirements, understand missing skills, and track analyses over time.

PermitMatch provides **explainable, rule-based skill matching**. It does **not** predict hiring outcomes, measure a candidate's proficiency, or determine eligibility for an Irish employment permit.

> **Status:** MVP V1 implemented and deployed. Testing and maintenance are ongoing.

## Features

- **Authentication:** Register, log in, and access protected endpoints using JSON Web Tokens (JWT).
- **Candidate profiles:** Store a target role, skills, experience, education, preferred location, and employment-permit needs.
- **Job management:** Create, view, update, list, and delete jobs, retaining both the original job description and structured requirements.
- **AI-assisted extraction:** Use Google Gemini to turn a pasted job description into an editable structured draft. The user reviews the draft before saving; manual entry remains available if extraction fails.
- **Skill normalization:** Map common technology aliases to consistent names for comparison and reporting.
- **Explainable matching:** Evaluate required and preferred skill groups, including `all` (AND) and `any` (OR) conditions.
- **Scoring:** Weight required and preferred group coverage at 80% and 20% when both are available; handle required-only and unscorable cases separately.
- **Analysis history:** Save job and profile snapshots so previous analyses retain their original context.
- **Cross-job skill gaps:** Aggregate recurring missing requirements across jobs, with job-level deduplication.
- **Access control:** Scope jobs and analyses to their authenticated owner.
- **Consistent updates:** Use a MongoDB transaction when creating an analysis and updating the job's latest analysis reference.
- **Request protection:** Validate input with Zod, apply security middleware and rate limiting, and return consistent API errors.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Runtime | Node.js, TypeScript |
| HTTP API | Express 5 |
| Database | MongoDB Atlas, Mongoose 9 |
| Authentication | JSON Web Tokens, bcryptjs |
| Validation | Zod 4, Mongoose validation |
| AI extraction | Google Gemini via `@google/genai` |
| Security | Helmet, CORS, `express-rate-limit` |
| Testing | Vitest, Supertest |
| Development / build | tsx, TypeScript compiler |

## Getting Started

### Prerequisites

- Node.js and npm compatible with the versions declared in `package.json`
- A MongoDB deployment that supports transactions (for example, a MongoDB Atlas replica set)
- A Gemini API key if you want to use AI-assisted extraction

### Installation

```bash
npm ci
```

### Environment variables

Create `.env` in the backend project root:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/permitmatch
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
GEMINI_API_KEY=your-gemini-api-key
# Optional, if supported by your extraction service configuration:
GEMINI_MODEL=gemini-3.5-flash-lite
```

Use the actual variable names and model supported by your deployed configuration. Never commit real secrets, `.env`, or `.env.test`.

**Important:** AI extraction uses an external provider and can fail, time out, or be rate limited. The manual job-entry workflow must remain usable.

### Start locally

```bash
npm run dev
```

By default, the API is configured for `http://localhost:3000` when `PORT=3000`.

### Build and run

```bash
npm run build
npm start
```

The `start` script runs `node dist/server.js`. Ensure your TypeScript output configuration builds to that path.

## API Overview

All endpoints except registration and login require a bearer token:

```http
Authorization: Bearer <JWT_TOKEN>
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Register an account |
| POST | `/auth/login` | Log in |
| GET | `/auth/me` | Get the authenticated user |
| GET | `/profile` | Get the candidate profile |
| PUT | `/profile` | Update the candidate profile |
| GET | `/jobs` | List the user's jobs |
| POST | `/jobs` | Create a job |
| POST | `/jobs/extract` | Extract an editable job draft from a description |
| GET | `/jobs/:id` | Get an owned job |
| PATCH | `/jobs/:id` | Update an owned job |
| DELETE | `/jobs/:id` | Delete an owned job |
| POST | `/jobs/:id/analyses` | Generate and save a skill analysis |
| GET | `/jobs/:id/analyses` | List a job's analyses |
| GET | `/analyses` | List saved analyses |
| GET | `/analyses/:id` | View an analysis snapshot |
| GET | `/skillsGap` | Aggregate recurring skill gaps |

Request and response shapes are defined by the current controllers, schemas, and validators.

## How Matching Works

1. The user saves a profile containing their skills.
2. A job is entered manually or drafted with AI and then reviewed by the user.
3. The backend normalizes technology names and evaluates requirement groups: `all` means every member is needed, while `any` means at least one member is needed.
4. Coverage is calculated **per requirement group**, not per individual skill.
5. If both required and preferred groups exist, the score is calculated as:

   ```text
   score = required coverage × 80% + preferred coverage × 20%
   ```

6. When only required groups are available, required coverage determines the full score. When there are no scorable groups, the result is unavailable.
7. The analysis is saved with job and profile snapshots, while the job's `latestAnalysisId` is updated in the same transaction.

Scores indicate **requirement coverage only**—not likelihood of employment or actual skill proficiency.

## Testing

```bash
npm run test:run
npm run build
```

For watch mode:

```bash
npm test
```

For coverage (requires the configured coverage tooling):

```bash
npm run coverage
```

Integration tests must use an isolated test database. For example, configure a local `.env.test` with:

```dotenv
MONGODB_TEST_URI=mongodb+srv://<user>:<password>@<cluster>/permitmatch_test
JWT_SECRET=replace-with-a-test-only-secret
```

- Never run destructive tests against development or production data.
- MongoDB transactions require transaction-capable deployment configuration.
- The repository contains Vitest/Supertest tooling; consult the test files for currently covered cases.

## Project Structure

```text
src/
├── app.ts          # Express app and middleware setup
├── server.ts       # Database connection and HTTP listener
├── controller/     # HTTP request handlers
├── middleware/     # Authentication and error handling
├── models/         # Mongoose schemas
├── routes/         # Route definitions
├── services/       # Matching, extraction and business logic
├── validators/     # Zod request validation
├── types/          # Shared TypeScript declarations
└── test/           # Automated tests
```

Adjust this tree if your repository's actual folder names differ.

## Deployment

The backend is deployed as an AWS-hosted API, with MongoDB Atlas as its database.

**Production API:** https://d38890yu916wq0.cloudfront.net

Deployment considerations:

- Supply JWT, database, and Gemini credentials through server-side environment variables or a secrets manager.
- Allow CORS only from the intended frontend origin.
- Use HTTPS for public traffic.
- Keep rate limits and error handling enabled for AI-assisted extraction.
- Confirm your container/startup command matches `npm start` and `dist/server.js`.
- Do not expose `GEMINI_API_KEY`, `JWT_SECRET`, or database credentials to the frontend.

## Related Application

- **Live frontend:** https://d3omusoi6mx2kn.cloudfront.net
- **Frontend repository:** `permitmatch-frontend` (add the GitHub link when available)

## Disclaimer

PermitMatch is a portfolio and decision-support project. Its scores and permit-related notes are informational only. Employment-permit requirements should be checked against current official Irish government guidance.