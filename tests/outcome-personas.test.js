import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { computeSkillScores, evaluateCourse } from '../src/composables/useScoring.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const personas = JSON.parse(readFileSync(join(repoRoot, 'outcome-harness/personas.json'), 'utf8'))
const questionsData = JSON.parse(readFileSync(join(repoRoot, 'questions.json'), 'utf8'))
const coursesData = JSON.parse(readFileSync(join(repoRoot, 'courses.json'), 'utf8'))

const questions = questionsData.questions
const questionOrder = questionsData.questionOrder || questions.map((q) => q.id)
const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]))
const skills = coursesData.skills || []
const course = coursesData.courses.find((c) => c.id === personas.courseId)

describe('outcome harness personas.json', () => {
  it('targets the configured course', () => {
    expect(course).toBeDefined()
    expect(course.id).toBe('hike-and-fly-woche')
  })

  it('belowThreshold: weighted score below threshold', () => {
    const p = personas.personas.belowThreshold
    const skillScores = computeSkillScores(p.answers, questions, questionsById, questionOrder)
    const result = evaluateCourse(skillScores, course, skills)
    expect(result.meetsThreshold).toBe(false)
  })

  it('practiceRecommended: meets threshold and has missing skills', () => {
    const p = personas.personas.practiceRecommended
    const skillScores = computeSkillScores(p.answers, questions, questionsById, questionOrder)
    const result = evaluateCourse(skillScores, course, skills)
    expect(result.meetsThreshold).toBe(true)
    expect(result.missingSkills.length).toBeGreaterThanOrEqual(1)
  })

  it('perfectMatch: meets threshold and no missing skills', () => {
    const p = personas.personas.perfectMatch
    const skillScores = computeSkillScores(p.answers, questions, questionsById, questionOrder)
    const result = evaluateCourse(skillScores, course, skills)
    expect(result.meetsThreshold).toBe(true)
    expect(result.missingSkills.length).toBe(0)
  })
})
