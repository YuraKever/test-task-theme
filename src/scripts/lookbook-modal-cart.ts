/**
 * Add to cart from Lookbook modal product rows (forms with [data-lookbook-cart-form]).
 * Mirrors Dawn product-form.js fetch flow for cart drawer / notification.
 */

declare const fetchConfig: (type: string) => {
  method: string;
  headers: Record<string, string>;
};

declare const publish: (event: string, data: unknown) => Promise<unknown[]>;

declare const PUB_SUB_EVENTS: {
  cartUpdate: string;
  cartError: string;
};

interface CartUIElement extends Element {
  getSectionsToRender: () => { id: string }[];
  renderContents: (parsedState: unknown) => void;
  setActiveElement?: (el: Element) => void;
  classList: DOMTokenList;
}

interface LookbookModalElement extends HTMLElement {
  hide: () => void;
}

type CartAddResponse = {
  status?: number;
  description?: string;
  errors?: string;
  message?: string;
};

function getCart(): CartUIElement | null {
  return (
    (document.querySelector('cart-notification') as CartUIElement | null) ||
    (document.querySelector('cart-drawer') as CartUIElement | null)
  );
}

function closeParentModal(form: HTMLFormElement): void {
  const modal = form.closest('ui-modal') as LookbookModalElement | null;
  modal?.hide();
}

function updateVariantPresentation(select: HTMLSelectElement): void {
  const form = select.closest<HTMLFormElement>('form[data-lookbook-cart-form]');
  if (!form) return;

  const selectedOption = select.selectedOptions[0];
  if (!selectedOption) return;

  const priceCurrent = form.parentElement?.querySelector<HTMLElement>('[data-lookbook-price-current]');
  const priceCompare = form.parentElement?.querySelector<HTMLElement>('[data-lookbook-price-compare]');
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-lookbook-submit]');

  const isAvailable = selectedOption.dataset.available === 'true';
  const price = selectedOption.dataset.price;
  const compare = selectedOption.dataset.compare;
  const isOnSale = Boolean(compare);

  if (priceCurrent && price) {
    priceCurrent.textContent = price;
    priceCurrent.dataset.onSale = String(isOnSale);
    priceCurrent.classList.toggle('text-red-600', isOnSale);
    priceCurrent.classList.toggle('text-neutral-900', !isOnSale);
  }

  if (priceCompare) {
    if (compare) {
      priceCompare.textContent = compare;
      priceCompare.hidden = false;
    } else {
      priceCompare.hidden = true;
      priceCompare.textContent = '';
    }
  }

  if (submitBtn) {
    submitBtn.disabled = !isAvailable;
    submitBtn.textContent = isAvailable
      ? submitBtn.dataset.labelAdd || 'Add to cart'
      : submitBtn.dataset.labelSoldOut || 'Sold out';
  }
}

function initLookbookModalCart(): void {
  document.addEventListener('change', (evt) => {
    const select = (evt.target as HTMLElement | null)?.closest<HTMLSelectElement>(
      'form[data-lookbook-cart-form] select[name="id"]'
    );
    if (!select) return;
    updateVariantPresentation(select);
  });

  document.addEventListener('submit', async (evt) => {
    const form = (evt.target as HTMLElement | null)?.closest<HTMLFormElement>('form[data-lookbook-cart-form]');
    if (!form) return;

    evt.preventDefault();

    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!submitBtn || submitBtn.getAttribute('aria-disabled') === 'true') return;

    const cart = getCart();
    const config = fetchConfig('javascript') as {
      method: string;
      headers: Record<string, string>;
      body?: FormData;
    };
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const formData = new FormData(form);
    if (cart) {
      const sectionIds = cart.getSectionsToRender().map((section) => section.id);
      formData.append('sections', sectionIds.join(','));
      formData.append('sections_url', window.location.pathname);
      if (typeof cart.setActiveElement === 'function') {
        cart.setActiveElement(document.activeElement as Element);
      }
    }

    config.body = formData;

    submitBtn.setAttribute('aria-disabled', 'true');
    submitBtn.classList.add('loading');

    const routes = (window as Window & { routes?: { cart_add_url: string; cart_url: string } }).routes;
    const url = routes?.cart_add_url;
    if (!url) {
      submitBtn.removeAttribute('aria-disabled');
      submitBtn.classList.remove('loading');
      return;
    }

    try {
      const response = (await fetch(url, config as RequestInit).then((res) =>
        res.json()
      )) as CartAddResponse;

      if (response.status) {
        void publish(PUB_SUB_EVENTS.cartError, {
          source: 'lookbook-modal',
          productVariantId: formData.get('id'),
          errors: response.errors || response.description,
          message: response.message,
        });
        return;
      }

      if (!cart) {
        const cartUrl = routes?.cart_url;
        closeParentModal(form);
        if (cartUrl) window.location.href = cartUrl;
        return;
      }

      cart.renderContents(response);
      closeParentModal(form);
      void publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'lookbook-modal',
        productVariantId: formData.get('id'),
        cartData: response,
      });
    } catch (e) {
      console.error(e);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.removeAttribute('aria-disabled');
      if (cart?.classList.contains('is-empty')) cart.classList.remove('is-empty');
    }
  });
}

initLookbookModalCart();
