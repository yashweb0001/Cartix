const express = require('express');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Product = require('./models/Product');

// 1. App initialize pehle hona zaroori hai!
const app = express();

// 2. Middlewares
app.use(express.json());
app.use(express.static('public'));

// 3. Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/kiranaDB')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// 4. Razorpay Setup
const razorpay = new Razorpay({
    key_id: 'rzp_test_1DP5A3A552B357',
    key_secret: '92837498237489237492'
});

// 5. Routes (App declare hone ke BAAD aayenge)
// Step 1: Fix - Mock Order Endpoint (100% Guaranteed Hackathon Workaround)
// Dummy Order Endpoint for Demo
app.post('/api/create-order', (req, res) => {
    const { amount } = req.body;
    res.json({
        id: "order_mock_" + Date.now(),
        amount: (amount || 100) * 100,
        currency: "INR"
    });
});

app.post('/api/products/add', async (req, res) => {
    const { title, price, category } = req.body;
    const newProduct = new Product({ title, price, category });
    await newProduct.save();
    res.json({ message: 'Product Added Successfully!', product: newProduct });
});

app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.put('/api/products/ondc/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    product.ondcStatus = product.ondcStatus === "Not Listed" ? "Live on ONDC Network" : "Not Listed";
    await product.save();
    res.json(product);
});

// 6. Server Listen
app.listen(5000, () => console.log('Server running on http://localhost:5000'));