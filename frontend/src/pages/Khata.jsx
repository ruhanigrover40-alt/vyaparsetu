import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Khata({ shopDetails, setShopDetails }) {
  const navigate = useNavigate();
  
  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Bills');

  // Fetch Bills from MongoDB on load
  useEffect(() => {
    const fetchBills = async () => {
      const shopId = shopDetails?.id || 'roopchand';
      try {
        const res = await fetch(`https://vyaparsetu-backend.onrender.com/api/bills/${shopId}`);
        const data = await res.json();
        setBills(data);
      } catch (err) {
        console.error("Failed to fetch ledger from DB", err);
      }
    };
    fetchBills();
  }, [shopDetails]);

  const handleLogout = () => {
    if(window.confirm('Are you sure you want to log out?')) {
      setShopDetails(null);
      navigate('/login');
    }
  };

  // Delete from MongoDB
  const handleDelete = async (id) => {
    if(window.confirm('🚨 Are you sure you want to delete this record? This cannot be undone.')) {
      try {
        await fetch(`https://vyaparsetu-backend.onrender.com/api/bills/${id}`, { method: 'DELETE' });
        setBills(bills.filter(b => b.id !== id)); // Remove from screen instantly
      } catch (err) {
        alert("Failed to delete record from database.");
      }
    }
  };

  // Settle in MongoDB
  const handleSettle = async (id) => {
    if(window.confirm('Mark this Udhaar as fully paid?')) {
      try {
        const res = await fetch(`https://vyaparsetu-backend.onrender.com/api/bills/settle/${id}`, { method: 'PUT' });
        if (res.ok) {
          const updatedBill = await res.json();
          // Update the screen instantly
          setBills(bills.map(b => b.id === id ? updatedBill : b));
        }
      } catch (err) {
        alert("Failed to settle record in database.");
      }
    }
  };

  const handleRemind = (bill) => {
    const cleanMobile = bill.customerMobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 10) return alert("No valid mobile number saved for this customer.");
    
    let msg = `*${shopDetails?.name || 'VyaparSetu Store'}*\n\n`;
    msg += `Hello ${bill.customerName},\n`;
    msg += `This is a gentle reminder that an amount of *₹${bill.pendingAmount}* is pending for your purchase on ${bill.date}.\n`;
    msg += `Please settle the amount at your earliest convenience.\n\nThank you!`;
    
    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/91${cleanMobile}?text=${encodedMsg}`, '_blank');
  };

  // --- UPDATED EXCEL EXPORT LOGIC ---
  const downloadExcel = () => {
    if(filteredBills.length === 0) return alert("No data to export!");
    let csv = 'Date,Customer Name,Mobile,Total Sales (Rs),Amount Paid (Rs),Pending Udhaar (Rs),Status\n';
    
    filteredBills.forEach(b => {
      const status = b.pendingAmount > 0 ? 'UDHAAR' : 'SETTLED';
      
      // Forces Excel to treat the Date and Mobile as pure text, preventing ######## and Scientific Notation
      const safeDate = `="${b.date}"`;
      const safeMobile = b.customerMobile ? `="${b.customerMobile}"` : 'N/A';
      const safeName = `"${(b.customerName || '').replace(/"/g, '""')}"`;

      csv += `${safeDate},${safeName},${safeMobile},${b.totalAmount},${b.paidAmount},${b.pendingAmount},"${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `VyaparSetu_Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
    a.click();
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = (b.customerName && b.customerName.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (b.customerMobile && b.customerMobile.includes(searchQuery));
    
    let matchesStatus = true;
    if (statusFilter === 'Pending Udhaar') matchesStatus = b.pendingAmount > 0;
    if (statusFilter === 'Settled') matchesStatus = b.pendingAmount === 0;

    let matchesTime = true;
    if (timeFilter !== 'All Time' && b.date) {
      const today = new Date();
      const [d, m, y] = b.date.split('/');
      
      if (timeFilter === 'Today') {
        matchesTime = Number(d) === today.getDate() && Number(m) === (today.getMonth() + 1) && Number(y) === today.getFullYear();
      } else if (timeFilter === 'This Month') {
        matchesTime = Number(m) === (today.getMonth() + 1) && Number(y) === today.getFullYear();
      } else if (timeFilter === 'This Year') { 
        matchesTime = Number(y) === today.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  const totalSales = filteredBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalReceived = filteredBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalPending = filteredBills.reduce((sum, b) => sum + b.pendingAmount, 0);

  return (
    <div style={{ minHeight: '100vh', color: '#1e293b', fontFamily: '"Outfit", sans-serif', paddingBottom: '50px', position: 'relative', overflowX: 'hidden' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { margin: 0; background: #f4f7f9; }
        .animated-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; overflow: hidden; background: #f8fafc; }
        .blob-1 { position: absolute; top: -10%; left: -10%; width: 50vw; height: 50vw; border-radius: 50%; background: radial-gradient(circle, rgba(142, 197, 252, 0.4) 0%, transparent 70%); animation: floatBlob 20s infinite ease-in-out; }
        .blob-2 { position: absolute; bottom: -10%; right: -10%; width: 60vw; height: 60vw; border-radius: 50%; background: radial-gradient(circle, rgba(224, 195, 252, 0.3) 0%, transparent 70%); animation: floatBlob 25s infinite ease-in-out reverse; }
        
        @keyframes floatBlob { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(5%, 10%) scale(1.05); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes textShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .glass-panel { 
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: 28px; border: 1px solid rgba(255,255,255,0.9); 
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.5); 
          padding: 25px; animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .metric-card {
          background: #fff; border-radius: 24px; padding: 30px 25px; border: 1px solid #f1f5f9;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03); flex: 1; text-align: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;
        }
        .metric-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: #e2e8f0; }
        .metric-card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px; }
        .card-sales::before { background: linear-gradient(90deg, #2155FF, #00C6FF); }
        .card-received::before { background: linear-gradient(90deg, #10b981, #34d399); }
        .card-udhaar::before { background: linear-gradient(90deg, #ef4444, #f87171); }
        
        .shimmer-text { animation: textShimmer 4s linear infinite; background-size: 200% auto; WebkitBackgroundClip: text; WebkitTextFillColor: transparent; }
        
        .ui-control { 
          height: 54px; box-sizing: border-box; padding: 0 20px; border-radius: 16px; border: 1.5px solid #e2e8f0; 
          font-size: 1.05rem; font-family: inherit; font-weight: 600; color: #1e293b; background: #fff; 
          transition: all 0.2s ease; outline: none; box-shadow: 0 2px 5px rgba(0,0,0,0.01); 
        }
        .ui-control:focus, .ui-control:hover { border-color: #2155FF; box-shadow: 0 4px 12px rgba(33,85,255,0.1); }
        
        .btn-excel { 
          height: 54px; padding: 0 25px; border-radius: 16px; border: none; background: #10b981; color: #fff; 
          font-size: 1.05rem; font-weight: 800; cursor: pointer; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 6px 15px rgba(16, 185, 129, 0.2); 
        }
        .btn-excel:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35); }

        .record-row { 
          display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.8); 
          border: 1px solid #f1f5f9; border-radius: 20px; padding: 22px 25px; margin-bottom: 16px; 
          box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          animation: popIn 0.4s ease-out; position: relative; overflow: hidden;
        }
        .record-row:hover { transform: translateY(-4px); box-shadow: 0 15px 35px rgba(0,0,0,0.05); border-color: #e2e8f0; background: #fff; }
        .row-udhaar::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #ef4444; }
        .row-settled::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: #10b981; }

        .btn-action { padding: 10px 18px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; font-size: 0.95rem; }
        .btn-settle { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1); }
        .btn-settle:hover { background: #d1fae5; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2); }
        .btn-remind { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.1); }
        .btn-remind:hover { background: #fef3c7; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2); }
        .btn-delete { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 10px 14px; }
        .btn-delete:hover { background: #fee2e2; transform: translateY(-2px) rotate(5deg); }
        
        .nav-btn { cursor: pointer; font-weight: 700; padding: 12px 22px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: rgba(255,255,255,0.8); transition: all 0.2s; display: flex; align-items: center; gap: 8px; font-family: inherit; font-size: 0.95rem; color: #1e293b; backdrop-filter: blur(10px); }
        .nav-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.05); }
      `}</style>

      <div className="animated-bg">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
      </div>

      <nav style={{ padding: '15px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.5)', position: 'sticky', top: 0, zIndex: 100 }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>📖</span> 
          <span style={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a' }}>Digital Khata</span>
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => navigate('/inventory')} className="nav-btn">📦 Inventory</button>
            <button onClick={() => navigate('/billing')} className="nav-btn">🧾 POS Billing</button>
            <button onClick={handleLogout} className="nav-btn" style={{ color: '#ef4444', borderColor: '#fecaca', background: 'rgba(254,242,242,0.8)' }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: '1300px', margin: '40px auto 0', padding: '0 5vw', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div className="metric-card card-sales">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Sales</h3>
            <div className="shimmer-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(to right, #0f172a 20%, #334155 50%, #0f172a 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹{totalSales.toLocaleString()}
            </div>
          </div>
          <div className="metric-card card-received">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount Received</h3>
            <div className="shimmer-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(to right, #10b981 20%, #34d399 50%, #10b981 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹{totalReceived.toLocaleString()}
            </div>
          </div>
          <div className="metric-card card-udhaar">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Udhaar (Pending)</h3>
            <div className="shimmer-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-1px', background: 'linear-gradient(to right, #ef4444 20%, #f87171 50%, #ef4444 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ₹{totalPending.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', animationDelay: '0.1s' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input type="text" className="ui-control" placeholder="Search records by Customer Name or Mobile..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '0 15px', borderRadius: '16px', border: '1.5px solid #e2e8f0', height: '54px' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.95rem' }}>Report:</span>
            </div>
            <select className="ui-control cursor-pointer" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ minWidth: '140px', cursor: 'pointer' }}>
              <option>All Time</option>
              <option>Today</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
            <select className="ui-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: '160px', cursor: 'pointer' }}>
              <option>All Bills</option>
              <option>Pending Udhaar</option>
              <option>Settled</option>
            </select>
            <button onClick={downloadExcel} className="btn-excel">📊 Download Excel</button>
          </div>
        </div>

        <div style={{ animationDelay: '0.2s', animation: 'slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
          {filteredBills.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8', fontWeight: 600, background: 'rgba(255,255,255,0.7)', borderRadius: '28px', border: '2px dashed #cbd5e1', fontSize: '1.2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
               <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
               No records found matching your filters.
             </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className={`record-row ${bill.pendingAmount > 0 ? 'row-udhaar' : 'row-settled'}`}>
                <div style={{ flex: '1.5', paddingLeft: '10px' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', marginBottom: '6px', textTransform: 'capitalize' }}>
                    {bill.customerName}
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 600, display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📞 {bill.customerMobile || 'N/A'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>📅 {bill.date}</span>
                  </div>
                </div>
                <div style={{ flex: '2', display: 'flex', justifyContent: 'space-around', borderLeft: '1.5px dashed #e2e8f0', borderRight: '1.5px dashed #e2e8f0', padding: '0 20px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Total</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>₹{bill.totalAmount}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Paid</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>₹{bill.paidAmount}</div>
                  </div>
                  <div style={{ textAlign: 'center', background: bill.pendingAmount > 0 ? '#fef2f2' : 'transparent', padding: '5px 15px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: bill.pendingAmount > 0 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Pending</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: bill.pendingAmount > 0 ? '#ef4444' : '#64748b' }}>₹{bill.pendingAmount}</div>
                  </div>
                </div>
                <div style={{ flex: '1.5', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                  {bill.pendingAmount > 0 ? (
                    <>
                      <button onClick={() => handleRemind(bill)} className="btn-action btn-remind">💬 Remind</button>
                      <button onClick={() => handleSettle(bill.id)} className="btn-action btn-settle">✅ Settle</button>
                    </>
                  ) : (
                    <div style={{ padding: '10px 20px', borderRadius: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.5px' }}>✓ SETTLED</div>
                  )}
                  <button onClick={() => handleDelete(bill.id)} className="btn-action btn-delete" title="Delete Record">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}

export default Khata;