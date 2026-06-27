import { useState, useEffect } from 'react';
import { FiUserPlus, FiLayout } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Navbar({ onSignIn, onSignUp, onSelectProduct, onSelectPricing, onSelectEnterprise, isAuthenticated, onDashboard }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  let activeTab = 'product';
  if (location.pathname.endsWith('/pricing') || location.pathname.endsWith('/pricing/')) {
    activeTab = 'pricing';
  } else if (location.pathname.includes('/docs')) {
    activeTab = 'docs';
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`vs-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="vs-header-left">
        {/* Logo and Brand Name */}
        <a href="#" className="vs-logo-group" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <span className="vs-logo-icon">
            <img src="/boxty.svg" width="18" height="18" alt="boxty" />
          </span>
          <span className="vs-brand-name">boxty</span>
        </a>

        {/* Separator Pipe */}
        <div className="vs-header-separator"></div>

        {/* Main Nav Links (Left side) */}
        <nav className="vs-nav-desktop">
          <span 
            className={`vs-nav-link ${activeTab === 'product' ? 'active' : ''}`} 
            onClick={() => {
              if (activeTab !== 'product') {
                navigate('/');
              } else if (onSelectProduct) {
                onSelectProduct();
              }
            }}
          >
            product
          </span>
          <span 
            className={`vs-nav-link ${activeTab === 'pricing' ? 'active' : ''}`} 
            onClick={() => {
              if (activeTab !== 'pricing') {
                navigate('/pricing');
              } else if (onSelectPricing) {
                onSelectPricing();
              }
            }}
          >
            pricing
          </span>
          <span 
            className={`vs-nav-link ${activeTab === 'docs' ? 'active' : ''}`} 
            onClick={() => {
              navigate('/docs');
            }}
          >
            docs
          </span>
        </nav>
      </div>

      {/* Auth Actions (Right side) */}
      <div className="vs-header-actions vs-desktop-only">
        {isAuthenticated ? (
          <button type="button" className="vs-btn-signup" onClick={onDashboard}>
            <FiLayout style={{ marginRight: '6px', verticalAlign: 'middle' }} /> dashboard
          </button>
        ) : (
          <>
            <span className="vs-nav-link" onClick={onSignIn}>sign in</span>
            <button type="button" className="vs-btn-signup" onClick={onSignUp}>
              <FiUserPlus style={{ marginRight: '6px', verticalAlign: 'middle' }} /> sign up
            </button>
          </>
        )}
      </div>

      {/* Mobile Burger Menu Toggle */}
      <button 
        type="button" 
        className="vs-burger" 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="vs-mobile-drawer">
          <span 
            className={`vs-mobile-link ${activeTab === 'product' ? 'active' : ''}`} 
            onClick={() => { 
              setMobileMenuOpen(false); 
              if (activeTab !== 'product') {
                navigate('/');
              } else if (onSelectProduct) {
                onSelectProduct();
              }
            }}
          >
            product
          </span>
          <span 
            className={`vs-mobile-link ${activeTab === 'pricing' ? 'active' : ''}`} 
            onClick={() => { 
              setMobileMenuOpen(false); 
              if (activeTab !== 'pricing') {
                navigate('/pricing');
              } else if (onSelectPricing) {
                onSelectPricing();
              }
            }}
          >
            pricing
          </span>
          <span 
            className={`vs-mobile-link ${activeTab === 'docs' ? 'active' : ''}`} 
            onClick={() => { 
              setMobileMenuOpen(false); 
              navigate('/docs');
            }}
          >
            docs
          </span>
          <div className="vs-mobile-divider"></div>
          {isAuthenticated ? (
            <span className="vs-mobile-link" onClick={() => { setMobileMenuOpen(false); if (onDashboard) onDashboard(); }}>dashboard</span>
          ) : (
            <>
              <span className="vs-mobile-link" onClick={() => { setMobileMenuOpen(false); if (onSignIn) onSignIn(); }}>sign in</span>
              <button 
                type="button" 
                className="vs-btn-signup-mobile" 
                onClick={() => { setMobileMenuOpen(false); if (onSignUp) onSignUp(); }}
              >
                <FiUserPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> sign up
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
