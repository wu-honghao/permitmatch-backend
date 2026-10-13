import mongoose, { Schema } from "mongoose";

export const candidateProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    needsPermit: {
        type: Boolean,
        required: true,
    },
    targetRole: {
        type: String,
        required: true,
        trim: true,
    },
    educationLevel: {
        type: String,
        required: true,
        enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd'],
    },
    yearsExperience: {
        type: Number,
        required: true,
        min: 0
    },
    skills: {
        type: [String],
        default: []
    },
    preferredLocation: {
        type: String,
        required: true
    }
    },{
        timestamps: true,
    }
)

export const CandidateProfileModel = mongoose.model('CandidateProfile', candidateProfileSchema)