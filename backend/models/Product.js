const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Changed from businessId to shopId to match your Bill.js perfectly
  // Added a default fallback so the server never crashes if it's missing
  shopId: { type: String, default: 'roopchand' }, 
  
  // Example: 17 (so your father can type fast)
  productId: { type: Number, required: true }, 
  
  // Example: "नेल पॉलिश"
  nameHindi: { type: String }, 
  
  // Example: "Nail Polish"
  nameEnglish: { type: String }, 
  
  // NEW: Added to support the new Inventory UI features
  rate: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  
  // Example: "Nag" or "Pkt"
  baseUnit: { type: String, default: "Nag" } 
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);