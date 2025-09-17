class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = document.querySelector('.cart-drawer__overlay');
    this.closeBtn = this.querySelector('.cart-drawer__close');
    this.loader = this.querySelector('.cart-drawer__loader');

    // bind handlers
    this.handleQtyClick = this.handleQtyClick.bind(this);
    this.inputHandleQtyClick = this.inputHandleQtyClick.bind(this);
    this.handleRemoveClick = this.handleRemoveClick.bind(this);
    this.handleUpsellClick = this.handleUpsellClick.bind(this);
    this.handleToggleNote = this.handleToggleNote.bind(this);
    this.open = this.open.bind(this);

    // Event listeners
    this.onNoteBlur = this.onNoteBlur.bind(this);
    this.overlay.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.delegateEvents(); // Attach event delegation
  }

  showLoader() {
    this.loader.classList.remove('hidden');
  }

  hideLoader() {
    this.loader.classList.add('hidden');
  }

  delegateEvents() {
    this.querySelectorAll('.qty-btn').forEach((btn) => btn.addEventListener('click', this.handleQtyClick));
    this.querySelectorAll('.cart-drawer__quantity input').forEach((input) =>
      input.addEventListener('change', this.inputHandleQtyClick)
    );

    this.querySelectorAll('.cart-drawer__remove').forEach((removeBtn) =>
      removeBtn.addEventListener('click', this.handleRemoveClick)
    );

    this.querySelectorAll('.upsell-add').forEach((removeBtn) =>
      removeBtn.addEventListener('click', this.handleUpsellClick)
    );

    this.querySelectorAll('.toggle-note').forEach((removeBtn) =>
      removeBtn.addEventListener('click', this.handleToggleNote)
    );

    this.querySelectorAll('.save-note').forEach((elm) => elm.addEventListener('click', this.onNoteBlur));

    // const noteField = this.querySelector('.cart-note');
    // if (noteField) {
    //   noteField.removeEventListener('blur', this.saveNote);
    //   noteField.addEventListener('blur', () => this.saveNote());
    // }

    this.updateMinusButtonStates();
  }

  handleQtyClick(e) {
    this.updateQuantity(e);
  }

  inputHandleQtyClick(e) {
    const item = e.target.closest('.cart-drawer__item');
    let qty = parseInt(e.target.value);
    this.changeQuantity(item.dataset.key, qty);
  }

  handleRemoveClick(e) {
    const key = e.target.closest('.cart-drawer__item').dataset.key;
    this.changeQuantity(key, 0);
  }

  handleUpsellClick(e) {
    const variantId = e.target.dataset.variant;
    this.addProduct(variantId, e.target);
  }

  handleToggleNote() {
    this.toggleNote();
  }

  toggleNote() {
    const wrapper = this.querySelector('.note-wrapper');
    wrapper.classList.toggle('hidden');

    const parentElm = this.querySelector('.cart-drawer__note');
    parentElm.classList.toggle('note-open');
  }

  onNoteBlur() {
    this.saveNote();
  }

  async saveNote() {
    this.showLoader();
    const noteValue = this.querySelector('#CartNote').value;
    await fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteValue }),
    });
    // Optionally refresh drawer so note persists
    await this.refresh();
    this.hideLoader();
  }

  updateMinusButtonStates() {
    this.querySelectorAll('.cart-drawer__quantity').forEach((qtyEl) => {
      const input = qtyEl.querySelector('input');
      const minusBtn = qtyEl.querySelector('.minus');
      if (parseInt(input.value) <= 1) {
        minusBtn.disabled = true;
      } else {
        minusBtn.disabled = false;
      }
    });
  }

  async changeQuantity(itemKey, newQty) {
    this.showLoader();
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemKey, quantity: newQty }),
    });
    await this.refresh();
    this.hideLoader();
  }

  async addProduct(variantId, qty = 1) {
    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: qty }),
    });
    await this.refresh();
    this.hideLoader();
  }

  async refresh() {
    const section_id = this.dataset.id;
    const res = await fetch(`/?section_id=${section_id}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newBody = doc.querySelector('#CartDrawerBody');
    const newSubtotal = doc.querySelector('.subtotal');
    const newCount = doc.querySelector('#CartCount');

    this.querySelector('#CartDrawerBody').replaceWith(newBody);
    this.querySelector('.subtotal').textContent = newSubtotal.textContent;
    this.querySelector('#CartCount').textContent = newCount.textContent;

    const headerCount = document.querySelector('.header-cart__count');
    if (headerCount) {
      headerCount.textContent = newCount.textContent;
    }

    this.delegateEvents(); // Re-delegate events after refresh
  }

  updateQuantity(e) {
    const item = e.target.closest('.cart-drawer__item');
    const input = item.querySelector('input');
    let qty = parseInt(input.value);

    if (e.target.classList.contains('plus')) qty++;
    if (e.target.classList.contains('minus') && qty > 1) qty--;

    this.changeQuantity(item.dataset.key, qty);
  }

  open() {
    this.classList.add('drawer-open');
    document.querySelector('body').classList.add('body-drawer-overflow');
  }

  close() {
    this.classList.remove('drawer-open');
    document.querySelector('body').classList.remove('body-drawer-overflow');
  }
}

customElements.define('cart-drawer', CartDrawer);

class AddVariantItem extends HTMLElement {
  constructor() {
    super();
    this.variantId = this.dataset.id;
    this.drawer = document.querySelector('cart-drawer');
    this.addEventListener('click', () => this.addToCart());
  }

  setLoading(isLoading) {
    if (isLoading) {
      this.classList.add('loading');
      this.disabled = true;
      this.innerHTML = `<span class="btn-spinner"></span>`;
    } else {
      this.classList.remove('loading');
      this.disabled = false;
      this.textContent = 'Add';
    }
  }

  async addToCart() {
    if (!this.variantId || !this.drawer) return;

    this.setLoading(true);
    this.drawer.showLoader();

    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.variantId, quantity: 1 }),
      });

      await this.drawer.refresh();
      this.drawer.hideLoader();
      this.drawer.open();

      // Success state
      this.textContent = 'Added';
      setTimeout(() => {
        this.textContent = 'Add';
        this.disabled = false;
      }, 1500);
    } catch (err) {
      console.error('Add to cart failed', err);
      this.setLoading(false);
    }
  }
}

customElements.define('add-variant-item', AddVariantItem);

class CartIcon extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    const CartDrawer = document.querySelector('cart-drawer');
    if (CartDrawer) {
      CartDrawer.open();
    }
  }
}
customElements.define('cart-icon', CartIcon);