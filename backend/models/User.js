const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true }, 
  shopName: { type: String, required: true }, 
  contactInfo: { type: String, required: true }, // NEW: Requires Email or Phone!
  password: { type: String, required: true }, 
  isPremium: { type: Boolean, default: false },
  // Inside your User.js schema, just add this one line:
plan: { type: String, default: "free" }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);