import { useRef, useState, useEffect } from 'react';
import { FiArrowUpRight, FiBookOpen, FiTerminal, FiArrowRight, FiX } from 'react-icons/fi';
import Navbar from './Navbar';
import LandingCanvas from './LandingCanvas';
import SandboxEditor from './SandboxEditor';
import SshVisualizer from './SshVisualizer';
import GpuVisualizer from './GpuVisualizer';
import UseCasesCarousel from './UseCasesCarousel';
import CtaGrid from './CtaGrid';
import './LandingPage.css';

export default function LandingPage({ onLogin, onViewHowItWorks, onViewUsageExamples, isAuthenticated, onDashboard }) {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    document.title = 'boxty | secure code execution & compute';
  }, []);

  function handleConnect(e) {
    e.preventDefault();
    setError('');

    if (!accessCode.trim()) {
      setError('Please enter your workspace access code.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(accessCode);
    }, 600);
  }

  function handleGetStarted() {
    setShowAccess(true);
    setError('');
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  return (
    <div className="vaultsync-landing">
      {/* Top Navbar */}
      <Navbar 
        onSignIn={handleGetStarted}
        onSignUp={handleGetStarted}
        onSelectProduct={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onSelectPricing={handleGetStarted}
        onSelectEnterprise={handleGetStarted}
        isAuthenticated={isAuthenticated}
        onDashboard={onDashboard}
      />

      <div className="vs-wide-container">
        {/* Vertically Stacked Hero Content Area */}
        <main className="vs-hero-layout">
          {/* Hero Content (Left Aligned) */}
          <div className="vs-hero-content">
            <h1 className="vs-headline">
              Secure Code Execution<br />
              &amp; On-Demand Compute
            </h1>

            <p className="vs-subheadline">
              boxty delivers secure, ephemeral sandboxes and auto-scaling GPU runtimes to execute untrusted code, tools, and heavy workloads for AI agents.
            </p>

            <div className="vs-hero-actions">
              <button type="button" className="vs-btn-primary" onClick={handleGetStarted}>
                Get Started for Free <FiArrowUpRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
              <button type="button" className="vs-btn-secondary" onClick={onViewHowItWorks}>
                View Docs <FiBookOpen style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
            </div>
            <div className="vs-hero-hint">$20 free compute</div>
          </div>
        </main>
      </div>

      {/* Full-width Grid Canvas Visualizer directly under hero content */}
      <div className="vs-full-width-canvas vs-dot-grid-bg">
        <LandingCanvas />
      </div>

      {/* Platform Utilities grid section */}
      <div className="vs-wide-container">
        <section className="vs-utility-section">
          <div className="vs-section-header">
            <h2 className="vs-section-title">
              Isolated sandbox execution environments for AI agents and model operations
            </h2>
          </div>
          <div className="vs-utility-grid">
            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroAgent />
              </div>
              <h3 className="vs-card-title">[01] Agents</h3>
              <p className="vs-card-desc">Run autonomous AI agents in secure, isolated, and ephemeral sandboxes with full filesystem access and tools execution capabilities.</p>
            </div>
            
            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroDataAnalysis />
              </div>
              <h3 className="vs-card-title">[02] AI Data Analysis</h3>
              <p className="vs-card-desc">Execute complex data analysis tasks, run python notebooks, manipulate large datasets, and render custom charts or reports securely.</p>
            </div>

            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroRL />
              </div>
              <h3 className="vs-card-title">[03] Reinforcement Learning</h3>
              <p className="vs-card-desc">Train reinforcement learning agents, execute virtual simulations, run policy trials, and record state transitions in a safe sandbox environment.</p>
            </div>

            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroModelTraining />
              </div>
              <h3 className="vs-card-title">[04] Model Training</h3>
              <p className="vs-card-desc">Run training loops and fine-tune models on custom data in isolated spaces without compromising the security of host infrastructure.</p>
            </div>

            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroModelInference />
              </div>
              <h3 className="vs-card-title">[05] Model Inference</h3>
              <p className="vs-card-desc">Spin up prediction engines, serve inference endpoints for mock testing, and evaluate new checkpoints in containerized instances.</p>
            </div>

            <div className="vs-utility-card">
              <div className="vs-micro-wrapper">
                <MicroComputerUse />
              </div>
              <h3 className="vs-card-title">[06] Computer Use</h3>
              <p className="vs-card-desc">Allow AI models to interact with virtual desktops, control mouse and keyboard, scrape web interfaces, and execute browser automation securely.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Code SDK Section */}
      <div className="vs-wide-container">
        <section className="vs-sdk-section">
          <div className="vs-sdk-layout">
            {/* Left Column: Description */}
            <div className="vs-sdk-info">
              <h2 className="vs-sdk-title">Launch sandboxes programmatically</h2>
              <p className="vs-sdk-desc">
                Integrate secure execution into your agent pipeline with our lightweight Python SDK. Spawning isolated micro-runtimes takes less than a second, giving your agents complete freedom to execute code safely.
              </p>
              <ul className="vs-sdk-features">
                <li>Complete filesystem & process isolation</li>
                <li>Pre-installed packages or custom requirements</li>
                <li>Automatic cleanup and custom idle timeouts</li>
              </ul>
            </div>

            {/* Right Column: Sandbox Editor Mockup */}
            <div className="vs-sdk-visualizer-container vs-dot-grid-bg">
              <SandboxEditor />
            </div>
          </div>
        </section>
      </div>

      {/* SSH from any machine Section */}
      <div className="vs-wide-container">
        <section className="vs-ssh-section">
          {/* Row 1: Left Intro Column and Right Empty Column */}
          <div className="vs-ssh-row1">
            <div className="vs-ssh-intro-left">
              <h2 className="vs-ssh-title">SSH from any machine</h2>
              <p className="vs-ssh-desc-large">
                A named sandbox isn't only an execution surface &mdash; it's a portable cloud workstation. Register your key once, then <span className="vs-code-inline">ssh</span> in, or open it in <strong>VS Code</strong>, <strong>Cursor</strong>, or <strong>JetBrains Gateway</strong> over Remote-SSH. <span className="vs-code-inline">scp</span>, <span className="vs-code-inline">rsync</span>, and full port-forwarding all ride the same connection.
              </p>
              <div className="vs-ssh-buttons">
                <button type="button" className="vs-btn-primary">
                  <FiBookOpen style={{ marginRight: '6px', verticalAlign: 'middle' }} /> REMOTE DEV DOCS
                </button>
                <button type="button" className="vs-btn-secondary">
                  <FiTerminal style={{ marginRight: '6px', verticalAlign: 'middle' }} /> SSH &amp; PTY
                </button>
              </div>
            </div>
            <div className="vs-ssh-row1-right-empty"></div>
          </div>

          {/* Row 2: SSH visualizer */}
          <div className="vs-ssh-row2 vs-dot-grid-bg">
            <SshVisualizer />
          </div>
        </section>
      </div>

      {/* Observability & Auto-scale GPU Section */}
      <div className="vs-wide-container">
        <section className="vs-obs-section">
          {/* Left Column: Title and Description */}
          <div className="vs-obs-left">
            <h2 className="vs-obs-title">Out of the box observability</h2>
            <p className="vs-obs-desc-large">
              Monitor agent resource footprints, custom environments, and container runtime statistics in real-time. Automatically scale up GPU execution tasks using dynamically allocated NVIDIA H100 or A100 nodes, running only when your model prompts demand compute.
            </p>
          </div>

          {/* Right Column: GPU live graph visualizer */}
          <div className="vs-obs-right vs-dot-grid-bg">
            <GpuVisualizer />
          </div>
        </section>
      </div>

      {/* Use Cases Carousel Section */}
      <div className="vs-wide-container">
        <UseCasesCarousel />
      </div>

      {/* CTA Section */}
      <div className="vs-wide-container">
        <section className="vs-cta-section">
          <div className="vs-cta-left">
            <h2 className="vs-cta-title">Ship your first app in minutes</h2>
            <p className="vs-cta-desc">
              Build, run, and monitor secure sandboxes for your AI agents programmatically. Start coding today and get free compute credits instantly.
            </p>
            <div className="vs-cta-actions">
              <button type="button" className="vs-btn-cta" onClick={() => setShowAccess(true)}>
                GET STARTED <FiArrowRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
              <span className="vs-cta-hint">$20 free compute</span>
            </div>
          </div>
          <div className="vs-cta-right vs-dot-grid-bg">
            <CtaGrid />
          </div>
        </section>
      </div>

      <div className="vs-wide-container">
        {/* Footer */}
        <footer className="vs-footer">
          <div>
            &copy; 2026 boxty. All rights reserved. &bull; brought to you by <a href="https://staticlabs.ro" target="_blank" rel="noopener noreferrer" className="vs-footer-labs-link">staticlabs</a>
          </div>
          <div className="vs-footer-links">
            <span className="vs-footer-link" onClick={onViewHowItWorks}>How It Works</span>
            <span className="vs-footer-link" onClick={onViewUsageExamples}>Usage Examples</span>
          </div>
        </footer>
      </div>

      {/* Workspace Access Modal Overlay */}
      {showAccess && (
        <div className="vs-modal-overlay" onClick={() => setShowAccess(false)}>
          <div className="vs-modal-card" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="vs-modal-close" 
              onClick={() => setShowAccess(false)}
              aria-label="Close modal"
            >
              <FiX size={18} />
            </button>

            <div className="vs-modal-header">
              <h2 className="vs-modal-title">Connect Workspace</h2>
              <p className="vs-modal-desc">Enter your workspace access code below to launch your sandbox console.</p>
            </div>

            <form onSubmit={handleConnect}>
              <div className="vs-form-group">
                <label className="vs-input-label" htmlFor="access-code-input">Workspace Access Code</label>
                <input
                  id="access-code-input"
                  ref={inputRef}
                  type="password"
                  placeholder="Enter access code..."
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setError('');
                  }}
                  className="vs-input"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <button type="submit" className="vs-btn-submit" disabled={loading}>
                {loading ? 'Opening Console...' : (
                  <>
                    Open Console <FiArrowRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                  </>
                )}
              </button>

              {error && <div className="vs-error-message">{error}</div>}
              {!error && <p className="vs-success-message">Access remains scoped to your approved sandbox workspaces.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const agentSteps = [
  '> init sandbox...',
  '> mounting vol/',
  '> exec script.py',
  '> latency: 42ms',
  '> status: active',
  '✓ task complete'
];

function MicroAgent() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % agentSteps.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="vs-micro-agent">
      <div className="vs-micro-header">
        <span className="vs-micro-dot red"></span>
        <span className="vs-micro-dot yellow"></span>
        <span className="vs-micro-dot green"></span>
        <span className="vs-micro-status">agent.log</span>
      </div>
      <div className="vs-micro-body">
        {agentSteps.slice(0, step + 1).map((text, i) => (
          <div 
            key={i} 
            className={`vs-micro-line ${text.startsWith('✓') ? 'success' : ''}`}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

function MicroDataAnalysis() {
  const [val, setVal] = useState([40, 70, 50, 90]);

  useEffect(() => {
    const timer = setInterval(() => {
      setVal((v) => v.map(() => Math.floor(Math.random() * 60) + 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="vs-micro-data">
      <div className="vs-micro-chart">
        {val.map((height, i) => (
          <div 
            key={i} 
            className="vs-micro-bar" 
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
      <div className="vs-micro-metrics">
        <span>acc: 98.4%</span>
        <span className="vs-pulse-dot"></span>
      </div>
    </div>
  );
}

function MicroRL() {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPosition((p) => (p + 1) % 4);
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="vs-micro-rl">
      <svg className="vs-micro-rl-svg" viewBox="0 0 100 50">
        <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        <polyline 
          points="10,25 40,25 40,10 70,10 70,35 90,35" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.1)" 
          strokeWidth="1.5" 
          strokeDasharray="3,3"
        />

        <circle cx="90" cy="35" r="4" fill="var(--vs-accent)" className="vs-glow-node" />
        
        <circle 
          cx={10 + position * 26.6} 
          cy={25 + (position === 2 ? -15 : position === 3 ? 10 : 0)} 
          r="4.5" 
          fill="#ffffff" 
          stroke="var(--vs-accent)" 
          strokeWidth="1.5"
          style={{ transition: 'all 0.4s ease' }}
        />
      </svg>
      <div className="vs-micro-label">reward: +1.00</div>
    </div>
  );
}

function MicroModelTraining() {
  const [epoch, setEpoch] = useState(1);
  const [loss, setLoss] = useState(0.85);

  useEffect(() => {
    const timer = setInterval(() => {
      setEpoch((e) => {
        const nextEpoch = (e % 10) + 1;
        setLoss(Math.max(0.08, (0.85 * Math.pow(0.75, nextEpoch - 1)).toFixed(3)));
        return nextEpoch;
      });
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="vs-micro-training-descriptive">
      <svg className="vs-micro-nn-svg" viewBox="0 0 80 50">
        {/* Connection lines */}
        <line x1="15" y1="15" x2="40" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="15" x2="40" y2="25" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="15" x2="40" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="35" x2="40" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="35" x2="40" y2="25" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="15" y1="35" x2="40" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        
        <line x1="40" y1="10" x2="65" y2="25" stroke="rgba(0, 255, 102, 0.2)" strokeWidth="1" />
        <line x1="40" y1="25" x2="65" y2="25" stroke="rgba(0, 255, 102, 0.2)" strokeWidth="1" />
        <line x1="40" y1="40" x2="65" y2="25" stroke="rgba(0, 255, 102, 0.2)" strokeWidth="1" />

        {/* Input Nodes */}
        <circle cx="15" cy="15" r="3" fill="#333" />
        <circle cx="15" cy="35" r="3" fill="#333" />

        {/* Hidden Nodes */}
        <circle cx="40" cy="10" r="3" fill="var(--vs-accent)" className="vs-pulse-node-slow" />
        <circle cx="40" cy="25" r="3" fill="var(--vs-accent)" className="vs-pulse-node-fast" />
        <circle cx="40" cy="40" r="3" fill="var(--vs-accent)" className="vs-pulse-node-slow" />

        {/* Output Node */}
        <circle cx="65" cy="25" r="4" fill="#ffffff" />
      </svg>
      <div className="vs-training-meta-descriptive">
        <span>ep: {epoch}/10</span>
        <span className="vs-accent-text">loss: {loss}</span>
      </div>
    </div>
  );
}

function MicroModelInference() {
  return (
    <div className="vs-micro-inference-descriptive">
      <div className="vs-inf-bubble">prompt: "hello"</div>
      <div className="vs-inf-pipeline">
        <span className="vs-inf-pulse-dot"></span>
      </div>
      <div className="vs-inf-bubble output">tokens: "world"</div>
      <div className="vs-inf-meta-descriptive">94.8 tok/s</div>
    </div>
  );
}

function MicroComputerUse() {
  const [searchStep, setSearchStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchStep((s) => (s + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="vs-micro-computer-descriptive">
      <div className="vs-window-header">
        <div className="vs-window-buttons">
          <span></span><span></span><span></span>
        </div>
        <div className="vs-window-address">web.search</div>
      </div>
      <div className="vs-window-body-descriptive">
        {searchStep === 0 && (
          <div className="vs-web-page">
            <div className="vs-web-input">[ boxty ]</div>
            <div className="vs-web-btn">search</div>
            <div className="vs-web-cursor step-0"></div>
          </div>
        )}
        {searchStep === 1 && (
          <div className="vs-web-page">
            <div className="vs-web-input">[ boxty ]</div>
            <div className="vs-web-btn clicked">search</div>
            <div className="vs-web-cursor step-1"></div>
          </div>
        )}
        {searchStep === 2 && (
          <div className="vs-web-page results">
            <div className="vs-web-result-link">boxty.dev ↗</div>
            <div className="vs-web-result-desc">programmatic...</div>
          </div>
        )}
      </div>
    </div>
  );
}
