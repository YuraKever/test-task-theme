/**
 * Shared modal web component: <ui-modal id="unique-id">
 *
 * Open via:
 *   - element.show() / element.hide() / element.toggle()
 *   - [data-modal-open="unique-id"] on any clickable element (click delegates)
 *   - attribute open (reflects state)
 *
 * Slots:
 *   - name="title" — optional heading
 *   - default — main content
 */

const CLOSE_LABEL = 'Close';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: contents;
    }
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.45);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }
    :host([open]) .backdrop {
      opacity: 1;
      visibility: visible;
    }
    .panel {
      position: fixed;
      z-index: 9999;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0.96);
      width: min(94vw, 38rem);
      max-height: min(88vh, 48rem);
      overflow: auto;
      padding: 1.5rem 1.5rem 1.25rem;
      background: #fff;
      color: #1a1a1a;
      border-radius: 2px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
    }
    :host([open]) .panel {
      opacity: 1;
      visibility: visible;
      transform: translate(-50%, -50%) scale(1);
    }
    :host([data-size="wide"]) .panel {
      width: min(98vw, 64rem);
      max-height: min(92vh, 58rem);
    }
    :host([data-layout="split"]) .panel {
      width: min(98vw, 76rem);
      max-width: 1200px;
      max-height: min(94vh, 860px);
      padding: 0;
      overflow: hidden;
    }
    :host([data-layout="split"]) .close {
      z-index: 3;
      top: 0.65rem;
      right: 0.65rem;
      background: rgba(255, 255, 255, 0.94);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }
    .close {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      color: inherit;
      opacity: 0.6;
      border-radius: 2px;
    }
    .close:hover,
    .close:focus-visible {
      opacity: 1;
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    ::slotted([slot="title"]) {
      display: block;
      margin: 0 2rem 0.75rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      line-height: 1.3;
    }
    ::slotted(:not([slot="title"])) {
      font-size: 0.9375rem;
      line-height: 1.55;
    }
  </style>
  <div class="backdrop" part="backdrop" data-modal-backdrop aria-hidden="true"></div>
  <div
    class="panel"
    part="panel"
    role="dialog"
    aria-modal="true"
    aria-label="Dialog"
    tabindex="-1"
  >
    <button type="button" class="close" part="close" data-modal-close aria-label="${CLOSE_LABEL}">
      &times;
    </button>
    <slot name="title"></slot>
    <slot></slot>
  </div>
`;

export class UiModalElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['open', 'aria-label', 'label', 'aria-labelledby'];
  }

  private _backdrop: HTMLElement | null = null;
  private _panel: HTMLElement | null = null;
  private _lastFocus: Element | null = null;
  private _titleSlot: HTMLSlotElement | null = null;
  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      this.hide();
      return;
    }

    if (e.key === 'Tab' && this.open) {
      this._trapFocus(e);
    }
  };

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.appendChild(template.content.cloneNode(true));
    this._backdrop = root.querySelector('[data-modal-backdrop]');
    this._panel = root.querySelector('.panel');
    this._titleSlot = root.querySelector('slot[name="title"]');
  }

  connectedCallback(): void {
    this._syncAriaLabel();
    this._syncAriaLabelledBy();
    this._backdrop?.addEventListener('click', () => this.hide());
    this.shadowRoot?.querySelector('[data-modal-close]')?.addEventListener('click', () =>
      this.hide()
    );
    this._titleSlot?.addEventListener('slotchange', () => this._syncAriaLabelledBy());
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this._onKeydown, true);
    this._unlockScroll();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'aria-label' || name === 'label') {
      this._syncAriaLabel();
      return;
    }
    if (name === 'aria-labelledby') {
      this._syncAriaLabelledBy();
      return;
    }
    if (name !== 'open' || oldValue === newValue) return;
    const isOpen = newValue !== null;
    if (isOpen) {
      document.addEventListener('keydown', this._onKeydown, true);
      this._lockScroll();
      queueMicrotask(() => {
        const closeBtn = this.shadowRoot?.querySelector<HTMLButtonElement>('[data-modal-close]');
        closeBtn?.focus();
      });
    } else {
      document.removeEventListener('keydown', this._onKeydown, true);
      this._unlockScroll();
      if (this._lastFocus instanceof HTMLElement) {
        this._lastFocus.focus();
        this._lastFocus = null;
      }
    }
  }

  get open(): boolean {
    return this.hasAttribute('open');
  }

  set open(value: boolean) {
    if (value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
  }

  show(): void {
    this._lastFocus = document.activeElement;
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  toggle(): void {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  private _lockScroll(): void {
    const body = document.body;
    const y = window.scrollY;
    body.dataset.modalScrollY = String(y);
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
  }

  private _syncAriaLabel(): void {
    const panel = this._panel;
    if (!panel) return;
    if (panel.hasAttribute('aria-labelledby')) {
      panel.removeAttribute('aria-label');
      return;
    }
    const fromAria = this.getAttribute('aria-label');
    const fromLabel = this.getAttribute('label');
    const text = fromAria || fromLabel || 'Dialog';
    panel.setAttribute('aria-label', text);
  }

  private _syncAriaLabelledBy(): void {
    const panel = this._panel;
    if (!panel) return;

    const explicit = this.getAttribute('aria-labelledby');
    if (explicit) {
      panel.setAttribute('aria-labelledby', explicit);
      panel.removeAttribute('aria-label');
      return;
    }

    const title = this._titleSlot?.assignedElements({ flatten: true })[0] as HTMLElement | undefined;
    if (!title) {
      panel.removeAttribute('aria-labelledby');
      this._syncAriaLabel();
      return;
    }

    if (!title.id) {
      title.id = `${this.id || 'ui-modal'}-title`;
    }

    panel.setAttribute('aria-labelledby', title.id);
    panel.removeAttribute('aria-label');
  }

  private _trapFocus(event: KeyboardEvent): void {
    const panel = this._panel;
    if (!panel) return;

    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('hidden') && el.offsetParent !== null);

    if (focusables.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.shadowRoot?.activeElement || document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private _unlockScroll(): void {
    const body = document.body;
    const y = body.dataset.modalScrollY;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.overflow = '';
    delete body.dataset.modalScrollY;
    if (y !== undefined) {
      window.scrollTo(0, Number(y) || 0);
    }
  }
}

const TAG = 'ui-modal';

if (!customElements.get(TAG)) {
  customElements.define(TAG, UiModalElement);
}

function findModal(id: string | null): UiModalElement | null {
  if (!id) return null;
  const el = document.getElementById(id);
  return el instanceof UiModalElement ? el : null;
}

document.addEventListener('click', (e) => {
  const openEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-modal-open]');
  if (openEl) {
    const id = openEl.getAttribute('data-modal-open');
    const modal = findModal(id);
    if (modal) {
      e.preventDefault();
      modal.show();
    }
  }

  const closeEl = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-modal-close-id]');
  if (closeEl) {
    const id = closeEl.getAttribute('data-modal-close-id');
    findModal(id)?.hide();
  }
});
