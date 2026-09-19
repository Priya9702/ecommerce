const API_BASE = '/api';
let jwtToken = localStorage.getItem('token') || null;
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let authMode = 'login'; // 'login' or 'register'
let homeLayoutHtml = '';

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    // Cache original home layout HTML
    homeLayoutHtml = document.getElementById('app-container').innerHTML;
    
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
    toast.style.borderColor = isError ? 'var(--accent-red)' : 'var(--primary)';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
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
        const isAdmin = currentUser.role === 'ROLE_ADMIN';
        container.innerHTML = `
            <span style="color: #38bdf8; font-weight: 700; font-size: 0.9rem;">
                ${isAdmin ? '<i class="fa-solid fa-shield-halved"></i> Admin: ' : 'Hello, '}${currentUser.name}
            </span>
            <a href="#" onclick="handleLogout()" style="margin-left: 1rem; color: #ef4444; font-weight: 600;">Logout</a>
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
        if (select) {
            select.innerHTML = '<option value="">All Categories</option>';
            res.data.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        }
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

// Load Products
async function loadProducts() {
    try {
        const searchInput = document.getElementById('search-input');
        const categorySelect = document.getElementById('category-select');
        const minPriceInput = document.getElementById('min-price-input');
        const maxPriceInput = document.getElementById('max-price-input');
        const sortSelect = document.getElementById('sort-select');

        if (!searchInput || !sortSelect) return;

        const search = searchInput.value;
        const categoryId = categorySelect ? categorySelect.value : '';
        const minPrice = minPriceInput ? minPriceInput.value : '';
        const maxPrice = maxPriceInput ? maxPriceInput.value : '';
        const [sortBy, sortDir] = sortSelect.value.split(':');

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
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #cbd5e1; padding: 4rem; font-size: 1.1rem;">No products found matching criteria.</div>`;
        return;
    }
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-img-wrapper">
                <img src="${p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}" class="product-img" alt="${p.name}">
                <span class="stock-badge" style="background: ${p.quantity > 0 ? (p.quantity <= 5 ? '#f59e0b' : '#10b981') : '#ef4444'}">
                    ${p.quantity > 0 ? (p.quantity <= 5 ? `Only ${p.quantity} left!` : 'In Stock') : 'Out of Stock'}
                </span>
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
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #cbd5e1; padding: 2rem;">Your cart is currently empty.</div>`;
        return;
    }
    container.innerHTML = items.map(item => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid #334155;">
            <div>
                <div style="font-weight: 700; color: #ffffff;">${item.productName}</div>
                <div style="font-size: 0.85rem; color: #cbd5e1;">$${item.price.toFixed(2)} x ${item.quantity} = $${item.subtotal.toFixed(2)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" style="background: #334155; border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">-</button>
                <span style="font-weight: bold; color: #fff; padding: 0 4px;">${item.quantity}</span>
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" style="background: #334155; border: none; color: #fff; width: 26px; height: 26px; border-radius: 4px; cursor: pointer; font-weight: bold;">+</button>
                <button onclick="removeCartItem(${item.id})" style="background: none; border: none; color: #ef4444; margin-left: 0.75rem; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
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

        showToast('🎉 Order placed & mock payment processed successfully!');
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

// Quick Demo Login Helper
async function quickDemoLogin(email, password) {
    document.getElementById('auth-email').value = email;
    document.getElementById('auth-password').value = password;
    const form = document.getElementById('auth-form');
    handleAuthSubmit({ preventDefault: () => {} });
}

async function handleAuthSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    try {
        if (authMode === 'register') {
            const name = document.getElementById('auth-name').value;
            const phone = document.getElementById('auth-phone').value;
            // Auto-assign ROLE_ADMIN if email contains admin
            const role = email.toLowerCase().includes('admin') ? 'ROLE_ADMIN' : 'ROLE_CUSTOMER';
            
            await apiFetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                body: JSON.stringify({ name, email, password, phone, role })
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
        showToast(`Logged in successfully as ${currentUser.name}!`);
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
    switchView('home');
}

// Switch Views (Home / Orders / Admin)
async function switchView(view) {
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    if (document.getElementById(`nav-${view}`)) {
        document.getElementById(`nav-${view}`).classList.add('active');
    }

    const container = document.getElementById('app-container');

    if (view === 'home') {
        // Restore home layout HTML if changed
        if (homeLayoutHtml && container.innerHTML !== homeLayoutHtml) {
            container.innerHTML = homeLayoutHtml;
        }
        loadCategories();
        loadProducts();
    } else if (view === 'orders') {
        if (!jwtToken) {
            openAuthModal('login');
            showToast('Please login to view your orders', true);
            return;
        }
        renderMyOrdersView();
    } else if (view === 'admin') {
        if (!jwtToken || !currentUser || currentUser.role !== 'ROLE_ADMIN') {
            openAuthModal('login');
            showToast('Admin access required. Click "Demo Login as Admin" in the login popup!', true);
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

        let html = `<div style="padding: 2.5rem 6%; max-width: 900px; margin: 0 auto;"><h2 style="margin-bottom: 2rem; font-family: var(--font-heading); color: #ffffff;">My Orders</h2>`;
        if (!orders || orders.length === 0) {
            html += `<div style="color: #cbd5e1; background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155;">You haven't placed any orders yet.</div>`;
        } else {
            html += orders.map(o => `
                <div style="background: #1e293b; border: 2px solid #334155; border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div>
                            <span style="font-weight: 800; font-size: 1.2rem; color: #ffffff;">Order #${o.id}</span>
                            <span style="color: #cbd5e1; font-size: 0.85rem; margin-left: 1rem;">${new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span class="badge-status status-${o.status}">${o.status}</span>
                            ${o.status === 'CONFIRMED' || o.status === 'PENDING' ? `<button onclick="cancelMyOrder(${o.id})" style="background: none; border: 1px solid #ef4444; color: #ef4444; padding: 0.3rem 0.6rem; border-radius: 6px; margin-left: 0.75rem; cursor: pointer; font-weight: 700;">Cancel Order</button>` : ''}
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 0.75rem;"><i class="fa-solid fa-location-dot" style="color: #38bdf8;"></i> Shipping: ${o.shippingAddress}</div>
                    <div style="font-weight: 800; font-size: 1.1rem; color: #38bdf8;">Total Amount: $${o.totalAmount.toFixed(2)}</div>
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
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored.')) return;
    try {
        await apiFetch(`${API_BASE}/orders/${orderId}/cancel`, { method: 'POST' });
        showToast('Order cancelled successfully.');
        renderMyOrdersView();
    } catch (e) {
        showToast(e.message, true);
    }
}

// Render Admin Dashboard View
async function renderAdminDashboardView() {
    try {
        const [ordersRes, categoriesRes] = await Promise.all([
            apiFetch(`${API_BASE}/admin/orders?pageNo=0&pageSize=50`),
            apiFetch(`${API_BASE}/categories`)
        ]);

        const container = document.getElementById('app-container');
        const orders = ordersRes.data.content;
        const categories = categoriesRes.data;

        let html = `
        <div style="padding: 2.5rem 6%; max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="font-family: var(--font-heading); color: #ffffff;"><i class="fa-solid fa-shield-halved" style="color: #818cf8;"></i> Admin Control Center</h2>
                <span style="background: #334155; color: #38bdf8; padding: 0.4rem 1rem; border-radius: 8px; font-weight: 700;">Logged in as: ${currentUser.name}</span>
            </div>

            <!-- Create New Product Section -->
            <div style="background: #1e293b; border: 2px solid #334155; border-radius: 14px; padding: 1.75rem; margin-bottom: 2.5rem;">
                <h3 style="color: #ffffff; margin-bottom: 1.25rem;"><i class="fa-solid fa-plus-circle" style="color: #10b981;"></i> Add New Product</h3>
                <form onsubmit="handleCreateProductAdmin(event)">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <input type="text" id="admin-prod-name" class="control-input" placeholder="Product Title" required>
                        <input type="number" step="0.01" id="admin-prod-price" class="control-input" placeholder="Price ($)" required>
                        <input type="number" id="admin-prod-qty" class="control-input" placeholder="Quantity / Stock" required>
                        <select id="admin-prod-cat" class="control-input" required>
                            <option value="">Select Category</option>
                            ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <input type="text" id="admin-prod-img" class="control-input" placeholder="Image URL (e.g. https://images.unsplash.com/...)" style="width: 100%; margin-bottom: 1rem;">
                    <textarea id="admin-prod-desc" class="control-input" placeholder="Product Description..." style="width: 100%; height: 80px; margin-bottom: 1rem;" required></textarea>
                    <button type="submit" class="btn-primary" style="margin-top: 0; width: auto; padding: 0.75rem 2rem;">Publish Product</button>
                </form>
            </div>

            <!-- Manage Orders Section -->
            <div style="background: #1e293b; border: 2px solid #334155; border-radius: 14px; padding: 1.75rem;">
                <h3 style="color: #ffffff; margin-bottom: 1.25rem;"><i class="fa-solid fa-boxes-stack" style="color: #38bdf8;"></i> System Orders Management</h3>
                ${!orders || orders.length === 0 ? '<div style="color: #cbd5e1;">No system orders placed yet.</div>' : `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; color: #ffffff;">
                            <thead>
                                <tr style="border-bottom: 2px solid #334155; color: #cbd5e1; font-size: 0.9rem;">
                                    <th style="padding: 0.75rem;">Order ID</th>
                                    <th style="padding: 0.75rem;">Customer Email</th>
                                    <th style="padding: 0.75rem;">Date</th>
                                    <th style="padding: 0.75rem;">Total</th>
                                    <th style="padding: 0.75rem;">Status</th>
                                    <th style="padding: 0.75rem;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(o => `
                                    <tr style="border-bottom: 1px solid #334155;">
                                        <td style="padding: 0.75rem; font-weight: 700;">#${o.id}</td>
                                        <td style="padding: 0.75rem; color: #cbd5e1;">${o.userEmail}</td>
                                        <td style="padding: 0.75rem; font-size: 0.85rem; color: #cbd5e1;">${new Date(o.createdAt).toLocaleDateString()}</td>
                                        <td style="padding: 0.75rem; font-weight: 800; color: #38bdf8;">$${o.totalAmount.toFixed(2)}</td>
                                        <td style="padding: 0.75rem;"><span class="badge-status status-${o.status}">${o.status}</span></td>
                                        <td style="padding: 0.75rem;">
                                            <select onchange="updateOrderStatusAdmin(${o.id}, this.value)" style="background: #0f172a; border: 1px solid #475569; color: #fff; padding: 0.4rem; border-radius: 6px;">
                                                <option value="CONFIRMED" ${o.status === 'CONFIRMED' ? 'selected' : ''}>CONFIRMED</option>
                                                <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
                                                <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                                                <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
                                            </select>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
        `;
        container.innerHTML = html;
    } catch (e) {
        showToast(e.message, true);
    }
}

async function handleCreateProductAdmin(e) {
    e.preventDefault();
    const name = document.getElementById('admin-prod-name').value;
    const price = parseFloat(document.getElementById('admin-prod-price').value);
    const quantity = parseInt(document.getElementById('admin-prod-qty').value);
    const categoryId = parseInt(document.getElementById('admin-prod-cat').value);
    const imageUrl = document.getElementById('admin-prod-img').value;
    const description = document.getElementById('admin-prod-desc').value;

    try {
        await apiFetch(`${API_BASE}/products`, {
            method: 'POST',
            body: JSON.stringify({ name, price, quantity, categoryId, imageUrl, description })
        });
        showToast('🎉 Product created successfully!');
        renderAdminDashboardView();
    } catch (err) {
        showToast(err.message, true);
    }
}

async function updateOrderStatusAdmin(orderId, status) {
    try {
        await apiFetch(`${API_BASE}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast(`Order #${orderId} status updated to ${status}`);
        renderAdminDashboardView();
    } catch (e) {
        showToast(e.message, true);
    }
}
