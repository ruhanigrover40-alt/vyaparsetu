import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home'; // 1. IMPORT THE NEW HOME PAGE
import Login from './pages/Login';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Khata from './pages/Khata';

function App() {
  const [shopDetails, setShopDetails] = useState(() => {
    const saved = localStorage.getItem('vyaparShops_DB');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (shopDetails) {
      localStorage.setItem('vyaparShops_DB', JSON.stringify(shopDetails));
    } else {
      localStorage.removeItem('vyaparShops_DB');
    }
  }, [shopDetails]);

  return (
    <Router>
      <Routes>
        {/* 2. SET HOME AS THE MAIN ROUTE */}
        <Route path="/" element={<Home />} />
        
        {/* 3. LOGIN IS NOW ON ITS OWN ROUTE */}
        <Route path="/login" element={<Login setShopDetails={setShopDetails} />} />
        <Route path="/khata" element={<Khata shopDetails={shopDetails} setShopDetails={setShopDetails} />} />
        <Route 
          path="/inventory" 
          element={shopDetails ? <Inventory shopDetails={shopDetails} setShopDetails={setShopDetails} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/billing" 
          element={shopDetails ? <Billing shopDetails={shopDetails} setShopDetails={setShopDetails} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;