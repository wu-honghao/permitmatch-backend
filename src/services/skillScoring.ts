import { matchSkillRequirement, type SkillRequirement } from "./skillMatching.js";
import { normalizeSkill } from "./skillNormalization.js";

type SkillCoverage = {
  matched: number;
  total: number;
  coveredSkills: string[];
  missingSkills: string[][];
};

type SkillScoreResult = {
  score: number | null;

  scoreType:
    | 'weighted'
    | 'required_only'
    | 'unavailable';

  required: SkillCoverage;
  preferred: SkillCoverage;

  hasPendingReview: boolean;
};

function calculateCoverage(
  userSkills: string[],
  requirements: SkillRequirement[],
  category: 'required' | 'preferred'
): SkillCoverage {
  const normalizedUserSkills = new Set(
    userSkills.map(normalizeSkill)
  );

  const coverage: SkillCoverage = {
    matched: 0,
    total: 0,
    coveredSkills: [],
    missingSkills: []
  };

  for (const requirement of requirements) {
    if (
      requirement.category !== category ||
      requirement.operator === null ||
      requirement.skills.length === 0
    ) {
      continue;
    }

    if (requirement.operator === 'all') {
      coverage.total += requirement.skills.length;

      for (const skill of requirement.skills) {
        if (normalizedUserSkills.has(normalizeSkill(skill))) {
          coverage.matched++;
          coverage.coveredSkills.push(skill);
        } else {
          coverage.missingSkills.push([skill]);
        }
      }
    }

    if (requirement.operator === 'any') {
      coverage.total++;

      const matchedSkills = requirement.skills.filter(skill =>
        normalizedUserSkills.has(normalizeSkill(skill))
      );

      if (matchedSkills.length > 0) {
        coverage.matched++;
        coverage.coveredSkills.push(...matchedSkills);
      } else {
        coverage.missingSkills.push([...requirement.skills]);
      }
    }
  }

  coverage.coveredSkills = [...new Set(coverage.coveredSkills)];

  return coverage;
}

export function calculateSkillScore(
  userSkills: string[],
  requirements: SkillRequirement[] 
): SkillScoreResult {
   const hasPendingReview = requirements.some((requirement)=>{
    if(requirement.operator === null || requirement.category === 'review' || requirement.skills.length === 0){
        return true
    }
    
    return false
  })

  const normalizedRequirements = removeDuplicateRequirements(
    requirements.map(normalizeRequirement)
  );

  const required = calculateCoverage(
    userSkills,
    normalizedRequirements,
    'required'
  );

  const preferred = calculateCoverage(
    userSkills,
    normalizedRequirements,
    'preferred'
  );

  // TODO: 判断是否存在待复核要求
  let score: SkillScoreResult['score'] = null
  let scoreType : SkillScoreResult['scoreType'] = 'unavailable'

  if(!hasPendingReview){
    if(required.total > 0 && preferred.total > 0){
        score = Math.round(((required.matched / required.total) * 0.8 + (preferred.matched / preferred.total) * 0.2) * 100)
        scoreType = 'weighted'
    }
    else if(required.total > 0 && preferred.total === 0){
        score = Math.round(((required.matched / required.total) * 1)  * 100)
        scoreType = 'required_only'
    }
  }

  // TODO: 返回 SkillScoreResult
  return {
    score,
    scoreType,
    required,
    preferred,
    hasPendingReview
  }
}

export function normalizeRequirement(requirements: SkillRequirement): SkillRequirement{
    return {
        ...requirements,
        skills: [...new Set(requirements.skills.map((skill)=>{
            return normalizeSkill(skill)
        }))]
    }
}

export function isSameRequirement(
  groupA: SkillRequirement,
  groupB: SkillRequirement
): boolean {
  // TODO
  if(groupA.category !== groupB.category || groupA.operator !== groupB.operator){
    return false
  }

  const groupASkillRequirement = normalizeRequirement(groupA)
  const groupBSkillRequirement = normalizeRequirement(groupB)

  if(groupASkillRequirement.skills.length !== groupBSkillRequirement.skills.length){
    return false
  }

  const groupASkillString = groupASkillRequirement.skills.sort().join('|')
  const groupBSkillString = groupBSkillRequirement.skills.sort().join('|')

  return groupASkillString === groupBSkillString
}

export function removeDuplicateRequirements(
  requirements: SkillRequirement[]
): SkillRequirement[] {
  const removeIndexes = new Set<number>();
  
  // TODO: 双重循环
  // 使用 isSameRequirement() 判断是否重复
  // 重复时将 j 加入 removeIndexes
  for(let i = 0; i < requirements.length; i++){
    if (removeIndexes.has(i)) continue;

    for(let j = i + 1; j < requirements.length; j++){
        if (removeIndexes.has(j)) continue;

        const result = isSameRequirement(requirements[i],requirements[j])

        if(result){
            removeIndexes.add(j)
        }
    }
  }

  return requirements.filter(
    (_, index) => !removeIndexes.has(index)
  );
}