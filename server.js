const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();

/* ==================== MIDDLEWARES ==================== */
// Allowed origins: local dev + your Vercel frontend(s)
// Set FRONTEND_URL in Render env vars — comma-separated if you have more than one
// (e.g. production URL + a preview/branch URL): 
// FRONTEND_URL = https://cartix-kirana.vercel.app,https://cartix-kirana-git-main-codejs1.vercel.app
const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5500',
    ...envOrigins
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (curl, mobile apps, server-to-server, Postman)
        if (!origin || allowedOrigins.includes(origin) || /^cartix-kirana(-[a-z0-9-]+)?\.vercel\.app$/.test(new URL(origin).hostname)) {
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

// 4. Rider Schema — delivery riders who register on Cartix
const riderSchema = new mongoose.Schema({
    riderId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Rider = mongoose.model('Rider', riderSchema);

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
    { title: "Soya Mini Chunks (200g)", price: 46, category: "Atta, Rice & Dal", image: "/images/soya_chunks.jpg" },
    // Personal Care
    { title: "Clinic Plus Strong & Long Shampoo (175ml)", price: 153, category: "Personal Care", image: "/images/clinic_plus_strong_long_shampoo_175ml.jpg" },
    { title: "Head & Shoulders Anti Dandruff Shampoo (180ml)", price: 199, category: "Personal Care", image: "/images/head_shoulders_anti_dandruff_shampoo_180ml.jpg" },
    { title: "Pears Pure & Gentle Soap (3x125g)", price: 188, category: "Personal Care", image: "/images/pears_pure_gentle_soap_3x125g.jpg" },
    { title: "Dettol Skincare Hand Wash Refill (675ml)", price: 101, category: "Personal Care", image: "/images/dettol_skincare_handwash_refill_675ml.jpg" },
    { title: "Lux Natural Glow Soap Mega Pack (3x150g)", price: 158, category: "Personal Care", image: "/images/lux_natural_glow_soap_3x150g.jpg" },
    { title: "Dettol Bathing Bar Soap (4x100g)", price: 161, category: "Personal Care", image: "/images/dettol_bathing_bar_soap_4x100g.jpg" },
    { title: "Himalaya Gentle Baby Shampoo (200ml)", price: 179, category: "Personal Care", image: "/images/himalaya_gentle_baby_shampoo_200ml.jpg" },
    { title: "Himalaya Gentle Baby Soap (125g)", price: 80, category: "Personal Care", image: "/images/himalaya_gentle_baby_soap_125g.jpg" },
    { title: "Garnier Shampoo Hair Colour (20ml)", price: 35, category: "Personal Care", image: "/images/garnier_shampoo_hair_colour_20ml.jpg" },
    { title: "Godrej Expert Hair Colour Rich Creme (20g+20ml+8ml)", price: 40, category: "Personal Care", image: "/images/godrej_expert_hair_colour_rich_creme.jpg" },
    { title: "Dove Bathing Soap (5x125g)", price: 380, category: "Personal Care", image: "/images/dove_bathing_soap_5x125g.jpg" },
    { title: "Navratna Cool Ayurvedic Hair Oil (90ml)", price: 92, category: "Personal Care", image: "/images/navratna_cool_ayurvedic_hair_oil_90ml.jpg" },
    { title: "Bajaj Almond Hair Oil (95ml)", price: 89, category: "Personal Care", image: "/images/bajaj_almond_hair_oil_95ml.jpg" },
    { title: "Dabur Coconut Hair Oil (550ml)", price: 191, category: "Personal Care", image: "/images/dabur_coconut_hair_oil_550ml.jpg" },

    // Cold Drinks & Juices
    { title: "Thums Up Cola Soft Drink (2 Ltr)", price: 93, category: "Cold Drinks & Juices", image: "/images/thums_up_cola_2ltr.jpg" },
    { title: "Thums Up Cola Soft Drink (750ml)", price: 38, category: "Cold Drinks & Juices", image: "/images/thums_up_cola_750ml.jpg" },
    { title: "Sprite (750ml)", price: 36, category: "Cold Drinks & Juices", image: "/images/sprite_750ml.jpg" },
    { title: "Fizz (1 Ltr)", price: 48, category: "Cold Drinks & Juices", image: "/images/fizz_1ltr.jpg" },
    { title: "Pepsi Cola Soft Drink (1.25 Ltr)", price: 50, category: "Cold Drinks & Juices", image: "/images/pepsi_cola_1_25ltr.jpg" },
    { title: "Coca-Cola Soft Drink (750ml)", price: 38, category: "Cold Drinks & Juices", image: "/images/coca_cola_750ml.jpg" },
    { title: "Coca-Cola Soft Drink (180ml)", price: 30, category: "Cold Drinks & Juices", image: "/images/coca_cola_180ml.jpg" },
    { title: "Frooti Mango Drink (600ml)", price: 34, category: "Cold Drinks & Juices", image: "/images/frooti_mango_drink_600ml.jpg" },
    { title: "Red Bull Energy Drink (250ml)", price: 125, category: "Cold Drinks & Juices", image: "/images/red_bull_energy_drink_250ml.jpg" },
    { title: "Glucon-D Orange Energy Drink (200g)", price: 99, category: "Cold Drinks & Juices", image: "/images/glucon_d_orange_200g.jpg" },
    { title: "Glucon-D Orange Energy Drink (1 kg)", price: 382, category: "Cold Drinks & Juices", image: "/images/glucon_d_orange_1kg.jpg" },
    { title: "Eno Lemon Antacid (30g)", price: 60, category: "Cold Drinks & Juices", image: "/images/eno_lemon_antacid_30g.jpg" },
    { title: "Amul Rose Lassi (200ml)", price: 25, category: "Cold Drinks & Juices", image: "/images/amul_rose_lassi_200ml.jpg" },

    // Sweet Tooth
    { title: "Britannia Gobbles Fruit Slice Cake (100g)", price: 29, category: "Sweet Tooth", image: "/images/britannia_gobbles_fruit_slice_cake_100g.jpg" },
    { title: "Parle Happy-Happy Slice Cake (90g)", price: 30, category: "Sweet Tooth", image: "/images/parle_happy_happy_slice_cake_90g.jpg" },
    { title: "Pulse Candy (202.5g)", price: 56, category: "Sweet Tooth", image: "/images/pulse_candy_202_5g.jpg" },
    { title: "Juzt Jelly - Strawberry (155g)", price: 51, category: "Sweet Tooth", image: "/images/juzt_jelly_strawberry_155g.jpg" },
    { title: "Parle Melody Toffee (276g)", price: 100, category: "Sweet Tooth", image: "/images/parle_melody_toffee_276g.jpg" },
    { title: "Chupa Chups (56g)", price: 29, category: "Sweet Tooth", image: "/images/chupa_chups_56g.jpg" },
    { title: "Mentos Rainbow Toffee (109g)", price: 50, category: "Sweet Tooth", image: "/images/mentos_rainbow_toffee_109g.jpg" },
    { title: "Cadbury Gems (25g)", price: 20, category: "Sweet Tooth", image: "/images/cadbury_gems_25g.jpg" },
    { title: "Kinder Joy (20g)", price: 50, category: "Sweet Tooth", image: "/images/kinder_joy_20g.jpg" },

    // Dry Fruits
    { title: "California Almonds (250g)", price: 349, category: "Dry Fruits", image: "/images/california_almonds_250g.jpg" },
    { title: "Whole Cashew (200g)", price: 282, category: "Dry Fruits", image: "/images/whole_cashew_200g.jpg" },
    { title: "Happilo Premium Inshell Walnuts (1 kg)", price: 902, category: "Dry Fruits", image: "/images/happilo_inshell_walnuts_1kg.jpg" },
    { title: "Oygain Box Walnut (200g)", price: 389, category: "Dry Fruits", image: "/images/oygain_box_walnut_200g.jpg" },
    { title: "Farmley Prasadam Makhana (200g)", price: 389, category: "Dry Fruits", image: "/images/farmley_prasadam_makhana_200g.jpg" },
    { title: "Organic Box Anjeer (250g)", price: 299, category: "Dry Fruits", image: "/images/organic_box_anjeer_250g.jpg" },
    { title: "AMAYU Mix Dry Fruits & Seeds (900g)", price: 699, category: "Dry Fruits", image: "/images/amayu_mix_dry_fruits_seeds_900g.jpg" },
    { title: "Dry Dates Chuara (250g)", price: 119, category: "Dry Fruits", image: "/images/dry_dates_chuara_250g.jpg" },
    { title: "Queen Kalmi Dates (Khajur) (200g)", price: 282, category: "Dry Fruits", image: "/images/queen_kalmi_dates_200g.jpg" },
    { title: "Nature Vit Dry Fruits Gift Pack (400g)", price: 650, category: "Dry Fruits", image: "/images/nature_vit_dry_fruits_gift_pack_400g.jpg" },
    { title: "Raisins (200g)", price: 191, category: "Dry Fruits", image: "/images/raisins_200g.jpg" },
    { title: "Natureland Organics Raisins (250g)", price: 318, category: "Dry Fruits", image: "/images/natureland_organics_raisins_250g.jpg" },

    // Sauces & Spreads
    { title: "Kissan Tomato Ketchup (825g)", price: 99, category: "Sauces & Spreads", image: "/images/kissan_tomato_ketchup_825g.jpg" },
    { title: "Maggi Rich Tomato Ketchup (190g)", price: 75, category: "Sauces & Spreads", image: "/images/maggi_rich_tomato_ketchup_190g.jpg" },
    { title: "Amul Salted Butter (200g)", price: 130, category: "Sauces & Spreads", image: "/images/amul_salted_butter_200g.jpg" },
    { title: "Peanut Butter Smooth (610g)", price: 281, category: "Sauces & Spreads", image: "/images/peanut_butter_smooth_610g.jpg" },
    { title: "Veg Mayonnaise (180g)", price: 46, category: "Sauces & Spreads", image: "/images/veg_mayonnaise_180g.jpg" },
    { title: "Mixed Pickle (500g)", price: 140, category: "Sauces & Spreads", image: "/images/mixed_pickle_500g.jpg" },
    { title: "Dabur Honey (100g)", price: 70, category: "Sauces & Spreads", image: "/images/dabur_honey_100g.jpg" },
    { title: "Dabur Chyawanprash (250g)", price: 99, category: "Sauces & Spreads", image: "/images/dabur_chyawanprash_250g.jpg" }
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
            const hashedPin = await bcrypt.hash(s.pin, 10);
            const shop = await Shop.create({ ...s, pin: hashedPin });
            await seedProductsForShop(shop);
        }
        console.log("🌱 Seeded 3 demo shops with default catalogs. (Demo PINs — shop_1: 1111, shop_2: 2222, shop_3: 3333)");
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

        const plainPin = String(Math.floor(1000 + Math.random() * 9000));
        const hashedPin = await bcrypt.hash(plainPin, 10);

        const shop = await Shop.create({
            shopId: 'shop_' + Date.now(),
            name,
            phone,
            pin: hashedPin,
            pincode: pincode || '273001'
        });

        await seedProductsForShop(shop);

        // Send the plain PIN back once at registration time only — it's never stored or returned again.
        const shopResponse = shop.toObject();
        delete shopResponse.pin;
        res.json({ success: true, shop: shopResponse, pin: plainPin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Retailer login with phone + PIN
app.post('/api/shops/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        const cleanPhone = (phone || '').replace(/\D/g, '');

        const shops = await Shop.find();
        const candidate = shops.find(s => s.phone.replace(/\D/g, '').endsWith(cleanPhone));

        const matched = candidate && await bcrypt.compare(String(pin || ''), candidate.pin);

        if (matched) {
            const shopResponse = candidate.toObject();
            delete shopResponse.pin;
            res.json({ success: true, shop: shopResponse });
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
        const shops = await Shop.find(filter).select('-pin').sort({ createdAt: -1 });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Single shop lookup
app.get('/api/shops/:shopId', async (req, res) => {
    try {
        const shop = await Shop.findOne({ shopId: req.params.shopId }).select('-pin');
        if (!shop) return res.status(404).json({ error: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==================== RIDER APIs ==================== */

// Register a new rider (name + phone + 4-digit PIN)
app.post('/api/riders/register', async (req, res) => {
    try {
        const { name, phone, pin } = req.body;
        if (!name || !phone || !pin) {
            return res.status(400).json({ error: 'Name, phone and PIN are required' });
        }
        if (String(pin).length < 4) {
            return res.status(400).json({ error: 'PIN must be at least 4 digits' });
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const existing = await Rider.findOne({ phone: cleanPhone });
        if (existing) {
            return res.status(409).json({ error: 'A rider with this phone number is already registered. Please login instead.' });
        }

        const hashedPin = await bcrypt.hash(String(pin), 10);
        const rider = await Rider.create({
            riderId: 'rider_' + Date.now(),
            name,
            phone: cleanPhone,
            pin: hashedPin
        });

        const riderResponse = rider.toObject();
        delete riderResponse.pin;
        res.json({ success: true, rider: riderResponse });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rider login with phone + PIN
app.post('/api/riders/login', async (req, res) => {
    try {
        const { phone, pin } = req.body;
        const cleanPhone = (phone || '').replace(/\D/g, '');

        const rider = await Rider.findOne({ phone: cleanPhone });
        const matched = rider && await bcrypt.compare(String(pin || ''), rider.pin);

        if (matched) {
            const riderResponse = rider.toObject();
            delete riderResponse.pin;
            res.json({ success: true, rider: riderResponse });
        } else {
            res.status(401).json({ success: false, error: 'Invalid phone or PIN' });
        }
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