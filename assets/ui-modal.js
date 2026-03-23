"use strict";(()=>{var b="Close",h=document.createElement("template");h.innerHTML=`
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
    <button type="button" class="close" part="close" data-modal-close aria-label="${b}">
      &times;
    </button>
    <slot name="title"></slot>
    <slot></slot>
  </div>
`;var s=class extends HTMLElement{constructor(){super();this._backdrop=null;this._panel=null;this._lastFocus=null;this._titleSlot=null;this._onKeydown=t=>{if(t.key==="Escape"){t.stopPropagation(),this.hide();return}t.key==="Tab"&&this.open&&this._trapFocus(t)};let t=this.attachShadow({mode:"open"});t.appendChild(h.content.cloneNode(!0)),this._backdrop=t.querySelector("[data-modal-backdrop]"),this._panel=t.querySelector(".panel"),this._titleSlot=t.querySelector('slot[name="title"]')}static get observedAttributes(){return["open","aria-label","label","aria-labelledby"]}connectedCallback(){this._syncAriaLabel(),this._syncAriaLabelledBy(),this._backdrop?.addEventListener("click",()=>this.hide()),this.shadowRoot?.querySelector("[data-modal-close]")?.addEventListener("click",()=>this.hide()),this._titleSlot?.addEventListener("slotchange",()=>this._syncAriaLabelledBy())}disconnectedCallback(){document.removeEventListener("keydown",this._onKeydown,!0),this._unlockScroll()}attributeChangedCallback(t,e,i){if(t==="aria-label"||t==="label"){this._syncAriaLabel();return}if(t==="aria-labelledby"){this._syncAriaLabelledBy();return}if(t!=="open"||e===i)return;i!==null?(document.addEventListener("keydown",this._onKeydown,!0),this._lockScroll(),queueMicrotask(()=>{this.shadowRoot?.querySelector("[data-modal-close]")?.focus()})):(document.removeEventListener("keydown",this._onKeydown,!0),this._unlockScroll(),this._lastFocus instanceof HTMLElement&&(this._lastFocus.focus(),this._lastFocus=null))}get open(){return this.hasAttribute("open")}set open(t){t?this.setAttribute("open",""):this.removeAttribute("open")}show(){this._lastFocus=document.activeElement,this.open=!0}hide(){this.open=!1}toggle(){this.open?this.hide():this.show()}_lockScroll(){let t=document.body,e=window.scrollY;t.dataset.modalScrollY=String(e),t.style.position="fixed",t.style.top=`-${e}px`,t.style.left="0",t.style.right="0",t.style.overflow="hidden"}_syncAriaLabel(){let t=this._panel;if(!t)return;if(t.hasAttribute("aria-labelledby")){t.removeAttribute("aria-label");return}let e=this.getAttribute("aria-label"),i=this.getAttribute("label"),a=e||i||"Dialog";t.setAttribute("aria-label",a)}_syncAriaLabelledBy(){let t=this._panel;if(!t)return;let e=this.getAttribute("aria-labelledby");if(e){t.setAttribute("aria-labelledby",e),t.removeAttribute("aria-label");return}let i=this._titleSlot?.assignedElements({flatten:!0})[0];if(!i){t.removeAttribute("aria-labelledby"),this._syncAriaLabel();return}i.id||(i.id=`${this.id||"ui-modal"}-title`),t.setAttribute("aria-labelledby",i.id),t.removeAttribute("aria-label")}_trapFocus(t){let e=this._panel;if(!e)return;let i=Array.from(e.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(d=>!d.hasAttribute("hidden")&&d.offsetParent!==null);if(i.length===0){t.preventDefault(),e.focus();return}let a=i[0],n=i[i.length-1],r=this.shadowRoot?.activeElement||document.activeElement;if(t.shiftKey&&r===a){t.preventDefault(),n.focus();return}!t.shiftKey&&r===n&&(t.preventDefault(),a.focus())}_unlockScroll(){let t=document.body,e=t.dataset.modalScrollY;t.style.position="",t.style.top="",t.style.left="",t.style.right="",t.style.overflow="",delete t.dataset.modalScrollY,e!==void 0&&window.scrollTo(0,Number(e)||0)}},c="ui-modal";customElements.get(c)||customElements.define(c,s);function u(l){if(!l)return null;let o=document.getElementById(l);return o instanceof s?o:null}document.addEventListener("click",l=>{let o=l.target?.closest("[data-modal-open]");if(o){let e=o.getAttribute("data-modal-open"),i=u(e);i&&(l.preventDefault(),i.show())}let t=l.target?.closest("[data-modal-close-id]");if(t){let e=t.getAttribute("data-modal-close-id");u(e)?.hide()}});})();
