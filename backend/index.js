require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Razorpay = require('razorpay');

// Import your Database Models
const Product = require('./models/Product');
const User = require('./models/User');
const Bill = require('./models/Bill');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 🚀 DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => {
    console.log("Database Connected Successfully! 🚀");
  })
  .catch((err) => {
    console.log("Database Connection Failed! ❌", err);
  });

// ==========================================
// 🔐 USER AUTHENTICATION ROUTES (Untouched)
// ==========================================

// 1. REGISTER A NEW SHOP
app.post('/api/register', async (req, res) => {
  try {
    const { shopId, shopName, contactInfo, password } = req.body;

    const existingUser = await User.findOne({ shopId });
    if (existingUser) {
      return res.status(400).json({ message: "This Shop ID is already taken!" });
    }

    const newUser = await User.create({ shopId, shopName, contactInfo, password });
    
    res.status(201).json({ message: "Registration successful!", user: newUser });
  } catch (error) {
    console.log("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 2. LOGIN AN EXISTING SHOP
app.post('/api/login', async (req, res) => {
  try {
    const { shopId, password } = req.body;

    const user = await User.findOne({ shopId });
    
    if (!user) {
      return res.status(404).json({ message: "Shop ID not found. Please register first." });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password!" });
    }

    res.status(200).json({ message: "Login successful!", user });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


// ==========================================
// 📦 INVENTORY ROUTES
// ==========================================

// 1. The "Drive-Thru Window" (Gets all products, newest first)
app.get('/api/products', async (req, res) => {
  try {
    const allProducts = await Product.find({}).sort({ createdAt: -1 }); 
    res.status(200).json(allProducts);
  } catch (error) {
    console.log("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// 2. The "Receiving Window" (Adds a new product properly WITH FREE LIMITS)
app.post('/api/products', async (req, res) => {
  try {
    const { nameHindi, nameEnglish, productId, rate, stock, baseUnit, shopId } = req.body;
    const targetShop = shopId;

    console.log("\n--- 🛑 NEW SAVE REQUEST ---");
    console.log("1. Shop ID sent from React:", targetShop);

    const user = await User.findOne({ shopId: targetShop });
    console.log("2. User found in Database:", user ? user.shopName : "NO MATCH FOUND");
    console.log("3. User's Current Plan:", user ? user.plan : "NO PLAN FOUND");
    console.log("----------------------------\n");

    // --- FREE TIER LIMIT CHECK ---
    if (user && user.plan === "free" && targetShop !== "riturajgrover") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1); 
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentItemCount = await Product.countDocuments({
        shopId: targetShop,
        createdAt: { $gte: startOfMonth }
      });

      if (currentItemCount >= 10) {
        console.log("⛔ Blocked: Free tier limit reached.");
        return res.status(403).json({ message: "Free plan limit reached (10 items/month). Please upgrade to Premium!" });
      }
    }

    console.log("4. VIP Check Passed. Attempting to save to MongoDB...");

    // --- AGGRESSIVE SAVE WITH TYPE CHECKING ---
    try {
      const newProduct = await Product.create({
        shopId: targetShop,
        nameHindi: nameHindi || "",
        nameEnglish: nameEnglish || "", 
        productId: productId || Date.now().toString(), // Fills missing ID just in case
        rate: Number(rate) || 0,   // Forces it to be a valid number
        stock: Number(stock) || 0, // Forces it to be a valid number
        baseUnit: baseUnit || "Nag"
      });

      console.log("5. ✅ SUCCESS! Item saved with ID:", newProduct._id);
      return res.status(201).json({ message: "Product added!", product: newProduct });

    } catch (dbError) {
      // If MongoDB hates the data, it will get caught right here!
      console.log("🚨 MONGODB REJECTED THE SAVE:", dbError.message);
      return res.status(500).json({ message: "Database rejected the item", error: dbError.message });
    }

  } catch (error) {
    console.log("🚨 FATAL SERVER ERROR:", error.message);
    return res.status(500).json({ message: "Server crashed before saving", error: error.message });
  }
});

// 3. The "Update Window" (Edits an existing product)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.status(200).json({ message: "Product updated successfully!", product: updatedProduct });
  } catch (error) {
    console.log("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product", error });
  }
});

// 4. The "Trash Can" (Deletes a product)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.status(200).json({ message: "Product deleted permanently! 🗑️" });
  } catch (error) {
    console.log("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product", error });
  }
});

// ==========================================
// 💳 RAZORPAY PAYMENT ROUTE (UPDATED FOR DYNAMIC PRICING)
// ==========================================
app.post('/api/create-order', async (req, res) => {
  try {
    // 1. Get the exact amount sent from the React button
    const { amount } = req.body; 

    // 2. Initialize Razorpay with your hidden keys
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 3. Set the options using the dynamic amount
    const options = {
      amount: amount, // NO MORE HARDCODED 49900! It uses whatever the button sends.
      currency: "INR",
      receipt: "receipt_order_" + Math.floor(Math.random() * 1000)
    };

    // 4. Ask Razorpay to generate a unique Order ID
    const order = await razorpay.orders.create(options);
    
    // 5. Send that Order ID back to the React frontend
    res.json(order);

  } catch (error) {
    console.log(error);
    res.status(500).send("Error creating order");
  }
});


// ==========================================
// 🧾 KHATA & BILLING ROUTES
// ==========================================

// 1. SAVE A NEW BILL (WITH FREE LIMITS)
app.post('/api/bills', async (req, res) => {
  try {
    const { shopId } = req.body; // Fixed undefined variable bug
    const targetShop = shopId;

    // --- FREE TIER LIMIT CHECK ---
    // --- FREE TIER LIMIT CHECK ---
    const user = await User.findOne({ shopId: targetShop });
    if (user && user.plan === "free" && targetShop !== "riturajgrover") {
      // Find the start of the current month
      // ... the rest of the code stays the same
      // Find the start of the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1); 
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Count how many bills this shop generated this month
      const currentBillCount = await Bill.countDocuments({
        shopId: targetShop,
        createdAt: { $gte: startOfMonth }
      });

      if (currentBillCount >= 10) {
        return res.status(403).json({ message: "Free plan limit reached (10 bills/month). Please upgrade to Premium!" });
      }
    }
    // -----------------------------

    const newBill = await Bill.create(req.body);
    res.status(201).json(newBill);
  } catch (error) {
    console.log("Error saving bill:", error);
    res.status(500).json({ message: "Failed to save bill" });
  }
});

// 2. GET ALL BILLS FOR A SHOP
app.get('/api/bills/:shopId', async (req, res) => {
  try {
    const bills = await Bill.find({ shopId: req.params.shopId }).sort({ id: -1 });
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bills" });
  }
});

// 3. SETTLE A BILL (Update Udhaar to 0)
app.put('/api/bills/settle/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({ id: req.params.id });
    if (bill) {
      bill.paidAmount = bill.totalAmount;
      bill.pendingAmount = 0;
      bill.paymentMode = 'Settled (Cash)';
      await bill.save();
      res.status(200).json(bill);
    } else {
      res.status(404).json({ message: "Bill not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to settle bill" });
  }
});

// 4. DELETE A BILL
app.delete('/api/bills/:id', async (req, res) => {
  try {
    await Bill.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ message: "Bill deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete bill" });
  }
});


// ==========================================
// 🚀 START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`VyaparSetu Backend running on port ${PORT} ⚙️`);
});