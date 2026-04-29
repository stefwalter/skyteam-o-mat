<script setup>
const props = defineProps({
  course: { type: Object, required: true },
  result: { type: Object, required: true },
  skillNames: { type: Object, default: () => ({}) },
  onComplete: { type: Function, default: null },
  onCancelBooking: { type: Function, default: null },
})

function getCompletionPayload() {
  const missingSkillNames = (props.result.missingSkills || []).map((s) => props.skillNames[s.id] ?? s.id)
  return {
    courseId: props.course.id,
    courseName: props.course.name,
    meetsThreshold: props.result.meetsThreshold,
    missingSkillNames,
    weightedScore: props.result.weightedScore,
    threshold: props.result.threshold,
    completedAt: new Date().toISOString(),
  }
}

function finish() {
  if (props.onComplete) props.onComplete(getCompletionPayload())
}

function cancelBooking() {
  if (props.onCancelBooking) props.onCancelBooking(getCompletionPayload())
}
</script>

<template>
  <section class="result-screen" aria-label="Ergebnis">
    <h2 class="result-title">Ergebnis für {{ course.name }}</h2>

    <div v-if="result.meetsThreshold" class="verdict verdict-ok">
      <p><strong>Super. Dieser Kurs könnte ihre Fähigkeiten passen.</strong></p>
    </div>
    <div v-else class="verdict verdict-suggest">
      <p><strong>Wir empfehlen zuerst einen einfacheren Kurs.</strong></p>
      <p v-if="result.fallbackLabel && result.fallbackUrl">
        <a :href="result.fallbackUrl" class="link">{{ result.fallbackLabel }}</a>
      </p>
      <p v-else-if="result.fallbackLabel">{{ result.fallbackLabel }}</p>
    </div>

    <div v-if="result.missingSkills && result.missingSkills.length" class="missing-skills">
      <h3>Diese Bereiche solltest du zusätzlich üben</h3>
      <ul>
        <li v-for="s in result.missingSkills" :key="s.id">
          {{ skillNames[s.id] ?? s.id }}
        </li>
      </ul>
    </div>

    <!--
    <p class="score-note">
      Gewichtete Punktzahl: {{ result.weightedScore }} von {{ result.threshold }} (Mindestanforderung).
    </p>
    -->

    <div v-if="onComplete || onCancelBooking" class="result-actions">
      <button
        v-if="onCancelBooking"
        type="button"
        class="btn btn-cancel"
        @click="cancelBooking"
      >
        Abbrechen
      </button>
      <button
        v-if="onComplete"
        type="button"
        class="btn btn-primary"
        @click="finish"
      >
        {{ result.meetsThreshold ? 'Buchen' : 'Trotzdem buchen' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.result-screen {
  margin-bottom: 1.5rem;
}
.result-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.verdict {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.verdict-ok {
  border: 2px solid #0a7ea4;
  background: #e8f4f8;
}
.verdict-suggest {
  border: 2px solid #b8860b;
  background: #fef9e7;
}
.verdict p {
  margin: 0 0 0.5rem 0;
}
.verdict p:last-child {
  margin-bottom: 0;
}
.link {
  color: #0a7ea4;
  font-weight: 600;
}
.link:hover {
  text-decoration: underline;
}
.missing-skills {
  margin-bottom: 1rem;
}
.missing-skills h3 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}
.missing-skills ul {
  margin: 0;
  padding-left: 1.25rem;
}
.score-note {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}
.result-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.btn-primary {
  margin-left: auto;
  padding: 0.6rem 1.25rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid #0a7ea4;
  background: #0a7ea4;
  color: #fff;
}
.btn-primary:hover {
  background: #086a8a;
  border-color: #086a8a;
}
.btn-cancel {
  padding: 0.6rem 1.25rem;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid #666;
  background: #fff;
  color: #333;
}
.btn-cancel:hover {
  background: #f5f5f5;
}
</style>
