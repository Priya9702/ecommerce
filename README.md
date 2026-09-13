# ShopSphere - Production-Quality Spring Boot E-Commerce Platform

ShopSphere is a full-stack, production-quality E-Commerce Web Application built with **Java 21**, **Spring Boot 3.3.3**, **Spring Data JPA**, **Spring Security (JWT)**, **MySQL**, and a responsive **HTML/CSS/JS** frontend.

---

## Key Features

### 1. Product & Category Management
- Full CRUD REST APIs for Products (`/api/products`) and Categories (`/api/categories`).
- Dynamic searching (keyword search across product name and description).
- Category filtering & price range (`minPrice`, `maxPrice`) filtering using JPA Criteria API (`ProductSpecification`).
- Pagination (`pageNo`, `pageSize`) and multi-field sorting (`sortBy`, `sortDir`).

### 2. User Authentication & Authorization (JWT + BCrypt)
- Role-based authorization (`ROLE_CUSTOMER`, `ROLE_ADMIN`).
- Statless JWT authentication with `io.jsonwebtoken` (JJWT 0.12.6).
- BCrypt password hashing.
- Public browsing for products and categories; restricted administrative routes.

### 3. Shopping Cart & Inventory Control
- Individual shopping cart per user.
- Stock validation preventing ordering more than available inventory.
- Subtotal and grand total auto-calculation.
- Clear cart and item quantity update capabilities.

### 4. Order Management & Stock Control
- Transactional order placement flow: Cart $\rightarrow$ Stock Check $\rightarrow$ Create Order & OrderItems $\rightarrow$ Reduce Inventory $\rightarrow$ Clear Cart.
- Order statuses: `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Automated stock restoration when orders are cancelled.

### 5. Payment Integration Layer
- Abstracted `PaymentService` interface with a `MockPaymentServiceImpl` for safe development and testing.

### 6. Dynamic E-Commerce Frontend
- Glassmorphism dark-mode UI with Vanilla JS Fetch API.
- Instant search, filtering, cart modal, checkout, order history, and admin dashboard.

---

## Tech Stack

* **Backend**: Java 21, Spring Boot 3.3.3, Spring Security, Spring Data JPA, Hibernate, MySQL, JJWT.
* **Frontend**: HTML5, CSS3 (Inter Typography, Flexbox/Grid), Vanilla JavaScript (ES6+).
* **Build Tool**: Apache Maven (`mvnw`).

---

## Database Configuration & Startup Instructions

### 1. Database Setup (`application.properties`)
Create a MySQL database named `shopsphere_db`:
```sql
CREATE DATABASE shopsphere_db;
```
Or use the environment variables in `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/shopsphere_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
```

### 2. Run the Application
In the project directory, run:
```cmd
mvnw.cmd spring-boot:run
```
Access the application at `http://localhost:8080`.

---

## Pre-seeded Test Accounts

The application automatically seeds default accounts on boot via `DataInitializer`:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@shopsphere.com` | `admin123` |
| **Customer** | `user@shopsphere.com` | `user123` |

---

## REST API Specification

### Authentication
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Login & receive JWT Token

### Products
* `GET /api/products` — Browse products (supports `search`, `categoryId`, `minPrice`, `maxPrice`, `pageNo`, `pageSize`, `sortBy`, `sortDir`)
* `GET /api/products/{id}` — Get product details
* `POST /api/products` — Create product (Admin only)
* `PUT /api/products/{id}` — Update product (Admin only)
* `DELETE /api/products/{id}` — Delete product (Admin only)

### Categories
* `GET /api/categories` — Get all categories
* `POST /api/categories` — Create category (Admin only)

### Shopping Cart
* `GET /api/cart` — View current user cart
* `POST /api/cart/items` — Add product to cart
* `PUT /api/cart/items/{itemId}` — Update item quantity
* `DELETE /api/cart/items/{itemId}` — Remove item from cart

### Orders
* `POST /api/orders` — Place order from shopping cart
* `GET /api/orders` — View customer's orders
* `POST /api/orders/{id}/cancel` — Cancel eligible order
* `GET /api/admin/orders` — View all system orders (Admin only)
* `PUT /api/admin/orders/{id}/status` — Update order status (Admin only)

### Payments
* `POST /api/payments/process` — Process mock order payment
