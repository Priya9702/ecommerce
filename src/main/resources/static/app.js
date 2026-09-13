const API_BASE = '/api';
let jwtToken = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let authMode = 'login'; // 'login' or 'register'

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadCategories();
    loadProducts();
    if (jwtToken) {
        fetchCart();
    }
});

// Toast Utility
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.style.borderColor = isError ? 'var(--accent-danger)' : 'var(--primary)';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Fetch Helper with Auth Headers
async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Content-Type'] = 'application/json';
    if (jwtToken) {
        options.headers['Authorization'] = `Bearer ${jwtToken}`;
    }
    const res = await fetch(url, options);
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.message || 'API request failed');
    }
    return json;
}

// Update Nav & Auth UI
function updateAuthUI() {
    const container = document.getElementById('auth-link-container');
    if (currentUser) {
        container.innerHTML = `
            <span style="color: var(--text-muted); font-size: 0.9rem;">Hello, ${currentUser.name}</span>
            <a href="#" onclick="handleLogout()" style="margin-left: 1rem; color: var(--accent-danger);">Logout</a>
        `;
    } else {
        container.innerHTML = `<a href="#" onclick="openAuthModal('login')" id="nav-login">Login</a>`;
    }
}

// Load Categories into Dropdown
async function loadCategories() {
    try {
        const res = await apiFetch(`${API_BASE}/categories`);
        const select = document.getElementById('category-select');
        select.innerHTML = '<option value="">All Categories</option>';
        res.data.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

// Load Products
async function loadProducts() {
    try {
        const search = document.getElementById('search-input').value;
        const categoryId = document.getElementById('category-select').value;
        const minPrice = document.getElementById('min-price-input').value;
        const maxPrice = document.getElementById('max-price-input').value;
        const [sortBy, sortDir] = document.getElementById('sort-select').value.split(':');

        let query = `?pageNo=0&pageSize=20&sortBy=${sortBy}&sortDir=${sortDir}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        if (categoryId) query += `&categoryId=${categoryId}`;
        if (minPrice) query += `&minPrice=${minPrice}`;
        if (maxPrice) query += `&maxPrice=${maxPrice}`;

        const res = await apiFetch(`${API_BASE}/products${query}`);
        renderProductGrid(res.data.content);
    } catch (e) {
        showToast(e.message, true);
    }
}

// Render Products Grid
function renderProductGrid(products) {
    const container = document.getElementById('product-list');
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No products found matching criteria.</div>`;
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img-wrapper">
                <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}" class="product-img" alt="${p.name}">
                <span class="stock-badge" style="background: ${p.quantity > 0 ? (p.quantity <= 5 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)') : 'rgba(244, 63, 94, 0.9)'}">${p.quantity > 0 ? (p.quantity <= 5 ? `Only ${p.quantity} left!` : 'In Stock') : 'Out of Stock'}</span>
            </div>
            <div class="product-info">
                <div class="category-tag">${p.categoryName || 'General'}</div>
                <div class="product-title">${p.name}</div>
                <div class="product-desc">${p.description || 'Premium quality product.'}</div>
                <div class="product-bottom">
                    <span class="price">$${p.price.toFixed(2)}</span>
                    <button class="add-cart-btn" onclick="addToCart(${p.id})"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter Handler
function handleFilter() {
    loadProducts();
}

let searchTimer;
function handleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { loadProducts(); }, 300);
}

// Add to Cart
async function addToCart(productId) {
    if (!jwtToken) {
        openAuthModal('login');
        showToast('Please login to add items to your cart', true);
        return;
    }
    try {
        await apiFetch(`${API_BASE}/cart/items`, {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });
        showToast('Added product to cart!');
        fetchCart();
    } catch (e) {
        showToast(e.message, true);
    }
}

// Fetch & Update Cart
async function fetchCart() {
    if (!jwtToken) return;
    try {
        const res = await apiFetch(`${API_BASE}/cart`);
        const cart = res.data;
        document.getElementById('cart-count').innerText = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        document.getElementById('cart-total-amount').innerText = `$${cart.totalAmount.toFixed(2)}`;
        renderCartItems(cart.items);
    } catch (e) {
        console.error('Error fetching cart', e);
    }
}

function renderCartItems(items) {
    const container = document.getElementById('cart-items-container');
    if (!items || items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Your cart is currently empty.</div>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div>
                <div style="font-weight: 700;">${item.productName}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">$${item.price.toFixed(2)} x ${item.quantity} = $${item.subtotal.toFixed(2)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 24px; height: 24px; border-radius: 4px; cursor: pointer;">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 24px; height: 24px; border-radius: 4px; cursor: pointer;">+</button>
                <button onclick="removeCartItem(${item.id})" style="background: none; border: none; color: var(--accent-danger); margin-left: 0.5rem; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function updateCartQuantity(itemId, newQty) {
    if (newQty < 1) {
        return removeCartItem(itemId);
    }
    try {
        await apiFetch(`${API_BASE}/cart/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQty })
        });
        fetchCart();
    } catch (e) {
        showToast(e.message, true);
    }
}

async function removeCartItem(itemId) {
    try {
        await apiFetch(`${API_BASE}/cart/items/${itemId}`, { method: 'DELETE' });
        fetchCart();
    } catch (e) {
        showToast(e.message, true);
    }
}

// Checkout & Place Order
async function proceedToCheckout() {
    if (!jwtToken) return openAuthModal('login');
    const address = prompt('Please enter your Shipping Address:');
    if (!address) return;

    try {
        const orderRes = await apiFetch(`${API_BASE}/orders`, {
            method: 'POST',
            body: JSON.stringify({ shippingAddress: address })
        });
        
        // Process Mock Payment
        await apiFetch(`${API_BASE}/payments/process`, {
            method: 'POST',
            body: JSON.stringify({
                orderId: orderRes.data.id,
                amount: orderRes.data.totalAmount,
                paymentMethod: 'MOCK'
            })
        });

        showToast('🎉 Order placed and payment processed successfully!');
        closeModal('cart-modal');
        fetchCart();
        switchView('orders');
    } catch (e) {
        showToast(e.message, true);
    }
}

// Auth Handlers
function openAuthModal(mode) {
    authMode = mode;
    document.getElementById('auth-modal-title').innerText = mode === 'login' ? 'User Login' : 'Register Account';
    document.getElementById('register-fields').style.display = mode === 'register' ? 'block' : 'none';
    document.getElementById('auth-submit-btn').innerText = mode === 'login' ? 'Login' : 'Create Account';
    document.getElementById('auth-toggle-text').innerText = mode === 'login' ? "Don't have an account?" : "Already have an account?";
    document.getElementById('auth-toggle-link').innerText = mode === 'login' ? "Register here" : "Login here";
    document.getElementById('auth-modal').style.display = 'flex';
}

function toggleAuthMode() {
    openAuthModal(authMode === 'login' ? 'register' : 'login');
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function openCartModal() {
    if (!jwtToken) {
        openAuthModal('login');
        return;
    }
    fetchCart();
    document.getElementById('cart-modal').style.display = 'flex';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        if (authMode === 'register') {
            const name = document.getElementById('auth-name').value;
            const phone = document.getElementById('auth-phone').value;
            await apiFetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                body: JSON.stringify({ name, email, password, phone, role: 'ROLE_CUSTOMER' })
            });
            showToast('Registration successful! Logging in...');
        }

        const loginRes = await apiFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        jwtToken = loginRes.data.accessToken;
        currentUser = loginRes.data.user;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(currentUser));

        updateAuthUI();
        closeModal('auth-modal');
        showToast(`Welcome back, ${currentUser.name}!`);
        fetchCart();
    } catch (err) {
        showToast(err.message, true);
    }
}

function handleLogout() {
    jwtToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    document.getElementById('cart-count').innerText = '0';
    showToast('Logged out successfully.');
}

// Switch Views (Home / Orders / Admin)
async function switchView(view) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (document.getElementById(`nav-${view}`)) {
        document.getElementById(`nav-${view}`).classList.add('active');
    }

    if (view === 'home') {
        loadProducts();
    } else if (view === 'orders') {
        if (!jwtToken) return openAuthModal('login');
        renderMyOrdersView();
    } else if (view === 'admin') {
        if (!jwtToken || (currentUser && currentUser.role !== 'ROLE_ADMIN')) {
            showToast('Admin access required. Please login with an Admin account.', true);
            return;
        }
        renderAdminDashboardView();
    }
}

// Render Orders View
async function renderMyOrdersView() {
    try {
        const res = await apiFetch(`${API_BASE}/orders`);
        const container = document.getElementById('app-container');
        const orders = res.data;

        let html = `<div style="padding: 2rem 5%;"><h2 style="margin-bottom: 1.5rem;">My Orders</h2>`;
        if (!orders || orders.length === 0) {
            html += `<div style="color: var(--text-muted);">You haven't placed any orders yet.</div>`;
        } else {
            html += orders.map(o => `
                <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <span style="font-weight: 800; font-size: 1.1rem;">Order #${o.id}</span>
                            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 1rem;">${new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span class="badge-status status-${o.status}">${o.status}</span>
                            ${o.status === 'CONFIRMED' || o.status === 'PENDING' ? `<button onclick="cancelMyOrder(${o.id})" style="background: none; border: 1px solid var(--accent-danger); color: var(--accent-danger); padding: 0.25rem 0.5rem; border-radius: 6px; margin-left: 0.5rem; cursor: pointer;">Cancel</button>` : ''}
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Shipping: ${o.shippingAddress}</div>
                    <div style="font-weight: 800; color: var(--primary);">Total: $${o.totalAmount.toFixed(2)}</div>
                </div>
            `).join('');
        }
        html += `</div>`;
        container.innerHTML = html;
    } catch (e) {
        showToast(e.message, true);
    }
}

async function cancelMyOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
        await apiFetch(`${API_BASE}/orders/${orderId}/cancel`, { method: 'POST' });
        showToast('Order cancelled successfully.');
        renderMyOrdersView();
    } catch (e) {
        showToast(e.message, true);
    }
}
