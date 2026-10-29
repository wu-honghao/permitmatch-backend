import mongoose, { Schema } from "mongoose";

export const salarySchema = new Schema({
  rawContent: {
    type: String,
    default: null
  },
  min: {
    type: Number,
    default: null
  },
  max: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: null
  },
  period: {
    type: String,
    enum: ['hour', 'month', 'year'],
    default: null
  }
}, {
  _id: false
});

export const contractSchema = new Schema({
    rawContent: {
        type: String,
        default: null
    },
    type: {
        type: String,
        default: null,
        enum: ['permanent', 'fixed_term', 'other']
    },
    durationMonths: {
        type: Number,
        min: 0,
        default: null,
    }
},{
  _id: false
})

export const educationRequirementSchema = new Schema({
    rawContent:{
        type: String,
        default: null
    },
    level:{
        type: String,
        default: null,
        enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd'],
    },
    importance: {
        type: String,
        required: true,
        enum: ['required','preferred','review']
    },
    fieldOfStudy: {
        type: String,
        default: null,
    }
}, { 
    _id: false
})

export const experienceRequirementSchema = new Schema({
    rawContent: {
        type: String,
        default: null
    },
    minYears: {
        type: Number,
        default: null,
        min: 0
    },
    maxYears: {
        type: Number,
        default: null,
        min: 0
    },
    importance: {
        type: String,
        required: true,
        enum: ['required', 'preferred', 'review']
    },
    scope: {
        type: String,
        default: null,
    }
},{ _id: false })

export const permitSupportSchema = new Schema({
    rawContent: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['supported', 'not_supported', 'unknown'],
        required: true
    }
},{ _id: false })

export const skillRequirementSchema = new Schema({
    rawContent: {
        type: String,
        default: null
    },
    category: {
        type: String,
        required: true,
        enum: ['required', 'preferred', 'review']
    },
    operator:{
        type: String,
        enum: ['all','any'],
        default: null
    },
    skills: {
        type: [String],
        default: []
    }
},{ _id: false });

export type Job = {
  ownerId: mongoose.Types.ObjectId;
  rawDescription: string;
  title: string;
  company: string | null;
  location: string | null;

  salary: {
    rawContent: string | null;
    min: number | null;
    max: number | null;
    currency: string | null;
    period: 'hour' | 'month' | 'year' | null;
  } | null;

  contract: {
    rawContent: string | null;
    type: 'permanent' | 'fixed_term' | 'other' | null;
    durationMonths: number | null;
  } | null;

  educationRequirement: {
    rawContent: string | null;
    level: 'high_school' | 'diploma' | 'bachelor' | 'master' | 'phd' | null;
    importance: 'required' | 'preferred' | 'review';
    fieldOfStudy: string | null;
  } | null;

  experienceRequirement: {
    rawContent: string | null;
    minYears: number | null;
    maxYears: number | null;
    importance: 'required' | 'preferred' | 'review';
    scope: string | null;
  } | null;

  requirements: {
    rawContent: string | null;
    category: 'required' | 'preferred' | 'review';
    operator: 'all' | 'any' | null;
    skills: string[];
  }[];

  permitSupport: {
    rawContent: string | null;
    status: 'supported' | 'not_supported' | 'unknown';
  } | null;

  latestAnalysisId: mongoose.Types.ObjectId | null;
};

export const jobSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    rawDescription:{
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    company: {
        type: String,
        default: null,
        trim: true,
    },
    location: {
        type: String,
        default: null,
        trim: true,
    },
    salary: {
        type: salarySchema,
        default: null,
    },
    contract: {
        type: contractSchema,
        default: null,
    },
    educationRequirement: {
        type: educationRequirementSchema,
        default: null,
    },
    experienceRequirement: {
        type: experienceRequirementSchema,
        default: null,
    },
    requirements: {
        type: [skillRequirementSchema],
        default: []
    },
    permitSupport: {
        type: permitSupportSchema,
        default: null
    },
    latestAnalysisId: {
        type: Schema.Types.ObjectId,
        ref: 'Analysis',
        default: null
    }
    },{
        timestamps: true,
    }
)

jobSchema.index({ ownerId: 1, updatedAt: -1 })

export const JobModel = mongoose.model('Job', jobSchema)