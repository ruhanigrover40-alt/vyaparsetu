const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  shopId: { type: String, required: true }, // Ties the bill to your specific shop
  id: { type: Number, required: true }, // The unique timestamp ID
  date: { type: String, required: true },
  customerName: { type: String },
  customerMobile: { type: String },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  pendingAmount: { type: Number, required: true },
  paymentMode: { type: String },
  items: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);