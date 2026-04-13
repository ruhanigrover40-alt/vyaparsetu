import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; 

function Inventory({ shopDetails, setShopDetails }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [productId, setProductId] = useState('');
  const [nameHindi, setNameHindi] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showRate, setShowRate] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);

  const codeInputRef = useRef(null);
  const navigate = useNavigate();
  // NEW: State for our Premium Popup
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  useEffect(() => {
    if (shopDetails?.id === 'roopchand') {
      fetch('http://localhost:5000/api/products')
        .then(res => res.json())
        .then(data => { 
          const formattedData = data.map(p => ({ ...p, stock: p.stock || 0, rate: p.rate || 0, nameEnglish: p.nameEnglish || '' }));
          setProducts(formattedData);
          setLoading(false); 
        })
        .catch(err => { console.error(err); setLoading(false); });
    } else if (shopDetails) {
      const localData = JSON.parse(localStorage.getItem(`inventory_${shopDetails.id}`)) || [];
      setProducts(localData);
      setLoading(false);
    }
  }, [shopDetails]);

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
      setShopDetails(null);
      navigate('/login');
    }
  };

const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!nameHindi.trim() && !nameEnglish.trim()) {
      alert("⚠️ You must provide either a Hindi Name or an English Name to save this item!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(productId), 
          nameHindi: nameHindi.trim(),
          nameEnglish: nameEnglish.trim(),
          rate: 0,
          stock: 0,
          baseUnit: "Nag",
          shopId: shopDetails?.shopId || shopDetails?.id 
        })
      });

      const result = await response.json();

      if (response.ok) {
        setProducts([result.product, ...products]); 
        clearInputs();
      } else if (response.status === 403) {
        setUpgradeMessage(result.message);
        setShowUpgradePopup(true);
      } else {
        alert(`Server Error: ${result.message || "Database rejected the item."}`);
      }
    } catch (error) { 
      console.error("Fetch error:", error); 
      alert("Failed to connect to the backend server.");
    }
  };

  const clearInputs = () => {
    setProductId(''); 
    setNameHindi('');
    setNameEnglish('');
    if(codeInputRef.current) codeInputRef.current.focus(); 
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    
    if (shopDetails?.id === 'roopchand') {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setProducts(products.filter(p => p._id !== id));
        } else {
           if (window.confirm("Server error: This might be a 'ghost' item. Remove it from your screen anyway?")) {
              setProducts(products.filter(p => p._id !== id));
           }
        }
      } catch (error) { 
        console.error(error); 
        setProducts(products.filter(p => p._id !== id));
      }
    } else {
      const updatedList = products.filter(p => p._id !== id);
      setProducts(updatedList);
      localStorage.setItem(`inventory_${shopDetails.id}`, JSON.stringify(updatedList));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct.nameHindi.trim() && !editingProduct.nameEnglish.trim()) {
      alert("⚠️ Item must have at least one name!");
      return;
    }

    const updatedList = products.map(p => p._id === editingProduct._id ? editingProduct : p);
    setProducts(updatedList);
    
    const productToSave = { ...editingProduct }; 
    setEditingProduct(null); 

    if (shopDetails?.id === 'roopchand') {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${productToSave._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productToSave)
        });
        if (!response.ok) alert("Warning: Could not save edit to the database. It may reset on refresh.");
      } catch (err) { console.error("Failed to save edit to DB:", err); }
    } else {
      localStorage.setItem(`inventory_${shopDetails.id}`, JSON.stringify(updatedList));
    }
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      alert("Your vault is empty! Add some items before exporting.");
      return;
    }

    const excelData = products.map(p => ({
      "Item Code": p.productId,
      "Hindi Name": p.nameHindi || '-',
      "English Name": p.nameEnglish || '-',
      "Stock Qty": p.stock || 0,
      "Default Rate (₹)": p.rate || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory List");
    XLSX.writeFile(workbook, `${shopDetails?.id || 'Shop'}_Stock_List.xlsx`);
  };

  const filteredProducts = products.filter(p => 
    (p.nameHindi && p.nameHindi.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (p.nameEnglish && p.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.productId && p.productId.toString().includes(searchQuery.toLowerCase()))
  );

  // --- UPDATED PAYMENT FUNCTION (Dynamic Pricing + UPI) ---
  const handlePayment = async (planName, price) => {
    try {
      const response = await fetch('https://vyaparsetu-backend.onrender.com/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price }) 
      });
      const order = await response.json();

      const options = {
        key: "rzp_test_ScwLVZpL8SQvfU",
        amount: order.amount,
        currency: "INR",
        name: "VyaparSetu",
        description: `Upgrade to ${planName}`,
        order_id: order.id, 
        
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Choose Payment Method',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'netbanking' }
                ]
              }
            },
            sequence: ['block.banks'],
            preferences: { show_default_blocks: true }
          }
        },

        handler: function (response) {
          alert(`Success! You have subscribed to the ${planName} plan.`);
          setShowUpgradePopup(false);
        },
        theme: { color: "#ff2155" }
      };

      setShowUpgradePopup(false);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Unable to open payment window.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', color: '#1e293b', fontFamily: '"Outfit", sans-serif', paddingBottom: '80px', position: 'relative', overflowX: 'hidden' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { margin: 0; background: #f4f7f9; }
        .animated-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; background: #f8fafc; }
        .blob-1 { position: absolute; top: -10%; left: -10%; width: 50vw; height: 50vw; border-radius: 50%; background: radial-gradient(circle, rgba(142, 197, 252, 0.4) 0%, transparent 70%); animation: floatBlob 20s infinite ease-in-out; }
        .blob-2 { position: absolute; bottom: -10%; right: -10%; width: 60vw; height: 60vw; border-radius: 50%; background: radial-gradient(circle, rgba(224, 195, 252, 0.3) 0%, transparent 70%); animation: floatBlob 25s infinite ease-in-out reverse; }
        
        @keyframes floatBlob { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(5%, 10%) scale(1.05); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes glassyShine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }
        @keyframes modalFadeIn { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
        @keyframes modalSlideDown { from { opacity: 0; transform: translateY(-50px); } to { opacity: 1; transform: translateY(0); } }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .glass-panel { 
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 28px; border: 1px solid rgba(255,255,255,0.9); 
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5); 
          padding: 30px; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .ui-input { width: 100%; padding: 16px 20px; border-radius: 14px; border: 1.5px solid #e2e8f0; font-size: 1.05rem; font-family: inherit; font-weight: 500; color: #1e293b; background: rgba(255,255,255,0.9); transition: all 0.3s ease; box-sizing: border-box; box-shadow: 0 2px 5px rgba(0,0,0,0.01); outline: none; }
        .ui-input:focus { border-color: #2155FF; background: #fff; box-shadow: 0 0 0 4px rgba(33,85,255,0.1); transform: translateY(-2px); }
        
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        .product-card { background: rgba(255,255,255,0.8); border: 1px solid #f1f5f9; border-radius: 20px; padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02); margin-bottom: 15px; animation: popIn 0.4s ease-out; }
        .product-card::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 5px; background: linear-gradient(to bottom, #2155FF, #00C6FF); transform: scaleY(0); transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom; }
        .product-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.06); border-color: #e2e8f0; background: #fff; }
        .product-card:hover::before { transform: scaleY(1); transform-origin: top; }

        .action-icon { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; margin-left: 10px; color: #64748b; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); width: 44px; height: 44px; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; }
        .action-icon:hover { background: #fff; transform: translateY(-3px); color: #0f172a; border-color: #cbd5e1; box-shadow: 0 6px 15px rgba(0,0,0,0.05); }
        .action-icon-delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; box-shadow: 0 6px 15px rgba(239, 68, 68, 0.15); }

        .setting-btn { padding: 10px 18px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: #f8fafc; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: #64748b; transition: all 0.2s; font-size: 0.9rem; }
        .setting-btn.active { background: #eff6ff; color: #2155FF; border-color: #bfdbfe; box-shadow: 0 4px 10px rgba(33,85,255,0.1); }

        .nav-btn { cursor: pointer; font-weight: 700; padding: 12px 22px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: rgba(255,255,255,0.8); transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.95rem; color: #1e293b; backdrop-filter: blur(10px); }
        .nav-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); }

        .btn-primary { padding: 18px; border-radius: 16px; border: none; color: #fff; font-size: 1.1rem; font-weight: 800; cursor: pointer; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; gap: 10px; position: relative; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.1); width: 100%; margin-top: 15px; }
        .btn-primary::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: glassyShine 4s infinite; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(15,23,42,0.3); }
      `}</style>

      <div className="animated-bg">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      {/* ⭐ UPDATED DYNAMIC PREMIUM UPGRADE POPUP */}
      {showUpgradePopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'modalFadeIn 0.3s forwards' }}>
          <div className="glass-panel" style={{ background: '#fff', width: '90%', maxWidth: '700px', textAlign: 'center', padding: '40px', borderRadius: '30px', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', animation: 'modalSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👑</div>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>Upgrade Your Plan</h2>
              <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, marginBottom: '30px' }}>
                {upgradeMessage || "You've reached the 10-item limit. Choose a plan to unlock unlimited access!"}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                {/* PRAGATI PLAN */}
                <div style={{ border: '2px solid #E91E63', borderRadius: '20px', padding: '20px', background: 'rgba(233, 30, 99, 0.02)' }}>
                  <h3 style={{ margin: 0, color: '#E91E63' }}>Pragati (Growth)</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '15px 0' }}>₹299 <span style={{fontSize:'0.9rem', color:'#888'}}> / mo</span></div>
                  <button onClick={() => handlePayment("Pragati Monthly", 29900)} style={{ width: '100%', background: '#E91E63', color: '#fff', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', marginBottom: '10px' }}>Buy Monthly</button>
                  <button onClick={() => handlePayment("Pragati Yearly", 299000)} style={{ width: '100%', border: '2px solid #E91E63', color: '#E91E63', background: 'white', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Buy Yearly (₹2,990)</button>
                </div>

                {/* UDAAN PLAN */}
                <div style={{ border: '2px solid #2155FF', borderRadius: '20px', padding: '20px', background: 'rgba(33, 85, 255, 0.02)' }}>
                  <h3 style={{ margin: 0, color: '#2155FF' }}>Udaan (Premium)</h3>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '15px 0' }}>₹499 <span style={{fontSize:'0.9rem', color:'#888'}}> / mo</span></div>
                  <button onClick={() => handlePayment("Udaan Monthly", 49900)} style={{ width: '100%', background: '#2155FF', color: '#fff', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 800, cursor: 'pointer', marginBottom: '10px' }}>Buy Monthly</button>
                  <button onClick={() => handlePayment("Udaan Yearly", 499000)} style={{ width: '100%', border: '2px solid #2155FF', color: '#2155FF', background: 'white', padding: '12px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>Buy Yearly (₹4,990)</button>
                </div>

              </div>
              
              <button onClick={() => setShowUpgradePopup(false)} style={{ background: 'transparent', color: '#94a3b8', padding: '20px 0 0', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>Maybe Later</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, animation: 'modalFadeIn 0.3s forwards' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', animation: 'modalSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards', background: 'rgba(255,255,255,0.95)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '25px', fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>✎ Edit Item Details</h2>

            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>HINDI NAME</label>
            <input type="text" className="ui-input" value={editingProduct.nameHindi} onChange={e => setEditingProduct({...editingProduct, nameHindi: e.target.value})} placeholder="e.g. चावल" style={{ marginBottom: '20px' }} />

            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>ENGLISH NAME</label>
            <input type="text" className="ui-input" value={editingProduct.nameEnglish} onChange={e => setEditingProduct({...editingProduct, nameEnglish: e.target.value})} placeholder="e.g. Rice" style={{ marginBottom: '25px' }} />

            <div style={{ display: 'flex', gap: '20px', marginBottom: '35px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>IN STOCK</label>
                <input type="number" className="ui-input" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', display: 'block' }}>RATE (₹)</label>
                <input type="number" className="ui-input" value={editingProduct.rate} onChange={e => setEditingProduct({...editingProduct, rate: Number(e.target.value)})} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingProduct(null)} style={{ padding: '16px 25px', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ background: '#10b981', color: 'white', padding: '16px 35px', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ padding: '15px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2.2rem' }}>📦</span> 
          <span style={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>VyaparSetu Vault</span>
        </h1>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/khata')} className="nav-btn">📖 Digital Khata</button>
            <button onClick={handleExportExcel} className="nav-btn" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>📊 Export Stock List</button>
            <button onClick={() => navigate('/billing')} className="nav-btn" style={{ background: '#0f172a', color: '#fff', borderColor: '#0f172a' }}>🧾 Go to Billing →</button>
            <button onClick={handleLogout} className="nav-btn" style={{ color: '#ef4444', borderColor: '#fecaca', background: 'rgba(254,242,242,0.8)' }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '0 5vw', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
        
        <div style={{ flex: '1 1 380px' }} className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>Add New Item</h2>
            <button onClick={() => setShowGlobalSettings(!showGlobalSettings)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', color: '#475569', padding: '6px 12px' }}>⚙️</button>
          </div>

          {showGlobalSettings && (
            <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.6)', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ width: '100%', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '5px' }}>DISPLAY SETTINGS</div>
              <button className={`setting-btn ${showStock ? 'active' : ''}`} onClick={() => setShowStock(!showStock)}>📦 In Stock</button>
              <button className={`setting-btn ${showRate ? 'active' : ''}`} onClick={() => setShowRate(!showRate)}>💰 Default Rate</button>
            </div>
          )}

          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontWeight: 800, color: '#64748b' }}>ITEM CODE / BARCODE</label>
              <input ref={codeInputRef} type="number" className="ui-input" value={productId} onChange={(e) => setProductId(e.target.value)} required placeholder="e.g. 101" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontWeight: 800, color: '#64748b' }}>HINDI NAME / VIVRAN</label>
              <input type="text" className="ui-input" value={nameHindi} onChange={(e) => setNameHindi(e.target.value)} placeholder="e.g. चावल" />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontWeight: 800, color: '#64748b' }}>ENGLISH NAME</label>
              <input type="text" className="ui-input" value={nameEnglish} onChange={(e) => setNameEnglish(e.target.value)} placeholder="e.g. Rice" />
            </div>

            <button type="submit" className="btn-primary" style={{ background: '#0f172a' }}>✨ Save Item</button>
          </form>
        </div>

        <div style={{ flex: '2 1 550px' }}>
          <div style={{ position: 'relative', marginBottom: '30px' }}>
            <span style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.3rem', color: '#94a3b8' }}>🔍</span>
            <input type="text" className="ui-input" placeholder="Search vault by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '22px 25px 22px 60px', borderRadius: '20px', fontSize: '1.15rem' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontWeight: 700, fontSize: '1.2rem' }}>Loading your vault...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontWeight: 600, background: 'rgba(255,255,255,0.6)', borderRadius: '24px', border: '2px dashed #cbd5e1', fontSize: '1.1rem' }}>No items found in vault.</div>
            ) : (
              filteredProducts.map(p => (
                <div key={p._id} className="product-card">
                  <div style={{ flex: 1 }}>
                    {p.nameHindi && p.nameEnglish ? (
                      <>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{p.nameEnglish}</h3>
                        <h3 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>{p.nameHindi}</h3>
                      </>
                    ) : (
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                        {p.nameHindi || p.nameEnglish}
                      </h3>
                    )}
                    
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '12px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 700, background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>Code: {p.productId}</div>
                      {showStock && <div style={{ fontSize: '0.9rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>📦 Stock: {p.stock}</div>}
                      {showRate && <div style={{ fontSize: '0.9rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>💰 Rate: ₹{p.rate}</div>}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="action-icon" onClick={() => setEditingProduct(p)} title="Edit Item">✎</button>
                    <button className="action-icon action-icon-delete" onClick={() => handleDeleteProduct(p._id)} title="Delete Item">🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default Inventory;