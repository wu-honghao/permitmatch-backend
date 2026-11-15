import z from "zod";

export const createJobExtractionValidator = z.strictObject({
    rawDescription: z.string().trim().min(30).max(20000)
})

export type createJobExtration = z.infer<typeof createJobExtractionValidator>