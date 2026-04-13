import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  // THE MISSING PAYMENT FUNCTION FOR THE HOME PAGE
  const handlePayment = async (planName, price) => {
    try {
      // 🛑 Pointing safely to your LIVE backend!
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
        
        // Force UPI to show here as well
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Choose Payment Method',
                instruments: [{ method: 'upi' }, { method: 'card' }, { method: 'netbanking' }]
              }
            },
            sequence: ['block.banks'],
            preferences: { show_default_blocks: true }
          }
        },

        handler: function (response) {
          alert(`Success! You have subscribed to the ${planName} plan.`);
        },
        theme: { color: "#E91E63" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Unable to open payment window.");
    }
  };

  // Smooth scroll function for the navbar
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  const featureList = [
    { 
      id: 0, icon: '📖', title: 'Digital Khata', color: '#FCE4EC', 
      desc: 'Securely track Udhaar balance and view historical customer transaction records in one click.',
      type: 'image', content: '/Digital-Khata-mockup.png'
    },
    { 
      id: 1, icon: '📦', title: 'Smart Inventory', color: '#FFF4E5', 
      desc: 'Track every Kirana item or SKU automatically in English and Hindi as you generate bills.',
      type: 'image', content: '/inventory-mockup.png'
    },
    { 
      id: 2, icon: '💬', title: 'WhatsApp Bills', color: '#E8F5E9', 
      desc: 'Send professional, instantly formatted estimates directly to your customer\'s smartphone.',
      type: 'image', content: '/billing-mockup.png' 
    },
    { 
      id: 3, icon: '📊', title: 'One-Click Excel', color: '#F3E5F5', 
      desc: 'Export perfectly formatted daily, weekly, and annual sales reports for your accountant.',
      type: 'mockup', content: 'excel' 
    },
  ];

  const secondaryFeatures = [
    { icon: '🖨️', title: 'Thermal Printing', desc: 'Connects directly to 2" and 3" receipt printers.' },
    { icon: '📱', title: 'Multi-Device Sync', desc: 'Access your shop from your laptop, tablet, or phone.' },
    { icon: '🏢', title: 'GST Ready', desc: 'Easily generate GSTR-compliant reports.' },
    { icon: '🧑‍🤝‍🧑', title: 'Staff Accounts', desc: 'Give cashiers access without showing your profits.' },
    { icon: '📶', title: 'Offline Mode', desc: 'Keep billing even if your WiFi goes down.' },
    { icon: '🔎', title: 'Barcode Ready', desc: 'Scan items directly into the billing screen.' },
  ];

  return (
    <div style={{ fontFamily: '"Outfit", sans-serif', color: '#111', background: '#fafafa', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      
      {/* ALL THE "WOW FACTOR" ANIMATIONS & FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        html { scroll-behavior: smooth; }
        
        @keyframes scrollMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes floatAnimation { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerText { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes glowBorder { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        /* Typography limits to avoid being too bold */
        h1, h2, h3, h4 { font-weight: 800; letter-spacing: -0.5px; }

        .animated-logo {
          background: linear-gradient(to right, #000 15%, #E91E63 40%, #9C27B0 60%, #000 85%);
          background-size: 200% auto; color: transparent; -webkit-background-clip: text;
          animation: shimmerText 5s linear infinite; cursor: pointer;
        }

        /* Responsive Navbar Magic */
        .desktop-nav { display: none; gap: 35px; }
        @media (min-width: 900px) { .desktop-nav { display: flex; } }

        .nav-link-rich {
          background: none; border: none; cursor: pointer; font-family: inherit;
          font-size: 1.05rem; font-weight: 700; color: #444; position: relative;
          padding: 8px 0; transition: color 0.3s; display: flex; align-items: center; gap: 4px;
        }
        .nav-link-rich:hover { color: #E91E63; }
        .nav-link-rich::after {
          content: ''; position: absolute; width: 0; height: 3px; bottom: 0; left: 0;
          background: #E91E63; transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); border-radius: 5px;
        }
        .nav-link-rich:hover::after { width: 100%; }

        .hero-section {
          background: linear-gradient(-45deg, #FFCFF5, #D6E4FF, #D5E8D4, #FFECB3);
          background-size: 400% 400%; animation: shimmerText 15s ease infinite;
        }

        /* Premium Pricing Card with Animated Gradient Border */
        .pricing-card {
          background: white; border-radius: 40px; padding: 50px 40px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid #eee; position: relative; z-index: 2;
        }
        .pricing-card:hover { transform: translateY(-15px); box-shadow: 0 40px 80px rgba(0,0,0,0.08); }
        
        .glowing-card {
          position: relative; border: none;
        }
        .glowing-card::before {
          content: ""; position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px;
          background: linear-gradient(90deg, #ff007f, #7928ca, #ff007f);
          background-size: 200% auto; animation: glowBorder 3s linear infinite;
          z-index: -1; border-radius: 44px;
        }

        .feature-selector { transition: all 0.3s ease; }
        .feature-selector:hover { transform: translateX(10px); }
        
        .excel-row { display: flex; border-bottom: 1px solid #eee; padding: 12px; }
        .excel-cell { flex: 1; font-size: 0.85rem; font-weight: 700; color: #444; }

        /* Secondary Slider CSS */
        .slider-track {
          display: flex; width: calc(350px * 12); animation: scrollMarquee 35s linear infinite; gap: 30px; padding: 20px 0;
        }
        .slider-card {
          width: 320px; background: #fff; padding: 30px; border-radius: 25px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #f0f0f0;
          display: flex; flex-direction: column; gap: 15px;
        }
      `}</style>

      {/* RICH WIX-STYLE NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5vw', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(15px)', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid #eee' }}>
        <h1 onClick={() => window.scrollTo(0,0)} className="animated-logo" style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>
          VyaparSetu
        </h1>
        
        {/* FIXED: This menu will now visibly display on laptop/desktop screens! */}
        <div className="desktop-nav">
           <button className="nav-link-rich">Solutions <span style={{fontSize: '0.8rem'}}>▼</span></button>
           <button onClick={() => scrollToSection('features')} className="nav-link-rich">Features</button>
           <button onClick={() => scrollToSection('slider')} className="nav-link-rich">Add-ons</button>
           <button onClick={() => scrollToSection('pricing')} className="nav-link-rich">Pricing</button>
           <button onClick={() => scrollToSection('support')} className="nav-link-rich">Support</button>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', cursor: 'pointer', display: 'none', '@media (minWidth: 768px)': {display: 'block'} }}>🌐</span>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', transition: '0.2s', color: '#111' }} onMouseOver={e => e.target.style.color='#E91E63'} onMouseOut={e => e.target.style.color='#111'}>Log In</button>
          <button onClick={() => navigate('/login', { state: { register: true } })} style={{ background: '#2155FF', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 800, fontSize: '1.05rem', padding: '12px 28px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(33, 85, 255, 0.3)', transition: '0.3s' }} onMouseOver={e => e.target.style.transform='translateY(-2px)'} onMouseOut={e => e.target.style.transform='translateY(0)'}>Get Started</button>
        </div>
      </nav>

      {/* INSTANTLY UNDERSTANDABLE HERO SECTION */}
      <section className="hero-section" style={{ padding: '120px 5vw 100px', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '1050px', margin: '0 auto', animation: 'slideUpFade 1s ease-out' }}>
          <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(10px)', display: 'inline-block', padding: '8px 20px', borderRadius: '30px', fontWeight: 700, color: '#E91E63', marginBottom: '25px', border: '1px solid #fff' }}>
            ✨ Designed for Indian Retailers
          </div>
          <h2 style={{ fontSize: '5rem', fontWeight: 800, lineHeight: '1.1', margin: '0 0 25px 0', color: '#111', letterSpacing: '-2px' }}>
            The Ultimate Billing App for <br />the Modern Indian Shop.
          </h2>
          <p style={{ fontSize: '1.4rem', color: '#444', marginBottom: '50px', fontWeight: 500, lineHeight: '1.6', maxWidth: '750px', margin: '0 auto 50px' }}>
            Replace your pen, paper, and calculator. VyaparSetu manages your inventory, generates WhatsApp bills, and tracks Udhaar—all in one beautiful place.
          </p>
          <button onClick={() => navigate('/login', { state: { register: true } })} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '40px', fontWeight: 800, fontSize: '1.3rem', padding: '22px 50px', cursor: 'pointer', boxShadow: '0 15px 35px rgba(37, 211, 102, 0.4)', transition: '0.3s' }} onMouseOver={e => e.target.style.transform='scale(1.05)'} onMouseOut={e => e.target.style.transform='scale(1)'}>
            Register Your Business Free
          </button>
        </div>
      </section>

      {/* THE MARQUEE BORDER */}
      <div style={{ background: '#111', color: '#fff', padding: '25px 0', overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '5px solid #E91E63', borderBottom: '5px solid #2155FF' }}>
         <div style={{ display: 'flex', width: '200%', animation: 'scrollMarquee 25s linear infinite', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '2px' }}>
            {[...Array(8)].map((_, i) => (
              <span key={i} style={{ margin: '0 50px' }}>
                <span style={{color: '#FFCFF5'}}>✦ KIRANA STORES</span> <span style={{color: '#D6E4FF'}}>✦ CLOTHING SHOPS</span> <span style={{color: '#D5E8D4'}}>✦ HARDWARE</span> <span style={{color: '#FFECB3'}}>✦ GENERAL MERCHANTS</span>
              </span>
            ))}
         </div>
      </div>

      {/* DYNAMIC INTERACTIVE FEATURES SHOWCASE */}
      <section id="features" style={{ padding: '140px 5vw', maxWidth: '1400px', margin: '0 auto' }}>
        <h3 style={{ textAlign: 'center', fontSize: '3.8rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>Engineered for growth</h3>
        <p style={{ textAlign: 'center', fontSize: '1.3rem', color: '#666', marginBottom: '80px', fontWeight: 500 }}>Everything you need to modernize your retail counter, built into one dashboard.</p>
        
        <div style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {featureList.map((f, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setActiveFeature(i)} 
                className="feature-selector"
                style={{ 
                  padding: '30px', borderRadius: '30px', cursor: 'pointer',
                  background: activeFeature === i ? '#fff' : 'rgba(255,255,255,0.5)', 
                  border: activeFeature === i ? `3px solid ${f.color}` : '3px solid transparent', 
                  boxShadow: activeFeature === i ? '0 20px 40px rgba(0,0,0,0.08)' : 'none' 
                }}
              >
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                  <span style={{ fontSize: '3rem', background: f.color, padding: '15px', borderRadius: '20px', boxShadow: 'inset 0 -4px 10px rgba(0,0,0,0.05)' }}>{f.icon}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#111' }}>{f.title}</h4>
                    <p style={{ margin: '8px 0 0 0', color: '#666', fontWeight: 600, fontSize: '1.1rem', lineHeight: '1.5' }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ flex: '1.5 1 600px', background: '#f8f9fa', borderRadius: '40px', height: '650px', border: '2px solid #eee', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.1)', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {featureList[activeFeature].type === 'image' ? (
              <img 
                src={featureList[activeFeature].content} 
                alt="VyaparSetu Feature" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', animation: 'slideUpFade 0.5s ease-out' }} 
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
            ) : (
              // EXPANDED EXCEL CSS MOCKUP (More names added as requested!)
              <div style={{ padding: '40px', width: '100%', animation: 'slideUpFade 0.5s ease-out' }}>
                <div style={{ background: '#E8F5E9', padding: '12px 25px', borderRadius: '15px', marginBottom: '25px', display: 'inline-block', color: '#2E7D32', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 5px 15px rgba(46,125,50,0.1)' }}>
                  ✓ SALES_REPORT_2026.xlsx
                </div>
                <div style={{ background: '#fff', border: '2px solid #f0f0f0', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
                  <div className="excel-row" style={{ background: '#f9f9f9', fontWeight: 800, borderBottom: '3px solid #eee' }}>
                    <div className="excel-cell">DATE</div><div className="excel-cell">CUSTOMER</div><div className="excel-cell" style={{color: '#D32F2F'}}>UDHAAR</div><div className="excel-cell">TOTAL</div>
                  </div>
                  <div className="excel-row"><div className="excel-cell">11/04</div><div className="excel-cell">Rahul Sharma</div><div className="excel-cell" style={{color: '#D32F2F'}}>₹1500</div><div className="excel-cell">₹2500</div></div>
                  <div className="excel-row"><div className="excel-cell">11/04</div><div className="excel-cell">Anita Verma</div><div className="excel-cell" style={{color: '#2E7D32'}}>₹0</div><div className="excel-cell">₹850</div></div>
                  <div className="excel-row"><div className="excel-cell">10/04</div><div className="excel-cell">Vikram Singh</div><div className="excel-cell" style={{color: '#D32F2F'}}>₹4200</div><div className="excel-cell">₹4200</div></div>
                  <div className="excel-row"><div className="excel-cell">10/04</div><div className="excel-cell">Suresh Patel</div><div className="excel-cell" style={{color: '#D32F2F'}}>₹500</div><div className="excel-cell">₹1200</div></div>
                  <div className="excel-row"><div className="excel-cell">09/04</div><div className="excel-cell">Priya Desai</div><div className="excel-cell" style={{color: '#2E7D32'}}>₹0</div><div className="excel-cell">₹300</div></div>
                  <div className="excel-row"><div className="excel-cell">09/04</div><div className="excel-cell">Amit Kumar</div><div className="excel-cell" style={{color: '#D32F2F'}}>₹100</div><div className="excel-cell">₹600</div></div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'none', padding: '40px', textAlign: 'center', color: '#888', fontWeight: 800, fontSize: '1.5rem' }}>
              Oops! Make sure '{featureList[activeFeature].content}' is saved in your 'public' folder!
            </div>
          </div>
        </div>
      </section>

      {/* NEW: BEAUTIFUL SLIDING SECONDARY FEATURES */}
      <section id="slider" style={{ padding: '80px 0 120px', overflow: 'hidden', background: '#fff' }}>
        <h3 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, marginBottom: '50px', color: '#111' }}>Plus everything you need to run your shop.</h3>
        
        {/* Infinite scrolling track */}
        <div className="slider-track">
          {[...secondaryFeatures, ...secondaryFeatures].map((feat, index) => (
            <div key={index} className="slider-card">
              <div style={{ fontSize: '3rem', background: '#f8f9fa', width: '70px', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '20px' }}>{feat.icon}</div>
              <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111' }}>{feat.title}</h4>
              <p style={{ margin: 0, color: '#666', fontWeight: 500, lineHeight: '1.5' }}>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIBRANT PRICING SECTION WITH YEARLY TOGGLE */}
{/* VIBRANT PRICING SECTION */}
{/* VIBRANT PRICING SECTION - MATCHED TO MOCKUP */}
<section id="pricing" style={{ padding: '140px 5vw', background: 'linear-gradient(135deg, #FFCFF5 0%, #D6E4FF 100%)', position: 'relative', overflow: 'hidden' }}>
  
  {/* Abstract background glow shapes */}
  <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(233,30,99, 0.1)', filter: 'blur(50px)' }}></div>
  <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(33,85,255, 0.1)', filter: 'blur(60px)' }}></div>

  <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 5 }}>
    <div style={{ background: '#fff', display: 'inline-block', padding: '10px 25px', borderRadius: '30px', fontWeight: 700, color: '#111', marginBottom: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
      🏷️ Fair Pricing, No Hidden Fees
    </div>
    <h3 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1.5px', color: '#111' }}>Simple, honest pricing</h3>
    <p style={{ color: '#444', fontSize: '1.4rem', marginBottom: '80px', fontWeight: 600, maxWidth: '600px', margin: '0 auto 80px' }}>Start for free, upgrade when you need more power.</p>
    
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
      
      {/* Card 1: Neev */}
      <div className="pricing-card" style={{ background: '#fff', padding: '50px 40px', borderRadius: '40px', textAlign: 'left', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#111' }}>Neev</h4>
          <span style={{ fontSize: '2.5rem' }}>🌱</span>
        </div>
        <p style={{ color: '#666', fontWeight: 500, fontSize: '1.1rem', marginBottom: '30px' }}>Perfect foundation for a new digital shop.</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '40px' }}>
          <span style={{ fontSize: '4rem', fontWeight: 800, color: '#111' }}>₹0</span>
          <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: 600 }}>/forever</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '1.1rem', fontWeight: 600, color: '#444' }}>
          <li>✅ 10 Bills / Month</li>
          <li>✅ 10 Inventory Items</li>
          <li>✅ Digital Khata (Udhaar)</li>
          <li>✅ WhatsApp Bill Sharing</li>
          <li>✅ Standard Printing</li>
          <li style={{ color: '#888' }}>⚠️ Basic Reports</li>
        </ul>
        <button style={{ width: '100%', padding: '18px', background: '#f8f9fa', color: '#888', borderRadius: '15px', border: '2px solid #eee', fontWeight: 800, fontSize: '1.1rem', cursor: 'not-allowed' }}>Current Plan</button>
      </div>

      {/* Card 2: Pragati */}
      <div className="pricing-card glowing-card" style={{ background: '#fff', padding: '50px 40px', borderRadius: '40px', textAlign: 'left', position: 'relative', transform: 'scale(1.03)', boxShadow: '0 20px 50px rgba(233,30,99,0.1)' }}>
        <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'linear-gradient(90deg, #ff007f, #7928ca)', color: '#fff', padding: '8px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>POPULAR</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#111' }}>Pragati</h4>
          <span style={{ fontSize: '2.5rem' }}>🚀</span>
        </div>
        <p style={{ color: '#666', fontWeight: 500, fontSize: '1.1rem', marginBottom: '30px' }}>For busy shops ready to scale up.</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '40px' }}>
          <span style={{ fontSize: '4rem', fontWeight: 800, color: '#111' }}>₹299</span>
          <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: 600 }}>/month</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '1.1rem', fontWeight: 600, color: '#444' }}>
          <li>✅ 500 Bills / Month</li>
          <li>✅ Unlimited Inventory</li>
          <li>✅ Everything in Neev</li>
          <li>✅ Barcode Scanning</li>
          <li>✅ Thermal Printer Support</li>
          <li>✅ Comprehensive Reports</li>
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => handlePayment("Pragati Monthly", 29900)} style={{ width: '100%', padding: '18px', background: '#E91E63', color: '#fff', borderRadius: '15px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>Buy Monthly</button>
          <button onClick={() => handlePayment("Pragati Yearly", 299000)} style={{ width: '100%', padding: '18px', background: '#fff', color: '#E91E63', borderRadius: '15px', border: '2px solid #E91E63', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>Buy Yearly (Save 20%)</button>
        </div>
      </div>

      {/* Card 3: Udaan */}
      <div className="pricing-card" style={{ background: '#fff', padding: '50px 40px', borderRadius: '40px', textAlign: 'left', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: '#111' }}>Udaan</h4>
          <span style={{ fontSize: '2.5rem' }}>🦅</span>
        </div>
        <p style={{ color: '#666', fontWeight: 500, fontSize: '1.1rem', marginBottom: '30px' }}>Ultimate tool for large enterprises.</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '40px' }}>
          <span style={{ fontSize: '4rem', fontWeight: 800, color: '#111' }}>₹499</span>
          <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: 600 }}>/month</span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '1.1rem', fontWeight: 600, color: '#444' }}>
          <li>✅ Unlimited Bills & Items</li>
          <li>✅ Everything in Pragati</li>
          <li>✅ GST Filing Ready</li>
          <li>✅ Multi-Staff Accounts</li>
          <li>✅ Staff Performance Tracking</li>
          <li>✅ Priority Support</li>
        </ul>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={() => handlePayment("Udaan Monthly", 49900)} style={{ width: '100%', padding: '18px', background: '#2155FF', color: '#fff', borderRadius: '15px', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>Buy Monthly</button>
          <button onClick={() => handlePayment("Udaan Yearly", 499000)} style={{ width: '100%', padding: '18px', background: '#fff', color: '#2155FF', borderRadius: '15px', border: '2px solid #2155FF', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', transition: '0.3s' }}>Buy Yearly (Save 20%)</button>
        </div>
      </div>

    </div>
  </div>
</section>

      {/* MASSIVE 3D SUPPORT SECTION */}
      <section id="support" style={{ padding: '140px 5vw', textAlign: 'center', background: '#fff', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glowing Orbs behind the support card */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(37,211,102,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none' }}></div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', padding: '100px 50px', borderRadius: '60px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 40px 100px rgba(0,0,0,0.08)', position: 'relative', zIndex: 10, animation: 'floatAnimation 6s infinite ease-in-out' }}>
          
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🤝</div>
          <h3 style={{ fontSize: '3.8rem', fontWeight: 800, marginBottom: '25px', letterSpacing: '-1.5px', color: '#111' }}>We're always here to help.</h3>
          <p style={{ fontSize: '1.4rem', color: '#555', marginBottom: '50px', fontWeight: 600, maxWidth: '700px', margin: '0 auto 50px', lineHeight: '1.6' }}>Have a question about setting up your shop? Our dedicated support team is available to ensure your business never stops running.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', flexWrap: 'wrap' }}>
            <a href="https://wa.me/917049189001" style={{ background: '#25D366', color: '#fff', padding: '20px 45px', borderRadius: '40px', textDecoration: 'none', fontWeight: 800, fontSize: '1.3rem', boxShadow: '0 15px 35px rgba(37,211,102,0.4)', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.3s' }} onMouseOver={e => e.target.style.transform='scale(1.05)'} onMouseOut={e => e.target.style.transform='scale(1)'}>
              <span style={{fontSize: '1.6rem'}}>💬</span> WhatsApp Support
            </a>
            <div style={{ background: '#f8f9fa', padding: '20px 45px', borderRadius: '40px', fontWeight: 800, color: '#111', fontSize: '1.3rem', border: '2px solid #eee', display: 'flex', alignItems: 'center' }}>
              vyaparsetu.customersupport@gmail.com
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '50px', textAlign: 'center', color: '#888', fontWeight: 700, borderTop: '2px solid #f5f5f5', fontSize: '1.1rem' }}>
        © 2026 VyaparSetu. Built for the future of Indian retail.
      </footer>
    </div>
  );
}

export default Home;