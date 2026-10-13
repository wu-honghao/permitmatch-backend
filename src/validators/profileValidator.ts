import z from "zod";

export const profileSchema = z.object({
    needsPermit: z.boolean(),
    targetRole: z.string().trim(),
    educationLevel: z.string(),
    yearsExperience: z.number(),
    skills: z.array(z.string()).default([]),
    preferredLocation: z.string()
})

export type ProfileInput = z.infer<typeof profileSchema>