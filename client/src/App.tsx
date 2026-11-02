import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CrmPipeline from './pages/CrmPipeline';
import OutreachCenter from './pages/OutreachCenter';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import Onboarding from './components/Onboarding';
import TopUpModal from './components/TopUpModal';
import LeadFinder from './pages/LeadFinder';
import Audience from './pages/Audience';
import Automations from './pages/Automations';
import Integrations from './pages/Integrations';
import Team from './pages/Team';
import Appointments from './pages/Appointments';
import AdminPanel from './pages/AdminPanel';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import RefundPolicy from './pages/RefundPolicy';

import MeshBackground from './components/MeshBackground';
import ErrorBoundary from './components/ErrorBoundary';
import AppConfirmModal from './components/AppConfirmModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useStore();
  if (!token) return <Navigate to="/" replace />;
  return <div className="saas-platform min-h-screen w-full relative">{children}</div>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useStore();
  if (!token) return <Navigate to="/" replace />;

  const roleClean = (user?.role || '').toUpperCase();
  const emailClean = (user?.email || '').toLowerCase().trim();
  const isSuper = roleClean === 'SUPER_ADMIN' || emailClean === 'ashleyghose64@gmail.com';

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF8F5]">
        <div className="flex items-center gap-2 text-xs font-delight font-semibold text-[#191716]">
          <span className="w-4 h-4 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Super Admin...</span>
        </div>
      </div>
    );
  }

  if (!isSuper) return <Navigate to="/dashboard" replace />;
  return <div className="saas-platform min-h-screen w-full relative">{children}</div>;
};

const App = () => {
  const { user, token, refreshUserProfile, setUpgradeModalOpen, setUpgradeTab } = useStore();
  const [showLogin, setShowLogin] = useState(false);

  // Handle external checkout funneling (e.g. from marketing campaigns)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const plan = urlParams.get('plan');
      const billing = urlParams.get('billing');

      if (action === 'upgrade' || action === 'checkout') {
        const payload = { action, plan: plan || 'basic', billing: billing || 'monthly' };
        sessionStorage.setItem('strovr_pending_checkout', JSON.stringify(payload));
        
        if (token) {
          setUpgradeTab('plans');
          setUpgradeModalOpen(true);
        } else {
          // If logged out, funnel directly into login
          setShowLogin(true);
        }
      } else if (token) {
        const pending = sessionStorage.getItem('strovr_pending_checkout');
        if (pending) {
          setUpgradeTab('plans');
          setUpgradeModalOpen(true);
        }
      }
    } catch (_) {}
  }, [token, setUpgradeTab, setUpgradeModalOpen]);

  useEffect(() => {
    if (token) {
      refreshUserProfile();
    }
    const handleFocus = () => {
      if (token) {
        refreshUserProfile();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, refreshUserProfile]);

  return (
    <BrowserRouter>
      <div className="saas-platform">
        <AppConfirmModal />
      </div>
      {showLogin && !token && (
        <div className="saas-platform">
          <Login onBack={() => setShowLogin(false)} />
        </div>
      )}
      <div className="min-h-screen w-full max-w-full overflow-x-hidden font-sans text-charcoal relative">
        {token && <MeshBackground variant="platform" />}
        {user && !user.onboarding_complete && token && (
          <div className="saas-platform">
            <Onboarding />
          </div>
        )}
        {token && (
          <div className="saas-platform">
            <TopUpModal />
          </div>
        )}
        
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Landing onLogin={() => setShowLogin(true)} />
              )
            } />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/finder" element={<ProtectedRoute><LeadFinder /></ProtectedRoute>} />
            <Route path="/crm" element={<ProtectedRoute><CrmPipeline /></ProtectedRoute>} />
            <Route path="/appointments" element={<Navigate to="/crm" replace />} />
            <Route path="/outreach" element={<ProtectedRoute><OutreachCenter /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            
            <Route path="/audience" element={<ProtectedRoute><Audience /></ProtectedRoute>} />
            <Route path="/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            
            <Route path="/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login" element={<Login onBack={() => window.location.href = '/'} />} />
            
            {/* Mandatory Public Legal & Compliance Pages (RBI / DPDP / Consumer Protection) */}
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/cancellation-policy" element={<RefundPolicy />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
};

export default App;
