/**
 * STEP 1: requestProducts()
 * This function acts as the controller. It initiates the process 
 * when the page loads, following the sequence diagram trigger.
 */
async function requestProducts() {
    console.log("Sequence Start: Requesting products...");
    const jsonPath = 'data/products.json'; // The path to your JSON data source

    try {
        // FLOW: Move from Controller logic to the Data Acquisition phase
        const data = await fetchProductsData(jsonPath);
        
        // FLOW: If data is acquired, move to the UI Rendering phase
        if (data) {
            allProducts = data; // Store in global for search functionality
            renderUI(data);
            renderFeaturedProducts(data);
        }
    } catch (error) {
        // Error handling logic if any step in the sequence fails
        console.error("Sequence Interrupted:", error);
        document.getElementById('product-container').innerHTML = 
            `<p class="text-danger">System Error: Unable to complete the request.</p>`;
    }
}

/**
 * STEP 2: fetch(path-to-json-file) logic
 * Focuses strictly on the communication between the Client and the Data Source.
 */
async function fetchProductsData(path) {
    // SEND: HTTP GET Request to the server/file system
    const response = await fetch(path);
    
    // VALIDATION: Check if the "Messenger" (HTTP) returned a success code (200 OK)
    if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    // TRANSFORMATION: Convert the raw byte stream into a usable JavaScript Object (JSON)
    const products = await response.json();
    console.log("Data Flow: JSON successfully parsed", products);
    
    return products;
}

/**
 * STEP 3: renderUI()
 * The final stage in the sequence diagram. It takes the processed data 
 * and maps it to the DOM (Document Object Model).
 */
function renderUI(products) {
    const container = document.getElementById('product-container');
    
    // DATA MAPPING: Loop through each object in the array
    const htmlOutput = products.map(product => {
        // We use template literals to inject data into your specific HTML block structure
        return `
          <div class="col mb-4 mb-3">
            <div class="product-card position-relative">
              <div class="card-img">
                <img src="${product.image}" alt="${product.title}" class="product-image img-fluid">
                <div class="cart-concern position-absolute d-flex justify-content-center">
                  <div class="cart-button d-flex gap-2 justify-content-center align-items-center">
                    <button type="button" class="btn btn-light add-to-cart" data-id="${product.id}">
                      <svg class="shopping-carriage"><use xlink:href="#shopping-carriage"></use></svg>
                    </button>
                    <button type="button" class="btn btn-light" data-bs-target="#modaltoggle" data-bs-toggle="modal">
                      <svg class="quick-view"><use xlink:href="#quick-view"></use></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="card-detail d-flex justify-content-between align-items-center mt-3">
                <h3 class="card-title fs-6 fw-normal m-0">
                  <a href="index.html">${product.title}</a>
                </h3>
                <span class="card-price fw-bold">$${product.price}</span>
              </div>
            </div>
          </div>`;
    }).join(''); // Join array into one long string of HTML

    // UPDATE: Final "Push" of data to the storefront
    container.innerHTML = htmlOutput;
    console.log("Sequence End: UI Rendered");
}

/**
 * Render featured products (first 5 products)
 */
function renderFeaturedProducts(products) {
    const featuredContainer = document.getElementById('featured-container');
    
    // Take only the first 5 products for featured section
    const featuredProducts = products.slice(0, 5);
    
    const htmlOutput = featuredProducts.map(product => {
        return `
          <div class="col mb-4 mb-3">
            <div class="product-card position-relative">
              <div class="card-img">
                <img src="${product.image}" alt="${product.title}" class="product-image img-fluid">
                <div class="cart-concern position-absolute d-flex justify-content-center">
                  <div class="cart-button d-flex gap-2 justify-content-center align-items-center">
                    <button type="button" class="btn btn-light add-to-cart" data-id="${product.id}">
                      <svg class="shopping-carriage"><use xlink:href="#shopping-carriage"></use></svg>
                    </button>
                    <button type="button" class="btn btn-light" data-bs-target="#modaltoggle" data-bs-toggle="modal">
                      <svg class="quick-view"><use xlink:href="#quick-view"></use></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div class="card-detail d-flex justify-content-between align-items-center mt-3">
                <h3 class="card-title fs-6 fw-normal m-0">
                  <a href="index.html">${product.title}</a>
                </h3>
                <span class="card-price fw-bold">$${product.price}</span>
              </div>
            </div>
          </div>`;
    }).join('');

    featuredContainer.innerHTML = htmlOutput;
    console.log("Featured Products Rendered");
}

// Global memory (The "Warehouse")
let allProducts = [];

/**
 * Modified renderUI to accept a target container ID
 */
function renderProducts(products, containerId = 'product-container') {
    const container = document.getElementById(containerId);
    
    const htmlOutput = products.map(product => `
          <div class="col mb-4 mb-3">
            <div class="product-card position-relative">
              <div class="card-img">
                <img src="${product.image}" alt="${product.title}" class="product-image img-fluid">
                </div>
              <div class="card-detail d-flex justify-content-between align-items-center mt-3">
                <h3 class="card-title fs-6 fw-normal m-0">
                  <a href="#">${product.title}</a>
                </h3>
                <span class="card-price fw-bold">$${product.price}</span>
              </div>
            </div>
          </div>`).join('');

    container.innerHTML = htmlOutput;
}

/**
 * Updated Search Logic
 */
function searchProducts(event) {
    if (event) event.preventDefault();

    const keyword = document.querySelector('.search-input').value.toLowerCase().trim();
    const searchSection = document.getElementById('search-results-section');
    const latestSection = document.getElementById('latest-products-section');
    const searchGrid = document.getElementById('search-results-grid');

    if (keyword === "") {
        searchSection.style.display = 'none'; // Hide results
        latestSection.style.opacity = '1';    // Show latest products fully
        return;
    }

    const filteredResults = allProducts.filter(product => 
        product.title.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword)
    );

    // Update UI Flow
    searchSection.style.display = 'block'; // Show the search area
    
    if (filteredResults.length > 0) {
        renderProducts(filteredResults, 'search-results-grid');
    } else {
        searchGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger fs-5"><strong>⚠ No results found for "${keyword}"</strong></p>
                <p class="text-muted">Try searching with different keywords.</p>
            </div>`;
    }
}

/**
 * Clear search and hide results section
 */
function clearSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchSection = document.getElementById('search-results-section');
    const latestSection = document.getElementById('latest-products-section');
    
    searchInput.value = '';
    searchSection.style.display = 'none';
    if (latestSection) {
        latestSection.style.opacity = '1';
    }
}

// Event: Search form submission
const searchForm = document.getElementById('search-form');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => searchProducts(e));
}

// Event: Close button in search box
const closeButton = document.querySelector('.close-button');
if (closeButton) {
    closeButton.addEventListener('click', clearSearch);
}

// Event: Live search as user types
const searchInput = document.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => searchProducts(e));
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

/**
 * Show a toast notification with a message
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast) return;
    
    toastMessage.textContent = message;
    toast.style.display = 'flex';
    toast.classList.remove('hide');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 400); // Wait for animation to finish
    }, 3000);
}

// ============================================================
// EVENT DELEGATION: Shopping Cart Handler
// ============================================================

// Step 1: Initialize a cart object to keep track of added products.
// We use localStorage to persist cart data across page refreshes
let cart = {};

/**
 * Load cart from localStorage
 */
function loadCart() {
    const savedCart = localStorage.getItem('stylish-cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            console.log('Cart loaded from localStorage:', cart);
        } catch (e) {
            console.error('Error loading cart:', e);
            cart = {};
        }
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('stylish-cart', JSON.stringify(cart));
    console.log('Cart saved to localStorage');
}

// Step 4: Define the event handler function.
// This function runs whenever ANY click happens inside #product-container
function handleAddToCartClick(event) {
    // We use .closest() to check if the clicked element (or any of its parent nodes)
    // has the '.add-to-cart' class. This method traverses up the DOM tree.
    // 
    // WHY .closest() instead of checking event.target directly?
    //   - If user clicks on the <svg> or <use> icon INSIDE the button, event.target
    //     will point to the icon, not the button
    //   - .closest() handles this by checking the element and all ancestors
    const button = event.target.closest('.add-to-cart');

    // If the click did not originate from within an '.add-to-cart' button, ignore it.
    // This ensures we only process clicks on the shopping cart button,
    // not on other elements like the quick-view button or product title
    if (!button) return;

    // Optional: prevent default behavior if the button is an <a> tag or inside a form
    event.preventDefault();

    // Step 5: Grab the product ID from the 'data-id' attribute of the button.
    // This attribute is set in the renderUI template:
    //   <button class="add-to-cart" data-id="${product.id}">
    const productId = button.getAttribute('data-id');

    // Only proceed if a valid ID was found
    if (productId) {
        // Step 6: Update the cart object.
        // If the product is already in the cart, increment its quantity.
        // Otherwise, add it as a new entry with quantity of 1.
        if (cart[productId]) {
            cart[productId].quantity += 1;
        } else {
            cart[productId] = {
                quantity: 1
            };
        }

        console.log(`✓ Product ${productId} added to cart!`, cart);

        // Update the cart UI to show the item
        updateCartUI();
        
        // Save cart to localStorage
        saveCart();

        // Show success notification
        const product = allProducts.find(p => p.id == productId);
        const productName = product ? product.title : 'Item';
        showToast(`✓ ${productName} added to cart!`);
    }
}

// ============================================================
// CART UI RENDERING
// ============================================================

/**
 * Update the cart UI to display all items in the cart modal
 */
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const subtotalElement = document.getElementById('cart-subtotal');

    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
        cartContainer.innerHTML = '';
        emptyMessage.style.display = 'block';
        subtotalElement.textContent = '$0.00';
        return;
    }

    // Hide empty message
    emptyMessage.style.display = 'none';

    // Build HTML for all cart items
    let totalPrice = 0;
    let cartHTML = '';

    Object.keys(cart).forEach(productId => {
        const cartItem = cart[productId];
        const product = allProducts.find(p => p.id == productId);

        if (product) {
            const itemTotal = product.price * cartItem.quantity;
            totalPrice += itemTotal;

            cartHTML += `
                <div class="mini-cart-item d-flex border-bottom pb-3" data-product-id="${productId}">
                    <div class="col-lg-2 col-md-3 col-sm-2 me-4">
                        <a href="#" title="product-image">
                            <img src="${product.image}" class="img-fluid" alt="${product.title}">
                        </a>
                    </div>
                    <div class="col-lg-9 col-md-8 col-sm-8">
                        <div class="product-header d-flex justify-content-between align-items-center mb-3">
                            <h4 class="product-title fs-6 me-5">${product.title}</h4>
                            <button class="remove-from-cart btn-link border-0 p-0" data-product-id="${productId}" aria-label="Remove this item">
                                <svg class="close" width="16" height="16">
                                    <use xlink:href="#close"></use>
                                </svg>
                            </button>
                        </div>
                        <div class="quantity-price d-flex justify-content-between align-items-center">
                            <div class="input-group product-qty" style="width: 120px;">
                                <button type="button" class="qty-minus btn btn-light rounded-0 rounded-start btn-sm" data-product-id="${productId}">
                                    <svg width="14" height="14">
                                        <use xlink:href="#minus"></use>
                                    </svg>
                                </button>
                                <input type="text" name="quantity" class="form-control input-number quantity text-center" value="${cartItem.quantity}" readonly>
                                <button type="button" class="qty-plus btn btn-light rounded-0 rounded-end btn-sm" data-product-id="${productId}">
                                    <svg width="14" height="14">
                                        <use xlink:href="#plus"></use>
                                    </svg>
                                </button>
                            </div>
                            <div class="price-code">
                                <span class="product-price fs-6">$${itemTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    });

    cartContainer.innerHTML = cartHTML;
    subtotalElement.textContent = `$${totalPrice.toFixed(2)}`;

    // Attach event listeners to remove and quantity buttons
    attachCartEventListeners();
}

/**
 * Attach event listeners to cart item controls
 */
function attachCartEventListeners() {
    // Remove from cart buttons
    document.querySelectorAll('.remove-from-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            removeFromCart(productId);
        });
    });

    // Quantity increase buttons
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            if (cart[productId]) {
                cart[productId].quantity += 1;
                updateCartUI();
                saveCart();
            }
        });
    });

    // Quantity decrease buttons
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            if (cart[productId] && cart[productId].quantity > 1) {
                cart[productId].quantity -= 1;
                updateCartUI();
                saveCart();
            }
        });
    });
}

/**
 * Remove a product from the cart
 */
function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
        updateCartUI();
        saveCart();
        console.log(`✗ Product ${productId} removed from cart`);
    }
}

// Execution: Start the sequence once the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from localStorage first
    loadCart();
    
    // Attach event listeners for both product containers
    const catalogContainer = document.getElementById('product-container');
    const featuredContainer = document.getElementById('featured-container');

    // Attach listeners for Latest Products section
    if (catalogContainer) {
        catalogContainer.addEventListener('click', handleAddToCartClick);
    }

    // Attach listeners for Featured Products section
    if (featuredContainer) {
        featuredContainer.addEventListener('click', handleAddToCartClick);
    }

    // Load products
    requestProducts();
    
    // Display cart UI (in case there were items in localStorage)
    setTimeout(() => {
        updateCartUI();
    }, 500);
});