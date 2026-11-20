import { describe, it, expect } from "vitest";
import { normalizeSkill } from "../../services/skillNormalization.js";

describe('skillNormalization', () => {
    it('T01: normalizes ReactJS alias',() => {
        expect(normalizeSkill('ReactJS')).toBe('React')
    })

    it('T02: normalizes React.js with whitespace',() => {
        expect(normalizeSkill(' react.js ')).toBe('React')
    })

    it('T03: normalizes Node.js alias case insensitively',() => {
        expect(normalizeSkill('NODEJS')).toBe('Node.js')
    })

    it('T04: normalizes HTML5',() => {
        expect(normalizeSkill('HTML5')).toBe('HTML')
    })

    it('T05: normalizes CSS3',() => {
        expect(normalizeSkill('CSS3')).toBe('CSS')
    })

    it('T06: does not merge Java with JavaScript',() => {
        expect(normalizeSkill('Java')).toBe('Java')
    })

    it('T07: preserves JavaScript',() => {
        expect(normalizeSkill('JavaScript')).toBe('JavaScript')
    })

    it('T08: trims unknown skill names',() => {
        expect(normalizeSkill(' UnknownSkill ')).toBe('UnknownSkill')
    })

    it('T09: does not merge React Native with React',() => {
        expect(normalizeSkill('React Native')).toBe('React Native')
    })
})
