document.addEventListener('alpine:init', () => {
  Alpine.store('cart', {
    items: [],
    itemsCount: 0,
    totalPrice: '0.00',
    isCartOpen: false,
    isLoading: false,
    errorMessage: '',
    shippingDiscount: {
      shippingProgress: 0,
      shippingPrice: 35,
      shippingLeft: 35,
      isFreeShippingUnlocked: false,
    },
    options: {
      showSellingPlan: true,
    },

    loadCart() {
      this.isLoading = true;
      this.errorMessage = '';

      fetch('/cart.js')
        .then((response) => response.json())
        .then((data) => {
          this.items = data.items;
          this.updateItemsCount();
          this.updateTotalPrice();
          console.log('Test this.items', this.items);
        })
        .catch(() => {
          this.errorMessage = 'Failed to load the cart. Please try again.';
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    addToCart ({
        variantId,
        quantity = 1,
        properties = {},
        sellingPlanId = null
      },
      showCart = true,
      redirectToCheckout = false) {
      if (!variantId) {
        console.error('Variant ID is required to add a product to the cart.');
        return;
      }
      this.isLoading = true;
      this.errorMessage = '';
      const requestData = {
        id: variantId,
        quantity: quantity,
        properties,
      };
      if (sellingPlanId) {
        requestData.selling_plan = sellingPlanId;
      }
      console.log('requestData', requestData);
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      .then(() => {
        this.loadCart();
        if (showCart && !this.isCartOpen) {
          this.toggleCart();
        }
        if (redirectToCheckout) {
          window.location.href = '/checkout';
        }
      })
      // .then(response => {
      //   console.log(response.json());
      //   return response.json();
      // })
      .catch(() => {
        this.errorMessage = 'Failed to add the product. Please try again.';
      })
      .finally(() => {
        this.isLoading = false;
      });
    },

    addMultiplyToCart(productsArr) {
      console.log('productsArr', productsArr);
      if (!Array.isArray(productsArr) || productsArr.length === 0) {
        console.error('Invalid products array');
        return;
      }
      this.isLoading = true;
      this.errorMessage = '';

      let formData = {
        items: productsArr,
      };

      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      }).then(() => {
        this.loadCart();
        // window.location.href = '/checkout';
      }).catch(() => {
        this.errorMessage = 'Failed to add the product. Please try again.';
      }).finally(() => {
        this.isLoading = false;
      });
    },

    updateCart(itemKey, quantity) {
      this.isLoading = true;
      this.errorMessage = '';

      fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: String(itemKey), quantity: quantity }),
      })
        .then((response) => {
          if (!response.ok) {
            this.errorMessage = 'Failed to update the cart.';
            throw new Error('Failed to update the cart.');
          }
          return response.json();
        })
        .then((data) => {
          this.items = data.items;
          this.updateItemsCount();
          this.updateTotalPrice();
        })
        .catch((error) => {
          this.errorMessage = error.message;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    decrementQuantity(itemId, quantity) {
      console.log(quantity);
      if (quantity > 1) {
        this.updateCart(itemId, quantity - 1);
      } else {
        this.updateCart(itemId, 0);
      }
    }, 

    clearCart() {
      this.isLoading = true;
      this.errorMessage = '';
      fetch('/cart/clear.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(() => {
          this.items = [];
          this.itemsCount = 0;
          this.updateTotalPrice();
        })
        .catch(() => {
          this.errorMessage = 'Failed to clear the cart. Please try again.';
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    removeFromCart(itemKey) {
      this.updateCart(itemKey, 0);
    },

    toggleCart(status) {
      if (status !== undefined) {
        this.isCartOpen = status;
        Alpine.store('shopMainStore').body_no_scroll = status;
        // console.log('status', this.$store.shopMainStore.body_no_scroll);
      } else {
        this.isCartOpen = !this.isCartOpen;
        Alpine.store('shopMainStore').body_no_scroll = this.isCartOpen;
      }
    },

    updateItemsCount() {
      this.itemsCount = this.items.reduce((total, item) => total + item.quantity, 0);
    },

    showQuantity(itemId) {
      const item = this.items.find((item) => item.id === itemId);
      return item ? item.quantity : 0;
    },

    updateTotalPrice() {
      this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity) / 100, 0).toFixed(2);

      const total = parseFloat(this.totalPrice);
      this.shippingDiscount.isFreeShippingUnlocked = total >= this.shippingDiscount.shippingPrice;
      this.shippingDiscount.shippingLeft = (this.shippingDiscount.shippingPrice - total).toFixed(2);
      this.shippingDiscount.shippingProgress = Math.min(100, (total / this.shippingDiscount.shippingPrice) * 100);
    },
  });

  Alpine.store('cart').loadCart();
});
