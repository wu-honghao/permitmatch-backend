import { JobModel } from "../models/jobModel.js";
import { normalizeGroup } from "./skillNormalization.js";

type SkillCoverage = {
    missingSkills: string[][];
};

type PopulatedAnalysis = {
    skillScoreResult: {
        required: SkillCoverage;
        preferred: SkillCoverage;
    };
};

export async function crossRoleSkillsGap(userId: string){
    // 找到该用户所有的 Job
    // 关联处 analyses skills 中的 missingskills

    const result = await JobModel.find({ ownerId: userId })
    .populate<{ latestAnalysisId: PopulatedAnalysis | null }>(
        "latestAnalysisId",
        "skillScoreResult.required skillScoreResult.preferred"
    )
    .lean();

    const jobsGapCount = new Map<string, { requiredCount: number, preferredCount: number }>()

    let totalJobs = 0;
    for(let job of result){
        if (!job.latestAnalysisId) continue;

        totalJobs++;

        const { missingSkills: missingSkillsRequired } = job.latestAnalysisId.skillScoreResult.required
        const { missingSkills: missingSkillsPreferred } = job.latestAnalysisId.skillScoreResult.preferred

        const resultRequired = (missingSkillsRequired ?? []).map(normalizeGroup);
        const resultPreferred = (missingSkillsPreferred ?? []).map(normalizeGroup);

        const jobsGap = new Map<string, "required" | "preferred">();

        for(let preferredGap of resultPreferred){
            jobsGap.set(preferredGap, "preferred")
        }

        for(let requiredGap of resultRequired){
            jobsGap.set(requiredGap, "required")
        }

        for(let [skill, category] of jobsGap){
            const count = jobsGapCount.get(skill) ?? {
                requiredCount: 0,
                preferredCount: 0
            }

            if(category === 'required'){
                count.requiredCount ++ 
            }
            if(category === 'preferred'){
                count.preferredCount ++ 
            }

            jobsGapCount.set(skill, count)
        }
    }

    const gaps = [...jobsGapCount].map(([skill, counts])=>{
        return {
            skills: skill.split('|'),
            ...counts,
            totalCount: counts.requiredCount + counts.preferredCount
        }
    })

    gaps.sort((a, b) => b.totalCount - a.totalCount);

    return { totalJobs, gaps }
}