/**
 * Compute skill scores from wizard answers, then weighted course score and missing skills.
 * @param {Record<string, unknown>} answers - Map of questionId -> answer (option index, scale value, number, or text)
 * @param {Array<{ id: string, type: string, skillId: string, options?: Array<{ score: number }>, scale?: Array<{ value: number }>, scoreMultiplier?: number, presenceScore?: number, absenceScore?: number }>} questions
 * @param {Record<string, { id: string }>} questionsById - Map id -> question
 * @param {string[]} questionOrder
 */
export function computeSkillScores(answers, questions, questionsById, questionOrder) {
  const skillScores = {}
  for (const qId of questionOrder) {
    const q = questionsById[qId]
    if (!q || !q.skillId) continue
    const raw = answers[qId]
    if (raw === undefined || raw === null) continue

    let contribution = 0
    if (q.type === 'multiple_choice' && q.options) {
      const idx = typeof raw === 'number' ? raw : parseInt(raw, 10)
      if (!Number.isNaN(idx) && q.options[idx]) contribution = q.options[idx].score
    } else if (q.type === 'likert' && q.scale) {
      const scaleVal = typeof raw === 'number' ? raw : (q.scale[raw]?.value ?? 0)
      const mult = q.scoreMultiplier ?? 1
      contribution = scaleVal * mult
    } else if (q.type === 'numerical') {
      const num = typeof raw === 'number' ? raw : parseFloat(raw)
      if (!Number.isNaN(num)) contribution = num * (q.scoreMultiplier ?? 1)
    } else if (q.type === 'text_input') {
      const hasValue = typeof raw === 'string' ? raw.trim().length > 0 : false
      contribution = hasValue ? (q.presenceScore ?? 1) : (q.absenceScore ?? 0)
    }

    if (!(q.skillId in skillScores)) skillScores[q.skillId] = 0
    skillScores[q.skillId] += contribution
  }
  return skillScores
}

/**
 * Combined score is Σ(skillScore × weight). Skills not listed in `course.weights` use weight 1; explicit 0 still applies.
 * @param {Record<string, number>} skillScores
 * @param {{ weights: Record<string, number>, threshold: number, minSkillLevel?: Record<string, number>, fallbackCourseId?: string | null, fallbackLabel?: string | null, fallbackUrl?: string | null }} course
 * @param {Array<{ id: string, name: string }>} skills
 */
export function evaluateCourse(skillScores, course, skills) {
  const weights = course.weights || {}
  let weightedScore = 0
  for (const [skillId, score] of Object.entries(skillScores)) {
    const w = skillId in weights ? weights[skillId] : 1
    weightedScore += (score || 0) * w
  }

  const minLevel = course.minSkillLevel || {}
  const missingSkills = skills.filter((s) => {
    const required = minLevel[s.id]
    if (required == null) return false
    return (skillScores[s.id] ?? 0) < required
  })

  const meetsThreshold = weightedScore >= course.threshold
  return {
    weightedScore,
    threshold: course.threshold,
    meetsThreshold,
    missingSkills,
    fallbackLabel: course.fallbackLabel ?? null,
    fallbackUrl: course.fallbackUrl ?? null,
  }
}
