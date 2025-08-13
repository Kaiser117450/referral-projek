import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReferralLandingPage from '@/pages/ReferralLandingPage';
import ClaimPage from '@/pages/ClaimPage';
import CashierDashboard from '@/pages/CashierDashboard';
import ReferrerDashboard from '@/pages/ReferrerDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Routes>
            {/* Main referral landing page */}
            <Route path="/ref/:code" element={<ReferralLandingPage />} />
            
            {/* Claim page with timer */}
            <Route path="/claim/:rewardId" element={<ClaimPage />} />
            
            {/* Cashier dashboard */}
            <Route path="/cashier" element={<CashierDashboard />} />
            
            {/* Referrer dashboard (demo) */}
            <Route path="/" element={<ReferrerDashboard />} />
            
            {/* Fallback route */}
            <Route path="*" element={<ReferrerDashboard />} />
          </Routes>
        </motion.div>
      </div>
    </Router>
  );
}

export default App;


