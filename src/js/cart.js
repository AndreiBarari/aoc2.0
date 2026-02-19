document.addEventListener('DOMContentLoaded', function () {
  if (
    !window.getCart ||
    !window.saveCart ||
    !window.getData ||
    !window.updateCartCounter ||
    !window.showFlashMessage
  ) {
    console.error('Eroare: Initialization functions not found.');
    return;
  }

  const mainCartSection = document.querySelector('.main-cart__content');
  const tableWrapper = document.querySelector('.table-wrapper');
  const tableBody = document.querySelector('.products-table tbody');
  const cartActions = document.querySelector('.cart-actions');
  const summaryList = document.querySelector('.cart-actions__summary ul');
  const checkoutBtn = document.querySelector('.cart-actions__summary .checkout');

  const clearCartBtn = document.querySelector('.clear-cart');
  const continueBtn = document.querySelector('.continue');

  function showEmptyCartMessage(show) {
    const emptyMsg = mainCartSection.querySelector('.cart-empty-message');
    if (show) {
      if (!emptyMsg) {
        mainCartSection.insertAdjacentHTML(
          'afterbegin',
          '<p class="cart-empty-message">Your cart is empty. Use the catalog to add new items.</p> <a class="cart-empty-btn" href="./catalog.html">Continue shopping</a>'
        );
      }
      if (tableWrapper) tableWrapper.style.display = 'none';
      if (cartActions) cartActions.style.display = 'none';
    } else {
      if (emptyMsg) emptyMsg.remove();
      if (tableWrapper) tableWrapper.style.display = 'block';
      if (cartActions) cartActions.style.display = 'flex';
    }
  }

  // Function for re-rendering the entire cart
  async function rerenderCart() {
    const cartDetails = await getMergedCartDetails();
    renderTable(cartDetails);
    renderSummary(cartDetails);
    window.updateCartCounter();
  }

  // Function for merging localStorage cart data with full product data
  async function getMergedCartDetails() {
    const cart = window.getCart();
    if (cart.length === 0) {
      return [];
    }
    const allProducts = await window.getData();
    const cartDetails = cart
      .map((cartItem) => {
        const productData = allProducts.find((p) => p.id === cartItem.id);
        if (productData) {
          return {
            ...productData,
            quantity: cartItem.quantity,
          };
        }
        return null;
      })
      .filter((item) => item !== null);
    return cartDetails;
  }

  // Function for displaying cart items in the table
  function renderTable(cartDetails) {
    if (!tableBody || !mainCartSection) return;

    if (cartDetails.length === 0) {
      showEmptyCartMessage(true);
      return;
    }

    showEmptyCartMessage(false);

    tableBody.innerHTML = '';
    let rowsHtml = '';
    cartDetails.forEach((item) => {
      const total = item.price * item.quantity;
      rowsHtml += `
        <tr data-id="${item.id}">
          <td>
            <img class="product-image" src="${item.imageUrl}" alt="${item.name}">
          </td>
          <td>${item.name}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td class="product-quantity">
            <button class="qty-decrement">-</button>
            <span class="qty">${item.quantity}</span>
            <button class="qty-increment">+</button>
          </td>
          <td class="product-total">$${total.toFixed(2)}</td>
          <td>
            <button class="remove-product">
              <img src="/src/assets/Cart/remove.png" alt="remove-product">
            </button>
          </td>
        </tr>
      `;
    });
    tableBody.innerHTML = rowsHtml;
  }

  // Function for calculating and displaying the totals summary
  function renderSummary(cartDetails) {
    if (!summaryList || cartDetails.length === 0) {
      if (!summaryList) {
        console.error("Eroare: Nu am găsit 'summaryList' (selectorul '.cart-actions__summary ul')");
      }
      return;
    }
    const subtotal = cartDetails.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 15.0;
    let discount = 0.0;
    if (subtotal > 3000) {
      discount = subtotal * 0.1;
    }
    const total = subtotal + shipping - discount;
    const liItems = summaryList.querySelectorAll('li');

    if (liItems.length === 4) {
      liItems[0].innerHTML = `<span>Sub total</span> <span>$${subtotal.toFixed(2)}</span>`;
      liItems[1].innerHTML = `<span>Shipping</span> <span>$${shipping.toFixed(2)}</span>`;
      liItems[2].innerHTML = `<span>Discount</span> <span>-$${discount.toFixed(2)}</span>`;
      liItems[3].innerHTML = `<span>Total</span> <span>$${total.toFixed(2)}</span>`;
      liItems[3].className = 'summary-total';
    }
  }

  // Function for handling clicks within the cart table (qty, remove)
  function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr[data-id]');
    if (!row) return;

    const id = row.dataset.id;
    let cart = window.getCart();
    const itemIndex = cart.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    if (target.closest('.remove-product')) {
      cart = cart.filter((item) => item.id !== id);
      window.saveCart(cart);
      rerenderCart();
      window.showFlashMessage('Product removed', 'danger');
      return;
    }

    if (target.closest('.qty-increment')) {
      cart[itemIndex].quantity++;
      window.saveCart(cart);
      rerenderCart();
      return;
    }

    if (target.closest('.qty-decrement')) {
      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
        window.saveCart(cart);
        rerenderCart();
      }
    }
  }

  // Function for clearing the entire cart
  function handleClearCart() {
    window.saveCart([]);
    rerenderCart();
    window.showFlashMessage('Cart cleared', 'danger');
  }

  // Function for handling the checkout process
  function handleCheckout() {
    window.saveCart([]);
    rerenderCart();
    window.showFlashMessage('Thank you for your purchase', 'success');
  }

  // Function for setting up all event listeners
  function initCartPage() {
    if (tableBody) {
      tableBody.addEventListener('click', handleTableClick);
    }

    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', handleClearCart);
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = './catalog.html';
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', handleCheckout);
    }

    rerenderCart();
  }

  // Initialization
  initCartPage();
});
