import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const personas = JSON.parse(readFileSync(join(__dirname, 'personas.json'), 'utf8'))
const questionsData = JSON.parse(readFileSync(join(repoRoot, 'questions.json'), 'utf8'))
const coursesData = JSON.parse(readFileSync(join(repoRoot, 'courses.json'), 'utf8'))
const questionOrder = questionsData.questionOrder || questionsData.questions.map((q) => q.id)
const questionsById = Object.fromEntries(questionsData.questions.map((q) => [q.id, q]))
const skillsList = coursesData.skills || []
const harnessCourse = coursesData.courses.find((c) => c.id === personas.courseId)

/**
 * @param {import('@playwright/test').Page} page
 * @param {typeof questionsById[string]} question
 * @param {number} answer - option index (multiple_choice), likert scale value, or number (numerical)
 */
async function answerQuestion(page, question, answer) {
  const group = page.getByRole('radiogroup', { name: question.text })

  if (question.type === 'multiple_choice') {
    await group.getByRole('radio').nth(answer).click()
    return
  }

  if (question.type === 'likert' && question.scale) {
    const item = question.scale.find((s) => s.value === answer)
    if (!item) throw new Error(`No likert step for value ${answer} on ${question.id}`)
    await group.getByRole('radio', { name: item.label }).click()
    return
  }

  if (question.type === 'numerical') {
    await page.locator(`#q-${question.id}`).fill(String(answer))
    return
  }

  throw new Error(`Unsupported question type: ${question.type}`)
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, number>} answers
 */
async function runWizardAnswers(page, answers) {
  await page.getByRole('link', { name: /Zur Buchung/ }).click()
  await page.getByRole('button', { name: 'Weiter' }).click()

  for (let i = 0; i < questionOrder.length; i++) {
    const qId = questionOrder[i]
    const q = questionsById[qId]
    const raw = answers[qId]
    if (raw === undefined) throw new Error(`Missing answer for ${qId}`)
    await answerQuestion(page, q, raw)

    const isLast = i === questionOrder.length - 1
    await page.getByRole('button', { name: isLast ? 'Auswerten' : 'Weiter' }).click()
  }

  await expect(page.getByRole('region', { name: 'Ergebnis' })).toBeVisible()
}

/**
 * @param {Record<string, unknown>} payload
 * @param {typeof personas.personas.belowThreshold.expectPayload} expectPayload
 */
function expectCompletionPayloadSkillScores(payload, expectPayload) {
  expect(payload.courseId).toBe(expectPayload.courseId)
  expect(payload.meetsThreshold).toBe(expectPayload.meetsThreshold)
  if (expectPayload.allSkillIdsInScores) {
    for (const s of skillsList) {
      expect(payload.skillScores).toHaveProperty(s.id)
      expect(typeof payload.skillScores[s.id]).toBe('number')
    }
  }
  const minLevel = harnessCourse?.minSkillLevel || {}
  if (expectPayload.atLeastOneSkillBelowMin) {
    const anyBelow = Object.entries(minLevel).some(
      ([id, min]) => payload.skillScores[id] < min
    )
    expect(anyBelow).toBe(true)
  }
  if (expectPayload.noSkillBelowMin) {
    for (const [id, min] of Object.entries(minLevel)) {
      expect(payload.skillScores[id]).toBeGreaterThanOrEqual(min)
    }
  }
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies()
  await page.goto('/')
  await page.evaluate(() => {
    try {
      sessionStorage.removeItem('skyteam_o_mat')
      sessionStorage.removeItem('course-finder-wizard')
    } catch (_) {}
  })
})

test('persona below threshold: cancel does not navigate', async ({ page }) => {
  const p = personas.personas.belowThreshold
  await runWizardAnswers(page, p.answers)

  await page.getByRole('button', { name: 'Abbrechen' }).click()

  await expect(page).not.toHaveURL(/booking-hike-fly-woche-done/)
  const raw = await page.evaluate(() => sessionStorage.getItem('skyteam_o_mat'))
  expect(raw).toBeTruthy()
  expectCompletionPayloadSkillScores(JSON.parse(raw), p.expectPayload)
})

test('persona practice recommended: book navigates and payload has scores below min', async ({
  page,
}) => {
  const p = personas.personas.practiceRecommended
  await runWizardAnswers(page, p.answers)

  await Promise.all([
    page.waitForURL(/booking-hike-fly-woche-done/),
    page.getByRole('button', { name: 'Buchen' }).click(),
  ])

  const raw = await page.locator('#bemerkungen').inputValue()
  const payload = JSON.parse(raw)
  expectCompletionPayloadSkillScores(payload, p.expectPayload)
})

test('persona perfect match: book navigates and all skills meet min levels', async ({ page }) => {
  const p = personas.personas.perfectMatch
  await runWizardAnswers(page, p.answers)

  await Promise.all([
    page.waitForURL(/booking-hike-fly-woche-done/),
    page.getByRole('button', { name: 'Buchen' }).click(),
  ])

  const raw = await page.locator('#bemerkungen').inputValue()
  const payload = JSON.parse(raw)
  expectCompletionPayloadSkillScores(payload, p.expectPayload)
})
