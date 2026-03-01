<script setup>
import { ref, computed, onMounted } from 'vue'
import WizardSteps from './components/WizardSteps.vue'
import ResultScreen from './components/ResultScreen.vue'
import { computeSkillScores, evaluateCourse } from './composables/useScoring'

import questionsData from '../questions.json'
import coursesData from '../courses.json'

const questions = questionsData.questions
const questionOrder = questionsData.questionOrder || questions.map((q) => q.id)
const courses = coursesData.courses
const skills = coursesData.skills || []

const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]))

const loading = ref(true)
const error = ref(null)
const selectedCourseId = ref(null)
const answers = ref({})
const stepIndex = ref(0)

const currentCourse = computed(() =>
  courses.find((c) => c.id === selectedCourseId.value)
)

const orderedQuestions = computed(() =>
  questionOrder.map((id) => questionsById[id]).filter(Boolean)
)

const currentQuestion = computed(() => orderedQuestions.value[stepIndex.value] ?? null)
const progressLabel = computed(() => {
  const total = orderedQuestions.value.length
  const n = stepIndex.value + 1
  return `Frage ${n} von ${total}`
})
const isLastStep = computed(
  () => stepIndex.value >= orderedQuestions.value.length - 1
)
const canGoNext = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  const a = answers.value[q.id]
  if (q.type === 'multiple_choice') return typeof a === 'number' && !Number.isNaN(a)
  if (q.type === 'likert') return typeof a === 'number' && !Number.isNaN(a)
  if (q.type === 'numerical') {
    const n = Number(a)
    return a !== undefined && a !== null && a !== '' && !Number.isNaN(n) && n >= 0
  }
  if (q.type === 'text_input') return true
  return false
})

const result = computed(() => {
  if (!currentCourse.value) return null
  const skillScores = computeSkillScores(
    answers.value,
    questions,
    questionsById,
    questionOrder
  )
  return evaluateCourse(skillScores, currentCourse.value, skills)
})

const showResult = ref(false)

function loadState() {
  try {
    const raw = sessionStorage.getItem('course-finder-wizard')
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.courseId) selectedCourseId.value = data.courseId
    if (data.answers && typeof data.answers === 'object') answers.value = { ...data.answers }
    if (typeof data.stepIndex === 'number') stepIndex.value = Math.min(data.stepIndex, orderedQuestions.value.length - 1)
  } catch (_) {}
}

function saveState() {
  try {
    sessionStorage.setItem(
      'course-finder-wizard',
      JSON.stringify({
        courseId: selectedCourseId.value,
        answers: answers.value,
        stepIndex: stepIndex.value,
      })
    )
  } catch (_) {}
}

function setAnswer(questionId, value) {
  answers.value = { ...answers.value, [questionId]: value }
  saveState()
}

function next() {
  if (isLastStep.value) {
    showResult.value = true
  } else {
    stepIndex.value += 1
  }
  saveState()
}

function back() {
  if (stepIndex.value > 0) {
    stepIndex.value -= 1
  } else if (showResult.value) {
    showResult.value = false
  }
  saveState()
}

function restart() {
  selectedCourseId.value = null
  answers.value = {}
  stepIndex.value = 0
  showResult.value = false
  saveState()
}

onMounted(() => {
  loading.value = false
  loadState()
  if (!selectedCourseId.value && courses.length === 1) {
    selectedCourseId.value = courses[0].id
  }
})
</script>

<template>
  <div class="wizard-root">
    <div v-if="loading" class="wizard-loading" role="status" aria-live="polite">
      Lädt…
    </div>
    <template v-else>
      <!-- Course selector -->
      <div v-if="!selectedCourseId && courses.length" class="wizard-section">
        <h2 class="wizard-title">Für welchen Kurs möchtest du prüfen?</h2>
        <div class="course-cards">
          <button
            v-for="c in courses"
            :key="c.id"
            type="button"
            class="course-card"
            :class="{ selected: selectedCourseId === c.id }"
            @click="selectedCourseId = c.id; saveState()"
          >
            <span class="course-name">{{ c.name }}</span>
            <span v-if="c.description" class="course-desc">{{ c.description }}</span>
          </button>
        </div>
      </div>

      <!-- Wizard steps -->
      <WizardSteps
        v-if="selectedCourseId && !showResult && currentQuestion"
        :question="currentQuestion"
        :progress-label="progressLabel"
        :model-value="answers[currentQuestion?.id]"
        :can-go-next="canGoNext"
        :is-last-step="isLastStep"
        :has-back="stepIndex > 0"
        :show-change-course="stepIndex === 0 && courses.length > 1"
        @update:model-value="(v) => currentQuestion && setAnswer(currentQuestion.id, v)"
        @next="next"
        @back="back"
        @change-course="selectedCourseId = null; saveState()"
      />

      <!-- Result -->
      <ResultScreen
        v-if="showResult && currentCourse && result"
        :course="currentCourse"
        :result="result"
        :skill-names="Object.fromEntries(skills.map((s) => [s.id, s.name]))"
        @restart="restart"
      />
    </template>
  </div>
</template>

<style scoped>
.wizard-root {
  max-width: 36rem;
  margin: 0 auto;
  padding: 1rem;
  font-family: system-ui, sans-serif;
}
.wizard-loading {
  padding: 2rem;
  text-align: center;
  color: #666;
}
.wizard-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.wizard-section {
  margin-bottom: 1.5rem;
}
.course-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.course-card {
  display: block;
  width: 100%;
  padding: 1rem;
  text-align: left;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.course-card:hover {
  border-color: #888;
}
.course-card.selected {
  border-color: #0a7ea4;
  background: #e8f4f8;
}
.course-name {
  font-weight: 600;
  display: block;
}
.course-desc {
  font-size: 0.9rem;
  color: #555;
  margin-top: 0.25rem;
  display: block;
}
</style>
