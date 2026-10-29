import type { ObjectId } from "mongoose"
import { CandidateProfileModel } from "../models/candidateProfile.js"
import type { ProfileInput } from "../validators/profileValidator.js"

export const getProfileService = async (userid: string) => {
    return await CandidateProfileModel.findOne({
        userId: userid
    })
}

export const updateProfileService = async (userid: string, data: ProfileInput) => {
    return await CandidateProfileModel.findOneAndUpdate({ userId: userid }, { ...data, userId: userid },{
      new: true,
      upsert: true,
      runValidators: true,
    })
}