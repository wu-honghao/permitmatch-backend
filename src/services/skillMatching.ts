import { normalizeSkill } from "./skillNormalization.js";

export type SkillRequirement = {
  category: 'required' | 'preferred' | 'review';
  operator: 'all' | 'any' | null;
  skills: string[];
};

export function matchSkillRequirement(
  userSkills: string[],
  requirement: SkillRequirement
): boolean | null {
    if(requirement.category === 'review' || !requirement.operator || requirement.skills.length === 0){
        return null
    }
    
    const normalizedUserSkills = new Set(userSkills.map((skill)=> normalizeSkill(skill)))

    if(requirement.operator === 'all'){
        return requirement.skills.every((requirementSkill)=>{
            return normalizedUserSkills.has(normalizeSkill(requirementSkill))
        })
    }

    else if(requirement.operator === 'any'){
        return requirement.skills.some((requirementSkill)=>{
            return normalizedUserSkills.has(normalizeSkill(requirementSkill))
        })
    }

    return null
}