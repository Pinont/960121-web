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
                    <button type="button" class="btn btn-light" data-bs-toggle="modal" data-bs-target="#modallong">
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

// Execution: Start the sequence once the DOM is ready
document.addEventListener('DOMContentLoaded', requestProducts);