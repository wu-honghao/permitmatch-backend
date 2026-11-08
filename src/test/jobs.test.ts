import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { JobModel } from '../models/jobModel.js';
import request from 'supertest';
import app from '../app.js';
import { createTestUser } from "./helpers/testAuth.js";
import { connectTestDB, disconnectTestDB } from './testDb.js';
import { UserModel } from '../models/userModel.js';

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
  "contract": {
    "type": "permanent",
    "durationMonths": null
  },
  "educationRequirement": {
    "rawContent": "Bachelor's degree in Computer Science or equivalent",
    "level": "bachelor"
  },
  "experienceRequirement": {
    "rawContent": "At least 2 years of commercial development experience",
    "minYears": 2,
    "maxYears": null
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
  "permitSupport": {
    "status": "unknown"
  }
}

beforeAll(async () => {
    await connectTestDB();

    userA = await createTestUser();
    userB = await createTestUser();
});

afterAll(async () => {
    await UserModel.deleteMany({
        _id: { $in: [userA.userId, userB.userId] }
    });

    await disconnectTestDB();
});

describe('JobModel validation', () => {
    // 1. 预期验证成功
    // await expect(job.validate())
    //   .resolves.toBeUndefined();

    // 2. 预期验证失败
    // await expect(job.validate())
    //   .rejects.toThrow();

    // 3. 预期因为特定字段验证失败
    // await expect(job.validate())
    //   .rejects.toThrow(/salary\.period/);

  it('T01: accepts a valid job', () => {
    const job = new JobModel({
      ownerId: new mongoose.Types.ObjectId(),
      rawDescription: 'React Developer position',
      title: 'React Developer',

      salary: {
        rawContent: '€60,000 annually',
        min: 60000,
        max: 60000,
        currency: 'EUR',
        period: 'year'
      },

      requirements: [
        {
          rawContent: 'React or Vue',
          category: 'required',
          operator: 'any',
          skills: ['React', 'Vue']
        }
      ]
    });

    expect(job.validateSync()).toBeUndefined();
  });

  // TODO T02: invalid salary period
  it("T02 invalid salary period", async () => {
    const job = new JobModel({
        ownerId: new mongoose.Types.ObjectId(),
        rawDescription: 'Vue Developer position',
        title: 'Vue Developer',
        salary: {
            rawContent: '$10000 per month',
            min: 10000,
            currency: '$',
            period: 'day'
        },
    })

    await expect(job.validate()).rejects.toThrow(
        /salary\.period/
    );
  })

  // TODO T03: negative experience years
  it('T03 negative experience years', async () => {
    const job = new JobModel({
        ownerId: new mongoose.Types.ObjectId(),
        rawDescription: 'Software Engineer position',
        title: 'Software Engineer',

        experienceRequirement: {
            rawContent: '2-3 years perfered',
            minYears: -2,
            maxYears: 3,
            importance: 'preferred',
            scope: 'software_development'
        }
    })

    await expect(job.validate()).rejects.toThrow(
        /experienceRequirement\.minYears/
    );
  })

  it('T04 rejects negative contract durationMonths', async () => {
    const job = new JobModel({
        ownerId: new mongoose.Types.ObjectId(),
        rawDescription: 'Software Engineer1 position',
        title: 'Software Engineer1',

        contract: {
            rawContent: '1111',
            type: 'permanent',
            durationMonths: -1
        }
    })

    await expect(job.validate()).rejects.toThrow(/contract\.durationMonths/)
  })

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