# Stylish E-Commerce Backend API

A modular Node.js/Express backend for the Stylish shoe store following the **Controller-Route-Service (MVC)** pattern.

## 🏗️ Architecture Overview

```
server.js                          # Application entry point
├── src/
│   ├── routes/
│   │   └── products.js            # Route definitions
│   ├── controllers/
│   │   └── products.controller.js # Request handlers
│   ├── services/
│   │   └── products.service.js    # Business logic
│   └── utils/
│       └── dataLoader.js          # Data persistence utilities
├── data/
│   └── products.json              # Product database
├── package.json                   # Dependencies
└── .env.example                   # Environment variables template
```

### Design Pattern: Controller-Route-Service

1. **Routes** (`src/routes/`) — Defines HTTP endpoints
2. **Controllers** (`src/controllers/`) — Validates requests, coordinates operations, formats responses
3. **Services** (`src/services/`) — Encapsulates business logic and data access
4. **Utils** (`src/utils/`) — Reusable helper functions (data loading, formatting)

---

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# For development with auto-restart
npm install --save-dev nodemon
```

### Running the Server

```bash
# Production
npm start

# Development (with hot reload)
npm run dev
```

Server runs on `http://localhost:3000` by default.

### Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
NODE_ENV=development
```

---

## 📡 API Endpoints

### Get All Products

```
GET /api/products
```

**Query Parameters:**

| Parameter | Type   | Description          | Default |
| --------- | ------ | -------------------- | ------- |
| `page`    | number | Pagination page      | 1       |
| `limit`   | number | Items per page       | 10      |
| `search`  | string | Search by title      | -       |
| `category`| string | Filter by category   | -       |

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

---

### Get Single Product

```
GET /api/products/:id
```

**Example:**

```bash
curl "http://localhost:3000/api/products/1"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "AeroSwift Pro Runner",
    "price": 120,
    "category": "Running shoes for men",
    "image": "images/card-item1.jpg"
  }
}
```

---

### Get Products by Category

```
GET /api/products/category/:category
```

**Query Parameters:**

| Parameter | Type   | Default |
| --------- | ------ | ------- |
| `page`    | number | 1       |
| `limit`   | number | 10      |

**Example:**

```bash
curl "http://localhost:3000/api/products/category/Running%20shoes%20for%20men?limit=3"
```

---

### Health Check

```
GET /health
```

---

## 📂 Project Structure Explanation

### `server.js` — Main Application

- Initializes Express app
- Configures middleware (CORS, JSON parsing)
- Mounts routes
- Error handling middleware

### `src/routes/products.js` — Route Definitions

- Defines HTTP endpoints and methods
- Maps requests to controller methods
- Documents API contract (comments)

### `src/controllers/products.controller.js` — Request Handlers

- Validates input from requests
- Calls service methods
- Formats and returns responses
- Handles error responses

### `src/services/products.service.js` — Business Logic

- Implements core business logic
- Performs data filtering, sorting, pagination
- Interacts with utilities for data access
- Pure business operations (no HTTP concerns)

### `src/utils/dataLoader.js` — Data Persistence

- Loads product data from JSON file
- Parses and validates data
- Error handling for file operations
- Reusable across services

---

## 🔄 Request Flow

```
HTTP Request
    ↓
Route (src/routes/products.js)
    ↓
Controller (src/controllers/products.controller.js)
    ├─ Validates input
    ├─ Calls service
    └─ Formats response
        ↓
Service (src/services/products.service.js)
    ├─ Applies filters
    ├─ Performs pagination
    └─ Returns processed data
        ↓
Utility (src/utils/dataLoader.js)
    └─ Reads from products.json
        ↓
HTTP Response
```

---

## 🛠️ Extending the Backend

### Add a New Endpoint

1. **Create route in `src/routes/products.js`:**

```javascript
router.post('/', productsController.createProduct);
```

2. **Add controller method in `src/controllers/products.controller.js`:**

```javascript
exports.createProduct = async (req, res, next) => {
  try {
    const newProduct = await productsService.create(req.body);
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};
```

3. **Add service method in `src/services/products.service.js`:**

```javascript
async create(productData) {
  const newProduct = { ...productData, id: Date.now() };
  this.products.push(newProduct);
  saveProducts(this.products);
  return newProduct;
}
```

---

## 📋 Error Handling

All errors return JSON responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

HTTP Status Codes:

| Code | Meaning           |
| ---- | ----------------- |
| 200  | Success           |
| 201  | Created           |
| 400  | Bad Request       |
| 404  | Not Found         |
| 500  | Server Error      |

---

## 🧪 Testing Endpoints (curl examples)

```bash
# Get all products
curl http://localhost:3000/api/products

# Get paginated products
curl "http://localhost:3000/api/products?page=1&limit=5"

# Search products
curl "http://localhost:3000/api/products?search=Runner"

# Filter by category
curl "http://localhost:3000/api/products?category=Running"

# Get single product
curl http://localhost:3000/api/products/1

# Get products by category
curl "http://localhost:3000/api/products/category/Running%20shoes%20for%20men"

# Health check
curl http://localhost:3000/health
```

---

## 📦 Dependencies

- **express** — Web framework
- **cors** — Cross-Origin Resource Sharing middleware
- **dotenv** — Environment variable management
- **nodemon** (dev) — Auto-restart on file changes

---

## 📝 License

See project documentation for licensing details.
