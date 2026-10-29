import { describe, it, expect, vi, afterEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { JobModel } from '../models/jobModel.js';

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
});