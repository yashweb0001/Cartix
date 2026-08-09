const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: String,
    price: Number,
    category: String,
    inStock: { type: Boolean, default: true },
    ondcStatus: { type: String, default: "Not Listed" }
});

module.exports = mongoose.model('Product', productSchema);