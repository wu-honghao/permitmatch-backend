import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { JobModel } from "../../models/jobModel.js";
import request from "supertest";
import app from "../../app.js";
import { createTestUser } from "../helpers/testAuth.js";
import { connectTestDB, disconnectTestDB } from "../testDb.js";
import { UserModel } from "../../models/userModel.js";

let userA: Awaited<ReturnType<typeof createTestUser>>;
let userB: Awaited<ReturnType<typeof createTestUser>>;

const jobData = {
  "title": "Full Stack Developer",
  "company": "Tech Ireland Ltd",
  "location": "Dublin, Ireland",
  "rawDescription": "We are looking for a Full Stack Developer with React, TypeScript, Node.js and MongoDB experience. Docker and AWS are desirable.",
  "salary": {
    "rawContent": "€50,000 - €65,000 per year",
    "min": 50000,
    "max": 65000,
    "currency": "EUR",
    "period": "year"
  },
  "requirements": [
    {
      "category": "required",
      "operator": "all",
      "skills": ["React", "TypeScript", "Node.js"],
      "rawContent": "Strong experience with React, TypeScript and Node.js"
    },
    {
      "category": "preferred",
      "operator": "any",
      "skills": ["Docker", "AWS"],
      "rawContent": "Experience with Docker or AWS is desirable"
    }
  ],
  "contract": {
    rawContent: null,
    type: "permanent",
    durationMonths: null
  },
  educationRequirement: {
    rawContent: "Bachelor's degree in Computer Science or equivalent",
    level: "bachelor",
    importance: null,
    fieldOfStudy: null
  },
  experienceRequirement: {
    rawContent: "At least 2 years of commercial development experience",
    minYears: 2,
    maxYears: null,
    importance: null,
    scope: null
  },
  permitSupport: {
    rawContent: null,
    status: "unknown"
  }
}

beforeAll(async () => {
  await connectTestDB();
  userA = await createTestUser();
  userB = await createTestUser();
});

afterAll(async () => {
  try {
    await JobModel.deleteMany({ ownerId: { $in: [userA.userId, userB.userId] } });
    await UserModel.deleteMany({ _id: { $in: [userA.userId, userB.userId] } });
  } finally {
    await disconnectTestDB();
  }
});

describe("jobs HTTP API (integration)", () => {
  it('T05 User A create Job return 201', async () => {
    const res = await request(app).post('/jobs').set("Authorization", `Bearer ${userA.token}`).send(jobData)
    expect(res.status).toBe(201);
  })

  it('T06 User B cannot access UserA Data', async () => {
    const createRes = await request(app).post('/jobs').set("Authorization", `Bearer ${userA.token}`).send(jobData)

    expect(createRes.status).toBe(201);

    const id = createRes.body.data._id

    const res = await request(app).get(`/jobs/${id}`).set('Authorization', `Bearer ${userB.token}`)

    expect(res.status).toBe(404);
  })

  it('T07 User B cannot update UserA Data', async () => {
    const createRes = await request(app).post('/jobs').set("Authorization", `Bearer ${userA.token}`).send(jobData)

    expect(createRes.status).toBe(201);

    const id = createRes.body.data._id

    const res = await request(app).patch(`/jobs/${id}`).set('Authorization', `Bearer ${userB.token}`).send({
      title: '111'
    })

    expect(res.status).toBe(404);
  })

  it('T08 User B cannot delete UserA Data', async () => {
    const createRes = await request(app).post('/jobs').set("Authorization", `Bearer ${userA.token}`).send(jobData)

    expect(createRes.status).toBe(201);

    const id = createRes.body.data._id

    const res = await request(app).delete(`/jobs/${id}`).set('Authorization', `Bearer ${userB.token}`)

    expect(res.status).toBe(404);
  })
});
