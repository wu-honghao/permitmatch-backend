import mongoose, { Schema } from "mongoose";
import { contractSchema, educationRequirementSchema, experienceRequirementSchema, permitSupportSchema, salarySchema, skillRequirementSchema } from "./jobModel.js";

const jobSnapshotSchema = new Schema(
  {
    // TODO
    title: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    company: {
        type: String,
        default: null
    },
    rawDescription: {
        type: String,
        default: null
    },
    requirements: {
        type: [skillRequirementSchema],
        default: []
    },
    salary: {
        type: salarySchema,
        default: null,
    },
    contract: {
        type: contractSchema,
        default: null
    },
    educationRequirement: {
        type: educationRequirementSchema,
        default: null,
    },
    experienceRequirement: {
        type: experienceRequirementSchema,
        default: null,
    },
    permitSupport: {
        type: permitSupportSchema,
        default: null
    },
  },
  { _id: false }
);

const skillCoverageSchema = new Schema({
  matched: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  coveredSkills: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [[String]],
    default: []
  }
}, { _id: false });

const skillScoreResultSchema = new Schema({
    score: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },
    scoreType: {
        type: String,
        enum: ['weighted','required_only','unavailable'],
        required: true
    },
    required: {
        type: skillCoverageSchema,
        required: true
    },
    preferred: {
        type: skillCoverageSchema,
        required: true
    },
    hasPendingReview: {
        type: Boolean,
        required: true
    }
}, { _id: false })

const profileSnapshotSchema = new Schema({
  needsPermit: {
    type: Boolean,
    default: null
  },
  targetRole: {
    type: String,
    default: null
  },
  educationLevel: {
    type: String,
    default: null
  },
  yearsExperience: {
    type: Number,
    default: null,
    min: 0
  },
  skills: {
    type: [String],
    default: []
  },
  preferredLocation: {
    type: String,
    default: null
  }
}, { _id: false });

export const AnalysisSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    profileSnapshot: {
        type: profileSnapshotSchema,
        required: true
    },
    jobSnapshot: {
        type: jobSnapshotSchema,
        required: true
    },
    skillScoreResult: {
        type: skillScoreResultSchema,
        required: true
    },
}, { timestamps: true })

AnalysisSchema.index({
  ownerId: 1,
  jobId: 1,
  createdAt: -1
});

export const AnalysisModel = mongoose.model('Analysis', AnalysisSchema)