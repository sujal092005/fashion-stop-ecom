// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isAdminLoggedIn = false;
let currentAdmin = null;
let demoProducts = []; // Store demo mode products locally

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadProducts();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Close modal events
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Product form submission
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addProduct();
        });
    }

    // Checkout form submission
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }

    // Admin navigation
    document.querySelectorAll('.admin-nav button').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showAdminSection(section);
            
            // Update active button
            document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            // Combine server products with demo products
            const allProducts = [...data.products, ...demoProducts];
            displayProducts(allProducts);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // If server fails, show demo products only
        if (demoProducts.length > 0) {
            displayProducts(demoProducts);
        }
    }
}

// Display products in the UI
function displayProducts(products) {
    const newArrivalsContainer = document.getElementById('new-arrivals-products');
    
    // Clear new arrivals and mark existing dynamic products for removal
    if (newArrivalsContainer) newArrivalsContainer.innerHTML = '';
    
    // Remove previously added dynamic products (marked with data-dynamic attribute)
    document.querySelectorAll('.product-card[data-dynamic="true"]').forEach(card => {
        card.remove();
    });
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productCard.setAttribute('data-dynamic', 'true'); // Mark as dynamic product
        
        // Add to new arrivals if featured
        if (product.featured && newArrivalsContainer) {
            const newArrivalCard = productCard.cloneNode(true);
            newArrivalCard.setAttribute('data-dynamic', 'true');
            newArrivalsContainer.appendChild(newArrivalCard);
        }
        
        // Add to appropriate brand section
        const brandLower = product.brand.toLowerCase();
        
        // Find existing brand containers by checking section titles
        let brandContainer = null;
        const brandSections = document.querySelectorAll('.brand-section');
        
        for (let section of brandSections) {
            const titleElement = section.querySelector('.brand-title');
            if (titleElement) {
                const sectionBrand = titleElement.textContent.toLowerCase();
                if (sectionBrand.includes(brandLower) || 
                    (brandLower === 'nike' && sectionBrand.includes('nike')) ||
                    (brandLower === 'adidas' && sectionBrand.includes('adidas')) ||
                    (brandLower === 'puma' && sectionBrand.includes('puma'))) {
                    brandContainer = section.querySelector('.products');
                    break;
                }
            }
        }
        
        // If no existing brand container found, create new brand section
        if (!brandContainer) {
            let brandSection = document.getElementById(`${brandLower}-section`);
            if (!brandSection) {
                const brandLogos = {
                    'reebok': 'https://logos-world.net/wp-content/uploads/2020/04/Reebok-Logo.png',
                    'converse': 'https://logos-world.net/wp-content/uploads/2020/04/Converse-Logo.png'
                };
                const logoUrl = brandLogos[brandLower] || 'https://via.placeholder.com/100x50?text=' + product.brand;
                brandSection = createBrandSection(product.brand, logoUrl);
                const productsContainer = document.querySelector('#products');
                if (productsContainer) {
                    productsContainer.appendChild(brandSection);
                }
            }
            brandContainer = brandSection ? brandSection.querySelector('.products') : null;
        }
        
        // Append to brand container (don't replace existing products)
        if (brandContainer) {
            brandContainer.appendChild(productCard);
        }
    });
}

// Create brand section
function createBrandSection(brandName, logoUrl) {
    const section = document.createElement('section');
    section.className = 'brand-section';
    section.id = `${brandName.toLowerCase()}-section`;
    
    section.innerHTML = `
        <div class="brand-header">
            <img src="${logoUrl}" alt="${brandName}" class="brand-logo">
            <h2 class="brand-title">${brandName} Collection</h2>
        </div>
        <div class="products"></div>
    `;
    
    return section;
}

// Place Order Function - moved here for proper scope
async function placeOrder() {
    console.log('placeOrder function called');
    
    const form = document.getElementById('checkoutForm');
    if (!form) {
        showNotification('Checkout form not found', 'error');
        return;
    }
    
    // Check if cart is empty
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    const formData = new FormData(form);
    
    // Validate required fields
    const requiredFields = ['customerName', 'email', 'phone', 'address', 'city', 'pincode'];
    const missingFields = [];
    
    for (const field of requiredFields) {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            missingFields.push(field);
        }
    }
    
    if (missingFields.length > 0) {
        showNotification(`Please fill in all required fields: ${missingFields.join(', ')}`, 'error');
        return;
    }
    
    const orderData = {
        customerName: formData.get('customerName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        address: formData.get('address').trim(),
        city: formData.get('city').trim(),
        pincode: formData.get('pincode').trim(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    console.log('Order data:', orderData);
    
    try {
        showNotification('Placing order...', 'info');
        
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            // Clear cart
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            
            // Show confirmation
            document.getElementById('checkoutModal').style.display = 'none';
            showOrderConfirmation(data.order);
            showNotification('Order placed successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to place order', 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Error placing order: ' + error.message, 'error');
    }
}

// Make placeOrder globally accessible
window.placeOrder = placeOrder;

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const productId = product.id || product._id;
    const safeName = product.name.replace(/'/g, "\\'");
    const safeBrand = product.brand.replace(/'/g, "\\'");
    const safeImage = product.image.replace(/'/g, "\\'");
    
    card.innerHTML = `
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
            <span class="brand-tag">${product.brand.toUpperCase()}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">₹${product.price} ${product.originalPrice ? `<span>₹${product.originalPrice}</span>` : ''}</p>
            <button class="add-to-cart" onclick="window.addToCart('${productId}', '${safeName}', ${product.price}, '${safeImage}', '${safeBrand}')">
                <i class="fas fa-shopping-cart"></i> ADD TO CART
            </button>
        </div>
    `;
    
    return card;
}

// Cart functions
window.addToCart = function(productId, name, price, image, brand) {
    console.log('Adding to cart:', { productId, name, price, image, brand });
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId,
            name,
            price: parseFloat(price),
            image,
            brand,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
    
    // Show success message
    showNotification(`${name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = totalItems;
        }
    });
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; padding: 30px 0;">Your cart is empty</p>';
        if (cartTotalElement) cartTotalElement.textContent = '0.00';
        return;
    }
    
    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-brand">${item.brand}</div>
                        <div class="cart-item-price">₹${item.price}</div>
                    </div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
                </div>
                <i class="fas fa-trash remove-item" onclick="removeFromCart('${item.productId}')"></i>
            </div>
        `;
    }).join('');
    
    if (cartTotalElement) cartTotalElement.textContent = total.toFixed(2);
}

function openCartModal() {
    updateCartDisplay();
    document.getElementById('cartModal').style.display = 'flex';
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    document.getElementById('cartModal').style.display = 'none';
    document.getElementById('checkoutModal').style.display = 'flex';
    
    // Update order summary
    const orderSummary = document.getElementById('orderSummary');
    if (orderSummary) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        orderSummary.innerHTML = `
            <h4>Order Summary</h4>
            ${cart.map(item => `
                <div style="display: flex; justify-content: space-between;">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <hr>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>Total:</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
        `;
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openAdminLogin() {
    document.getElementById('adminLoginModal').style.display = 'flex';
}

// Admin functions
async function adminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isAdminLoggedIn = true;
            currentAdmin = data.admin;
            document.getElementById('adminLoginModal').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            loadAdminDashboard();
            showNotification('Admin login successful!', 'success');
        } else {
            showNotification(data.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    currentAdmin = null;
    document.getElementById('adminPanel').style.display = 'none';
    showNotification('Logged out successfully!', 'success');
}

function showAdminSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`admin-${section}`).classList.add('active');
    
    if (section === 'dashboard') {
        loadAdminStats();
    } else if (section === 'products') {
        loadAdminProducts();
    } else if (section === 'orders') {
        loadAdminOrders();
    }
}

async function loadAdminDashboard() {
    showAdminSection('dashboard');
    document.querySelector('[data-section="dashboard"]').classList.add('active');
    await loadAdminStats();
}

async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            document.getElementById('totalProducts').textContent = stats.totalProducts;
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('pendingOrders').textContent = stats.pendingOrders;
            document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue}`;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        if (data.success) {
            // Combine server products with demo products
            const allProducts = [...data.products, ...demoProducts];
            displayAdminProducts(allProducts);
        }
    } catch (error) {
        console.error('Error loading admin products:', error);
        // If server fails, show demo products only
        if (demoProducts.length > 0) {
            displayAdminProducts(demoProducts);
        }
    }
}

function displayAdminProducts(products) {
    const container = document.getElementById('adminProductsList');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 20px;">No products found. Add some products to get started!</p>';
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    products.forEach(product => {
        const productId = product.id || product._id;
        
        // Create product card element
        const productCard = document.createElement('div');
        productCard.className = 'admin-product-card';
        
        // Create product HTML
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="admin-product-image">
            <div style="padding: 15px;">
                <h4 style="margin: 0 0 10px 0; color: white;">${product.brand} ${product.name}</h4>
                <p style="margin: 5px 0; color: #ccc;">Price: ₹${product.price} ${product.originalPrice ? `(Was: ₹${product.originalPrice})` : ''}</p>
                ${product.badge ? `<span style="background: var(--neon); color: var(--primary); padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold;">${product.badge}</span>` : ''}
                <div class="admin-product-actions">
                    <button onclick="handleDelete('${productId}')" class="admin-btn delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(productCard);
    });
}

// Global delete handler function
window.handleDelete = function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    // Check if it's a demo product first
    const demoProductIndex = demoProducts.findIndex(p => p.id === productId);
    if (demoProductIndex !== -1) {
        // Remove from demo products array
        demoProducts.splice(demoProductIndex, 1);
        showNotification('Product deleted successfully!', 'success');
        loadAdminProducts();
        loadProducts();
        return;
    }
    
    // Otherwise, delete from server
    fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Product deleted successfully!', 'success');
            loadAdminProducts();
            loadProducts();
        } else {
            showNotification('Failed to delete: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        showNotification('Error deleting product: ' + error.message, 'error');
    });
}

async function addProduct() {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);
    
    const productData = {
        name: formData.get('name'),
        brand: formData.get('brand'),
        price: parseInt(formData.get('price')),
        originalPrice: formData.get('originalPrice') ? parseInt(formData.get('originalPrice')) : null,
        image: formData.get('image'),
        category: formData.get('category') || 'shoes',
        badge: formData.get('badge') || '',
        featured: formData.get('featured') === 'on'
    };
    
    console.log('Adding product:', productData);
    
    try {
        const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        console.log('Add product response:', data);
        
        if (data.success) {
            showNotification('Product added successfully!', 'success');
            document.getElementById('productForm').reset();
            
            // Check if we're in demo mode by looking at the response message
            const isDemoMode = data.message && data.message.includes('Demo Mode');
            
            if (isDemoMode && data.product) {
                // In demo mode, manually add the product to the frontend
                console.log('Demo mode detected, adding product to frontend:', data.product);
                
                // Add to demo products array
                demoProducts.push(data.product);
                
                // Add the product to the display immediately
                const products = [data.product];
                displayProducts(products);
                
                // Also update admin products list with demo products
                displayAdminProducts(demoProducts);
            } else {
                // Normal mode - refresh from server
                loadAdminProducts();
                loadProducts();
            }
        } else {
            showNotification('Error: ' + (data.message || 'Failed to add product'), 'error');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product', 'error');
    }
}

// Remove duplicate delete function - using handleDelete instead

async function loadAdminOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        const data = await response.json();
        
        if (data.success) {
            displayAdminOrders(data.orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayAdminOrders(orders) {
    const container = document.getElementById('adminOrdersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h4>Order #${order.id}</h4>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Total:</strong> ₹${order.total}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
    `).join('');
}

function showOrderConfirmation(order) {
    document.getElementById('orderIdDisplay').textContent = order.id;
    document.getElementById('orderTotalDisplay').textContent = `₹${order.total}`;
    document.getElementById('confirmationModal').style.display = 'flex';
    
    // Automatically open WhatsApp with order details
    sendOrderToWhatsApp(order);
}

function sendOrderToWhatsApp(order) {
    const adminNumber = "8830440336";
    
    // Create order details message
    let message = `🛍️ *New Order Received*\n\n`;
    message += `📋 *Order ID:* ${order.id}\n`;
    message += `👤 *Customer:* ${order.customerName}\n`;
    message += `📧 *Email:* ${order.email}\n`;
    message += `📱 *Phone:* ${order.phone}\n`;
    message += `📍 *Address:* ${order.address}`;
    if (order.city) message += `, ${order.city}`;
    if (order.pincode) message += ` - ${order.pincode}`;
    message += `\n\n🛒 *Items Ordered:*\n`;
    
    order.items.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n`;
    });
    
    message += `\n💰 *Total Amount:* ₹${order.total}\n`;
    message += `📅 *Order Date:* ${new Date().toLocaleString()}\n\n`;
    message += `Please process this order. Thank you! 🙏`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/91${adminNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp immediately after order confirmation
    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
    }, 1000);
}

// Utility functions
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// Close modal utility
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Update cart count display
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count, #cart-count');
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = totalItems;
        }
    });
}
