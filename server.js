const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection - Force local connection for development
const MONGODB_URI = 'mongodb://localhost:27017/fashionstop';

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB connected successfully');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.error('❌ Server cannot start without MongoDB connection');
        process.exit(1);
    }
};

// Initialize database connection
connectDB();

// Middleware
app.use(cors({
    origin: true, // Allow all origins for simplicity in production
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// MongoDB Schemas (only used when database is available)
const productSchema = new mongoose.Schema({
    id: { type: String, unique: true, default: () => nanoid() },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    image: { type: String, required: true },
    category: { type: String, default: 'shoes' },
    badge: { type: String, default: '' },
    description: { type: String, default: '' },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, default: () => 'ORD-' + nanoid(8) },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    items: [{
        productId: String,
        name: String,
        brand: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
    paymentMethod: { type: String, default: 'cod' },
    createdAt: { type: Date, default: Date.now }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Admin = mongoose.model('Admin', adminSchema);

// Initialize default admin user
const initializeAdmin = async () => {
    try {
        const adminUsername = process.env.ADMIN_USERNAME || 'sujal';
        const adminPassword = process.env.ADMIN_PASSWORD || 'pass123';
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log(`Default admin already exists: ${adminUsername}/${adminPassword}`);
            return;
        }
        
        // Create the new admin user
        const defaultAdmin = new Admin({
            username: adminUsername,
            password: adminPassword
        });
        await defaultAdmin.save();
        console.log(`Default admin user created: ${adminUsername}/${adminPassword}`);
    } catch (error) {
        console.error('Error initializing admin:', error.message);
        throw error;
    }
};

// Initialize default products
const initializeProducts = async () => {
    try {
        // Check if products already exist
        const existingProducts = await Product.countDocuments();
        if (existingProducts > 0) {
            console.log(`${existingProducts} products already exist in database`);
            return;
        }
        
        const defaultProducts = [
            {
                name: 'Air Max 270',
                brand: 'Nike',
                price: 1999,
                originalPrice: 8999,
                image: 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/skwgyqrbfzhu6uyeh0gg/air-max-270-mens-shoes-KkLcGR.png',
                badge: 'BESTSELLER',
                description: 'Premium Nike Air Max 270 with maximum comfort and style',
                sizes: ['7', '8', '9', '10', '11'],
                colors: ['Black', 'White', 'Blue'],
                featured: true
            },
            {
                name: 'Air Force 1',
                brand: 'Nike',
                price: 1999,
                originalPrice: 7999,
                image: 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-force-1-07-mens-shoes-jBrhbr.png',
                badge: 'NEW',
                description: 'Classic Nike Air Force 1 - timeless design',
                sizes: ['7', '8', '9', '10', '11'],
                colors: ['White', 'Black'],
                featured: true
            },
            {
                name: 'Ultraboost 22',
                brand: 'Adidas',
                price: 2499,
                originalPrice: 9999,
                image: 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg',
                badge: 'HOT',
                description: 'Adidas Ultraboost 22 - Ultimate energy return',
                sizes: ['7', '8', '9', '10', '11'],
                colors: ['Black', 'White', 'Blue'],
                featured: true
            },
            {
                name: 'Suede Classic',
                brand: 'Puma',
                price: 1799,
                originalPrice: 6999,
                image: 'https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_2000,h_2000/global/374915/25/sv01/fnd/IND/fmt/png/Suede-Classic-XXI-Sneakers',
                badge: 'CLASSIC',
                description: 'Puma Suede Classic - Timeless street style',
                sizes: ['7', '8', '9', '10', '11'],
                colors: ['Red', 'Blue', 'Black'],
                featured: false
            }
        ];

        await Product.insertMany(defaultProducts);
        console.log(`${defaultProducts.length} default products initialized`);
    } catch (error) {
        console.error('Error initializing products:', error.message);
        throw error;
    }
};

// API Routes

// Admin Authentication
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username, password });
        
        if (admin) {
            res.json({ success: true, message: 'Login successful', admin: { username: admin.username, role: admin.role } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Product Routes
app.get('/api/products', async (req, res) => {
    try {
        const { brand, featured, category } = req.query;
        let filter = {};
        
        if (brand) filter.brand = new RegExp(brand, 'i');
        if (featured) filter.featured = featured === 'true';
        if (category) filter.category = category;
        
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const productData = req.body;
        const product = new Product(productData);
        await product.save();
        res.json({ success: true, message: 'Product added successfully', product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding product', error: error.message });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        if (global.demoMode) {
            // In demo mode, simulate successful product update
            const mockProduct = {
                id: req.params.id,
                ...req.body,
                updatedAt: new Date()
            };
            res.json({ success: true, message: 'Product updated successfully (Demo Mode)', product: mockProduct });
            return;
        }
        const product = await Product.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        
        if (product) {
            res.json({ success: true, message: 'Product updated successfully', product });
        } else {
            res.status(404).json({ success: false, message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        if (global.demoMode) {
            // In demo mode, simulate successful product deletion
            res.json({ success: true, message: 'Product deleted successfully (Demo Mode)' });
            return;
        }
        
        console.log('Attempting to delete product with ID:', req.params.id);
        
        // First try to find the product to see what we're working with
        let product = await Product.findOne({ id: req.params.id });
        if (!product) {
            product = await Product.findById(req.params.id);
        }
        
        if (!product) {
            console.log('Product not found with ID:', req.params.id);
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        console.log('Found product to delete:', product.name, 'with ID:', product.id || product._id);
        
        // Now delete using the same method we found it with
        let deletedProduct;
        if (product.id) {
            deletedProduct = await Product.findOneAndDelete({ id: req.params.id });
        } else {
            deletedProduct = await Product.findByIdAndDelete(req.params.id);
        }
        
        if (deletedProduct) {
            console.log('Product deleted successfully:', deletedProduct.name);
            res.json({ success: true, message: 'Product deleted successfully' });
        } else {
            console.log('Failed to delete product');
            res.status(500).json({ success: false, message: 'Failed to delete product' });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
    }
});

// Order Routes
app.post('/api/orders', async (req, res) => {
    try {
        if (global.demoMode) {
            // Use file storage in demo mode
            const orders = readJsonFile(ORDERS_FILE);
            const newOrder = {
                orderId: 'ORD-' + nanoid(8),
                customerName: req.body.customerName,
                email: req.body.email,
                phone: req.body.phone,
                address: req.body.address,
                city: req.body.city,
                pincode: req.body.pincode,
                items: req.body.items,
                totalAmount: req.body.total,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date().toISOString()
            };
            orders.push(newOrder);
            writeJsonFile(ORDERS_FILE, orders);
            
            const responseOrder = {
                id: newOrder.orderId,
                customerName: newOrder.customerName,
                email: newOrder.email,
                phone: newOrder.phone,
                address: newOrder.address,
                city: newOrder.city,
                pincode: newOrder.pincode,
                items: newOrder.items,
                total: newOrder.totalAmount
            };
            
            res.json({ success: true, message: 'Order placed successfully (Demo Mode)', order: responseOrder });
            return;
        }
        
        const orderData = {
            customerName: req.body.customerName,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            pincode: req.body.pincode,
            items: req.body.items,
            totalAmount: req.body.total
        };
        
        const order = new Order(orderData);
        await order.save();
        
        // Return order with the generated orderId
        const responseOrder = {
            id: order.orderId,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            address: order.address,
            city: order.city,
            pincode: order.pincode,
            items: order.items,
            total: order.totalAmount
        };
        
        res.json({ success: true, message: 'Order placed successfully', order: responseOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error placing order', error: error.message });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        if (global.demoMode) {
            // Use file storage in demo mode
            const orders = readJsonFile(ORDERS_FILE);
            const formattedOrders = orders.map(order => ({
                id: order.orderId,
                customerName: order.customerName,
                email: order.email,
                phone: order.phone,
                address: order.address,
                city: order.city,
                pincode: order.pincode,
                total: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt,
                items: order.items
            })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
            
            res.json({ success: true, orders: formattedOrders });
            return;
        }
        
        const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
        const formattedOrders = orders.map(order => ({
            id: order.orderId,
            customerName: order.customerName,
            email: order.email,
            phone: order.phone,
            address: order.address,
            city: order.city,
            pincode: order.pincode,
            total: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            items: order.items
        }));
        res.json({ success: true, orders: formattedOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
    }
});

app.put('/api/admin/orders/:orderId', async (req, res) => {
    try {
        if (global.demoMode) {
            // In demo mode, simulate successful order status update
            const mockOrder = {
                id: req.params.orderId,
                status: req.body.status,
                updatedAt: new Date()
            };
            res.json({ success: true, message: 'Order status updated successfully (Demo Mode)', order: mockOrder });
            return;
        }
        
        const { status } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            { status },
            { new: true }
        );
        
        if (order) {
            res.json({ success: true, message: 'Order status updated successfully', order });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        if (global.demoMode) {
            // Demo mode stats
            res.json({
                success: true,
                stats: {
                    totalProducts: 2,
                    totalOrders: 1,
                    pendingOrders: 1,
                    totalRevenue: 1999
                }
            });
            return;
        }
        
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalProducts,
                totalOrders,
                pendingOrders,
                totalRevenue: totalRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
    }
});

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Add API status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'OK', 
        demoMode: global.demoMode || false,
        timestamp: new Date().toISOString() 
    });
});

// Start server and initialize data
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
    console.log(`Admin Login: sujal/pass123`);
    
    // Initialize database data
    try {
        await initializeAdmin();
        await initializeProducts();
    } catch (error) {
        console.error('Failed to initialize database:', error.message);
        process.exit(1);
    }
});
