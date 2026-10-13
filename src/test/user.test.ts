import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { UserModel } from '../models/userModel.js'
import bcrypt from 'bcryptjs'

const LOGIN_EMAIL = 'test-login-001@example.com'
const REGISTER_EMAIL = 'test-register-001@example.com'
const DUPLICATE_EMAIL = 'test-duplicate-001@example.com'

beforeAll(async ()=>{
    // create test user
    const hashedPassword = await bcrypt.hash('1223444', 10)
    await UserModel.create({
        email: LOGIN_EMAIL,
        password: hashedPassword
    })

    await UserModel.deleteMany({
        email: {
            $in:[REGISTER_EMAIL,DUPLICATE_EMAIL]
        }
    })
})

afterAll(async ()=>{
    await UserModel.deleteMany({
        email: {
            $in:[REGISTER_EMAIL,DUPLICATE_EMAIL,LOGIN_EMAIL]
        }
    })
})

describe('user',()=>{
    // POST /auth/login
    // 错误密码
    // → 401

    it('should return 401 when the login password is wrong', async () => {
        const res = await request(app).post('/auth/login').send({
            email: LOGIN_EMAIL,
            password: '1223'
        })

        expect(res.status).toBe(401)
    })

    // POST /auth/login
    // 正确 email + 正确 password
    // → 200

    it('should return 200 when email and password is correct',async ()=>{
        const res = await request(app).post('/auth/login').send({
            email: LOGIN_EMAIL,
            password:'1223444'
        })

        expect(res.status).toBe(200)
        expect(res.body.data.token).toBeDefined()
    })

    // POST /auth/register
    // 新的 email + password
    // → 201
    it('should return 201 when email and password is correct',async ()=>{
        const res = await request(app).post('/auth/register').send({
            email: REGISTER_EMAIL,
            password: '1223444'
        })

        expect(res.status).toBe(201)
    })

    // 同一个 email 再注册一次
    // → 409

    it('should return 409 when email is exist',async ()=>{
        const hashedPassword = await bcrypt.hash('1223444', 10)

        await UserModel.create({
            email: DUPLICATE_EMAIL,
            password: hashedPassword
        })

        const res = await request(app).post('/auth/register').send({
            email: DUPLICATE_EMAIL,
            password: '1223444'
        })

        expect(res.status).toBe(409)
    })
})