import { afterAll, beforeAll, describe, expect, test } from "vitest";
import app from "../app.js";
import request from 'supertest'
import { UserModel } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { CandidateProfileModel } from "../models/candidateProfile.js";

const LOGINEMAIL_PROFILE = 'test-profile01@example.com' 
const LOGINPASSWORD_PROFILE = '1223444'

let token = ''
let userId = ''

beforeAll(async ()=>{
   const hashedPassword = await bcrypt.hash(LOGINPASSWORD_PROFILE, 10)

   const user = await UserModel.create({
    email: LOGINEMAIL_PROFILE,
    password: hashedPassword,
   })

  userId = user._id.toString()

   const loginResult = await request(app)
    .post('/auth/login')
    .send({
      email: LOGINEMAIL_PROFILE,
      password: LOGINPASSWORD_PROFILE,
    })

   token = loginResult.body.data.token
})

afterAll(async ()=>{
    await CandidateProfileModel.deleteMany({
        userId
    })

    await UserModel.deleteOne({
        _id: userId,
    })
})

describe('profile',() => {
    test('Should get profile when login', async () => {
        const result = await request(app).get('/profile').set('authorization', `Bearer ${token}`)
        
        expect(result.status).toBe(200)
    })

    test('Should update profile when login', async () => {
        const result = await request(app).put('/profile').set('authorization', `Bearer ${token}`).send({
            needsPermit: true,
            targetRole: 'softwore engineer',
            educationLevel: 'bachelor',
            yearsExperience: 3,
            skills: [],
            preferredLocation: 'Cork'
        })

        expect(result.status).toBe(200)
    })
})