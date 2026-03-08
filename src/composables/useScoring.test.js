import { describe, it, expect } from 'vitest'
import { computeSkillScores, evaluateCourse } from './useScoring'

describe('computeSkillScores', () => {
  const questions = [
    {
      id: 'q1',
      type: 'multiple_choice',
      skillId: 'thermalling',
      options: [
        { text: 'Never', score: 0 },
        { text: 'Sometimes', score: 1 },
        { text: 'Regularly', score: 2 },
      ],
    },
    {
      id: 'q2',
      type: 'likert',
      skillId: 'active_flying',
      scoreMultiplier: 1,
      scale: [
        { label: 'Never', value: -3 },
        { label: 'Rarely', value: -1 },
        { label: 'Sometimes', value: 0 },
        { label: 'Regularly', value: 1 },
        { label: 'Always', value: 3 },
      ],
    },
    {
      id: 'q3',
      type: 'numerical',
      skillId: 'xc_basics',
      scoreMultiplier: 0.5,
    },
    {
      id: 'q4',
      type: 'text_input',
      skillId: 'evidence',
      presenceScore: 1,
      absenceScore: 0,
    },
  ]
  const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]))
  const questionOrder = ['q1', 'q2', 'q3', 'q4']

  it('returns empty object when no answers', () => {
    expect(computeSkillScores({}, questions, questionsById, questionOrder)).toEqual({})
  })

  it('ignores answers for questions not in questionOrder', () => {
    const result = computeSkillScores(
      { otherQ: 1 },
      questions,
      questionsById,
      questionOrder
    )
    expect(result).toEqual({})
  })

  it('ignores null and undefined answers', () => {
    const result = computeSkillScores(
      { q1: null, q2: undefined },
      questions,
      questionsById,
      questionOrder
    )
    expect(result).toEqual({})
  })

  it('computes multiple_choice: option index as number', () => {
    const result = computeSkillScores(
      { q1: 2 },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.thermalling).toBe(2)
  })

  it('computes multiple_choice: option index as string (parsed)', () => {
    const result = computeSkillScores(
      { q1: '1' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.thermalling).toBe(1)
  })

  it('computes multiple_choice: option 0', () => {
    const result = computeSkillScores(
      { q1: 0 },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.thermalling).toBe(0)
  })

  it('computes likert: raw as scale value number', () => {
    const result = computeSkillScores(
      { q2: 3 },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.active_flying).toBe(3)
  })

  it('computes likert: raw as scale index when string (uses scale[raw].value)', () => {
    const result = computeSkillScores(
      { q2: '4' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.active_flying).toBe(3)
  })

  it('computes likert with scoreMultiplier', () => {
    const q = {
      id: 'q2b',
      type: 'likert',
      skillId: 's2',
      scoreMultiplier: 2,
      scale: [{ label: 'X', value: 5 }],
    }
    const byId = { q2b: q }
    const result = computeSkillScores(
      { q2b: 5 },
      [q],
      byId,
      ['q2b']
    )
    expect(result.s2).toBe(10)
  })

  it('computes numerical: value * scoreMultiplier', () => {
    const result = computeSkillScores(
      { q3: 20 },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.xc_basics).toBe(10)
  })

  it('computes numerical: string value parsed', () => {
    const result = computeSkillScores(
      { q3: '4' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.xc_basics).toBe(2)
  })

  it('computes text_input: presence gives presenceScore', () => {
    const result = computeSkillScores(
      { q4: 'https://example.com/log' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.evidence).toBe(1)
  })

  it('computes text_input: absence gives absenceScore', () => {
    const result = computeSkillScores(
      { q4: '' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.evidence).toBe(0)
  })

  it('computes text_input: whitespace-only counts as absence', () => {
    const result = computeSkillScores(
      { q4: '   ' },
      questions,
      questionsById,
      questionOrder
    )
    expect(result.evidence).toBe(0)
  })

  it('sums contributions for same skill from multiple questions', () => {
    const qA = { id: 'qa', type: 'multiple_choice', skillId: 's', options: [{ score: 1 }] }
    const qB = { id: 'qb', type: 'multiple_choice', skillId: 's', options: [{ score: 2 }] }
    const byId = { qa: qA, qb: qB }
    const result = computeSkillScores(
      { qa: 0, qb: 0 },
      [qA, qB],
      byId,
      ['qa', 'qb']
    )
    expect(result.s).toBe(3)
  })

  it('skips question missing in questionsById', () => {
    const result = computeSkillScores(
      { q1: 1, qMissing: 0 },
      questions,
      questionsById,
      ['q1', 'qMissing']
    )
    expect(result.thermalling).toBe(1)
    expect(Object.keys(result)).toEqual(['thermalling'])
  })

  it('skips question without skillId', () => {
    const q = { id: 'qn', type: 'multiple_choice', options: [{ score: 5 }] }
    const byId = { qn: q }
    const result = computeSkillScores({ qn: 0 }, [q], byId, ['qn'])
    expect(result).toEqual({})
  })
})

describe('evaluateCourse', () => {
  const skills = [
    { id: 'a', name: 'Skill A' },
    { id: 'b', name: 'Skill B' },
    { id: 'c', name: 'Skill C' },
  ]

  it('computes weighted score from skillScores and course weights', () => {
    const course = {
      threshold: 100,
      weights: { a: 2, b: 3, c: 0 },
    }
    const result = evaluateCourse(
      { a: 5, b: 10, c: 100 },
      course,
      skills
    )
    expect(result.weightedScore).toBe(5 * 2 + 10 * 3)
    expect(result.threshold).toBe(100)
  })

  it('meetsThreshold when weightedScore >= threshold', () => {
    const course = { threshold: 10, weights: { a: 1 } }
    expect(evaluateCourse({ a: 10 }, course, skills).meetsThreshold).toBe(true)
    expect(evaluateCourse({ a: 11 }, course, skills).meetsThreshold).toBe(true)
  })

  it('does not meet threshold when weightedScore < threshold', () => {
    const course = { threshold: 10, weights: { a: 1 } }
    expect(evaluateCourse({ a: 9 }, course, skills).meetsThreshold).toBe(false)
  })

  it('identifies missing skills below minSkillLevel', () => {
    const course = {
      threshold: 0,
      weights: {},
      minSkillLevel: { a: 2, b: 1, c: 5 },
    }
    const result = evaluateCourse(
      { a: 1, b: 1, c: 3 },
      course,
      skills
    )
    expect(result.missingSkills.map((s) => s.id)).toEqual(['a', 'c'])
  })

  it('excludes skills that meet or exceed minSkillLevel', () => {
    const course = {
      threshold: 0,
      weights: {},
      minSkillLevel: { a: 2, b: 1 },
    }
    const result = evaluateCourse(
      { a: 2, b: 3 },
      course,
      skills
    )
    expect(result.missingSkills).toEqual([])
  })

  it('excludes skills not in minSkillLevel', () => {
    const course = {
      threshold: 0,
      weights: {},
      minSkillLevel: { a: 10 },
    }
    const result = evaluateCourse(
      { a: 0, b: 0, c: 0 },
      course,
      skills
    )
    expect(result.missingSkills.map((s) => s.id)).toEqual(['a'])
  })

  it('uses default weight 1 for skills not in course.weights', () => {
    const course = { threshold: 0, weights: { a: 1 } }
    const skillScores = { a: 5, b: 100 }
    const result = evaluateCourse(skillScores, course, skills)
    expect(result.weightedScore).toBe(5 * 1 + 100 * 1)
  })

  it('returns fallbackLabel and fallbackUrl from course', () => {
    const course = {
      threshold: 100,
      weights: {},
      fallbackLabel: 'Beginner course',
      fallbackUrl: '/courses/beginner',
    }
    const result = evaluateCourse({}, course, skills)
    expect(result.fallbackLabel).toBe('Beginner course')
    expect(result.fallbackUrl).toBe('/courses/beginner')
  })

  it('returns null fallbackLabel and fallbackUrl when not set', () => {
    const course = { threshold: 0, weights: {} }
    const result = evaluateCourse({}, course, skills)
    expect(result.fallbackLabel).toBeNull()
    expect(result.fallbackUrl).toBeNull()
  })

  it('handles empty skillScores', () => {
    const course = { threshold: 10, weights: { a: 1 } }
    const result = evaluateCourse({}, course, skills)
    expect(result.weightedScore).toBe(0)
    expect(result.meetsThreshold).toBe(false)
  })

  it('handles empty skills array', () => {
    const course = { threshold: 0, weights: {}, minSkillLevel: { a: 1 } }
    const result = evaluateCourse({ a: 0 }, course, [])
    expect(result.missingSkills).toEqual([])
  })
})
