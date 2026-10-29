import { describe, it, expect } from 'vitest';
import { AnalysisModel } from '../models/analysisModel.js';
import mongoose from 'mongoose';

describe('AnalysisModel validation', () => {
  it('T01', async () => {
    const analysis = new AnalysisModel({
        ownerId: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(),

        jobSnapshot: {
            title: 'Frontend Developer',
            company: 'Example Ltd',
            rawDescription: 'React and TypeScript required.',
            requirements: [
            {
                category: 'required',
                operator: 'all',
                skills: ['React', 'TypeScript']
            }
            ]
        },

        profileSnapshot: {
            needsPermit: 'yes',
            targetRole: 'Frontend Developer',
            educationLevel: 'bachelor',
            yearsExperience: 2,
            skills: ['React'],
            preferredLocation: 'Dublin'
        },

        skillScoreResult: {
            score: 50,
            scoreType: 'required_only',
            required: { matched: 1, total: 2 },
            preferred: { matched: 0, total: 0 },
            hasPendingReview: false
        }
    });

    await expect(analysis.validate()).resolves.toBeUndefined();
  });

  it('T02', async () => {
    const analysis = new AnalysisModel({
        ownerId: new mongoose.Types.ObjectId(),
        jobId: new mongoose.Types.ObjectId(),

        jobSnapshot: {
            title: 'Frontend Developer',
            company: 'Example Ltd',
            rawDescription: 'React and TypeScript required.',
            requirements: [
            {
                category: 'required',
                operator: 'all',
                skills: ['React', 'TypeScript']
            }
            ]
        },

        skillScoreResult: {
            score: 50,
            scoreType: 'required_only',
            required: { matched: 1, total: 2 },
            preferred: { matched: 0, total: 0 },
            hasPendingReview: false
        }
    });

    await expect(analysis.validate()).rejects.toThrow(
        /profileSnapshot/
    );
  });
});