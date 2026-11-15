import z from "zod";

const salaryValidator = z.strictObject({
    rawContent: z.string().nullable(),
    min: z.number().min(0).nullable(),
    max: z.number().min(0).nullable(),
    currency: z.string().nullable(),
    period: z.enum(['hour', 'month', 'year']).nullable()
}).refine((data)=>{
    if(data.min === null || data.max === null){
        return true
    }

    return data.min <= data.max
}, {
  message: "Minimum salary cannot exceed maximum salary",
  path: ["max"],
})

const contractValidator = z.strictObject({
    rawContent: z.string().nullable(),
    type: z.enum(['permanent', 'fixed_term', 'other']).nullable(),
    durationMonths: z.number().min(0).nullable()
})

const educationRequirementValidator = z.strictObject({
    rawContent: z.string().nullable(),
    level: z.enum(['high_school', 'diploma', 'bachelor', 'master', 'phd']).nullable(),
    importance: z.enum(['required','preferred','review']).nullable(),
    fieldOfStudy: z.string().nullable()
})

const experienceRequirementValidator = z.strictObject({
    rawContent: z.string().nullable(),
    minYears: z.number().min(0).nullable(),
    maxYears: z.number().min(0).nullable(),
    importance: z.enum(['required', 'preferred', 'review']).nullable(),
    scope: z.string().nullable()
}).refine((data)=>{
    if(data.minYears === null || data.maxYears === null){
        return true
    }

    return data.minYears <= data.maxYears
}, {
  message: "Minimum years cannot exceed maximum years",
  path: ["maxYears"],
})

const requirementsValidator = z.strictObject({
    rawContent: z.string().nullable(),
    category: z.enum(['required', 'preferred', 'review']),
    operator: z.enum(['all','any']).nullable(),
    skills: z.array(z.string().trim().min(1)).default([])
}).refine((data)=>{
    if(data.category === 'review'){
        return true
    }

    return data.skills.length > 0
},{
    message: "Required and preferred groups must contain skills",
    path: ["skills"]
})

const permitSupportValidator = z.strictObject({
    rawContent: z.string().nullable(),
    status: z.enum(['supported', 'not_supported', 'unknown'])
})

export const createJobValidator = z.strictObject({
  rawDescription: z.string().nullish().transform(v => v ?? null),
  title: z.string().trim().min(1),
  company: z.string().trim().nullish().transform(v => v ?? null),
  location: z.string().trim().nullish().transform(v => v ?? null),

  salary: salaryValidator.nullish().transform(v => v ?? null),
  contract: contractValidator.nullish().transform(v => v ?? null),
  educationRequirement: educationRequirementValidator.nullish().transform(v => v ?? null),
  experienceRequirement: experienceRequirementValidator.nullish().transform(v => v ?? null),

  requirements: z.array(requirementsValidator).default([]),
  permitSupport: permitSupportValidator.nullish().transform(v => v ?? null),
});

export type CreateJobInput = z.infer<typeof createJobValidator>

export const updateJobValidator = z.strictObject({
  rawDescription: z.string().nullable().optional(),
  title: z.string().trim().min(1).optional(),
  company: z.string().trim().nullable().optional(),
  location: z.string().trim().nullable().optional(),

  salary: salaryValidator.nullable().optional(),
  contract: contractValidator.nullable().optional(),
  educationRequirement: educationRequirementValidator.nullable().optional(),
  experienceRequirement: experienceRequirementValidator.nullable().optional(),

  requirements: z.array(requirementsValidator).optional(),
  permitSupport: permitSupportValidator.nullable().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);

export type UpdateJobInputValidtor = z.infer<typeof updateJobValidator>;