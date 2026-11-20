import { afterEach, describe, expect, it, vi } from "vitest";
import { JobModel } from "../../models/jobModel";
import { crossRoleSkillsGap } from "../../services/crossRoleSkillsGapServices";

const mockJobsT02 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
];
const mockJobsT03 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
  {
    _id: "job002",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
];
const mockJobsT04 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"],["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
];
const mockJobsT05 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [["Docker"]],
        },
      },
    },
  },
  {
    _id: "job002",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [["React"]],
        },
      },
    },
  },
];
const mockJobsT06 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React", "Vue.js"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
];
const mockJobsT07 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
  {
    _id: "job002",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["ReactJS"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
];
const mockJobsT08 = [
  {
    _id: "job001",
    latestAnalysisId: {
      skillScoreResult: {
        required: {
          missingSkills: [["React"]],
        },
        preferred: {
          missingSkills: [],
        },
      },
    },
  },
  {
    _id: "job002",
    latestAnalysisId: null
  },
];
describe("crossRoleSkillsGap", () => {
    it("T01: should return empty gaps when user has no jobs", async () => {
        const userId = '507f1f77bcf86cd799439011'
        
        const leanMock = vi.fn().mockResolvedValue([])
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel, "find").mockReturnValue({
            populate: populateMock
        } as any)
        const res = await crossRoleSkillsGap(userId)

        expect(res).toEqual({
            totalJobs: 0,
            gaps: []
        })
        expect(findSpy).toHaveBeenCalledTimes(1);
        expect(populateMock).toHaveBeenCalledTimes(1);
    })

    it("T02: should return 1 totalJobs and gaps", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT02)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)

        expect(res).toEqual({
            totalJobs: 1,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 1,
                    preferredCount: 0,
                    totalCount: 1
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T03: should return 2 totalJobs and gaps", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT03)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 2,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 2,
                    preferredCount: 0,
                    totalCount: 2
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T04: should deduplicate missing skills within one job", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT04)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 1,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 1,
                    preferredCount: 0,
                    totalCount: 1
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T05: should count required and preferred gaps separately", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT05)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 2,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 2,
                    preferredCount: 0,
                    totalCount: 2
                },
                {
                    skills: ['Docker'],
                    requiredCount: 0,
                    preferredCount: 1,
                    totalCount: 1
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T06: should count an OR group as one gap", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT06)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 1,
            gaps: [
                {
                    skills: ['React', "Vue.js"],
                    requiredCount: 1,
                    preferredCount: 0,
                    totalCount: 1
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T07: should merge skill aliases across jobs", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT07)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 2,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 2,
                    preferredCount: 0,
                    totalCount: 2
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })

    it("T08: should exclude jobs without an analysis", async () => {
        const userId = '507f1f77bcf86cd799439011'

        const leanMock = vi.fn().mockResolvedValue(mockJobsT08)
        const populateMock = vi.fn().mockReturnValue({
            lean: leanMock
        })
        const findSpy = vi.spyOn(JobModel,'find').mockReturnValue({
            populate: populateMock
        } as any)

        const res = await crossRoleSkillsGap(userId)
        
        expect(res).toEqual({
            totalJobs: 1,
            gaps: [
                {
                    skills: ['React'],
                    requiredCount: 1,
                    preferredCount: 0,
                    totalCount: 1
                }
            ]
        })
        expect(findSpy).toHaveBeenCalledTimes(1)
    })
})

afterEach(() => {
  vi.restoreAllMocks();
});
