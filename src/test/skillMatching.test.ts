import { describe, expect, it } from "vitest";
import { matchSkillRequirement } from "../services/skillMatching.js";

describe('skillMatching', () => {
    it('T01', () => {
        expect(matchSkillRequirement(['React'],{
            category: "required",
            operator: 'all',
            skills: ['React','TypeScript']
        })).toBe(false)
    })

    it('T02', () => {
        expect(matchSkillRequirement(['React','TypeScript'],{
            category: "required",
            operator: 'all',
            skills: ['React','TypeScript']
        })).toBe(true)
    })

    it('T03', () => {
        expect(matchSkillRequirement(['React','TypeScript'],{
            category: "required",
            operator: 'any',
            skills: ['React','Vue']
        })).toBe(true)
    })

    it('T04', () => {
        expect(matchSkillRequirement(['Python'],{
            category: "required",
            operator: 'any',
            skills: ['React','Vue']
        })).toBe(false)
    })

    it('T05', () => {
        expect(matchSkillRequirement(['React'],{
            category: "review",
            operator: 'any',
            skills: ['React','Vue']
        })).toBe(null)
    })

    it('T06', () => {
        expect(matchSkillRequirement(['React'],{
            category: "required",
            operator: null,
            skills: ['React','Vue']
        })).toBe(null)
    })

    it('T07', () => {
        expect(matchSkillRequirement(['React'],{
            category: "required",
            operator: 'all',
            skills: []
        })).toBe(null)
    })

    it('T08', () => {
        expect(matchSkillRequirement(['ReactJS'],{
            category: "required",
            operator: 'all',
            skills: ['ReactJS']
        })).toBe(true)
    })
    
    it('T09', () => {
        expect(matchSkillRequirement(['NODEJS'],{
            category: "required",
            operator: 'all',
            skills: ['Node.js']
        })).toBe(true)
    })

    it('T10', () => {
        expect(matchSkillRequirement(['Java'],{
            category: "required",
            operator: 'all',
            skills: ['JavaScript']
        })).toBe(false)
    })

    it('T10', () => {
        expect(matchSkillRequirement(['React Native'],{
            category: "required",
            operator: 'all',
            skills: ['React']
        })).toBe(false)
    })

     it('T11', () => {
        expect(matchSkillRequirement(['ReactJS'],{
            category: "required",
            operator: 'all',
            skills: ['React','TypeScript']
        })).toBe(false)
    })
})