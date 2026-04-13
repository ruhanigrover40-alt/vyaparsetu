import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Login({ setShopDetails }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isRegisteringInitial = location.state?.register || false;
  
  const [isRegistering, setIsRegistering] = useState(isRegisteringInitial);
  const [shopId, setShopId] = useState('');
  const [shopName, setShopName] = useState('');
  const [contactInfo, setContactInfo] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? 'https://vyaparsetu-backend.onrender.com/api/register' : 'https://vyaparsetu-backend.onrender.com/api/login';
    
    const payload = isRegistering 
      ? { shopId, shopName, contactInfo, password } 
      : { shopId, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setShopDetails({
          id: data.user.shopId,
          name: data.user.shopName,
          isPremium: data.user.isPremium
        });
        navigate('/inventory');
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the server. Is your backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const method = window.prompt("Forgot Password?\n\nEnter your registered Email or Phone Number below to receive a reset link:");
    if (method) {
      alert(`A password reset link has been sent to: ${method}\n\n(Note: This is a simulation for the presentation)`);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'linear-gradient(-45deg, #FFCFF5, #D6E4FF, #D5E8D4, #FFECB3)', backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite', fontFamily: '"Outfit", sans-serif' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        /* Stunning Background Animations */
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes blobFloat1 { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0, 0) scale(1); } }
        @keyframes blobFloat2 { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-50px, 30px) scale(0.95); } 66% { transform: translate(20px, -20px) scale(1.05); } 100% { transform: translate(0, 0) scale(1); } }
        
        /* UI Entrance Animations */
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmerText { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .animated-logo {
          background: linear-gradient(to right, #000 15%, #E91E63 40%, #9C27B0 60%, #000 85%);
          background-size: 200% auto; color: transparent; -webkit-background-clip: text;
          animation: shimmerText 5s linear infinite; text-align: center; margin: 0 0 5px 0;
          font-size: 3rem; font-weight: 900; letter-spacing: -1.5px; cursor: pointer;
          transition: transform 0.3s ease;
        }
        .animated-logo:hover { transform: scale(1.05); }

        .input-group { position: relative; margin-bottom: 22px; }
        .input-label { display: block; margin-bottom: 8px; font-weight: 800; color: #555; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
        
        .login-input { 
          width: 100%; padding: 18px 22px; border-radius: 18px; border: 2px solid transparent; 
          font-size: 1.1rem; font-family: inherit; font-weight: 600; color: #333; 
          background: rgba(255,255,255,0.7); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-sizing: border-box; 
        }
        .login-input:focus { outline: none; border-color: #E91E63; background: #fff; box-shadow: 0 0 0 5px rgba(233, 30, 99, 0.1), 0 10px 20px rgba(0,0,0,0.05); transform: translateY(-2px); }
        
        .eye-btn {
          position: absolute; right: 15px; top: 40px; background: rgba(255,255,255,0.8); border: none;
          font-size: 1.2rem; cursor: pointer; color: #555; transition: 0.2s; padding: 6px; border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;
        }
        .eye-btn:hover { color: #E91E63; transform: scale(1.1); background: #fff; }

        .login-btn { 
          width: 100%; padding: 22px; border-radius: 18px; border: none; background: linear-gradient(135deg, #111, #333); 
          color: #fff; font-size: 1.2rem; font-weight: 800; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          margin-top: 15px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); letter-spacing: 0.5px;
        }
        .login-btn:hover { background: linear-gradient(135deg, #E91E63, #C2185B); transform: translateY(-5px); box-shadow: 0 20px 40px rgba(233, 30, 99, 0.3); }
        .login-btn:disabled { background: #ccc; cursor: not-allowed; transform: none; box-shadow: none; }

        .forgot-link { color: #888; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: 0.2s; text-align: right; display: inline-block; margin-top: 10px; width: 100%; }
        .forgot-link:hover { color: #E91E63; }

        /* Sleek Back Button */
        .back-btn {
          position: absolute; top: 30px; left: 5vw; background: rgba(255,255,255,0.6); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.8); color: #333; padding: 12px 25px; border-radius: 20px;
          font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          z-index: 100; font-family: inherit; display: flex; align-items: center; gap: 8px;
        }
        .back-btn:hover { background: #fff; transform: translateX(-5px); box-shadow: 0 15px 25px rgba(0,0,0,0.1); color: #E91E63; }
      `}</style>

      {/* FLOATING BACKGROUND BLOBS */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(233,30,99,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', animation: 'blobFloat1 20s infinite alternate', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37,211,102,0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', animation: 'blobFloat2 25s infinite alternate', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', top: '40%', left: '60%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(156,39,176,0.1) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', animation: 'blobFloat1 18s infinite alternate-reverse', zIndex: 0, pointerEvents: 'none' }}></div>

      {/* THE BACK BUTTON */}
      <button onClick={() => navigate('/')} className="back-btn">
        <span style={{ fontSize: '1.2rem' }}>←</span> Back to Home
      </button>

      {/* Main Form Container */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 10 }}>
        
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(30px)', padding: '50px', borderRadius: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 40px 80px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5)', animation: 'slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div onClick={() => navigate('/')} className="animated-logo">VyaparSetu</div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#333' }}>
              {isRegistering ? 'Start Your Journey.' : 'Welcome Back.'}
            </h2>
          </div>

          {error && (
            <div style={{ background: '#FFEBEE', color: '#D32F2F', padding: '15px', borderRadius: '15px', marginBottom: '25px', fontWeight: 700, textAlign: 'center', border: '1px solid rgba(211, 47, 47, 0.2)', fontSize: '0.95rem', animation: 'slideUpFade 0.3s ease-out' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {isRegistering && (
              <div style={{ animation: 'slideUpFade 0.4s ease-out both', animationDelay: '0.1s' }}>
                <div className="input-group">
                  <label className="input-label">SHOP NAME</label>
                  <input type="text" className="login-input" placeholder="e.g. Sharma General Store" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
                </div>
                
                <div className="input-group">
                  <label className="input-label">EMAIL OR PHONE <span style={{color: '#E91E63'}}>*</span></label>
                  <input type="text" className="login-input" placeholder="For password recovery" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="input-group" style={{ animation: 'slideUpFade 0.4s ease-out both', animationDelay: isRegistering ? '0.2s' : '0.1s' }}>
              <label className="input-label">LOGIN ID (USERNAME)</label>
              <input type="text" className="login-input" placeholder="e.g. sharma123" value={shopId} onChange={(e) => setShopId(e.target.value)} required />
            </div>

            <div className="input-group" style={{ animation: 'slideUpFade 0.4s ease-out both', animationDelay: isRegistering ? '0.3s' : '0.2s' }}>
              <label className="input-label">PASSWORD</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="login-input" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
              
              {!isRegistering && (
                <span className="forgot-link" onClick={handleForgotPassword}>Forgot Password?</span>
              )}
            </div>

            <div style={{ animation: 'slideUpFade 0.4s ease-out both', animationDelay: isRegistering ? '0.4s' : '0.3s' }}>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Processing...' : (isRegistering ? 'Create Store Account' : 'Login Securely')}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '30px', fontWeight: 600, color: '#777', fontSize: '1rem', animation: 'slideUpFade 0.4s ease-out both', animationDelay: isRegistering ? '0.5s' : '0.4s' }}>
            {isRegistering ? 'Already have an account? ' : 'New to VyaparSetu? '}
            <span 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); }} 
              style={{ color: '#E91E63', cursor: 'pointer', fontWeight: 800, padding: '5px 10px', borderRadius: '10px', transition: '0.2s' }}
              onMouseOver={(e) => e.target.style.background = 'rgba(233, 30, 99, 0.1)'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              {isRegistering ? 'Login here' : 'Create an account'}
            </span>
          </div>
          
        </div>
      </div>

    </div>
  );
}

export default Login;