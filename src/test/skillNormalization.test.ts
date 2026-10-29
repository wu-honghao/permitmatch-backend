import { describe, it, expect } from "vitest";
import { normalizeSkill } from "../services/skillNormalization.js";

describe('skillNormalization', () => {
    it('T01',() => {
        expect(normalizeSkill('ReactJS')).toBe('React')
    })

    it('T02',() => {
        expect(normalizeSkill(' react.js ')).toBe('React')
    })

    it('T03',() => {
        expect(normalizeSkill('NODEJS')).toBe('Node.js')
    })

    it('T04',() => {
        expect(normalizeSkill('HTML5')).toBe('HTML')
    })

    it('T05',() => {
        expect(normalizeSkill('CSS3')).toBe('CSS')
    })

    it('T06',() => {
        expect(normalizeSkill('Java')).toBe('Java')
    })

    it('T07',() => {
        expect(normalizeSkill('JavaScript')).toBe('JavaScript')
    })

    it('T08',() => {
        expect(normalizeSkill(' UnknownSkill ')).toBe('UnknownSkill')
    })

    it('T09',() => {
        expect(normalizeSkill('React Native')).toBe('React Native')
    })
})