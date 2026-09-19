# ShopSphere E-Commerce Project — Comprehensive Interview & Architecture Guide

A complete, easy-to-understand reference guide for explaining the **ShopSphere E-Commerce Web Application** in technical interviews.

---

## 📌 1. Project High-Level Overview

**ShopSphere** is a full-stack, production-quality E-Commerce Web Application built using **Java 21**, **Spring Boot 3.3.3**, **Spring Data JPA**, **Spring Security (JWT)**, **MySQL/H2 Database**, and a responsive **HTML/CSS/JavaScript** frontend.

### Primary Capabilities:
- **Product & Category Management**: Full CRUD operations, dynamic search, price filtering, category filtering, pagination, and multi-field sorting.
- **User Authentication & Authorization**: Role-based access control (`ROLE_CUSTOMER` vs. `ROLE_ADMIN`) powered by stateless **JWT (JSON Web Tokens)** and **BCrypt password hashing**.
- **Shopping Cart Management**: User-specific cart items with real-time stock validation to prevent negative inventory or over-ordering.
- **Transactional Order Placement**: Cart validation $\rightarrow$ Stock check $\rightarrow$ Order creation $\rightarrow$ Stock reduction $\rightarrow$ Cart clearing $\rightarrow$ Stock restoration upon order cancellation.
- **Payment Abstraction**: Modular `PaymentService` interface with mock payment processing.

---

## 📁 2. File & Directory Structure (What Each Component Does)

```text
com.example.ecommerce
├── config
│   ├── SecurityConfig.java         → Configures Spring Security, JWT filters, BCrypt encoder, CORS rules, and URL permissions.
│   └── DataInitializer.java        → Seeds default Admin, Customer, Categories, and Products on startup.
│
├── controller                      → REST API Endpoints layer (Handles HTTP Requests/Responses)
│   ├── AuthController.java         → Handles user Registration (/api/auth/register) and Login (/api/auth/login).
│   ├── ProductController.java      → Handles Product browsing, searching, and admin management (/api/products).
│   ├── CategoryController.java     → Handles Category CRUD (/api/categories).
│   ├── CartController.java         → Handles Shopping Cart operations (/api/cart).
│   ├── OrderController.java        → Handles Customer order placement & Admin order status updates (/api/orders).
│   ├── PaymentController.java      → Handles mock payment processing (/api/payments/process).
│   └── UserController.java         → Handles authenticated user profile fetching (/api/users/profile).
│
├── dto                             → Data Transfer Objects (Decouples API payloads from Database Entities)
│   ├── ApiResponse.java            → Generic API response wrapper (success, message, data, timestamp).
│   ├── ErrorResponse.java          → Standardized JSON error response payload for global exception handling.
│   ├── PagedResponse.java          → Generic pagination response wrapper (pageNo, pageSize, totalElements, totalPages).
│   ├── ProductDto.java             → Product API request/response payload with Jakarta validation constraints.
│   ├── CategoryDto.java            → Category API payload with name & description validation.
│   ├── CartDto.java & CartItemDto  → Shopping cart representation payload.
│   ├── OrderDto.java & OrderItemDto→ Order representation payload.
│   ├── RegisterDto.java & LoginDto → Authentication payloads.
│   └── PaymentRequestDto / Response→ Payment processing payloads.
│
├── entity                          → Database Domain Models (Mapped to SQL Tables via JPA)
│   ├── User.java                   → Mapped to 'users' table (id, name, email, password, phone, role).
│   ├── Role.java (Enum)            → User roles: ROLE_CUSTOMER, ROLE_ADMIN.
│   ├── Product.java                → Mapped to 'products' table (id, name, description, price, quantity, category).
│   ├── Category.java               → Mapped to 'categories' table (id, name, description).
│   ├── Cart.java & CartItem.java   → Mapped to 'carts' and 'cart_items' tables.
│   ├── Order.java & OrderItem.java → Mapped to 'orders' and 'order_items' tables.
│   └── OrderStatus.java (Enum)     → PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED.
│
├── repository                      → Data Access Layer (Spring Data JPA)
│   ├── UserRepository.java         → Queries users table (findByEmail, existsByEmail).
│   ├── ProductRepository.java      → Extends JpaRepository and JpaSpecificationExecutor for dynamic filtering.
│   ├── ProductSpecification.java   → Dynamic JPA Criteria API specification for keyword search, category, and price range filters.
│   ├── CategoryRepository.java     → Queries categories table.
│   ├── CartRepository.java         → Queries user carts table.
│   └── OrderRepository.java        → Queries user orders table.
│
├── service                         → Core Business Logic Layer
│   ├── AuthService.java & Impl     → Handles registration, password encoding, and JWT authentication token generation.
│   ├── ProductService.java & Impl  → Business logic for products, pagination, search, and stock updates.
│   ├── CategoryService.java & Impl → Business logic for categories.
│   ├── CartService.java & Impl     → Business logic for cart operations and stock availability validation.
│   ├── OrderService.java & Impl    → Transactional checkout pipeline and order status management.
│   └── PaymentService.java & Impl  → Abstracted payment processing service.
│
├── exception                       → Global Exception Handling
│   ├── GlobalExceptionHandler.java → @RestControllerAdvice handling domain & validation exceptions cleanly.
│   ├── ResourceNotFoundException.java → Thrown when an entity ID or record is not found (HTTP 404).
│   ├── BadRequestException.java    → Thrown for invalid requests or duplicate records (HTTP 400).
│   └── InsufficientStockException.java → Thrown when requested order quantity exceeds stock (HTTP 400).
│
└── security                        → JWT Token & Filter Mechanics
    ├── JwtTokenProvider.java       → Generates, parses, and validates JJWT 0.12.6 tokens.
    ├── JwtAuthenticationFilter.java→ OncePerRequestFilter parsing 'Authorization: Bearer <token>' header per HTTP request.
    ├── JwtAuthenticationEntryPoint.java → Returns HTTP 401 Unauthorized for unauthenticated requests.
    └── CustomUserDetailsService.java   → Loads user details and roles from database for Spring Security authentication.
```

---

## 🔄 3. End-to-End Request/Response Architecture & Data Flow

When a customer performs an action on the website (e.g. clicking **"Place Order"**):

```text
[ Browser (JavaScript Fetch API) ]
       │  (HTTP POST /api/orders with JWT Bearer Token in Header)
       ▼
[ JwtAuthenticationFilter ]
       │  (Verifies JWT token validity & sets SecurityContext Authentication)
       ▼
[ OrderController.java ]
       │  (Validates @Valid CreateOrderDto payload & delegates to OrderService)
       ▼
[ OrderServiceImpl.java (@Transactional) ]
       │  ├── 1. Fetches User & Cart from database
       │  ├── 2. Checks if Cart is empty or if requested quantity > Product Stock
       │  ├── 3. Creates Order and OrderItem entities
       │  ├── 4. Reduces Product stock in DB (product.setQuantity(product.getQuantity() - orderQty))
       │  └── 5. Clears User's Shopping Cart
       ▼
[ OrderRepository.java (Spring Data JPA) ]
       │  (Executes SQL INSERT and UPDATE statements into MySQL / H2)
       ▼
[ GlobalExceptionHandler.java (if error occurs) ] / [ ApiResponse<OrderDto> ]
       │  (Returns standardized HTTP 201 Created JSON response)
       ▼
[ Browser (app.js) ]
       │  (Updates UI, displays toast notification, and redirects to My Orders view)
```

---

## 🛠️ 4. Technology Stack Breakdown (What, Why & Benefits)

### 1. **Java 21**
- **What it is**: The core programming language used to build the backend logic.
- **Why we used it**: Java is enterprise-grade, strongly typed, highly performant, and reliable.
- **Key Benefit**: High performance, type safety, and modern Java features.

### 2. **Spring Boot (v3.3.3)**
- **What it is**: The primary web framework for building Java microservices and web applications.
- **Why we used it**: Eliminates complex XML configuration, provides auto-configuration, and includes an embedded Tomcat application server.
- **Key Benefit**: Speeds up development and allows instant execution (`mvnw spring-boot:run`).

### 3. **Spring Data JPA & Hibernate**
- **What it is**: Object-Relational Mapping (ORM) framework.
- **Why we used it**: Maps Java Entities directly to database tables, avoiding raw SQL queries.
- **Key Benefit**: High developer productivity with built-in methods like `save()`, `findById()`, `findAll()`, and `delete()`.

### 4. **Spring Security & JJWT (v0.12.6)**
- **What it is**: Security authentication & role-based authorization framework.
- **Why we used it**: Secures API routes and manages role permissions (`ROLE_CUSTOMER` vs. `ROLE_ADMIN`).
- **Key Benefit**: **Stateless JWT Authentication** — the server does not need to store session memory; tokens are securely validated per request.

### 5. **BCrypt Password Encoder**
- **What it is**: Key derivation password hashing algorithm.
- **Why we used it**: Encrypts user passwords before storing them in the database.
- **Key Benefit**: Prevents plain-text password leakage even if database storage is compromised.

### 6. **MySQL & H2 Databases**
- **What it is**: Relational Database Management Systems.
- **Why we used it**: H2 provides fast in-memory storage for development without local setup overhead, while MySQL provides production-grade database persistence.
- **Key Benefit**: Structured relational data storage with foreign keys and ACID transaction guarantees.

### 7. **HTML5, CSS3 & Vanilla JavaScript (Fetch API)**
- **What it is**: Frontend web presentation technologies.
- **Why we used it**: Builds a single-page application (SPA) UI communicating with backend REST endpoints asynchronously.
- **Key Benefit**: Instant UI updates without full page reloads.

---

## 📊 5. Key REST API Cheat Sheet

| HTTP Method | API Endpoint | Description | Access Permission |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | Public |
| `GET` | `/api/products` | Browse products (search, filter, page, sort) | Public |
| `GET` | `/api/products/{id}` | Get product details | Public |
| `POST` | `/api/products` | Create new product | Admin Only |
| `PUT` | `/api/products/{id}` | Update product details | Admin Only |
| `DELETE` | `/api/products/{id}` | Delete product | Admin Only |
| `GET` | `/api/categories` | Get all categories | Public |
| `POST` | `/api/categories` | Create category | Admin Only |
| `GET` | `/api/cart` | View current user's cart | Authenticated User |
| `POST` | `/api/cart/items` | Add product to cart | Authenticated User |
| `PUT` | `/api/cart/items/{id}` | Update item quantity | Authenticated User |
| `DELETE` | `/api/cart/items/{id}` | Remove item from cart | Authenticated User |
| `POST` | `/api/orders` | Place order from cart | Authenticated User |
| `GET` | `/api/orders` | View user's orders | Authenticated User |
| `POST` | `/api/orders/{id}/cancel` | Cancel order & restore stock | Authenticated User |
| `GET` | `/api/admin/orders` | View all system orders | Admin Only |
| `PUT` | `/api/admin/orders/{id}/status` | Update order status | Admin Only |

---

## 🎯 6. Common Interview Questions & Sample Answers

### Q1: *"Can you explain the architecture of your project?"*
> **Sample Answer**:
> *"My project follows a standard 3-tier Layered Architecture consisting of Controller, Service, and Repository layers. The Controller layer exposes REST API endpoints, the Service layer contains business rules and transaction boundaries, and the Repository layer uses Spring Data JPA to communicate with the relational database. I also used the DTO pattern to decouple API request/response payloads from database domain entities."*

### Q2: *"How does authentication and authorization work in your app?"*
> **Sample Answer**:
> *"I implemented stateless authentication using Spring Security and JWT. When a user logs in via `/api/auth/login`, `AuthService` verifies credentials using BCrypt and `JwtTokenProvider` generates a signed JWT token. For subsequent requests, `JwtAuthenticationFilter` intercepts the request, extracts the Bearer token, validates it, and sets the user's authentication and roles (`ROLE_CUSTOMER` or `ROLE_ADMIN`) in the `SecurityContext`."*

### Q3: *"How do you handle stock validation and transaction safety during checkout?"*
> **Sample Answer**:
> *"Order placement inside `OrderServiceImpl` is marked `@Transactional`. Before creating an order, the system checks whether the requested quantity for each cart item exceeds available product inventory. If stock is insufficient, an `InsufficientStockException` is thrown and the transaction rolls back. Upon successful order placement, stock is reduced in real-time, and if an eligible order is cancelled, inventory is automatically restored."*

### Q4: *"Why did you use DTOs instead of returning Database Entities directly?"*
> **Sample Answer**:
> *"Using DTOs prevents over-fetching or exposing sensitive internal fields like password hashes. It also prevents circular JSON serialization issues in `@OneToMany` and `@ManyToOne` relationships, and allows applying Jakarta Bean Validation annotations directly on input payloads."*
