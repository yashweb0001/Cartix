const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Serve Static Frontend Files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection (Apne URI ke hisab se adjust kar sakte hain)
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
    ondcStatus: { type: String, default: 'Offline' }     // Live on ONDC Network / Offline
});

const Product = mongoose.model('Product', productSchema);

// In-Memory Live Orders Storage
let ordersList = [];

/* ==================== PRODUCT APIs ==================== */

// Fetch All Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
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

// Cycle Stock Status (IN_STOCK -> LOW_STOCK -> OUT_OF_STOCK)
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

// Toggle ONDC Status
app.put('/api/products/ondc/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        product.ondcStatus = product.ondcStatus === 'Live on ONDC Network'
            ? 'Offline'
            : 'Live on ONDC Network';

        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear All Products
app.delete('/api/products/clear-all', async (req, res) => {
    try {
        await Product.deleteMany({});
        res.json({ message: 'All listed items cleared successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== ORDER APIs ==================== */

// Place Order (Customer Side)
app.post('/api/orders/place', (req, res) => {
    try {
        const { customerName, phone, address, items, totalAmount, storeName } = req.body;

        const newOrder = {
            orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            customerName,
            phone,
            address,
            items,
            totalAmount,
            storeName: storeName || 'Gorakhpur Central Kirana',
            status: 'PENDING',
            createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        ordersList.unshift(newOrder); // Add to top of list
        res.json({ success: true, order: newOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch All Orders (Retailer Side)
app.get('/api/orders', (req, res) => {
    res.json(ordersList);
});

// Update Order Status (Retailer Side)
app.put('/api/orders/status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = ordersList.find(o => o.orderId === id);
    if (order) {
        order.status = status;
        res.json({ success: true, order });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

/* ==================== PAGE ROUTES ==================== */

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ✅ Alternative Clean Fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});