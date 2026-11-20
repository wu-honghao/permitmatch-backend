import { describe, vi, it, expect, afterEach } from "vitest";
import { extractJobDescription } from '../../services/jobExtractionService'
import { ApiError } from "@google/genai";

const mockGenerateContent = vi.hoisted(()=> vi.fn())
const mockDraft = {
  title: "React Developer",
  company: "ABC Ltd",
  location: "Dublin",
  salary: {
    min: null,
  },
  contract: {
    durationMonths: null,
  },
  experienceRequirement: {
    minYears: null,
    scope: null,
  },
  educationRequirement: {
    level: null,
  },
  permitSupport: {
    status: "unknown",
  },
  requirements: [
    {
      category: "required",
      operator: "all",
      skills: ["React", "TypeScript"],
      rawContent: "Experience with React and TypeScript",
    },
  ],
};

vi.mock("@google/genai", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@google/genai")>();

    return {
        ...actual,
        GoogleGenAI: class{
            models = { generateContent: mockGenerateContent }
        }
    }
})

describe("jobExtractionService", () => {
    it("T01: should extract a valid job draft", async () => {
        const rawDescription = "Experience with React and TypeScript";

        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify(mockDraft)
        })

        const res = await extractJobDescription(rawDescription)

        expect(res).toEqual({
            ...mockDraft,
            rawDescription
        })

        expect(mockGenerateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                contents: rawDescription,
                config: expect.objectContaining({
                    responseMimeType: "application/json",
                    httpOptions: expect.objectContaining({
                        timeout: 15000,
                    })
                }),
            })
        )

        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    })

    it("T02: should reject an empty Gemini response with 502", async () => {
        const rawDescription = "React Developer";

        mockGenerateContent.mockResolvedValue({
            text: ""
        })

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 502,
            message: "AI returned an empty response",
        });
    })

    it("T03: should reject invalid JSON with 502", async () => {
        const rawDescription = "React Developer";

        mockGenerateContent.mockResolvedValue({
            text: "invalid json"
        })

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 502,
            message: 'AI returned invalid structured data'
        })
    })

    it("T04: should reject data that fails Zod validation with 502", async () => {
        const rawDescription = "React Developer";

        mockGenerateContent.mockResolvedValue({
            text: JSON.stringify({
                title: 'React Developer'
            })
        })

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 502,
            message: 'AI returned invalid structured data'
        })
    })

    it("T05: should reject a Gemini 503 error", async () => {
        const rawDescription = "React Developer";

        const error = new ApiError({
            status: 503,
            message: "Service unavailable",
        });
        mockGenerateContent.mockRejectedValue(error)

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 503,
            message: "AI service temporarily unavailable",
        })
    })

    it("T06: should convert Gemini 429 to AppError 503", async () => {
        const rawDescription = "React Developer";

        const error = new ApiError({
            status: 429,
            message: "AI provider rate limit exceeded",
        });
        mockGenerateContent.mockRejectedValue(error)

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 503,
            message: "AI provider rate limit exceeded",
        })
    })

    it("T07: should handle an aborted request with 504", async () => {
        const rawDescription = "React Developer";

        const error = new DOMException("The operation was aborted", "AbortError")
        mockGenerateContent.mockRejectedValue(error)

        await expect(extractJobDescription(rawDescription)).rejects.toMatchObject({
            statusCode: 504,
            message: "AI request timed out",
        })
    })

    it("T08: should rethrow an unexpected error unchanged", async () => {
        const rawDescription = "React Developer";

        const error = new Error('Unexpected failure')
        mockGenerateContent.mockRejectedValue(error)

        await expect(extractJobDescription(rawDescription)).rejects.toBe(error)
    })
})

afterEach(() => {
  vi.resetAllMocks();
});
