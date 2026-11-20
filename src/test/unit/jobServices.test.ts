import { describe, it, expect, afterEach, vi } from "vitest";
import { Types } from "mongoose";
import { JobModel } from "../../models/jobModel.js";
import { addJob, deleteJob, findAllJob, findJobById, updateJob } from "../../services/jobServices.js";
import { type CreateJobInput, createJobValidator } from "../../validators/jobValidator.js";

const userId = new Types.ObjectId().toString();
const jobId = new Types.ObjectId().toString();

const mockFindJob = {
  _id: jobId,
  ownerId: userId,
  title: "React Developer",
  company: "ABC Ltd",
  location: "Dublin",
  latestAnalysisId: {
    _id: new Types.ObjectId().toString(),
    skillScoreResult: {
      score: 85,
      scoreType: "weighted",
    },
    createdAt: new Date("2026-11-01"),
  },
};

const mockAddInputJob = {
  title: "React Developer",
  company: "ABC Ltd",
  location: "Dublin",
  rawDescription: "Experience with React and TypeScript",
};

const mockJobs = [
  {
    _id: new Types.ObjectId(),
    title: "React Developer",
    company: "ABC Ltd",
    location: "Dublin",
    latestAnalysisId: {
      _id: new Types.ObjectId(),
      skillScoreResult: {
        score: 85,
        scoreType: "weighted",
      },
    },
    updatedAt: new Date("2026-11-18"),
  },
];

const mockFindAllQuery = (jobs: unknown[]) => {
  const leanMock = vi.fn().mockResolvedValue(jobs);

  const sortMock = vi.fn().mockReturnValue({
    lean: leanMock,
  });

  const populateMock = vi.fn().mockReturnValue({
    sort: sortMock,
  });

  const selectMock = vi.fn().mockReturnValue({
    populate: populateMock,
  });

  const findSpy = vi.spyOn(JobModel, "find").mockReturnValue({
    select: selectMock,
  } as any);

  return { findSpy, selectMock, populateMock, sortMock, leanMock };
};

const updateInput = {
  id: jobId,
  job: {
    title: "Senior React Developer",
  },
};

afterEach(() => vi.restoreAllMocks());

describe("jobServices (unit)", () => {
  it("T09: should find an owned job and populate its latest analysis", async () => {
    const populateMock = vi.fn().mockResolvedValue(mockFindJob)

    const findOneSpy = vi.spyOn(JobModel, "findOne").mockReturnValue({
      populate: populateMock
    } as any)

    const res = await findJobById(userId, jobId)

    expect(res).toEqual(mockFindJob)
    expect(findOneSpy).toHaveBeenCalledWith({
      ownerId: userId,
      _id: jobId
    })
    expect(populateMock).toHaveBeenCalledWith({
      path: "latestAnalysisId", 
      select: "skillScoreResult.score skillScoreResult.scoreType createdAt"
    })
  })

  it("T10: should reject an invalid userId before querying a job", async () => {
    const findOneSpy = vi.spyOn(JobModel, "findOne")

    await expect(findJobById("invalid-user", jobId)).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid ObjectId"
    })

    expect(findOneSpy).not.toHaveBeenCalled()
  })

  it("T11: should return 404 when an owned job does not exist", async () => {
    const populateMock = vi.fn().mockResolvedValue(null)

    const findOneSpy = vi.spyOn(JobModel, "findOne").mockReturnValue({
      populate: populateMock
    } as any)

    const missingJobId = new Types.ObjectId().toString()
    await expect(findJobById(userId, missingJobId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Job not found"
    })

    expect(findOneSpy).toHaveBeenCalledWith({
      ownerId: userId,
      _id: missingJobId,
    });
    expect(populateMock).toHaveBeenCalledOnce();
  })

  it("T12: should reject an invalid jobId before querying a job", async () => {
    const findOneSpy = vi.spyOn(JobModel, "findOne")

    await expect(findJobById(userId, "invalid-job")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid ObjectId"
    })

    expect(findOneSpy).not.toHaveBeenCalled()
  })

  it("T13: should create a job with the authenticated ownerId", async () => {
    const data = createJobValidator.parse(mockAddInputJob)
    const createdJob = new JobModel({
      ...data,
      ownerId: userId,
    })
    const createSpy = vi.spyOn(JobModel, 'create').mockResolvedValue(createdJob)

    const res = await addJob(userId, data)

    expect(createSpy).toHaveBeenCalledWith({
      ...data,
      ownerId: userId
    })
    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(res).toBe(createdJob);
  })

  it("T14: should reject job creation with an invalid userId", async () => {
    const createSpy = vi.spyOn(JobModel,'create')

    const data = createJobValidator.parse(mockAddInputJob)

    await expect(addJob("invalid userid", data)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid ObjectId'
    })
    expect(createSpy).not.toHaveBeenCalled()
  })

  it("T15: should reject job creation with empty data", async () => {
    const createSpy = vi.spyOn(JobModel, 'create')

    await expect(addJob(userId, {} as CreateJobInput)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid job data'
    })

    expect(createSpy).not.toHaveBeenCalled()
  })

  it("T16: should reject job creation with an unauthorized ownerId field", async () => {
    const createSpy = vi.spyOn(JobModel, 'create')

    const data = {
      ...mockAddInputJob,
      ownerId: 'another-userId'
    }
    await expect(addJob(userId, data)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Fields not allowed: ownerId'
    })

    expect(createSpy).not.toHaveBeenCalled()
  })

  it("T17: should update an owned job with validation enabled", async () => {
    const updatedJob = new JobModel({
      _id: jobId,
      ownerId: userId,
      title: "Senior React Developer",
    });
    const findOneAndUpdateSpy = vi.spyOn(JobModel, "findOneAndUpdate").mockResolvedValue(updatedJob)

    const res = await updateJob(userId, updateInput)

    expect(findOneAndUpdateSpy).toHaveBeenCalledTimes(1)
    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        {
            _id: updateInput.id,
            ownerId: userId
        },
        { $set: updateInput.job },
        { new: true, runValidators: true }
    )
    expect(res).toBe(updatedJob)
  })

  it("T18: should return null when no owned job can be updated", async () => {
    const findOneAndUpdateSpy = vi
      .spyOn(JobModel, "findOneAndUpdate")
      .mockResolvedValue(null);

    const res = await updateJob(userId, updateInput);

    expect(findOneAndUpdateSpy).toHaveBeenCalledOnce();

    expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
      {
        _id: updateInput.id,
        ownerId: userId,
      },
      { $set: updateInput.job },
      { new: true, runValidators: true }
    );

    expect(res).toBeNull();
  });

  it("T19: should reject updates to the protected ownerId field", async () => {
    const findOneAndUpdateSpy = vi.spyOn(JobModel, 'findOneAndUpdate')

    const data = {
      id: jobId,
      job: {
        ownerId: 'another-userId'
      }
    }
    await expect(updateJob(userId, data)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Fields not allowed: ownerId'
    })

    expect(findOneAndUpdateSpy).not.toHaveBeenCalled()
  })

  it("T20: should reject an empty job update", async () => {
    const findOneAndUpdateSpy = vi.spyOn(JobModel, 'findOneAndUpdate')

    await expect(updateJob(userId, {
      id: jobId,
      job: {},
    })).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid job data'
    })

    expect(findOneAndUpdateSpy).not.toHaveBeenCalled()
  })

  it("T21: should reject an invalid jobId when updating a job", async () => {
    const findOneAndUpdateSpy = vi.spyOn(JobModel, 'findOneAndUpdate')

    await expect(updateJob(userId, {
      id: 'invalid jobid',
      job: {},
    })).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid job data'
    })

    expect(findOneAndUpdateSpy).not.toHaveBeenCalled()
  })

  it("T22: should delete an owned job and return the deleted document", async () => {
    const deletedJob = new JobModel({
      _id: jobId,
      ownerId: userId,
      title: "React Developer",
    });
    const findOneAndDeleteSpy = vi.spyOn(JobModel, 'findOneAndDelete').mockResolvedValue(deletedJob)

    const res = await deleteJob(jobId, userId)
    
    expect(findOneAndDeleteSpy).toHaveBeenCalledOnce()
    expect(findOneAndDeleteSpy).toHaveBeenCalledWith({
        _id: jobId,
        ownerId: userId
    })
    expect(res).toBe(deletedJob)
  })

  it("T23: should reject deletion with an invalid userId", async () => {
    const findOneAndDeleteSpy = vi.spyOn(JobModel, 'findOneAndDelete').mockResolvedValue(null)

    await expect(deleteJob(jobId, "invalid user")).rejects.toMatchObject({
      message: "Invalid ObjectId",
      statusCode: 400
    })
    expect(findOneAndDeleteSpy).not.toHaveBeenCalled()
  })

  it("T24: should reject deletion with an invalid jobId", async () => {
    const findOneAndDeleteSpy = vi.spyOn(JobModel, 'findOneAndDelete').mockResolvedValue(null)

    await expect(deleteJob("invalid job", userId)).rejects.toMatchObject({
      message: "Invalid ObjectId",
      statusCode: 400
    })
    expect(findOneAndDeleteSpy).not.toHaveBeenCalled()
  })

  it("T25: should return null when a job to delete is not found", async () => {
    const findOneAndDeleteSpy = vi.spyOn(JobModel, 'findOneAndDelete').mockResolvedValue(null)

    const res = await deleteJob(jobId, userId)
    expect(findOneAndDeleteSpy).toHaveBeenCalledWith({
      _id: jobId,
      ownerId: userId
    })
    expect(res).toBeNull()
  })

  it("T26: should return an empty list with correct query filters and ordering", async () => {
    const leanMock = vi.fn().mockResolvedValue([])

    const sortMock = vi.fn().mockReturnValue({
      lean: leanMock
    })

    const populateMock = vi.fn().mockReturnValue({
      sort: sortMock
    })

    const selectMock = vi.fn().mockReturnValue({
      populate: populateMock
    })

    const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
      select: selectMock
    } as any)

    const res = await findAllJob(userId)
    
    expect(res).toEqual([])
    expect(findSpy).toHaveBeenCalledWith({ ownerId: userId })
    expect(populateMock).toHaveBeenCalledWith({
      path: "latestAnalysisId",
      select: "skillScoreResult.score skillScoreResult.scoreType",
    });
    expect(sortMock).toHaveBeenCalledWith({
      updatedAt: -1,
    });
  })

  it("T27: should map populated analysis scores into a job list", async () => {
    const leanMock = vi.fn().mockResolvedValue(mockJobs)

    const sortMock = vi.fn().mockReturnValue({
      lean: leanMock
    })

    const populateMock = vi.fn().mockReturnValue({
      sort: sortMock
    })

    const selectMock = vi.fn().mockReturnValue({
      populate: populateMock
    })

    const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
      select: selectMock
    } as any)

    const res = await findAllJob(userId)
    expect(res[0]).toMatchObject({
      _id: mockJobs[0]._id.toString(),
      title: "React Developer",
      company: "ABC Ltd",
      location: "Dublin",
      skillScore: 85,
      scoreType: "weighted",
      latestAnalysisId: mockJobs[0].latestAnalysisId,
      updatedAt: mockJobs[0].updatedAt
    });
    expect(findSpy).toHaveBeenCalledWith({
      ownerId: userId,
    });
  })

  it('T28: should return null scores when no analysis exists', async () => {
    const jobs = [{
      _id: new Types.ObjectId(),
      title: 'React Developer',
      company: 'ABC Ltd',
      location: 'Dublin',
      latestAnalysisId: null,
      updatedAt: new Date('2026-11-18'),
    }];
    const { findSpy } = mockFindAllQuery(jobs);
    const res = await findAllJob(userId);

    expect(findSpy).toHaveBeenCalledWith({ ownerId: userId });
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      _id: jobs[0]._id.toString(),
      skillScore: null,
      scoreType: null,
      latestAnalysisId: null,
    });
  });

  it('T29: should preserve a null score when an analysis exists', async () => {
    const jobs = [{
      _id: new Types.ObjectId(),
      title: 'React Developer',
      company: 'ABC Ltd',
      location: 'Dublin',
      latestAnalysisId: {
        _id: new Types.ObjectId(),
        skillScoreResult: { score: null, scoreType: 'unavailable' },
      },
      updatedAt: new Date('2026-11-18'),
    }];
    mockFindAllQuery(jobs);
    const res = await findAllJob(userId);

    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      skillScore: null,
      scoreType: 'unavailable',
      latestAnalysisId: jobs[0].latestAnalysisId,
    });
  });

  it('T30: should reject invalid userId without querying database', async () => {
    const findSpy = vi.spyOn(JobModel, 'find');

    await expect(findAllJob('invalid-user')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid ObjectId',
    });
    expect(findSpy).not.toHaveBeenCalled();
  });
});
