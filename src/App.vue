<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import WizardSteps from './components/WizardSteps.vue'
import ResultScreen from './components/ResultScreen.vue'
import { computeSkillScores, evaluateCourse } from './composables/useScoring'

import questionsData from '../questions.json'
import coursesData from '../courses.json'

defineProps({
  onComplete: { type: Function, default: null },
  onCancelBooking: { type: Function, default: null },
})

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

const skillScores = computed(() => {
  if (!currentCourse.value) return {}
  return computeSkillScores(
    answers.value,
    questions,
    questionsById,
    questionOrder
  )
})

const result = computed(() => {
  if (!currentCourse.value) return null
  return evaluateCourse(skillScores.value, currentCourse.value, skills)
})

const showResult = ref(false)
const showIntro = ref(true)

function loadState() {
  try {
    const raw = sessionStorage.getItem('course-finder-wizard')
    if (!raw) return
    const data = JSON.parse(raw)
    if (data.courseId) selectedCourseId.value = data.courseId
    // Do not restore stepIndex or answers — each load starts at the first question.
  } catch (_) {}
}

function resetToFirstQuestion() {
  answers.value = {}
  stepIndex.value = 0
  showResult.value = false
  showIntro.value = true
  saveState()
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

function startQuestions() {
  showIntro.value = false
  stepIndex.value = 0
  saveState()
}

function back() {
  if (showResult.value) {
    showResult.value = false
  } else if (stepIndex.value > 0) {
    stepIndex.value -= 1
  } else if (!showIntro.value) {
    showIntro.value = true
  }
  saveState()
}

const WIZARD_OPEN_EVENT = 'skyteam-o-mat:open'

onMounted(() => {
  loading.value = false
  loadState()
  if (!selectedCourseId.value && courses.length === 1) {
    selectedCourseId.value = courses[0].id
  }
  window.addEventListener(WIZARD_OPEN_EVENT, resetToFirstQuestion)
})

onUnmounted(() => {
  window.removeEventListener(WIZARD_OPEN_EVENT, resetToFirstQuestion)
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
        v-if="selectedCourseId && !showResult && !showIntro && currentQuestion"
        :question="currentQuestion"
        :progress-label="progressLabel"
        :model-value="answers[currentQuestion?.id]"
        :can-go-next="canGoNext"
        :is-last-step="isLastStep"
        :has-back="true"
        :show-change-course="stepIndex === 0 && courses.length > 1"
        @update:model-value="(v) => currentQuestion && setAnswer(currentQuestion.id, v)"
        @next="next"
        @back="back"
        @change-course="showIntro = true; selectedCourseId = null; saveState()"
      />

      <section
        v-if="selectedCourseId && !showResult && showIntro"
        class="intro-screen wizard-section"
        aria-label="Einführung"
      >
        <h2 class="wizard-title">Buchungsfragebogen</h2>
        <p class="intro-text">
          Wir möchten dir einige Fragen stellen, um deine Fähigkeiten und Erfahrungen besser einschätzen
          zu können.
        </p>
        <div class="intro-actions">
          <button type="button" class="btn btn-next" @click="startQuestions">Weiter</button>
        </div>
      </section>

      <!-- Result -->
      <ResultScreen
        v-if="showResult && currentCourse && result"
        :course="currentCourse"
        :result="result"
        :skills="skills"
        :skill-scores="skillScores"
        :skill-names="Object.fromEntries(skills.map((s) => [s.id, s.name]))"
        :on-complete="onComplete"
        :on-cancel-booking="onCancelBooking"
      />
    </template>
  </div>
</template>

<style scoped>
.wizard-root {
  box-sizing: border-box;
  width: 100%;
  max-width: 36rem;
  margin: 0 auto;
  padding: 1rem 1rem 0rem 1rem;
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
  box-sizing: border-box;
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
.intro-text {
  margin-bottom: 1rem;
  line-height: 1.5;
  padding-top: 3rem;
  padding-bottom: 4rem;
}
.intro-actions {
  display: flex;
}
.btn {
  padding: 0.6rem 1.25rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid #0a7ea4;
  background: #0a7ea4;
  color: #fff;
}
.btn-next {
  margin-left: auto;
}
.btn-next:hover {
  background: #086a8a;
  border-color: #086a8a;
}
</style>
