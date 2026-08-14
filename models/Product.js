const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "General" },
    stockStatus: { type: String, default: "IN_STOCK" }, // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    ondcStatus: { type: String, default: "Not Listed" }, // Live on ONDC Network / Not Listed
    imageUrl: { type: String, default: "" }
});

module.exports = mongoose.model('Product', productSchema);