import { useState, useEffect } from 'react';
import { FiUserPlus } from 'react-icons/fi';

export default function Navbar({ onSignIn, onSignUp, onSelectProduct, onSelectPricing, onSelectEnterprise }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('product');
  const [scrolled, setScrolled] = useState(false);

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
        <a href="#" className="vs-logo-group" onClick={(e) => { e.preventDefault(); }}>
          <span className="vs-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
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
              setActiveTab('product');
              if (onSelectProduct) onSelectProduct();
            }}
          >
            product
          </span>
          <span 
            className={`vs-nav-link ${activeTab === 'pricing' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('pricing');
              if (onSelectPricing) onSelectPricing();
            }}
          >
            pricing
          </span>
          <span 
            className={`vs-nav-link ${activeTab === 'enterprise' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('enterprise');
              if (onSelectEnterprise) onSelectEnterprise();
            }}
          >
            enterprise
          </span>
        </nav>
      </div>

      {/* Auth Actions (Right side) */}
      <div className="vs-header-actions vs-desktop-only">
        <span className="vs-nav-link" onClick={onSignIn}>sign in</span>
        <button type="button" className="vs-btn-signup" onClick={onSignUp}>
          <FiUserPlus style={{ marginRight: '6px', verticalAlign: 'middle' }} /> sign up
        </button>
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
              setActiveTab('product'); 
              setMobileMenuOpen(false); 
              if (onSelectProduct) onSelectProduct(); 
            }}
          >
            product
          </span>
          <span 
            className={`vs-mobile-link ${activeTab === 'pricing' ? 'active' : ''}`} 
            onClick={() => { 
              setActiveTab('pricing'); 
              setMobileMenuOpen(false); 
              if (onSelectPricing) onSelectPricing(); 
            }}
          >
            pricing
          </span>
          <span 
            className={`vs-mobile-link ${activeTab === 'enterprise' ? 'active' : ''}`} 
            onClick={() => { 
              setActiveTab('enterprise'); 
              setMobileMenuOpen(false); 
              if (onSelectEnterprise) onSelectEnterprise(); 
            }}
          >
            enterprise
          </span>
          <div className="vs-mobile-divider"></div>
          <span className="vs-mobile-link" onClick={() => { setMobileMenuOpen(false); if (onSignIn) onSignIn(); }}>sign in</span>
          <button 
            type="button" 
            className="vs-btn-signup-mobile" 
            onClick={() => { setMobileMenuOpen(false); if (onSignUp) onSignUp(); }}
          >
            <FiUserPlus style={{ marginRight: '8px', verticalAlign: 'middle' }} /> sign up
          </button>
        </div>
      )}
    </header>
  );
}
