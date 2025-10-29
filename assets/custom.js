class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = document.querySelector('.cart-drawer__overlay');
    this.closeBtn = this.querySelector('.cart-drawer__close');
    this.loader = this.querySelector('.cart-drawer__loader');

    // Empty cart flow elements
    
    this.selectedProduct = null;
    this.selectedVariant = null;
    this.selectedPlan = null;
    this.selectedQty = 1;

    // bind handlers
    this.handleQtyClick = this.handleQtyClick.bind(this);
    this.inputHandleQtyClick = this.inputHandleQtyClick.bind(this);
    this.handleRemoveClick = this.handleRemoveClick.bind(this);
    this.handleUpsellClick = this.handleUpsellClick.bind(this);
    this.handleToggleNote = this.handleToggleNote.bind(this);
    this.open = this.open.bind(this);
    // this.handleChoosePlan() = this.handleChoosePlan.bind(this);
    // Event listeners
    this.onNoteBlur = this.onNoteBlur.bind(this);
    this.overlay.addEventListener('click', () => this.close());
    this.closeBtn.addEventListener('click', () => this.close());
    this.delegateEvents(); // Attach event delegation
    this.emptyDelegateEvents(); 
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

  emptyDelegateEvents() {
    this.addEventListener('click', (e) => {
      const el = e.target.closest('.add-product-item');
      if (el) {
        e.preventDefault();
        this.handleAddProductItem(el);
      }
    });
  }

  handleAddProductItem(el) {
    // Step navigation helper
    const handle = el.dataset.productHandle;
    fetch(`/products/${handle}?section_id=single-product-info`)
      .then((response) => response.text())
      .then((data) => {
        const html = new DOMParser().parseFromString(data, 'text/html');
        const singleProduct = html.querySelector('.cart-single-product-info');
        const existingSingleProduct = document.querySelector('.cart-single-product-info');
        if (singleProduct && existingSingleProduct) {
          existingSingleProduct.replaceWith(singleProduct);
        }

        this.querySelectorAll('.sp-variant-list .sp-variant-item').forEach((item) => {
          item.addEventListener('click', (event) => {
            document.querySelectorAll('.sp-variant-list .sp-variant-item').forEach((el) => {
              el.classList.remove('active');
            });
            event.currentTarget.classList.add('active'); 
            if(this.querySelector('.sp-variant-list .sp-variant-item.active')) {
              this.querySelector('.choose_size_btn').removeAttribute('disabled');
            } 
          });
        });
        setTimeout(()=>{
          this.showStep('variant');
        },100)

        document.querySelector('.choose_size_btn').addEventListener('click', ()=> {
          this.handleChoosePlan();
          this.showStep('plan');
        });

        document.querySelector('.cart-single-product-info .sp-remove').addEventListener('click', ()=> {
          this.showStep('product-list');
        });

        this.handleEmptyQrt();

      })
    .catch((error) => console.error('Error fetching section:', error));
  }

  handleChoosePlan(el) {
      const handle = this.querySelector('.sp-variant-list .sp-variant-item.active').dataset.productHandle;
      const variant = this.querySelector('.sp-variant-list .sp-variant-item.active').dataset.variantId;
      
      fetch(`/products/${handle}?variant=${variant}&section_id=product-selling-plan`)
        .then((response) => response.text())
        .then((data) => {
          const html = new DOMParser().parseFromString(data, 'text/html');
          const singleProduct = html.querySelector('.cart-selling-plan-info');
          const existingSingleProduct = document.querySelector('.cart-selling-plan-info');
          if (singleProduct && existingSingleProduct) {
            existingSingleProduct.replaceWith(singleProduct);
          }

          const qtyInput = document.querySelector('.cart-single-product-info .sp-qty-block input[name="quantity"]');
          if(qtyInput){
            this.selectedQty = qtyInput.value;
            const planQtyInput = document.querySelector('.cart-selling-plan-info .sp-qty-block input[name="quantity"]');
            if(planQtyInput){
              planQtyInput.value = this.selectedQty;
            }            
          }

          document.querySelector('.custom-cart-flow .choose_plan_btn').addEventListener('click', ()=> {
            const planWrapper = document.querySelector('.custom-cart-flow .selling_plan-item');
            let variantId = null;
            let selling_plan = '';
            if(planWrapper){
              variantId = planWrapper.querySelector('.cart-subscription-list.check-active input[type=radio]:checked').dataset.variantId;
              selling_plan = planWrapper.querySelector('.cart-subscription-list.check-active input[type=radio]:checked').dataset.sellingPlanId;
            } else {
              variantId = document.querySelector('.cart-selling-plan-info .cart-sp-main').dataset.variantId || null;
            }
            const qty = parseInt(document.querySelector('.cart-selling-plan-info input[type="number"]').value);
            if(variantId){
              this.addSelectedProduct(variantId, qty, selling_plan);
            }
          }); 

          document.querySelector('.custom-cart-flow .variant-edit-btn').addEventListener('click', ()=> {
            this.showStep('variant');
          });

          document.querySelector('.cart-selling-plan-info .sp-remove').addEventListener('click', ()=> {
            this.showStep('product-list');
          });

          this.handleEmptyQrt();
          
        })
      .catch((error) => console.error('Error fetching section:', error));
  }

  async addSelectedProduct(variantId, qty = 1, selling_plan = '') {
    this.showLoader();
    const body = { id: variantId, quantity: qty };
    if (selling_plan) body.selling_plan = selling_plan;

    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await this.refresh();
    this.hideLoader();
  }

  showStep(stepName) {
    this.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));
    const activeStep = this.querySelector(`.step-${stepName}`);
    if (activeStep) {
      activeStep.classList.remove('hidden');
    }
  }

  handleEmptyQrt(){
    document.querySelectorAll('.sp-qty-block').forEach(block => {
      const input = block.querySelector('input[type="number"]');
      const minusBtn = block.querySelector('.sp-qty-minus');
      const plusBtn = block.querySelector('.sp-qty-plus');
    
      minusBtn.addEventListener('click', () => {
        let current = parseInt(input.value) || 1;
        const min = parseInt(input.min) || 1;
        if (current > min) input.value = current - 1;
      });
    
      plusBtn.addEventListener('click', () => {
        let current = parseInt(input.value) || 1;
        const max = parseInt(input.max) || Infinity;
        if (current < max) input.value = current + 1;
      });
    });
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
    const countElm = this.querySelector('#CartCount');
    if(countElm){
      const qty = parseInt(newCount.textContent, 10) || 0;
      countElm.textContent = newCount.textContent;
      if(qty > 0){
        countElm.classList.add('active');
      }else {
        countElm.classList.remove('active');
      }
    }

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

    const cartDrawerBody = document.getElementById("CartDrawerBody");
    const shippingText = document.querySelector(".cart-drawer-shipping-text");

    if (cartDrawerBody && shippingText) {
      const threshold = parseFloat(cartDrawerBody.dataset.freeShippingThreshold);

      if (threshold === 100) {
        shippingText.classList.remove("hidden");
      }else{
        shippingText.classList.add("hidden");
      }
    }

    const footer = this.querySelector('.cart-drawer__footer');
    if (footer) {
      const count = parseInt(newCount.textContent, 10) || 0;
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
  if (!customElements.get('cart-drawer')) {
    customElements.define('cart-drawer', CartDrawer);
  }
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

class CartSellingPlan extends HTMLElement {
  constructor() {
    super();

    // Store current selection
    this.selectedVariantId = null;
    this.selectedPlanId = null;
    this.selectedType = null;

    // Bind methods
    this.onRadioChange = this.onRadioChange.bind(this);
    this.onSelectChange = this.onSelectChange.bind(this);
  }

  connectedCallback() {
    this.radioInputs = this.querySelectorAll('input[data-radio-type]');
    this.selectInputs = this.querySelectorAll('select.selling-plan-dropdown');

    this.radioInputs.forEach((radio) => {
      radio.addEventListener('change', this.onRadioChange);
    });

    this.selectInputs.forEach((select) => {
      select.addEventListener('change', this.onSelectChange);
    });

    const checked = this.querySelector('input[data-radio-type]:checked');
    if (checked) this.setSelectedPlan(checked);
  }

  disconnectedCallback() {
    // Clean up event listeners
    this.radioInputs.forEach((radio) => {
      radio.removeEventListener('change', this.onRadioChange);
    });
    this.selectInputs.forEach((select) => {
      select.removeEventListener('change', this.onSelectChange);
    });
  }

  onRadioChange(event) {
    const radio = event.currentTarget;
    this.setSelectedPlan(radio);
  }

  // Handle select dropdown change
  onSelectChange(event) {
    const select = event.currentTarget;
    const selectedPlanId = select.value;
    this.selectedPlanId = selectedPlanId;
  }

  setSelectedPlan(radio) {
    this.querySelectorAll('.cart-subscription-list').forEach((el) =>
      el.classList.remove('check-active')
    );
    radio.closest('.cart-subscription-list')?.classList.add('check-active');

    this.selectedType = radio.dataset.radioType;
    this.selectedVariantId = radio.dataset.variantId || radio.dataset.variantId;
    this.selectedPlanId = radio.dataset.sellingPlanId || null;

    //this.updateHiddenInputs();
  }

  updateHiddenInputs() {
    let hiddenPlanInput = this.querySelector('input[name="selling_plan"]');
    if (!hiddenPlanInput) {
      hiddenPlanInput = document.createElement('input');
      hiddenPlanInput.type = 'hidden';
      hiddenPlanInput.name = 'selling_plan';
      this.appendChild(hiddenPlanInput);
    }

    if (this.selectedType === 'selling_plan') {
      hiddenPlanInput.value = this.selectedPlanId;
    } else {
      hiddenPlanInput.value = '';
    }
  }

}

// Register custom element
customElements.define('cart-selling-plan', CartSellingPlan);

class CartItemUpdater {
  static async replaceItem(oldItemId, newVariantId, qty, sellingPlanId = null) {
    const drawer = document.querySelector('cart-drawer');
    try {
      drawer?.showLoader();
      await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: oldItemId,
          quantity: 0
        })
      });

      const addBody = {
        id: Number(newVariantId),
        quantity: Number(qty)
      };

      if (sellingPlanId && sellingPlanId !== 'null' && sellingPlanId !== '') {
        addBody.selling_plan = Number(sellingPlanId);
      }

      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addBody)
      });

      if (drawer) await drawer.refresh();

    } catch (err) {
      console.error('Error replacing cart item:', err);
    } finally {
      drawer?.hideLoader();
    }
  }
}

// ---------- Variant Selector ----------
class CustomCartVariantSelector extends HTMLElement {
  constructor() {
    super();
    this.toggleList = this.toggleList.bind(this);
    this.selectVariant = this.selectVariant.bind(this);
  }

  connectedCallback() {
    this.querySelector('.variant-select-button')?.addEventListener('click', this.toggleList);
    this.querySelectorAll('.variant-option-list li').forEach(li =>
      li.addEventListener('click', this.selectVariant)
    );
  }

  toggleList() {
    this.classList.toggle('active');
  }

  async selectVariant(event) {
    const li = event.currentTarget;
    const newVariantId = li.dataset.variantId;
    const itemId = this.dataset.itemId;
    const qty = this.dataset.qty;

    // find selling plan (if exists)
    const sellingPlanSelector = this.closest('.cart-item')?.querySelector('custom-cart-selling-plan-selector');
    let sellingPlanId = null;
    if (sellingPlanSelector && typeof sellingPlanSelector.getSelectedSellingPlanId === 'function') {
      sellingPlanId = sellingPlanSelector.getSelectedSellingPlanId();
    }

    //console.log('Replacing cart item →', { itemId, newVariantId, qty, sellingPlanId });

    await CartItemUpdater.replaceItem(itemId, newVariantId, qty, sellingPlanId);
  }
}

customElements.define('custom-cart-variant-selector', CustomCartVariantSelector);

// ---------- Selling Plan Selector ----------
class CustomCartSellingPlanSelector extends HTMLElement {
  constructor() {
    super();
    this.toggleList = this.toggleList.bind(this);
    this.selectPlan = this.selectPlan.bind(this);
  }

  connectedCallback() {
    this.querySelector('.selling-plan-button')?.addEventListener('click', this.toggleList);
    this.querySelectorAll('.selling-plan-list-ul li').forEach(li =>
      li.addEventListener('click', this.selectPlan)
    );
  }

  toggleList() {
    this.classList.toggle('active');
  }

  selectPlan(event) {
    const newPlanId = event.currentTarget.dataset.value;
    const itemId = this.dataset.itemId;
    const qty = this.dataset.qty;
    const variantSelector = this.closest('.cart-drawer__item')?.querySelector('custom-cart-variant-selector');
    const variantId = variantSelector?.querySelector('.active')?.dataset.variantId;
    CartItemUpdater.replaceItem(itemId, variantId, qty, newPlanId);
  }

  // helper to fetch currently active plan id
  getSelectedSellingPlanId() {
    return this.querySelector('.selling-plan-list-ul li.active')?.dataset.value || null;
  }
}
customElements.define('custom-cart-selling-plan-selector', CustomCartSellingPlanSelector);

