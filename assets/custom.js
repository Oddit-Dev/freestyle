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

    const headerCounts = document.querySelectorAll('.header-cart__count');
    const countValue = newCount.textContent.trim();

    headerCounts.forEach((el) => {
      el.textContent = countValue;

      if (countValue === '0') {
        el.classList.add('header-icon-is-hidden');
      } else {
        el.classList.remove('header-icon-is-hidden');
      }
    });


    const footer = this.querySelector('.cart-drawer__footer');
    if (footer) {
      const count = parseInt(newCount.textContent, 10) || 0;
      console.log(count,"count");
      if (count > 0) {
        footer.classList.remove("hidden");
      } else {
        footer.classList.add("hidden");
      }
    }

    this.delegateEvents(); // Re-delegate events after refresh
  }

  updateQuantity(e) {
    const button = e.target.closest('.qty-btn');
    if (!button) return;

    const item = e.target.closest('.cart-drawer__item');
    const input = item.querySelector('input');
    let qty = parseInt(input.value);

    if (button.classList.contains('plus')) qty++;
    if (button.classList.contains('minus') && qty > 1) qty--;
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
      CartDrawer.refresh();
      CartDrawer.open();
    }
  }
}
customElements.define('cart-icon', CartIcon);

document.addEventListener("DOMContentLoaded", function () {
   const drawer = document.querySelector('cart-drawer');
    if (drawer) {
      drawer.refresh();
    }

  const addToCartBtn = document.querySelector(".js-add-to-cart");
  const addonCheckbox = document.querySelector(".addonproduct");
  
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function () {
      const mainVariantId = this.dataset.variantId;
      const sellingPlanId = this.dataset.sellingPlanId;

      let mainItem = {
        id: mainVariantId,
        quantity: 1
      };

      if (sellingPlanId) {
        mainItem.selling_plan = sellingPlanId;
      }

      let items = [mainItem];
      if (addonCheckbox && addonCheckbox.checked) {
        let addonItem = {
          id: addonCheckbox.dataset.variantId,
          quantity: 1
        };
        const selectedPlan = document.querySelector(".selected-plan").textContent;
        if (selectedPlan != 'One-Time Purchase') {
          if (addonCheckbox.dataset.sellingPlanId) {
            addonItem.selling_plan = addonCheckbox.dataset.sellingPlanId;
          }
        }
        items.push(addonItem);
      }

      items.reverse();

      fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ items })
      })
      .then(response => response.json())
      .then(data => {
          const drawer = document.querySelector('cart-drawer');
          if (drawer) {
            drawer.refresh();
            drawer.hideLoader();
            drawer.open();
          }
      })
      .catch(error => {
        console.error("Error adding to cart:", error);
      });
    });
  }
});

class AddVariantCheckbox extends HTMLElement {
  constructor() {
    super();
    this.variantId = Number(this.dataset.id);
    this.sellingPlanId = Number(this.dataset.sellingPlanId);
    this.onetimePurchase = this.dataset.onetimePurchase;
    this.drawer = document.querySelector('cart-drawer');

    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.classList.add('addon-checkbox');
    this.appendChild(this.checkbox);
    this.syncWithCart();
    this.checkbox.addEventListener('change', () => this.onToggle());
  }

  async syncWithCart() {
    try {
      const cart = await fetch('/cart.js').then(res => res.json());
      const exists = cart.items.some(item => item.variant_id === this.variantId && item.quantity > 0);
      this.checkbox.checked = exists;
    } catch (err) {
      console.error('Error fetching cart for checkbox sync:', err);
    }
  }

  async onToggle() {
    if (!this.drawer) return;

    this.drawer.showLoader();
    //const updates = {};
   // updates[this.variantId] = this.checkbox.checked ? 1 : 0;

    try {

      let mainItem = {
        id: this.variantId,
        quantity: 1
      };
      
      if (this.onetimePurchase == 'false') {
        if (this.sellingPlanId) {
          mainItem.selling_plan = this.sellingPlanId;
        }
      }

      let items = [mainItem];

      const cart = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ items })
        }).then(res => res.json());

      const exists = cart.items.some(item => item.variant_id === this.variantId && item.quantity > 0);
      this.checkbox.checked = exists;

      if (this.drawer) {
        await this.drawer.refresh();
        this.drawer.open();
        this.drawer.hideLoader();
      }
    } catch (err) {
      console.error('Error updating cart for checkbox:', err);
      this.drawer.hideLoader();
      this.checkbox.checked = !this.checkbox.checked;
    }
  }
}
customElements.define('add-variant-checkbox', AddVariantCheckbox);
class ChangeCart extends HTMLElement {
  constructor() {
    super();
    this.selectPlan = this.selectPlan.bind(this);
  }

  connectedCallback() {
    this.querySelector('.change-label')?.addEventListener('click', this.selectPlan);
  }

  disconnectedCallback() {
    this.querySelector('.change-label')?.removeEventListener('click', this.selectPlan);
  }

  selectPlan(event) {
   
    const selectedId = event.currentTarget.dataset.sellingId;
    const qty = this.dataset.qty;
    const line = this.dataset.line;

    this.classList.add('has-loading');
    
    fetch(`/cart/change.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        line: parseInt(line),
        quantity: parseInt(qty),
        selling_plan: selectedId,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        const drawerSectionId = document.querySelector('cart-drawer')?.dataset.id;
        if (!drawerSectionId) return;
        
        return fetch(`/cart?section_id=${drawerSectionId}`);
      })
      .then((response) => response?.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const newInner = html.querySelector('cart-drawer .drawer__inner');
        if (newInner) {
          document.querySelector('cart-drawer .drawer__inner').innerHTML = newInner.innerHTML;
        }
        this.classList.remove('has-loading');
        const drawer = document.querySelector('cart-drawer');
        if (drawer) {
          drawer.refresh();
          drawer.hideLoader();
          drawer.open();
        }
      })
      .catch((err) => {
        console.error('Error updating selling plan:', err);
        this.classList.remove('has-loading');
      });
  }
}

customElements.define('item-change', ChangeCart);

 /* custom selling plan start */
  document.addEventListener("DOMContentLoaded", () => {
    const checked = document.querySelector('.selling_plan_app_container input[type="radio"]:checked');
    if (checked) updateSelectedPlan(checked);
  });
  function updateSelectedPlan(radio) {
    const subscriptionList = radio.closest('.subscription-list');
    const titleText = subscriptionList?.querySelector(".title-text");
    const mergedText = titleText?.innerText.trim();
    const selectedPlanSpan = document.querySelector(".selected-plan");
    const allocationPrice = radio.dataset.variantPrice;
    const checkbox = document.querySelector(".addonproduct");
    checkbox.setAttribute("data-plan-price", allocationPrice);
    if (mergedText && selectedPlanSpan) {
      selectedPlanSpan.textContent = mergedText;
    }
  }

  const radioButtons = document.querySelectorAll('.selling_plan_app_container input[type="radio"]');

  radioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      const subscriptionList = event.target.closest('.subscription-list');
      const selectElement = subscriptionList?.querySelector('select');
      const selectedValue = selectElement?.value;
      const productCard = event.target.closest('.product__content');
      const titleText = subscriptionList?.querySelector(".title-text");
      const mergedText = titleText.innerText.trim();
      const selectedPlanSpan = document.querySelector(".selected-plan");
      selectedPlanSpan.textContent = mergedText;
      if (subscriptionList) {
        document.querySelectorAll('.subscription-list').forEach(list => {
          list.classList.remove('check-active');
        });
        subscriptionList.classList.add('check-active');
      }

      if (selectedValue && selectedValue !== '') {
        if (productCard) {
          productCard.querySelector('.product__cta [name="selling_plan"]').value = selectedValue;
          productCard.querySelector('.product__cta .js-add-to-cart').setAttribute("data-selling-plan-id", selectedValue);
        }
      } else {
        if (productCard) {
          productCard.querySelector('.product__cta [name="selling_plan"]').value = '';
          productCard.querySelector('.product__cta .js-add-to-cart').setAttribute("data-selling-plan-id", '');
        }
      }

      const variantPrice = productCard.querySelector('.selling_plan_theme_integration:not(.has-hidden) [type="radio"]:checked').dataset.variantPrice;
      productCard.querySelector('.product__cta .sale-price').textContent = variantPrice;
      
      if (document.querySelector('.current-variant-price')) {
        document.querySelector('.current-variant-price').textContent = variantPrice;
      }

      let selectedVal = '';
      if (selectElement) {
        selectedVal = selectElement.options[selectElement.selectedIndex].text;
      } else if (subscriptionList.querySelector('.title-text')) {
        selectedVal = subscriptionList.querySelector('.title-text').textContent;
      }
      if (document.querySelector('.sticky-add-to-cart .selling-label')) {
        document.querySelector('.sticky-add-to-cart .selling-label').textContent = selectedVal;
      }

      const checkbox = document.querySelector(".addonproduct");
      checkbox.setAttribute("data-plan-price", variantPrice);
      const addonPrice = parseFloat(checkbox.dataset.variantPrice.replace(/[^0-9.]/g, "")) || 0;
      const planPrice = parseFloat(checkbox.dataset.planPrice.replace(/[^0-9.]/g, "")) || 0;
     
      if (checkbox.checked) {
        const newPrice = addonPrice + planPrice;  
        productCard.querySelector('.product__cta .sale-price').textContent = `$${newPrice.toFixed(2)}`;
      } else {
        const newPrice = planPrice;
        productCard.querySelector('.product__cta .sale-price').textContent = `$${newPrice.toFixed(2)}`;
      }
    });
  });

  const selectElements = document.querySelectorAll('.selling_plan_theme_integration select[name="selling-plan"]');
  selectElements.forEach((selectElement) => {
    selectElement.addEventListener('change', (event) => {
      const selectedValue = event.target.value;

      if (event.target?.closest('.subscription-list')?.querySelectorAll('input:checked').length == 0) {
        return false;
      }

      if (event.target?.closest('.subscription-list')?.querySelector('label input:checked')) {
        event.target.closest('.product__content').querySelector('[name="selling_plan"]').value = selectedValue;
        
      }
      const variantPrice = event.target.closest('.product__content').querySelector('.selling_plan_theme_integration [type="radio"]:checked').dataset.variantPrice;
      event.target.closest('.product__content').querySelector('.product__cta .sale-price').textContent = variantPrice;

      const currentOptionText = event.target.options[event.target.selectedIndex].text;
      if (document.querySelector('.sticky-add-to-cart .selling-label')) {
        document.querySelector('.sticky-add-to-cart .selling-label').textContent = currentOptionText;
      }

      if (document.querySelector('.current-variant-price')) {
        document.querySelector('.current-variant-price').textContent = variantPrice;
      }
    });
  });

  if (document.querySelectorAll('.product__content select[name="selling-plan"]')) {
    document.querySelectorAll('.product__content select[name="selling-plan"]').forEach((select) => {
      select.dispatchEvent(new Event('change'));
    });
  }
  /* custom selling plan end */
document.addEventListener("DOMContentLoaded", () => {
  const link = document.querySelector('a[href="#pdp-reviews"]');
  const target = document.querySelector(".junip-product-review");

  if (link && target) {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const offset = 50;
      const elementPosition = target.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    });
  }
});

