const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();

/* ==================== MIDDLEWARES ==================== */
// Allowed origins: local dev + your Vercel frontend (set FRONTEND_URL in Render env vars)
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    process.env.FRONTEND_URL // e.g. https://cartix-kirana.vercel.app
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (curl, mobile apps, server-to-server, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS: ' + origin));
        }
    }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ==================== MONGODB CONNECTION ==================== */
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kiranaDB';

mongoose.connect(mongoURI)
    .then(() => {
        console.log("✅ MongoDB Connected successfully!");
        seedInitialData();
    })
    .catch(err => console.log("❌ MongoDB Connection Error: ", err));

/* ==================== SCHEMAS & MODELS ==================== */

// 1. Shop Schema — each retailer that registers on Cartix
const shopSchema = new mongoose.Schema({
    shopId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pin: { type: String, required: true },
    pincode: { type: String, default: '273001' },
    status: { type: String, default: 'OPEN' },
    distance: { type: String, default: '1.2 km' },
    lat: { type: Number, default: 26.7606 },
    lng: { type: Number, default: 83.3732 },
    createdAt: { type: Date, default: Date.now }
});
const Shop = mongoose.model('Shop', shopSchema);

// 2. Product Schema & Model (scoped to a shop)
const productSchema = new mongoose.Schema({
    shopId: { type: String, required: true, index: true },
    shopName: String,
    title: String,
    price: Number,
    category: String,
    image: String,
    stockStatus: { type: String, default: 'IN_STOCK' },
    ondcStatus: { type: String, default: 'Live on ONDC Network' }
});
const Product = mongoose.model('Product', productSchema);

// 3. Order Schema & Model
const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, required: true },
    shopId: String,
    storeName: { type: String, default: 'Gorakhpur Central Kirana' },
    customerName: String,
    phone: String,
    address: String,
    items: Array,
    totalAmount: Number,
    paymentMethod: { type: String, default: 'COD' },
    status: { type: String, default: 'PENDING' },
    riderName: { type: String, default: null },
    riderPhone: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
});
const Order = mongoose.model('Order', orderSchema);

/* ==================== DEFAULT CATALOG (used to seed every new shop) ==================== */
const kiranaPresetDatabase = [
    { title: "Lay's Potato Chips (50g)", price: 21, category: "Snacks", image: "/images/lays.jpg" },
    { title: "Kurkure (75g)", price: 20, category: "Snacks", image: "/images/kurkure.jpg" },
    { title: "Rusk (200g)", price: 54, category: "Snacks", image: "/images/rusk.jpg" },
    { title: "Haldiram's Bhujia (200g)", price: 60, category: "Snacks", image: "/images/bhujia.jpg" },
    { title: "Butter Popcorn (47g)", price: 25, category: "Snacks", image: "/images/popcorn.jpg" },
    { title: "Milk Bread (200g)", price: 35, category: "Snacks", image: "/images/bread.jpg" },
    { title: "Dettol Antiseptic Liquid (250ml)", price: 167, category: "Cleaning Essentials", image: "/images/dettol.jpg" },
    { title: "Gonyle Floor Cleaner (1 Ltr)", price: 75, category: "Cleaning Essentials", image: "/images/gonyle.jpg" },
    { title: "Harpic Toilet Cleaner (600ml)", price: 123, category: "Cleaning Essentials", image: "/images/harpic.jpg" },
    { title: "Air Freshener (150ml)", price: 90, category: "Cleaning Essentials", image: "/images/air_freshener.jpg" },
    { title: "Surf Excel Detergent Powder (1kg)", price: 138, category: "Cleaning Essentials", image: "/images/surf_excel.jpg" },
    { title: "Rin Detergent Bar (130g)", price: 10, category: "Cleaning Essentials", image: "/images/rin.jpg" },
    { title: "Ariel Perfect Wash (1kg)", price: 149, category: "Cleaning Essentials", image: "/images/ariel.jpg" },
    { title: "Horlicks Chocolate Drink Mix (200g)", price: 125, category: "Tea, Coffee & Milk Drinks", image: "/images/horlicks.jpg" },
    { title: "Bournvita Chocolate Nutrition Drink (500g)", price: 241, category: "Tea, Coffee & Milk Drinks", image: "/images/bournvita.jpg" },
    { title: "Glucon-D (200g)", price: 99, category: "Tea, Coffee & Milk Drinks", image: "/images/glucond.jpg" },
    { title: "Nescafe Classic Coffee Powder (72g)", price: 199, category: "Tea, Coffee & Milk Drinks", image: "/images/nescafe.jpg" },
    { title: "Brooke Bond Taaza Tea (1kg)", price: 250, category: "Tea, Coffee & Milk Drinks", image: "/images/taaza_tea.jpg" },
    { title: "Amul Milk (500ml)", price: 36, category: "Tea, Coffee & Milk Drinks", image: "/images/amul_milk.jpg" },
    { title: "Tata Garam Masala (100g)", price: 89, category: "Masala", image: "/images/garam_masala.jpg" },
    { title: "Everest Hing (25g)", price: 50, category: "Masala", image: "/images/hing.jpg" },
    { title: "Coriander Powder (100g)", price: 41, category: "Masala", image: "/images/coriander.jpg" },
    { title: "Jeera (100g)", price: 56, category: "Masala", image: "/images/jeera.jpg" },
    { title: "Tata Salt (1kg)", price: 29, category: "Masala", image: "/images/tata_salt.jpg" },
    { title: "Red Chilli Powder (100g)", price: 45, category: "Masala", image: "/images/chilli_powder.jpg" },
    { title: "Turmeric Powder (200g)", price: 61, category: "Masala", image: "/images/turmeric.jpg" },
    { title: "Maggi Masala (72g)", price: 55, category: "Masala", image: "/images/maggi_masala.jpg" },
    { title: "Maida (500g)", price: 45, category: "Atta, Rice & Dal", image: "/images/maida.jpg" },
    { title: "Besan (500g)", price: 60, category: "Atta, Rice & Dal", image: "/images/besan.jpg" },
    { title: "Chana Dal (500g)", price: 62, category: "Atta, Rice & Dal", image: "/images/chana_dal.jpg" },
    { title: "Fortune Atta (5kg)", price: 222, category: "Atta, Rice & Dal", image: "/images/fortune_atta.jpg" },
    { title: "Whole Farm Rice (5kg)", price: 392, category: "Atta, Rice & Dal", image: "/images/rice.jpg" },
    { title: "Maggi (300g)", price: 60, category: "Atta, Rice & Dal", image: "/images/maggi.jpg" },
    { title: "Moong Dal (1kg)", price: 121, category: "Atta, Rice & Dal", image: "/images/moong_dal.jpg" },
    { title: "Soya Mini Chunks (200g)", price: 46, category: "Atta, Rice & Dal", image: "/images/soya_chunks.jpg" }
];

async function seedProductsForShop(shop) {
    const items = kiranaPresetDatabase.map(item => ({
        ...item,
        shopId: shop.shopId,
        shopName: shop.name,
        stockStatus: 'IN_STOCK'
    }));
    await Product.insertMany(items);
}

// One-time seed: 3 demo shops with full catalogs, only if the DB is empty.
async function seedInitialData() {
    try {
        const count = await Shop.countDocuments();
        if (count > 0) return;

        const demoShops = [
            { shopId: 'shop_1', name: 'Gorakhpur Central Kirana', phone: '+919876543210', pin: '1111', pincode: '273001', status: 'OPEN', distance: '0.8 km', lat: 26.7606, lng: 83.3732 },
            { shopId: 'shop_2', name: 'Gupta General Store', phone: '+919123456789', pin: '2222', pincode: '273001', status: 'OPEN', distance: '1.5 km', lat: 26.7650, lng: 83.3780 },
            { shopId: 'shop_3', name: 'Verma Super Mart', phone: '+919988776655', pin: '3333', pincode: '273015', status: 'CLOSED', distance: '3.2 km', lat: 26.7520, lng: 83.3610 }
        ];

        for (const s of demoShops) {
            const shop = await Shop.create(s);
            await seedProductsForShop(shop);
        }
        console.log("🌱 Seeded 3 demo shops with default catalogs.");
    } catch (err) {
        console.log("⚠️ Seeding error:", err.message);
    }
}

/* ==================== SHOP APIs ==================== */

// Register a new shop → creates it + seeds a starter catalog
app.post('/api/shops/register', async (req, res) => {
    try {
        const { name, phone, pincode } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ error: 'Shop name and phone are required' });
        }

        const pin = String(Math.floor(1000 + Math.random() * 9000));
        const shop = await Shop.create({
            shopId: 'shop_' + Date.now(),
            name,
            phone,
            pin,
            pincode: pincode || '273001'
        });

        await seedProductsForShop(shop);
        res.json({ success: true, shop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retailer login with phone + PIN
app.post('/api/shops/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        const cleanPhone = (phone || '').replace(/\D/g, '');

        const shops = await Shop.find({ pin });
        const matched = shops.find(s => s.phone.replace(/\D/g, '').endsWith(cleanPhone));

        if (matched) {
            res.json({ success: true, shop: matched });
        } else {
            res.status(401).json({ success: false, error: 'Invalid phone or PIN' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List all shops (used for shop-selector map + "view all stores")
app.get('/api/shops', async (req, res) => {
    try {
        const filter = {};
        if (req.query.pincode) filter.pincode = req.query.pincode;
        const shops = await Shop.find(filter).sort({ createdAt: -1 });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Single shop lookup
app.get('/api/shops/:shopId', async (req, res) => {
    try {
        const shop = await Shop.findOne({ shopId: req.params.shopId });
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== PRODUCT APIs ==================== */

// Get products — pass ?shopId=xxx to scope to one shop, omit to get the full network catalog
app.get('/api/products', async (req, res) => {
    try {
        const filter = {};
        if (req.query.shopId) filter.shopId = req.query.shopId;
        const products = await Product.find(filter).sort({ _id: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products/add', async (req, res) => {
    try {
        const { shopId, shopName, title, price, category, image, stockStatus } = req.body;
        if (!shopId || !title) {
            return res.status(400).json({ error: 'shopId and title are required' });
        }
        const newProduct = new Product({
            shopId,
            shopName,
            title,
            price,
            category,
            image,
            stockStatus: stockStatus || 'IN_STOCK',
            ondcStatus: 'Live on ONDC Network'
        });
        await newProduct.save();
        res.json({ message: 'Product added successfully!', product: newProduct });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Clear only the calling shop's own catalog — shopId is required so one shop can never wipe another's
app.delete('/api/products/clear-all', async (req, res) => {
    try {
        const { shopId } = req.query;
        if (!shopId) return res.status(400).json({ error: 'shopId query param is required' });
        await Product.deleteMany({ shopId });
        res.json({ message: 'Your catalog was cleared successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== ORDER APIs ==================== */

app.post('/api/orders/place', async (req, res) => {
    try {
        const { shopId, storeName, customerName, phone, address, items, totalAmount, paymentMethod } = req.body;

        const newOrder = new Order({
            orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            shopId,
            customerName,
            phone,
            address,
            items,
            totalAmount,
            storeName: storeName || 'Gorakhpur Central Kirana',
            paymentMethod: paymentMethod || 'COD',
            status: 'PENDING'
        });

        await newOrder.save();
        res.json({ success: true, order: newOrder });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin dashboard: orders that belong to one shop
app.get('/api/orders', async (req, res) => {
    try {
        const filter = {};
        if (req.query.shopId) filter.shopId = req.query.shopId;
        const orders = await Order.find(filter).sort({ _id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer order tracking by orderId
app.get('/api/orders/track/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rider hub: orders packed and waiting, not yet claimed by anyone
app.get('/api/orders/ready-for-pickup', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'PACKING', riderName: null }).sort({ _id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rider hub: this rider's active deliveries
app.get('/api/orders/rider/:riderName', async (req, res) => {
    try {
        const orders = await Order.find({ riderName: req.params.riderName, status: 'DISPATCHED' }).sort({ _id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin updates order status (Packing / Dispatched / Delivered / Cancelled)
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

// Rider claims a packed order
app.put('/api/orders/claim/:id', async (req, res) => {
    try {
        const { riderName, riderPhone } = req.body;
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.id, status: 'PACKING', riderName: null },
            { riderName, riderPhone, status: 'DISPATCHED' },
            { new: true }
        );
        if (!order) return res.status(409).json({ error: 'Order already claimed or not ready for pickup' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rider marks a delivery complete
app.put('/api/orders/deliver/:id', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.id },
            { status: 'DELIVERED' },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Customer cancels their own order (only while it's still PENDING/PACKING)
app.put('/api/orders/cancel/:id', async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.id });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'PENDING' && order.status !== 'PACKING') {
            return res.status(400).json({ error: 'Order already dispatched, cannot cancel' });
        }
        order.status = 'CANCELLED';
        await order.save();
        res.json({ success: true, order });
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