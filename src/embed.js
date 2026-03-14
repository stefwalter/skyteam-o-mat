/**
 * Skyteam-o-mat wizard: script-only embed.
 * Load via: <script src="skyteam-wizard.js" data-trigger-selector="[data-skyteam-wizard]" data-result-field-selector="[name=wizard_result]" data-storage-key="skyteam_wizard_result"></script>
 * Config (data attributes or init options): triggerSelector, resultFieldSelector, storageKey.
 */
import { createApp } from 'vue'
import App from './App.vue'

const STORAGE_KEY_DEFAULT = 'skyteam_wizard_result'
const MODAL_ID = 'skyteam-wizard-modal'
const MODAL_STYLES_ID = 'skyteam-wizard-modal-styles'

function getConfig() {
  let script = document.currentScript
  if (!script) {
    script = document.querySelector('script[data-trigger-selector], script[data-trigger]')
    if (!script) {
      script = document.querySelector('script[src*="embed.js"], script[src*="skyteam-wizard.js"]')
    }
  }
  if (!script) return {}
  return {
    triggerSelector: script.getAttribute('data-trigger-selector') || script.getAttribute('data-trigger') || '',
    resultFieldSelector: script.getAttribute('data-result-field-selector') || script.getAttribute('data-result-field') || '',
    storageKey: script.getAttribute('data-storage-key') || STORAGE_KEY_DEFAULT,
  }
}

function injectModalStyles() {
  if (document.getElementById(MODAL_STYLES_ID)) return
  const style = document.createElement('style')
  style.id = MODAL_STYLES_ID
  style.textContent = `
    .skyteam-wizard-modal { position: fixed; inset: 0; z-index: 999999; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); font-family: system-ui, sans-serif; }
    .skyteam-wizard-modal.is-open { display: flex; }
    .skyteam-wizard-modal__backdrop { position: absolute; inset: 0; }
    .skyteam-wizard-modal__box { position: relative; max-width: 36rem; max-height: 90vh; overflow: auto; margin: 1rem; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .skyteam-wizard-modal__close { position: absolute; top: 0.5rem; right: 0.5rem; width: 2rem; height: 2rem; padding: 0; border: none; background: transparent; cursor: pointer; font-size: 1.5rem; line-height: 1; color: #666; z-index: 1; }
    .skyteam-wizard-modal__close:hover { color: #333; }
  `
  document.head.appendChild(style)
}

function createModalRoot() {
  let el = document.getElementById(MODAL_ID)
  if (el) return el
  el = document.createElement('div')
  el.id = MODAL_ID
  el.className = 'skyteam-wizard-modal'
  el.setAttribute('aria-modal', 'true')
  el.setAttribute('aria-label', 'Kurs-Finder')
  el.innerHTML = '<div class="skyteam-wizard-modal__backdrop" data-close></div><button type="button" class="skyteam-wizard-modal__close" aria-label="Schließen" data-close>×</button><div class="skyteam-wizard-modal__box"><div id="skyteam-wizard-mount"></div></div>'
  document.body.appendChild(el)
  return el
}

function showModal(modalEl) {
  modalEl.classList.add('is-open')
  document.body.style.overflow = 'hidden'
}

function hideModal(modalEl) {
  modalEl.classList.remove('is-open')
  document.body.style.overflow = ''
}

function prefillResultField(selector, storageKey) {
  if (!selector) return
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return
    const el = document.querySelector(selector)
    if (el && 'value' in el) el.value = raw
  } catch (_) {}
}

function init(configOverrides = {}) {
  const config = { ...getConfig(), ...configOverrides }
  const { triggerSelector, resultFieldSelector, storageKey } = config

  if (!triggerSelector) {
    console.warn('Skyteam-wizard: data-trigger-selector not set; wizard will not open on button click.')
  }

  injectModalStyles()
  const modalEl = createModalRoot()
  const mountEl = document.getElementById('skyteam-wizard-mount')
  if (!mountEl) return

  const saveAndClose = (payload) => {
    try {
      sessionStorage.setItem(storageKey, typeof payload === 'string' ? payload : JSON.stringify(payload))
    } catch (_) {}
    hideModal(modalEl)
    prefillResultField(resultFieldSelector, storageKey)
  }

  const app = createApp(App, {
    onComplete: saveAndClose,
  })
  app.mount(mountEl)

  modalEl.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', () => hideModal(modalEl))
  })

  if (triggerSelector) {
    document.querySelectorAll(triggerSelector).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        showModal(modalEl)
      })
    })
  }

  prefillResultField(resultFieldSelector, storageKey)
}

if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => init())
} else {
  init()
}

export { init, getConfig, prefillResultField }
