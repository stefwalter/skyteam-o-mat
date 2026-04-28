/**
 * Skyteam-o-mat wizard: script-only embed.
 * Load via: <script src="skyteam-wizard.js"></script>
 * Trigger, result field, and storage key are built-in (see constants below). Pass overrides to init() for testing.
 */
import { createApp } from 'vue'
import App from './App.vue'

/** Injected at build time from package.json "version" (vite.embed.config.js). */
const SKYTEAM_O_MAT_VERSION = __SKYTEAM_O_MAT_VERSION__
console.log('SkyTeam-o-mat:', SKYTEAM_O_MAT_VERSION)

/** Built-in config (baked in at build time; not configurable at runtime). */
const TRIGGER_SELECTOR = 'a[href*=hike-fly-woche][class~=booking]'
const RESULT_FIELD_SELECTOR = 'input#bemerkungen'
const STORAGE_KEY = 'skyteam_o_mat'

const MODAL_ID = 'skyteam-wizard-modal'
const MODAL_STYLES_ID = 'skyteam-wizard-modal-styles'

function getConfig() {
  return {
    triggerSelector: TRIGGER_SELECTOR,
    resultFieldSelector: RESULT_FIELD_SELECTOR,
    storageKey: STORAGE_KEY,
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
    .skyteam-wizard-modal__box { position: relative; width: min(36rem, calc(100vw - 2rem)); max-height: 90vh; overflow: auto; margin: 1rem; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
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

/** Dispatched on `window` when the booking trigger opens the modal; App resets to question 1. */
const WIZARD_OPEN_EVENT = 'skyteam-o-mat:open'

function showModal(modalEl) {
  console.log('SkyTeam-o-mat: wizard started')
  modalEl.classList.add('is-open')
  document.body.style.overflow = 'hidden'
  window.dispatchEvent(new CustomEvent(WIZARD_OPEN_EVENT))
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
    if (el && 'value' in el) {
      el.value = raw
      console.log('SkyTeam-o-mat: result field filled', selector)
    }
  } catch (_) {}
}

function init(configOverrides = {}) {
  const config = { ...getConfig(), ...configOverrides }
  const { triggerSelector, resultFieldSelector, storageKey } = config

  injectModalStyles()
  const modalEl = createModalRoot()
  const mountEl = document.getElementById('skyteam-wizard-mount')
  if (!mountEl) return

  /** Booking URL from the trigger link when the modal was opened. */
  const pendingNavigation = { href: null }

  function finalizeWizard(payload, { navigate }) {
    try {
      sessionStorage.setItem(storageKey, typeof payload === 'string' ? payload : JSON.stringify(payload))
    } catch (_) {}
    hideModal(modalEl)
    prefillResultField(resultFieldSelector, storageKey)
    if (navigate && pendingNavigation.href) {
      const url = pendingNavigation.href
      pendingNavigation.href = null
      window.location.href = url
    } else {
      pendingNavigation.href = null
    }
  }

  const app = createApp(App, {
    onComplete: (p) => finalizeWizard(p, { navigate: true }),
    onCancelBooking: (p) => finalizeWizard(p, { navigate: false }),
  })
  app.mount(mountEl)

  modalEl.querySelectorAll('[data-close]').forEach((node) => {
    node.addEventListener('click', () => hideModal(modalEl))
  })

  if (triggerSelector) {
    document.querySelectorAll(triggerSelector).forEach((el) => {
      el.addEventListener(
        'click',
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          pendingNavigation.href = el.href || null
          showModal(modalEl)
        },
        true
      )
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
