<script setup>
defineProps({
  question: { type: Object, default: null },
  progressLabel: { type: String, default: '' },
  modelValue: { type: [Number, String], default: undefined },
  canGoNext: { type: Boolean, default: false },
  isLastStep: { type: Boolean, default: false },
  hasBack: { type: Boolean, default: false },
  showChangeCourse: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'next', 'back', 'changeCourse'])
</script>

<template>
  <section class="wizard-steps" aria-label="Fragen">
    <p class="progress" aria-live="polite">{{ progressLabel }}</p>

    <div v-if="question" class="question-block">
      <h3 class="question-text">{{ question.text }}</h3>

      <!-- Multiple choice -->
      <div v-if="question.type === 'multiple_choice'" class="options" role="radiogroup" :aria-label="question.text">
        <label
          v-for="(opt, idx) in question.options"
          :key="idx"
          class="option"
          :class="{ selected: modelValue === idx }"
        >
          <input
            type="radio"
            :name="'q-' + question.id"
            :value="idx"
            :checked="modelValue === idx"
            @change="emit('update:modelValue', idx)"
          />
          <span>{{ opt.text }}</span>
        </label>
      </div>

      <!-- Likert -->
      <div v-if="question.type === 'likert'" class="options likert" role="radiogroup" :aria-label="question.text">
        <label
          v-for="(item, idx) in question.scale"
          :key="idx"
          class="option"
          :class="{ selected: modelValue === item.value }"
        >
          <input
            type="radio"
            :name="'q-' + question.id"
            :value="item.value"
            :checked="modelValue === item.value"
            @change="emit('update:modelValue', item.value)"
          />
          <span>{{ item.label }}</span>
        </label>
      </div>

      <!-- Numerical -->
      <div v-if="question.type === 'numerical'" class="input-wrap">
        <input
          type="number"
          :id="'q-' + question.id"
          min="0"
          step="1"
          :placeholder="question.placeholder || ''"
          :value="modelValue"
          :aria-describedby="question.hint ? 'hint-' + question.id : undefined"
          @input="emit('update:modelValue', ($event.target).value === '' ? '' : Number(($event.target).value))"
        />
        <p v-if="question.hint" :id="'hint-' + question.id" class="hint">{{ question.hint }}</p>
      </div>

      <!-- Text input -->
      <div v-if="question.type === 'text_input'" class="input-wrap">
        <input
          type="url"
          :id="'q-' + question.id"
          :placeholder="question.placeholder || 'https://…'"
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target).value)"
        />
      </div>
    </div>

    <div class="nav">
      <button v-if="hasBack" type="button" class="btn btn-back" @click="emit('back')">
        Zurück
      </button>
      <button
        v-if="showChangeCourse"
        type="button"
        class="btn btn-back"
        @click="emit('changeCourse')"
      >
        Kurs wechseln
      </button>
      <button
        type="button"
        class="btn btn-next"
        :disabled="!canGoNext"
        @click="canGoNext && emit('next')"
      >
        {{ isLastStep ? 'Auswerten' : 'Weiter' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.wizard-steps {
  margin-bottom: 1.5rem;
}
.progress {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
}
.question-text {
  font-size: 1.5em;
  margin-bottom: 1rem;
  line-height: 1.4;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.options.likert {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.2s, background 0.2s;
}
.option:hover {
  border-color: #888;
}
.option.selected,
.option:has(input:checked) {
  border-color: #0a7ea4;
  background: #e8f4f8;
}
.option input {
  margin: 0;
}
.input-wrap {
  margin-bottom: 0.5rem;
}
.input-wrap input {
  width: 100%;
  max-width: 20rem;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
}
.input-wrap input:focus {
  outline: none;
  border-color: #0a7ea4;
}
.hint {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.35rem;
}
.nav {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-start;
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-back {
  background: #fff;
  color: #333;
  border-color: #888;
}
.btn-back:hover:not(:disabled) {
  background: #f5f5f5;
}
.btn-next {
  margin-left: auto;
}
.btn-next:hover:not(:disabled) {
  background: #086a8a;
  border-color: #086a8a;
}
</style>
