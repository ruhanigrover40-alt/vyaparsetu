import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

 // Add this near the top of your file, outside your main component
const PLAN_LIMITS = {
  neev: { maxBills: 10, maxItems: 10 },
  pragati: { maxBills: 500, maxItems: Infinity }, // Infinity means unlimited
  udaan: { maxBills: Infinity, maxItems: Infinity }
};

function Billing({ shopDetails, setShopDetails }) {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  
  const [showStock, setShowStock] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash'); 
  const [showRazorpayPopup, setShowRazorpayPopup] = useState(false);
  
  // VIP Address Logic: ONLY riturajgrover gets the address automatically. Everyone else gets a blank prompt.
  const defaultAddress = (shopDetails?.id === 'riturajgrover') 
    ? 'General Merchant, Gali Sher Gali, MANASA (M.P.)' 
    : 'Tap here to add your shop address ✏️';

  const shopAddress = shopDetails?.address || localStorage.getItem(`address_${shopDetails?.id}`) || defaultAddress;

  const handleAddressClick = () => {
    const newAddress = window.prompt("Enter your shop address (e.g., City, State):", shopAddress.includes('Tap here') ? '' : shopAddress);
    if (newAddress !== null && newAddress.trim() !== "") {
      if (shopDetails) {
          setShopDetails({...shopDetails, address: newAddress.trim()});
      }
      localStorage.setItem(`address_${shopDetails?.id}`, newAddress.trim());
    }
  };

  useEffect(() => {
    // ALWAYS fetch from the live cloud database!
    if (shopDetails) {
      fetch(`https://vyaparsetu-backend.onrender.com/api/products?shopId=${shopDetails.id}`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) {
              console.error("Backend returned an error:", data);
              setProducts([]);
              return;
          }
          setProducts(data);
        })
        .catch(err => console.error("Error fetching products:", err));
    }
  }, [shopDetails]);

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
      setShopDetails(null);
      navigate('/login');
    }
  };

  // FIX 1: Blank default values so no backspacing is needed!
  // FIX: Allow the same item to be added multiple times as separate rows
  const addToCart = (product) => {
    // Slap a unique timestamp on the ID so React treats every click as a new, independent row
    const uniqueRowId = product._id + '_' + Date.now();
    
    setCart([...cart, { ...product, _id: uniqueRowId, qty: '', rate: product.rate || '' }]);
  };

  const addCustomItem = () => {
    const customId = 'custom_' + Date.now();
    setCart([...cart, { _id: customId, nameEnglish: '', nameHindi: '', rate:'', qty:''}]);
  };

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item._id !== id));
  };

  // FIX 4: Perfected Math Logic for Udhaar
  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.qty || 0)), 0);
  
  let paid = 0;
  if (amountPaid !== '') {
    paid = Number(amountPaid);
  } else {
    paid = (paymentMode === 'Udhaar') ? 0 : totalAmount;
  }
  
  const pendingAmount = Math.max(0, totalAmount - paid);

  const saveBillToLedger = async () => {
    if (cart.length === 0) return false;
    
    const newBill = {
      shopId: shopDetails?.id, 
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB'),
      customerName: customerName.trim() || 'Cash Customer',
      customerMobile: customerMobile.trim(),
      totalAmount,
      paidAmount: paid,
      pendingAmount,
      paymentMode,
      items: cart
    };

    try {
      await fetch('https://vyaparsetu-backend.onrender.com/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBill)
      });
      return true;
    } catch (err) {
      console.error("Database connection failed", err);
      alert("Failed to save to database. Is the backend running?");
      return false;
    }
  };

  const handlePrint = async () => {
    // --- SAAS PLAN LIMIT CHECK ---
  const userPlan = shopDetails?.plan || 'neev';
  const allowedBills = PLAN_LIMITS[userPlan].maxBills;

  // Change 'bills.length' to whatever state variable holds your total bills!
  if (bills.length >= allowedBills) {
    alert(`Neev plan only allows ${allowedBills} bills per month. Please upgrade to Pragati!`);
    setShowRazorpayPopup(true); 
    return; // THIS IS CRITICAL: It stops the bill from saving/printing
  }
  // -----------------------------
    const saved = await saveBillToLedger();
    if (!saved) return alert("Cart is empty!");
    window.print();
    resetForm();
  };

  const handleWhatsApp = async () => {
    // --- SAAS PLAN LIMIT CHECK ---
  const userPlan = shopDetails?.plan || 'neev';
  const allowedBills = PLAN_LIMITS[userPlan].maxBills;

  // Change 'bills.length' to whatever state variable holds your total bills!
  if (bills.length >= allowedBills) {
    alert(`Neev plan only allows ${allowedBills} bills per month. Please upgrade to Pragati!`);
    setShowRazorpayPopup(true); 
    return; // THIS IS CRITICAL: It stops the bill from saving/printing
  }
  // -----------------------------
    const saved = await saveBillToLedger();
    if (!saved) return alert("Cart is empty!");
    
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      alert("Please enter a valid 10-digit mobile number to send WhatsApp!");
      return;
    }

    let msg = `*${shopDetails?.name || 'ROOPCHAND SANDEEP KUMAR'}*\n`;
    msg += `_${shopAddress.replace(' ✏️', '')}_\n\n`;
    msg += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
    msg += `Customer: ${customerName || 'Cash'}\n\n`;
    msg += `*Bill Details:*\n`;
    
    cart.forEach((item, i) => {
      let name = item.nameHindi || item.nameEnglish;
      msg += `${i+1}. ${name} - ${item.qty} x ₹${item.rate} = ₹${item.qty * item.rate}\n`;
    });
    
    msg += `\n*Grand Total: ₹${totalAmount}*\n`;
    msg += `Paid: ₹${paid} (${paymentMode})\n`;
    if (pendingAmount > 0) msg += `*Pending Udhaar: ₹${pendingAmount}*\n`;
    msg += `\n_बेचा हुआ माल वापस नहीं होगा_`;
    msg += `\n_Items once sold will not be returned._\n`;
    msg += `\nThank you for visiting!\nPowered by VyaparSetu`;

    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/91${cleanMobile}?text=${encodedMsg}`, '_blank');
    resetForm();
  };

  const resetForm = () => {
    setCart([]);
    setCustomerName('');
    setCustomerMobile('');
    setAmountPaid('');
    setPaymentMode('Cash');
  };

  const filteredProducts = products.filter(p => 
    (p.nameHindi && p.nameHindi.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (p.nameEnglish && p.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.productId && p.productId.toString().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    const query = searchQuery.trim().toLowerCase();
    
    // 1. EXACT Code Match gets pushed to the absolute top
    const aExactCode = a.productId && a.productId.toString().toLowerCase() === query;
    const bExactCode = b.productId && b.productId.toString().toLowerCase() === query;
    if (aExactCode && !bExactCode) return -1;
    if (!aExactCode && bExactCode) return 1;

    // 2. EXACT Name Match goes right below the exact code
    const aExactName = (a.nameHindi && a.nameHindi.toLowerCase() === query) || (a.nameEnglish && a.nameEnglish.toLowerCase() === query);
    const bExactName = (b.nameHindi && b.nameHindi.toLowerCase() === query) || (b.nameEnglish && b.nameEnglish.toLowerCase() === query);
    if (aExactName && !bExactName) return -1;
    if (!aExactName && bExactName) return 1;

    return 0; // Keep everything else in normal order
  });

  return (
    <div style={{ minHeight: '100vh', color: '#1e293b', fontFamily: '"Outfit", sans-serif', paddingBottom: '40px', overflowX: 'hidden', position: 'relative' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { margin: 0; background: #f4f7f9; }
        .animated-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; background: #f8fafc; }
        .blob-1 { position: absolute; top: -20%; left: -10%; width: 60vw; height: 60vw; border-radius: 50%; background: radial-gradient(circle, rgba(142, 197, 252, 0.4) 0%, transparent 70%); animation: floatBlob 20s infinite ease-in-out; }
        .blob-2 { position: absolute; bottom: -20%; right: -10%; width: 70vw; height: 70vw; border-radius: 50%; background: radial-gradient(circle, rgba(224, 195, 252, 0.4) 0%, transparent 70%); animation: floatBlob 25s infinite ease-in-out reverse; }
        
        @keyframes floatBlob { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(5%, 10%) scale(1.05); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes glassyShine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        h1, h2, h3, h4 { font-weight: 800; letter-spacing: -0.5px; color: #0f172a; }
        
        .glass-panel { 
          background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-radius: 28px; border: 1px solid rgba(255,255,255,0.9); 
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.3); 
          padding: 30px; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        
        .ui-input { width: 100%; padding: 16px 20px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 1.05rem; font-family: inherit; font-weight: 500; color: #1e293b; background: rgba(255,255,255,0.9); transition: all 0.3s ease; box-sizing: border-box; box-shadow: 0 2px 5px rgba(0,0,0,0.01); }
        .ui-input:focus { outline: none; border-color: #2155FF; background: #fff; box-shadow: 0 0 0 4px rgba(33,85,255,0.1); transform: translateY(-2px); }
        
        .ui-input-table { padding: 10px; border-radius: 10px; border: 1.5px solid #e2e8f0; font-size: 1rem; font-weight: 700; width: 100%; box-sizing: border-box; text-align: center; transition: all 0.2s; background: #fff; color: #0f172a; }
        .ui-input-table:focus { outline: none; border-color: #2155FF; box-shadow: 0 0 0 3px rgba(33,85,255,0.15); }
        
        .ui-input-name { padding: 10px; border-radius: 10px; border: 1.5px solid transparent; font-size: 1.05rem; font-weight: 700; width: 100%; box-sizing: border-box; background: transparent; transition: 0.2s; color: #0f172a; }
        .ui-input-name:focus { outline: none; border-color: #cbd5e1; background: #fff; }

        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        .product-card { background: rgba(255,255,255,0.8); border: 1px solid #f1f5f9; border-radius: 18px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .product-card::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 5px; background: linear-gradient(to bottom, #2155FF, #00C6FF); transform: scaleY(0); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom; }
        .product-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: #cbd5e1; background: #fff; }
        .product-card:hover::before { transform: scaleY(1); transform-origin: top; }
        
        .header-row { display: flex; align-items: center; gap: 15px; padding: 14px 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 12px; }
        .cart-row { display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-bottom: 1px solid #f1f5f9; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transition: background 0.2s; border-radius: 14px; }
        .cart-row:hover { background: #f8fafc; }
        
        .col-no { width: 45px; text-align: center; font-weight: 800; }
        .col-desc { flex: 1; min-width: 0; }
        .col-qty { width: 80px; text-align: center; }
        .col-rate { width: 100px; text-align: center; }
        .col-amt { width: 100px; text-align: right; font-weight: 800; font-size: 1.15rem; }
        .col-action { width: 40px; display: flex; justify-content: center; }
        
        .header-row .col-no, .header-row .col-qty, .header-row .col-rate { font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-row .col-desc { font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; padding-left: 10px; }
        .header-row .col-amt { font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; padding-right: 5px; }

        .payment-btn { flex: 1; padding: 16px; border-radius: 14px; border: 1px solid #e2e8f0; background: rgba(255,255,255,0.8); font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: #64748b; font-size: 1.05rem; box-shadow: 0 4px 6px rgba(0,0,0,0.01); }
        .payment-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); color: #0f172a; background: #fff; }
        .payment-btn.active { border-color: #2155FF; background: #eff6ff; color: #2155FF; transform: scale(1.03); box-shadow: 0 10px 25px rgba(33,85,255,0.2); }

        .btn-action { flex: 1; padding: 22px; border-radius: 20px; border: none; color: #fff; font-size: 1.2rem; font-weight: 800; cursor: pointer; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; gap: 10px; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); letter-spacing: 0.5px; }
        .btn-action::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: glassyShine 4s infinite; }
        .btn-print:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(15,23,42,0.3); }
        .btn-wa:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4); }
        
        .nav-btn { cursor: pointer; font-weight: 700; padding: 12px 22px; border-radius: 12px; border: 1px solid #e2e8f0; background: rgba(255,255,255,0.8); transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.95rem; color: #1e293b; backdrop-filter: blur(10px); }
        .nav-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); }

/* --- PERFECTED PRINT STYLES FOR A4 (GHOST PAGE FIX) --- */
        .print-only { display: none; }
        @media print {
          @page { margin: 10mm; }
          body, html { 
            background: #fff; 
            height: auto !important; 
            min-height: 0 !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important; 
          }
          
          /* CRITICAL: Force every single container to drop its laptop screen height! */
          * { min-height: 0 !important; }
          
          /* Hide the web UI elements entirely */
          .animated-bg, .no-print { display: none !important; }
          
          /* Restore normal document flow */
          .print-only { 
            display: block !important; 
            position: static !important; 
            width: 100%; 
            padding: 0; 
            margin: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            color: #000; 
            font-size: 13px;
          }
          
          /* Keep table headers on every page and prevent rows from splitting in half */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }
      `}</style>

      {/* AMBIENT LIQUID BACKGROUND */}
      <div className="animated-bg">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      {/* --- HIDDEN PRINTABLE RECEIPT SECTION (A4 Sized) --- */}
      <div className="print-only">
        
        {/* BRANDING HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ margin: '0', fontSize: '28px', textTransform: 'uppercase', fontStyle: 'italic', fontWeight: '900', letterSpacing: '1px', borderBottom: '3px solid #000', display: 'inline-block', paddingBottom: '4px', paddingLeft: '15px', paddingRight: '15px' }}>
            {shopDetails?.name || 'ROOPCHAND SANDEEP KUMAR'}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', fontWeight: 'bold' }}>{shopAddress.replace(' ✏️', '')}</p>
        </div>
        
        {/* CUSTOMER & DATE INFO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px', fontSize: '12px', fontWeight: 'bold' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '3px 0' }}>Customer Name: {customerName || 'Cash Customer'}</p>
            {customerMobile && <p style={{ margin: '3px 0' }}>Mobile No: {customerMobile}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '3px 0' }}>Invoice Date: {new Date().toLocaleDateString('en-GB')}</p>
            <p style={{ margin: '3px 0' }}>Payment Mode: {paymentMode}</p>
          </div>
        </div>

        {/* ITEMS TABLE WITH PROFESSIONAL BORDERS */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #000', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '50px' }}>क्र (NO.)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>विवरण (DESCRIPTION)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '80px' }}>नग (QTY)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '100px' }}>दर (RATE)</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', width: '120px' }}>रकम (AMT)</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{item.nameHindi || item.nameEnglish}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.qty}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{item.rate}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{(item.rate * item.qty) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS BOX */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <table style={{ width: '300px', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Grand Total:</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '16px' }}>Rs. {totalAmount}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Paid Amount:</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Rs. {paid}</td>
              </tr>
              {pendingAmount > 0 && (
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#000' }}>Pending (Udhaar):</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>Rs. {pendingAmount}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER NOTES */}
        <div style={{ textAlign: 'center', marginTop: '40px', borderTop: '2px solid #000', paddingTop: '15px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>बेचा हुआ माल वापस नहीं होगा | Items once sold will not be returned.</p>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', color: '#555' }}>⚡ Powered by VyaparSetu</p>
        </div>

      </div>
      {/* --- END PRINTABLE RECEIPT --- */}

      {/* NAVBAR */}
      <nav className="no-print" style={{ padding: '15px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.4)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>🧾</span> 
          <span style={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>VyaparSetu POS</span>
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => navigate('/inventory')} className="nav-btn">📦 Inventory</button>
            <button onClick={() => navigate('/khata')} className="nav-btn">📖 Khata</button>
            <button onClick={handleLogout} className="nav-btn" style={{ color: '#ef4444', borderColor: '#fecaca', background: 'rgba(254,242,242,0.8)' }}>Logout</button>
        </div>
      </nav>

      <main className="no-print" style={{ maxWidth: '1450px', margin: '40px auto 0', padding: '0 5vw', display: 'flex', flexWrap: 'wrap', gap: '35px', alignItems: 'flex-start' }}>
        
        {/* LEFT PANEL: PRODUCT VAULT */}
        <div style={{ flex: '1 1 450px', animationDelay: '0.1s' }} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a' }}>Select Items</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}>
                <input type="checkbox" checked={showStock} onChange={(e) => setShowStock(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0f172a' }} />
                Show Stock
              </label>
              <button onClick={addCustomItem} style={{ background: '#eff6ff', color: '#2155FF', border: '1px solid #dbeafe', padding: '10px 16px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 10px rgba(33,85,255,0.15)' }} onMouseOver={e=>{e.target.style.background='#dbeafe'; e.target.style.transform='translateY(-2px)'}} onMouseOut={e=>{e.target.style.background='#eff6ff'; e.target.style.transform='translateY(0)'}}>+ Custom</button>
            </div>
          </div>
          
          <input 
            type="text" 
            className="ui-input" 
            placeholder="Search vault by name or code..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ marginBottom: '25px' }} 
          />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '650px', overflowY: 'auto', paddingRight: '8px' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontWeight: 600, background: 'rgba(255,255,255,0.5)', borderRadius: '20px', border: '2px dashed #cbd5e1' }}>No items found in vault.</div>
            ) : (
              filteredProducts.map(p => (
                <div key={p._id} className="product-card" onClick={() => addToCart(p)} style={{ marginBottom: '16px', padding: '16px', height: 'auto', minHeight: '80px' }}>
                  <div>
                    {p.nameHindi && p.nameEnglish ? (
                      <>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{p.nameEnglish}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>{p.nameHindi}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{p.nameHindi || p.nameEnglish}</div>
                    )}
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700, marginTop: '8px' }}>Code: {p.productId}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {showStock && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>Stock: {p.stock || 0}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: LIVE DIGITAL RECEIPT */}
        <div style={{ flex: '1.5 1 600px', animationDelay: '0.2s' }} className="glass-panel">
          
          {/* DIGITAL RECEIPT HEADER WITH SHOP NAME */}
          <div style={{ textAlign: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.8)', padding: '25px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.5px' }}>
              {shopDetails?.name || 'ROOPCHAND SANDEEP KUMAR'}
            </h2>
            {/* CLICKABLE DYNAMIC ADDRESS */}
            <p 
              onClick={handleAddressClick}
              style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseOver={(e) => e.target.style.color = '#2155FF'}
              onMouseOut={(e) => e.target.style.color = '#64748b'}
            >
              {shopAddress}
            </p>
            <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #e2e8f0', padding: '8px 20px', borderRadius: '24px', color: '#475569', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              Invoice / Bill of Supply
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <input type="text" className="ui-input" placeholder="Customer Name (e.g. Rahul)" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <input type="text" className="ui-input" placeholder="Mobile Number (Optional)" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button className={`payment-btn ${paymentMode === 'Cash' ? 'active' : ''}`} onClick={() => { setPaymentMode('Cash'); setAmountPaid(''); }}>💵 Cash</button>
              <button className={`payment-btn ${paymentMode === 'UPI' ? 'active' : ''}`} onClick={() => { setPaymentMode('UPI'); setAmountPaid(''); }}>📱 UPI</button>
              <button className={`payment-btn ${paymentMode === 'Udhaar' ? 'active' : ''}`} onClick={() => { setPaymentMode('Udhaar'); setAmountPaid(''); }}>📓 Udhaar</button>
            </div>
          </div>
          
          {/* EXACTLY ALIGNED FLEX HEADERS */}
          <div className="header-row">
            <div className="col-no">क्र (NO.)</div>
            <div className="col-desc">विवरण (DESCRIPTION)</div>
            <div className="col-qty">नग (QTY)</div>
            <div className="col-rate">दर (RATE)</div>
            <div className="col-amt">रकम (AMT)</div>
            <div className="col-action"></div>
          </div>

          {/* EXACTLY ALIGNED CART ITEMS */}
          <div style={{ minHeight: '220px', maxHeight: '350px', overflowY: 'auto', marginBottom: '20px', paddingRight: '8px' }}>
            {cart.length === 0 ? (
              <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', fontWeight: 600, border: '2px dashed #cbd5e1', borderRadius: '20px', background: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>
                Cart is empty. Tap items to add.
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={item._id} className="cart-row">
                  
                  <div className="col-no" style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                    {index + 1}
                  </div>
                  
                  <div className="col-desc">
                    {item._id.toString().startsWith('custom_') ? (
                      <input 
                        type="text" 
                        className="ui-input-name" 
                        value={item.nameHindi} 
                        onChange={(e) => updateCartItem(item._id, 'nameHindi', e.target.value)}
                        placeholder="विवरण दर्ज करें..."
                      />
                    ) : (
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem', paddingLeft: '10px' }}>{item.nameHindi || item.nameEnglish}</div>
                    )}
                  </div>
                  
                  <div className="col-qty">
                    <input 
                      type="number" 
                      className="ui-input-table" 
                      value={item.qty} 
                      onChange={(e) => updateCartItem(item._id, 'qty', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="col-rate">
                    <input 
                      type="number" 
                      className="ui-input-table" 
                      value={item.rate} 
                      onChange={(e) => updateCartItem(item._id, 'rate', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="col-amt" style={{ color: '#0f172a' }}>
                    ₹{(Number(item.rate) * Number(item.qty)) || 0}
                  </div>
                  
                  <div className="col-action">
                    <button onClick={() => removeFromCart(item._id)} style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s' }} onMouseOver={e=>{e.target.style.background='#fee2e2'; e.target.style.transform='scale(1.15) rotate(5deg)'}} onMouseOut={e=>{e.target.style.background='#fef2f2'; e.target.style.transform='scale(1) rotate(0)'}}>✖</button>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* TOTALS BOX - MOVED TO THE BOTTOM! */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Grand Total</label>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>₹{totalAmount}</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Received (₹)</label>
              <input 
                type="number" 
                className="ui-input" 
                placeholder={`e.g. ${paymentMode === 'Udhaar' ? '0' : totalAmount}`} 
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value)} 
                style={{ fontSize: '1.2rem', fontWeight: 800, padding: '10px 15px' }} 
              />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Udhaar Generated</label>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: pendingAmount > 0 ? '#ef4444' : '#10b981', transition: 'color 0.3s' }}>
                ₹{pendingAmount}
              </div>
            </div>
          </div>

          {/* ON-SCREEN NOTES */}
          <div style={{ textAlign: 'center', margin: '20px 0', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700 }}>
            बेचा हुआ माल वापस नहीं होगा | Items once sold will not be returned.
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '25px' }}>
            <button onClick={handlePrint} className="btn-action btn-print" style={{ background: '#0f172a' }}>
              🖨️ Print Bill
            </button>
            <button onClick={handleWhatsApp} className="btn-action btn-wa" style={{ background: '#10b981' }}>
              💬 Send to WhatsApp
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '1.05rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.5px' }}>
            ⚡ Powered by <span style={{ color: '#2155FF', fontWeight: 900 }}>VyaparSetu</span>
          </div>
          
        </div>
      </main>

    </div>
  );
}

export default Billing;