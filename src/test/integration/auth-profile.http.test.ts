/**
 * Auth/Profile HTTP contract tests.
 * Real Express routing, validation, authentication and error middleware.
 * Mocked UserModel database methods and Profile services; no test DB required.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

const profileMocks = vi.hoisted(() => ({
  getProfileService: vi.fn(),
  updateProfileService: vi.fn(),
}));

vi.mock("../../services/profileServices.js", () => ({
  getProfileService: profileMocks.getProfileService,
  updateProfileService: profileMocks.updateProfileService,
}));

import app from "../../app.js";
import { UserModel } from "../../models/userModel.js";

const userId = new Types.ObjectId().toString();
const email = "user@example.com";
const password = "Correct123!";
const passwordHash = bcrypt.hashSync(password, 4);
const savedUser = {
  _id: new Types.ObjectId(userId),
  id: userId,
  email,
  password: passwordHash,
};
const profileInput = {
  needsPermit: true,
  targetRole: "Software Engineer",
  educationLevel: "bachelor",
  yearsExperience: 2,
  skills: ["React", "TypeScript"],
  preferredLocation: "Cork",
};
const originalJwtSecret = process.env.JWT_SECRET;
const testSecret = "permitmatch-auth-profile-http-test-secret";
let token: string;
const auth = (value = token) => ({ Authorization: `Bearer ${value}` });

beforeAll(() => {
  process.env.JWT_SECRET = testSecret;
  token = jwt.sign({ userId }, testSecret);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

afterAll(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

describe("Auth HTTP controller contract", () => {
  it("AH01: rejects invalid registration before accessing the database", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne");
    const createSpy = vi.spyOn(UserModel, "create");

    const res = await request(app).post("/auth/register")
      .send({ email: "not-an-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid user data" });
    expect(findSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AH02: rejects registration when email already exists", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne").mockResolvedValue(savedUser as any);
    const createSpy = vi.spyOn(UserModel, "create");

    const res = await request(app).post("/auth/register")
      .send({ email, password });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: "Email already registered" });
    expect(findSpy).toHaveBeenCalledExactlyOnceWith({ email });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("AH03: registers a new user with a hashed password and a safe response", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne").mockResolvedValue(null);
    const createSpy = vi.spyOn(UserModel, "create").mockResolvedValue(savedUser as any);

    const res = await request(app).post("/auth/register")
      .send({ email, password });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "User registered",
      data: { id: userId, email },
    });
    expect(res.body.data).not.toHaveProperty("password");
    expect(findSpy).toHaveBeenCalledExactlyOnceWith({ email });
    expect(createSpy).toHaveBeenCalledOnce();
    const written = createSpy.mock.calls[0][0] as { email: string; password: string };
    expect(written.email).toBe(email);
    expect(written.password).not.toBe(password);
    expect(await bcrypt.compare(password, written.password)).toBe(true);
  });

  it("AH04: rejects invalid login input before database lookup", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne");

    const res = await request(app).post("/auth/login")
      .send({ email: "invalid", password: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid user data" });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it("AH05: returns 401 for an unknown email", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne").mockResolvedValue(null);

    const res = await request(app).post("/auth/login")
      .send({ email, password });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid email or password" });
    expect(findSpy).toHaveBeenCalledExactlyOnceWith({ email });
  });

  it("AH06: returns 401 for an incorrect password without issuing a token", async () => {
    vi.spyOn(UserModel, "findOne").mockResolvedValue(savedUser as any);

    const res = await request(app).post("/auth/login")
      .send({ email, password: "Wrong123!" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid email or password" });
    expect(res.body).not.toHaveProperty("data.token");
  });

  it("AH07: signs a JWT for a valid user and password", async () => {
    vi.spyOn(UserModel, "findOne").mockResolvedValue(savedUser as any);

    const res = await request(app).post("/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(jwt.verify(res.body.data.token, testSecret)).toMatchObject({ userId });
  });

  it("AH08: rejects unauthenticated /auth/me without querying users", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne");

    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(findSpy).not.toHaveBeenCalled();
  });

  it("AH09: returns 401 if an authenticated user no longer exists", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne").mockResolvedValue(null);

    const res = await request(app).get("/auth/me").set(auth());

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid User" });
    expect(findSpy).toHaveBeenCalledExactlyOnceWith({ _id: userId });
  });

  it("AH10: returns authenticated user details without password", async () => {
    const findSpy = vi.spyOn(UserModel, "findOne").mockResolvedValue(savedUser as any);

    const res = await request(app).get("/auth/me").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: { id: userId, email } });
    expect(res.body.data).not.toHaveProperty("password");
    expect(findSpy).toHaveBeenCalledExactlyOnceWith({ _id: userId });
  });
});

describe("Profile HTTP controller contract", () => {
  it("PH01: requires authentication for GET /profile", async () => {
    const res = await request(app).get("/profile");

    expect(res.status).toBe(401);
    expect(profileMocks.getProfileService).not.toHaveBeenCalled();
  });

  it("PH02: rejects invalid userId before calling profile service", async () => {
    const invalidToken = jwt.sign({ userId: "not-an-object-id" }, testSecret);

    const res = await request(app).get("/profile").set(auth(invalidToken));

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid UserId" });
    expect(profileMocks.getProfileService).not.toHaveBeenCalled();
  });

  it("PH03: fetches the current user's profile", async () => {
    const profile = { _id: new Types.ObjectId().toString(), userId, ...profileInput };
    profileMocks.getProfileService.mockResolvedValue(profile);

    const res = await request(app).get("/profile").set(auth());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: profile });
    expect(profileMocks.getProfileService).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it("PH04: rejects unauthenticated PUT /profile without calling service", async () => {
    const res = await request(app).put("/profile").send(profileInput);

    expect(res.status).toBe(401);
    expect(profileMocks.updateProfileService).not.toHaveBeenCalled();
  });

  it("PH05: rejects invalid profile input before calling service", async () => {
    const res = await request(app).put("/profile").set(auth())
      .send({ ...profileInput, yearsExperience: "not-a-number" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid body" });
    expect(profileMocks.updateProfileService).not.toHaveBeenCalled();
  });

  it("PH06: updates the authenticated user's profile using parsed input", async () => {
    const profile = { _id: new Types.ObjectId().toString(), userId, ...profileInput };
    profileMocks.updateProfileService.mockResolvedValue(profile);

    const res = await request(app).put("/profile").set(auth()).send(profileInput);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "success", data: profile });
    expect(profileMocks.updateProfileService).toHaveBeenCalledExactlyOnceWith(userId, profileInput);
  });

  it("PH07: returns 404 when profile service cannot save the profile", async () => {
    profileMocks.updateProfileService.mockResolvedValue(null);

    const res = await request(app).put("/profile").set(auth()).send(profileInput);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Invalid userId or profile" });
    expect(profileMocks.updateProfileService).toHaveBeenCalledExactlyOnceWith(userId, profileInput);
  });
});
