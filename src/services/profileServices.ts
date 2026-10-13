import type { ObjectId } from "mongoose"
import { CandidateProfileModel } from "../models/candidateProfile.js"
import type { ProfileInput } from "../validators/profileValidator.js"

export const getProfileService = async (id: string) => {
    return await CandidateProfileModel.findById(id)
}

export const updateProfileService = async (userid: string, data: ProfileInput) => {
    return await CandidateProfileModel.findOneAndUpdate({ userId: userid }, { ...data, userId: userid },{
      new: true,
      upsert: true,
      runValidators: true,
    })
}