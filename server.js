const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Serve Static Frontend Files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cartix';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 1. Product Schema & Model
const productSchema = new mongoose.Schema({
    title: String,
    price: Number,
    category: String,
    stockStatus: { type: String, default: 'IN_STOCK' }, // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    ondcStatus: { type: String, default: 'Live on ONDC Network' }
});

const Product = mongoose.model('Product', productSchema);

// 2. Order Schema & Model (MongoDB Persistence)
const orderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    phone: String,
    address: String,
    items: Array,
    totalAmount: Number,
    storeName: { type: String, default: 'Gorakhpur Central Kirana' },
    status: { type: String, default: 'PENDING' },
    createdAt: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
});

const Order = mongoose.model('Order', orderSchema);

/* ==================== PRODUCT APIs ==================== */

// Fetch All Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add New Product
app.post('/api/products/add', async (req, res) => {
    try {
        const { title, price, category, stockStatus } = req.body;
        const newProduct = new Product({
            title,
            price,
            category,
            stockStatus: stockStatus || 'IN_STOCK',
            ondcStatus: 'Live on ONDC Network'
        });
        await newProduct.save();
        res.json({ message: 'Product added successfully!', product: newProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Stock Status directly in MongoDB
app.put('/api/products/stock/:id', async (req, res) => {
    try {
        const { stockStatus } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { stockStatus },
            { new: true }
        );
        res.json(updatedProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear All Products from MongoDB
app.delete('/api/products/clear-all', async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ message: 'All listed items cleared successfully from MongoDB!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== ORDER APIs ==================== */

// Place Order (Saved Permanently to MongoDB)
app.post('/api/orders/place', async (req, res) => {
    try {
        const { customerName, phone, address, items, totalAmount, storeName } = req.body;

        const newOrder = new Order({
            orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            customerName,
            phone,
            address,
            items,
            totalAmount,
            storeName: storeName || 'Gorakhpur Central Kirana',
            status: 'PENDING'
        });

        await newOrder.save();
        res.json({ success: true, order: newOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch All Orders from MongoDB
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ _id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status in MongoDB
app.put('/api/orders/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: id },
            { status },
            { new: true }
        );

        if (updatedOrder) {
            res.json({ success: true, order: updatedOrder });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== PAGE ROUTES ==================== */

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});