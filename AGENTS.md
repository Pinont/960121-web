# Stylish E-Commerce Platform — Complete Architecture & Agent Instructions

## Project Overview

**Stylish** (v1.0.0) is a full-stack e-commerce shoe store platform with:
- **Frontend:** Responsive HTML5/CSS3/JavaScript template (no build tools required)
- **Backend:** Node.js/Express API following the MVC (Controller-Route-Service) pattern
- **Data:** Centralized JSON-based product catalog shared between frontend and backend

### License & Attribution
- Licensed for personal and commercial use
- **REQUIRES** a visible TemplatesJungle credit link in the footer
- ⚠️ **Never remove or hide this attribution**

---

## 🏗️ Architecture Overview

### System-Wide Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Static)                        │
│                                                                  │
│  index.html ──┬─→ shop.js ──→ fetchProductsData() ───→ renderUI()│
│               │                                                   │
│         [User Interactions]                                       │
│         • Search/filter                                           │
│         • Category browse                                         │
│         • Product view                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (optional API calls)
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js/Express)                  │
│                                                                  │
│  HTTP Request → Route (src/routes/) → Controller → Service      │
│                                            ↓                      │
│                               Utility (src/utils/)               │
│                                     ↓                             │
│                        data/products.json                         │
│                                     ↓                             │
│                           JSON Response                           │
└─────────────────────────────────────────────────────────────────┘
```

### Current Mode (v1.0.0)
- **Frontend loads data** from `data/products.json` via `shop.js`
- **Backend API available** but frontend currently uses static JSON fetch
- **Modular structure ready** for future migration to full API-driven frontend

---

## 📁 Complete File Structure

```
.
├── index.html                     # Main frontend entry point
├── shop.js                        # Product fetch, search, filter, DOM render
├── style.css                      # Custom theme + Bootstrap v5 overrides
├── server.js                      # Express app entry point
├── package.json                   # Node.js dependencies
│
├── css/
│   └── vendor.css                 # Bootstrap 5 framework
│
├── js/
│   ├── jquery-1.11.0.min.js       # jQuery library
│   ├── plugins.js                 # jQuery plugin initialization
│   └── script.js                  # Parallax, quantity controls, interactions
│
├── data/
│   └── products.json              # Product catalog (shared by frontend & backend)
│
├── images/
│   ├── [product images]           # Shoe photos
│   └── chocolat/                  # Lightbox plugin assets
│
├── src/                           # Backend application code
│   ├── routes/
│   │   └── products.js            # API route definitions
│   ├── controllers/
│   │   └── products.controller.js # Request handlers & validation
│   ├── services/
│   │   └── products.service.js    # Business logic & data processing
│   └── utils/
│       └── dataLoader.js          # Data I/O utilities
│
├── Document/
│   └── product_filter/
│       └── contract.md            # Filter contract specification
│
├── models/                        # (Reserved for future use)
├── routes/                        # (Reserved for future use)
└── .env.example                   # Environment variables template
```

---

## 🎯 Technology Stack

### Frontend
- **HTML5/CSS3** — Semantic markup, responsive design
- **JavaScript (ES6+)** — Vanilla JS for DOM manipulation
- **Bootstrap 5** — Grid system, utilities, modals
- **Libraries:**
  - jQuery 1.11.0 — DOM utilities
  - Swiper.js — Image carousel
  - Chocolat.js — Lightbox gallery
  - Jarallax.js — Parallax scrolling
  - Google Fonts (Inter, Playfair Display)
  - Iconify SVG sprites

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Middleware:** CORS, JSON parser
- **Data Storage:** JSON file (products.json)
- **Dev Tools:** nodemon (auto-restart)
- **Environment:** dotenv for configuration

---

## 📡 Frontend Architecture

### Data Flow: `shop.js` Pipeline

```javascript
requestProducts()
  ↓
fetchProductsData()  // Async fetch from data/products.json
  ↓ (success)
allProducts[] ← stored in global scope
  ↓
renderUI()  // ES6 template literals → DOM
  ↓
User can search/filter via live keyup event
```

### Key Frontend Patterns

| Pattern | Implementation | Location |
|---------|------------------|----------|
| **Product Data** | JSON fetched at page load | [shop.js](shop.js) ~line 10 |
| **Rendering** | ES6 template literals + `.map().join()` | [shop.js](shop.js) ~line 40–60 |
| **Search/Filter** | Form `keyup` event triggers filter on `allProducts[]` | [shop.js](shop.js) `searchProducts()` |
| **UI Components** | Bootstrap modals, cards, grid | [index.html](index.html) |
| **Styling** | CSS custom properties + Bootstrap utilities | [style.css](style.css) |
| **Icons** | SVG `<symbol>` system with `<use>` references | [index.html](index.html) |
| **Interactive UI** | Quantity spinners, parallax, lightbox | [js/script.js](js/script.js) |

---

## 🖥️ Backend Architecture (Layered Pattern - v2.0.0)

### Layered Architecture Overview

The backend has been refactored into a **clean layered architecture** with clear separation of concerns:

```
REQUEST → ROUTES → CONTROLLERS → SERVICES → MODELS → DATA
```

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP REQUEST                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ROUTES (The Gatekeepers)                                       │
│  • Defines API endpoints                                        │
│  • Maps HTTP methods to controller methods                      │
│  • Applies middleware (auth, validation)                        │
│  Files: routes/*.js                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  CONTROLLERS (The Brains)                                       │
│  • Handles HTTP request/response logic                          │
│  • Calls appropriate service methods                            │
│  • Formats and returns JSON responses                           │
│  • No direct data access                                        │
│  Files: controllers/*.js                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SERVICES (The Workers)                                         │
│  • Contains pure business logic                                 │
│  • No HTTP concerns (no req/res)                                │
│  • Handles calculations, validation, data processing            │
│  • Calls utilities for data access                              │
│  Files: services/*.js                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MODELS (The Schema)                                            │
│  • Defines data structure                                       │
│  • Validation methods                                           │
│  • Data conversion/transformation                               │
│  Files: models/*.js                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA (JSON Files)                                              │
│  • data/products.json                                           │
│  • data/auth_user.json                                          │
│  • data/orders.json                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Directory Structure

```
stylish-1.0.0/
├── models/                    # Data schemas (Source of Truth)
│   ├── Product.js            # Product model & validation
│   ├── User.js               # User model & validation
│   └── Order.js              # Order model & validation
│
├── services/                 # Business logic (Workers)
│   ├── ProductService.js     # Product operations logic
│   ├── AuthService.js        # Authentication logic
│   └── OrderService.js       # Checkout & orders logic
│
├── controllers/              # Request handlers (Brains)
│   ├── ProductController.js  # Handles product endpoints
│   ├── AuthController.js     # Handles auth endpoints
│   ├── CheckoutController.js # Handles checkout endpoint
│   └── OrdersController.js   # Handles orders endpoints
│
├── routes/                   # API endpoints (Gatekeepers)
│   ├── productRoutes.js      # Product API routes
│   ├── authRoutes.js         # Auth API routes
│   ├── checkoutRoutes.js     # Checkout API routes
│   └── orderRoutes.js        # Orders API routes
│
├── middleware/               # Express middleware
│   └── authMiddleware.js     # JWT token verification
│
├── server.js                 # Express app entry point
└── package.json              # Dependencies
```

### Layer Responsibilities

| Layer | File | Purpose | Example |
|-------|------|---------|---------|
| **Models** | `models/*.js` | Data schema & validation | `Product.validate(data)` |
| **Services** | `services/*.js` | Pure business logic | `ProductService.getAll()` |
| **Controllers** | `controllers/*.js` | Request/response handling | `ProductController.getAll(req, res)` |
| **Routes** | `routes/*.js` | API endpoint mapping | `router.get('/', controller)` |
| **Middleware** | `middleware/*.js` | Cross-cutting concerns | `verifyToken(req, res, next)` |

### Data Flow Example: Get Products

```
1. CLIENT REQUEST
   GET /api/products?category=Running&page=1

2. ROUTE HANDLER (routes/productRoutes.js)
   Receives request → Passes to ProductController.getAll()

3. CONTROLLER (controllers/ProductController.js)
   - Extracts: category, search, page, limit from req.query
   - Calls: ProductService.getAll({ category, search, page, limit })
   - Returns: JSON response with products and pagination

4. SERVICE (services/ProductService.js)
   - Loads products from data file
   - Filters by category
   - Applies search
   - Calculates pagination
   - Returns: { products, pagination }

5. RESPONSE
   {
     "success": true,
     "data": [ { id, title, price, category, image } ],
     "pagination": { currentPage, totalPages, ... }
   }
```

### Models Layer
**Purpose:** Data schemas and validation

```javascript
// models/Product.js
class Product {
  constructor(id, image, title, price, category) { ... }
  
  static validate(data) {
    // Returns { valid: boolean, errors: array }
  }
}
```

### Services Layer
**Purpose:** Pure business logic

```javascript
// services/ProductService.js
class ProductService {
  getAll(options) { ... }    // Filter, search, paginate
  getById(id) { ... }        // Get single product
  getByCategory(category) { ... }
}
```

### Controllers Layer
**Purpose:** Request/response handling

```javascript
// controllers/ProductController.js
class ProductController {
  static getAll(req, res, next) {
    const result = ProductService.getAll(req.query);
    res.json(result);
  }
}
```

### Routes Layer
**Purpose:** API endpoint definitions

```javascript
// routes/productRoutes.js
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
```

### Middleware Layer
**Purpose:** Cross-cutting concerns (authentication, validation, logging)

```javascript
// middleware/authMiddleware.js
function verifyToken(req, res, next) {
  // Check Authorization header
  // Verify JWT
  // Set req.user
  // Call next()
}
```

**Used on:**
- `GET /api/auth/profile`
- `POST /api/checkout`
- `GET /api/orders` (all order endpoints)

### Complete API Endpoints

#### Products (Public)
```
GET    /api/products                      Get all products (with filters)
       Query: category, search, page, limit
GET    /api/products/:id                  Get single product
GET    /api/products/category/:category   Get by category
GET    /api/products/categories           List all categories
GET    /api/products/count                Get product count
```

**Example:**
```bash
curl "http://localhost:3000/api/products?page=1&limit=5&category=Running"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "AeroSwift Pro Runner",
      "price": 120,
      "category": "Running shoes for men",
      "image": "images/card-item1.jpg"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 4,
    "totalItems": 8,
    "itemsPerPage": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Authentication (Public/Protected)
```
POST   /api/auth/login                    Login → get JWT token
POST   /api/auth/register                 Register new user
GET    /api/auth/profile                  Get user profile (protected)
```

#### Checkout (Protected)
```
POST   /api/checkout                      Process checkout (requires JWT token)
```

#### Orders (Protected)
```
GET    /api/orders                        Get all orders (requires JWT token)
GET    /api/orders/:orderId               Get single order (requires JWT token)
GET    /api/orders/user/:email            Get orders by email (requires JWT token)
```

#### Health Check
```
GET    /health                            Server status check
```

---

## 📊 Product Data Schema

All products conform to this JSON schema (in [data/products.json](data/products.json)):

```json
{
  "id": 1,                              // Unique identifier
  "image": "images/card-item1.jpg",     // Image path (relative to root)
  "title": "AeroSwift Pro Runner",      // Product name
  "price": 120,                         // Price in USD
  "category": "Running shoes for men"   // Category/type
}
```

---

## 🔧 Setup & Deployment

### Frontend (No Build Required)
```bash
# Option 1: Direct browser
open index.html

# Option 2: Simple HTTP server
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Backend (Node.js API)
```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env

# 3. Start server (production)
npm start

# 4. Or: Start with auto-reload (development)
npm run dev
```

Server runs on `http://localhost:3000` by default.

**Environment Variables** (`.env`):
```
PORT=3000
NODE_ENV=development
```

---

## ✏️ Common Development Tasks

### 1. Add or Modify a Product

**Step 1:** Edit [data/products.json](data/products.json)
```json
{
  "id": 9,
  "image": "images/my-shoe.jpg",
  "title": "My New Shoe",
  "price": 150,
  "category": "New Category"
}
```

**Step 2:** Ensure image exists in `images/` folder

**Step 3:** Refresh browser; frontend auto-loads and displays

**Step 4:** (Backend) Test via API:
```bash
curl http://localhost:3000/api/products
```

---

### 2. Change Styling or Colors

**Brand colors:**
- Edit CSS variables in [style.css](style.css)
- Example: `--bs-primary: #ce071e` (primary red)

**Grid/spacing:**
- Use Bootstrap utility classes in [index.html](index.html)
- Override in [style.css](style.css)

**Product card layout:**
- Edit template literal in [shop.js](shop.js) `renderUI()` function (~line 40–60)

---

### 3. Modify Search/Filter Behavior

**Frontend:**
- Edit `searchProducts()` function in [shop.js](shop.js)
- Function filters `allProducts[]` array; results auto-render

**Backend:**
- Modify filtering logic in the service function within [src/products.js](src/products.js)
- Adjust filter logic and pagination

---

### 4. Add a New Backend Endpoint

Add all related code to a single service file in `src/`:

**Step 1:** Update [src/products.js](src/products.js)
```javascript
// Add route definition
router.post('/', (req, res, next) => {
  productsController.createProduct(req, res, next);
});

// Add controller logic
const createProduct = (req, res, next) => {
  try {
    const newProduct = productsService.create(req.body);
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

// Add service logic
create(productData) {
  const newProduct = { ...productData, id: Date.now() };
  this.products.push(newProduct);
  saveProducts(this.products);
  return newProduct;
}
```

**Step 2:** (Optional) Create a new service for a different domain:
- Create `src/orders.js` with all routes, controller, service, and utilities
- Import in [server.js](server.js): `const orders = require('./src/orders')`
- Add route: `app.use('/api/orders', orders)`

---

### 5. Add Interactive Features

**Frontend:**
- Use vanilla JS in [js/script.js](js/script.js)
- Or add event listeners in [shop.js](shop.js)
- Initialize jQuery plugins in [js/plugins.js](js/plugins.js)
- Add markup to [index.html](index.html) with Bootstrap classes

**Example:** Add click handler
```javascript
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', () => {
    console.log('Product clicked');
  });
});
```

---

## 🧪 Testing & Verification

### Frontend Testing
- **No build step** — Open `index.html` directly in browser
- **Responsiveness** — DevTools device emulation
- **Search/filter** — Verify filters work on all product fields
- **Browser console** — Check for async fetch errors

### Backend Testing

```bash
# Get all products
curl http://localhost:3000/api/products

# Paginated results
curl "http://localhost:3000/api/products?page=1&limit=5"

# Search
curl "http://localhost:3000/api/products?search=Runner"

# Filter by category
curl "http://localhost:3000/api/products?category=Running"

# Single product
curl http://localhost:3000/api/products/1

# Category endpoint
curl "http://localhost:3000/api/products/category/Running%20shoes%20for%20men"

# Health check
curl http://localhost:3000/health
```

---

## ⚠️ Important Constraints & Notes

1. **Static frontend** — No build step required; vanilla HTML/CSS/JS only
2. **Browser compatibility** — Uses ES6+ and CSS custom properties (modern browsers only)
3. **License compliance** — TemplatesJungle credit link MUST remain visible in footer
4. **Performance** — Lightweight libraries preferred; avoid large frameworks
5. **Accessibility** — Ensure ARIA labels and semantic HTML for screen readers
6. **JSON data format** — Strictly follow product schema in [data/products.json](data/products.json)
7. **API optional** — Frontend currently uses static JSON; backend API available for future migration

---

## 📋 Error Handling

### Frontend
- Try-catch in `fetchProductsData()` handles async errors
- User-facing error messages in modal/alert

### Backend
All errors return JSON responses with HTTP status codes:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status | Meaning        |
|--------|----------------|
| 200    | Success        |
| 201    | Created        |
| 400    | Bad Request    |
| 404    | Not Found      |
| 500    | Server Error   |

---

## 📋 Quick Reference - Which File Should I Edit?

| Scenario | File | Why |
|----------|------|-----|
| Add new endpoint | `routes/*.js` | That's where endpoints are defined |
| Add validation logic | `models/*.js` | Models validate data |
| Add business logic | `services/*.js` | Services contain business logic |
| Change response format | `controllers/*.js` | Controllers format responses |
| Add authentication | `middleware/*.js` | Middleware handles cross-cutting concerns |

### Layer Quick Reference

**Models** (`models/`)
- Defines data structure
- Validates data before use
- Converts to/from JSON
- No database operations

**Services** (`services/`)
- Pure business logic
- No HTTP concerns (`req`, `res`)
- No middleware
- Can be reused by multiple controllers

**Controllers** (`controllers/`)
- Request/response handling
- Extract and validate input
- Call services
- Format responses
- Set HTTP status codes
- Handle errors

**Routes** (`routes/`)
- Define API endpoints
- Map HTTP methods to controllers
- Apply middleware
- Wire everything together

**Middleware** (`middleware/`)
- Cross-cutting concerns
- Authentication
- Validation
- Logging
- Error handling

---

## 🧪 Complete Testing Examples

### Health Check
```bash
curl http://localhost:3000/health
```

### Get All Products
```bash
curl http://localhost:3000/api/products
```

### Get Products with Filters
```bash
curl "http://localhost:3000/api/products?page=1&limit=5&category=Running"
curl "http://localhost:3000/api/products?search=Runner"
```

### Get Single Product
```bash
curl http://localhost:3000/api/products/1
```

### Get Products by Category
```bash
curl "http://localhost:3000/api/products/category/Running%20shoes%20for%20men"
```

### Register New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }'
```

### Login and Get Token
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }' | jq -r '.token')

echo $TOKEN
```

### Get User Profile (Protected)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/auth/profile
```

### Process Checkout (Protected)
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cart": {
      "1": { "quantity": 2 },
      "3": { "quantity": 1 }
    },
    "email": "john@example.com",
    "cardNumber": "1234567890123456"
  }'
```

### Get All Orders (Protected)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/orders
```

### Get Orders by Email (Protected)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/orders/user/john@example.com"
```

### Try Protected Route Without Token (Should Return 401)
```bash
curl http://localhost:3000/api/auth/profile
# Response: "Authorization header missing"
```

---

## ✅ Checklist: Adding a New Feature

### Example: Add filter by price range

**Step 1: Update Model** (`models/Product.js`)
```javascript
// Add validation for price range if needed
```

**Step 2: Add Service Logic** (`services/ProductService.js`)
```javascript
getByPriceRange(minPrice, maxPrice) {
  return this.products.filter(p => 
    p.price >= minPrice && p.price <= maxPrice
  );
}
```

**Step 3: Add Controller Handler** (`controllers/ProductController.js`)
```javascript
static async getByPriceRange(req, res, next) {
  const { minPrice, maxPrice } = req.query;
  const result = ProductService.getByPriceRange(minPrice, maxPrice);
  res.json({ success: true, data: result });
}
```

**Step 4: Add Route** (`routes/productRoutes.js`)
```javascript
router.get('/price-range', ProductController.getByPriceRange);
```

**Step 5: Test**
```bash
curl "http://localhost:3000/api/products/price-range?minPrice=100&maxPrice=150"
```

---

## 🚨 Common Mistakes to Avoid

❌ **DON'T:** Put business logic in controllers
✅ **DO:** Put it in services

❌ **DON'T:** Access files directly in controllers
✅ **DO:** Call services that handle file I/O

❌ **DON'T:** Skip model validation
✅ **DO:** Always validate in models

❌ **DON'T:** Mix HTTP logic with business logic
✅ **DO:** Keep them separate (controller vs service)

❌ **DON'T:** Create routes without controllers
✅ **DO:** Always follow: route → controller → service

---

## 📚 Benefits of This Architecture

✅ **Separation of Concerns** - Each layer has one responsibility  
✅ **Easy Testing** - Each layer can be tested independently  
✅ **Code Reusability** - Services can be used by multiple controllers  
✅ **Maintainability** - Changes isolated to specific layers  
✅ **Scalability** - Easy to add new services and features  
✅ **Clear Dependencies** - Data flows in one direction  
✅ **Future-Proof** - Can migrate to microservices later  

---

## 🔧 Adding a New Service

To create a new service (e.g., for reviews, wishlists, etc.), follow this pattern:

**Step 1: Create Model** (`models/Review.js`)
```javascript
class Review {
  constructor(id, productId, userId, rating, comment) { ... }
  
  static validate(data) {
    // Returns { valid: boolean, errors: array }
  }
}
module.exports = Review;
```

**Step 2: Create Service** (`services/ReviewService.js`)
```javascript
class ReviewService {
  loadReviews() { ... }           // Load from file
  getByProduct(productId) { ... } // Get all by product
  create(reviewData) { ... }      // Create new review
}
module.exports = new ReviewService();
```

**Step 3: Create Controller** (`controllers/ReviewController.js`)
```javascript
class ReviewController {
  static async getByProduct(req, res, next) {
    const reviews = ReviewService.getByProduct(req.params.productId);
    res.json({ success: true, data: reviews });
  }
  
  static async create(req, res, next) {
    const review = ReviewService.create(req.body);
    res.status(201).json({ success: true, data: review });
  }
}
module.exports = ReviewController;
```

**Step 4: Create Routes** (`routes/reviewRoutes.js`)
```javascript
const router = express.Router();
const ReviewController = require('../controllers/ReviewController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/product/:productId', ReviewController.getByProduct);
router.post('/', verifyToken, ReviewController.create);

module.exports = router;
```

**Step 5: Register in server.js**
```javascript
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
```

---

## 🎯 Agent Guidelines

When asked to:

- ✅ **Add a feature** → Check [shop.js](shop.js), [index.html](index.html), and relevant controller/service
- ✅ **Fix styling** → Look at [style.css](style.css) CSS variables and Bootstrap utilities
- ✅ **Add/modify products** → Update [data/products.json](data/products.json) with correct schema
- ✅ **Create API endpoint** → Follow layered architecture: Models → Services → Controllers → Routes
- ✅ **Add a new service** → Create files in models/, services/, controllers/, routes/ directories
- ✅ **Improve UX** → Use existing plugins (Swiper, Chocolat, Jarallax) before adding dependencies
- ✅ **Debug search/filter** → Check [shop.js](shop.js) and service business logic
- ✅ **Ensure compliance** → Verify TemplatesJungle attribution remains visible
- ✅ **Performance optimization** — Minimize file size, use CDN for libraries, lazy-load images

---

## 📦 Dependencies

**Frontend:**
- Bootstrap 5 (CSS framework)
- jQuery 1.11.0 (DOM utilities)
- Swiper.js (carousel)
- Chocolat.js (lightbox)
- Jarallax.js (parallax)
- Google Fonts (Inter, Playfair Display)
- Iconify (SVG icons)

**Backend:**
- express (web framework)
- cors (CORS middleware)
- dotenv (environment config)
- nodemon (dev auto-restart)
- sqlite3 (SQLite database)
- bcrypt (password hashing)
- jsonwebtoken (JWT auth)
- uuid (unique IDs)

---

## 🗄️ SQLite DATABASE MIGRATION (v1.0.0+)

### Overview
The Stylish platform has been migrated from JSON file storage to SQLite database for better performance, scalability, and data integrity.

**Status**: ✅ Complete & Production Ready

### Database Location
- **File**: `data/store.db`
- **Auto-created**: On first server start
- **Size**: ~28 KB with full dataset

### Database Schema

#### Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
**Current Data**: 19 products

#### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
**Current Data**: 15 users (14 imported + 1 test)

#### Orders Table
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  items TEXT NOT NULL,        -- Stored as JSON string
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
**Current Data**: 1 order

### New Database Files

**`/db/database.js`** - Database Initialization & Query Wrappers
- `initDatabase()` - Creates tables, enables foreign keys
- `createTables()` - Creates all three tables with proper schema
- `queryDatabase(db, sql, params)` - Execute SELECT queries, returns all rows
- `getOne(db, sql, params)` - Execute SELECT, returns single row
- `executeDatabase(db, sql, params)` - Execute INSERT/UPDATE/DELETE
- `closeDatabase(db)` - Gracefully close connection

**`/db/migrate.js`** - Data Migration Script
- `migrateProducts(db)` - Import from `data/products.json`
- `migrateUsers(db)` - Import from `data/auth_user.json` (excludes login_tests)
- `migrateOrders(db)` - Import from `data/orders.json`
- `runMigrations()` - Orchestrate all migrations
- **Execution**: `node db/migrate.js` (automatic on server startup)
- **Duplicate Handling**: Gracefully skips duplicate IDs with warnings

### Modified Service Files

All services now use async/await patterns and SQLite queries:

**ProductService.js**
- `getAll(options, db)` - Filter, search, paginate
- `getById(id, db)` - Single product lookup
- `getByCategory(category, options, db)` - Category filtering
- `getCategories(db)` - List unique categories
- `getCount(db)` - Total product count
- `create(productData, db)` - Insert new product

**AuthService.js**
- `findUserByEmail(email, db)` - Query by email
- `authenticateUser(email, password, db)` - Validate credentials
- `registerUser(name, email, password, db)` - Create user with bcrypt
- `generateToken(user)` - JWT token creation
- `verifyToken(token)` - JWT verification
- **Password Support**: MD5 (legacy) + Bcrypt (new)

**OrderService.js**
- `validateCartItems(cart, db)` - Check products exist
- `validateEmail(email)` - Format validation
- `validateCreditCard(cardNumber)` - Card format check
- `calculateTotal(cart, db)` - Compute order total
- `createOrder(orderData, db)` - Insert order
- `getAllOrders(db, email)` - Retrieve orders
- `getOrderById(orderId, db)` - Single order lookup

### Modified Controller Files

All controllers now pass `req.db` to services and handle async operations:

**ProductController.js** - Updated methods
- `getAll(req, res, next)` - Async, pass req.db
- `getById(req, res, next)` - Async, pass req.db
- `getByCategory(req, res, next)` - Async, pass req.db
- `getCategories(req, res, next)` - Async, pass req.db

**AuthController.js** - Updated methods
- `login(req, res, next)` - Pass req.db to AuthService
- `register(req, res, next)` - Async user creation

**CheckoutController.js** - Updated methods
- `processCheckout(req, res, next)` - Await async validations

**OrdersController.js** - Updated methods
- `getAll(req, res, next)` - Use CheckoutService.getAllOrders()
- `getById(req, res, next)` - Use CheckoutService.getOrderById()
- `getByEmail(req, res, next)` - Filter by email

### Server Configuration

**server.js** - Auto Database Initialization
```javascript
async function startServer() {
  // Initialize database
  globalDb = await initDatabase();
  
  // Run migrations
  await migrate.runMigrations();
  
  // Start server
  app.listen(PORT, ...);
}
```

**Middleware**: Attaches `req.db = globalDb` to all requests

### Data Migration Details

**Migration Process**
1. Server starts → `server.js` calls `initDatabase()`
2. Tables created with `CREATE TABLE IF NOT EXISTS`
3. `migrate.runMigrations()` runs automatically
4. Data imported from JSON files:
   - 19 products (1 duplicate ID skipped)
   - 14 users (login_tests array excluded)
   - 1 order

**Duplicate Handling**
- Uses `INSERT OR IGNORE` for safe batch operations
- Logs warnings for skipped duplicates
- Prevents constraint violations

**Legacy User Support**
- Imported users: MD5 password hashes (from JSON)
- New users: Bcrypt hashing (10 salt rounds)
- AuthService auto-detects hash type
- Both work transparently

### Getting Started with Database

```bash
# 1. Server auto-initializes database
npm start

# 2. Database is created and populated automatically
# Output will show:
# ✓ Products table ready
# ✓ Users table ready
# ✓ Orders table ready
# ✓ Migrated 19 products
# ✓ Migrated 14 users
# ✓ Migrated 1 order

# 3. Test endpoint
curl http://localhost:3000/api/products

# 4. Query database directly
sqlite3 data/store.db "SELECT COUNT(*) FROM products;"
```

### Testing the Database

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Products
```bash
curl "http://localhost:3000/api/products?page=1&limit=5"
curl "http://localhost:3000/api/products/category/Running%20shoes%20for%20men"
```

#### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.smith@example.com","password":"123456"}'

# Get token, then use in subsequent requests
# Authorization: Bearer <TOKEN>
```

#### Orders (Protected)
```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3000/api/orders
```

### Important Notes

**JSON Files**
- `data/products.json` - Still available, used for migration only
- `data/auth_user.json` - Still available, `login_tests` preserved in JSON
- `data/orders.json` - Still available, used for migration
- Can be safely deleted after confirming database works

**Test Credentials**
| Email | Password |
|-------|----------|
| alice.smith@example.com | 123456 |
| bob.johnson@example.com | password |
| carol.williams@example.com | qwerty |

**Development**
- Watch mode: `npm run dev` (auto-restart with nodemon)
- Production: `npm start`
- Environment: Set `NODE_ENV=production` for production

**Database Operations**
- All operations use parameterized queries (SQL injection safe)
- All database calls wrapped in try-catch
- Proper error messages logged
- Foreign keys enabled

---

## 📄 License

Licensed for personal and commercial use with attribution requirement. See license in footer.
