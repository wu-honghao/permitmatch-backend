import { describe, expect, it} from "vitest";
import { calculateSkillScore, removeDuplicateRequirements } from "../services/skillScoring.js";
import type { SkillRequirement } from "../services/skillMatching.js";

describe('skillScoring',() => {
    it('T0', () => {
        const userSkills = [
            'ReactJS',
        ];

        const requirements: SkillRequirement[] = [
            {
                category: 'required',
                operator: 'all',
                skills: ['React','react']
            },
            {
                category: 'required',
                operator: 'all',
                skills: ['ReactJS']
            },
        ];

        const result = calculateSkillScore(userSkills, requirements)
        expect(result.score).toBe(100)
        expect(result.scoreType).toBe('required_only')
        expect(result.required).toEqual({
            matched: 1,
            total: 1,
            coveredSkills: ["React"],
            missingSkills: []
        });
    })
})

describe('removeDuplicateRequirements',()=>{
    it('T01',() => {
        const requirements: SkillRequirement[] = [
            {
                category: 'required',
                operator: 'any',
                skills: ['React', 'Vue']
            },
            {
                category: 'required',
                operator: 'any',
                skills: ['Vue', 'ReactJS']
            }
        ];

        const result = removeDuplicateRequirements(requirements);

        expect(result).toHaveLength(1);
        expect(requirements).toHaveLength(2);
    })

    it('T02',() => {
        const requirements: SkillRequirement[] = [
            {
                category: 'required',
                operator: 'all',
                skills: ['React', 'Vue']
            },
            {
                category: 'required',
                operator: 'all',
                skills: ['Vue', 'ReactJS']
            },
            {
                category: 'required',
                operator: 'all',
                skills: ['Vue', 'Reactjs']
            }
        ];

        const result = removeDuplicateRequirements(requirements);

        expect(result).toHaveLength(1);
        expect(requirements).toHaveLength(3);
    })

    it('T03',() => {
        const requirements: SkillRequirement[] = [
            {
                category: 'required',
                operator: 'any',
                skills: ['React', 'Vue']
            },
            {
                category: 'required',
                operator: 'any',
                skills: ['Vue', 'ReactJS', 'Angular']
            },
        ];

        const result = removeDuplicateRequirements(requirements);

        expect(result).toHaveLength(2);
        expect(requirements).toHaveLength(2);
    })
})