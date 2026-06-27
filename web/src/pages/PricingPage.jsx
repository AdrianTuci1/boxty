import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import Navbar from '../landing/components/Navbar';
import CtaGrid from '../landing/components/CtaGrid';
import './PricingPage.css';

// Rates definitions
const CPU_RATE_PER_SEC = 0.0000083; // ~$0.03 / hr
const RAM_RATE_PER_SEC = 0.0000014; // ~$0.005 / hr per GB

const CPU_PRESETS = [1, 2, 4, 8, 16];
const RAM_PRESETS = [1, 2, 4, 8, 16, 32, 64];

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, devMode } = useAuth();
  const showDashboard = isAuthenticated || devMode;

  const [cpu, setCpu] = useState(2);
  const [ram, setRam] = useState(4);
  const [hoursPerDay, setHoursPerDay] = useState(24);
  const [numSandboxes, setNumSandboxes] = useState(1);
  
  // Simulation states
  const [simulatedCost, setSimulatedCost] = useState(0);
  const [simTime, setSimTime] = useState(0);

  // Live calculator calculations
  const costPerSecond = (cpu * CPU_RATE_PER_SEC + ram * RAM_RATE_PER_SEC) * numSandboxes;
  const costPerHour = costPerSecond * 3600;
  const costPerDay = costPerHour * hoursPerDay;
  const costPerMonth = costPerDay * 30;

  useEffect(() => {
    document.title = 'boxty | pricing';
  }, []);

  useEffect(() => {
    // Reset simulation on config change
    setSimulatedCost(0);
    setSimTime(0);

    const timer = setInterval(() => {
      setSimTime(t => t + 1);
      setSimulatedCost(c => c + costPerSecond);
    }, 1000);

    return () => clearInterval(timer);
  }, [cpu, ram, numSandboxes, hoursPerDay]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleDashboardRedirect = () => {
    navigate('/apps/adrian-tucicovenco/main');
  };

  return (
    <div className="vaultsync-landing">
      {/* Top Navbar */}
      <Navbar 
        onSignIn={handleLoginRedirect}
        onSignUp={handleLoginRedirect}
        onSelectProduct={() => navigate('/')}
        onSelectPricing={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onSelectEnterprise={handleLoginRedirect}
        isAuthenticated={showDashboard}
        onDashboard={handleDashboardRedirect}
      />

      <div className="vs-wide-container">
        {/* Header Section */}
        <section className="vs-pricing-hero">
          <h1 className="vs-pricing-title">Pay-as-you-go secure compute</h1>
          <p className="vs-pricing-subtitle">
            Get started with $20 in free compute credits. Once exhausted, top up your account with pay-as-you-go funds. Billed strictly per second. No monthly subscriptions, no upfront fees.
          </p>
        </section>

        {/* Live Simulator & Pricing Calculator */}
        <section className="vs-calculator-section">
          <div className="vs-section-header-compact">
            <h2 className="vs-calc-section-title">// Live Compute Calculator</h2>
            <p className="vs-calc-section-desc">
              Estimate your pay-as-you-go sandbox usage. Move the controls to see billing updates in real time.
            </p>
          </div>

          <div className="vs-calculator-layout">
            {/* Left Column: Sliders */}
            <div className="vs-calculator-inputs">
              {/* CPU Selection */}
              <div className="vs-input-group">
                <div className="vs-input-label-row">
                  <span>vCPU Core Allocation</span>
                  <span className="vs-input-val">{cpu} Cores</span>
                </div>
                <div className="vs-preset-buttons">
                  {CPU_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`vs-preset-btn ${cpu === val ? 'active' : ''}`}
                      onClick={() => setCpu(val)}
                    >
                      {val} Core{val > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAM Selection */}
              <div className="vs-input-group">
                <div className="vs-input-label-row">
                  <span>RAM Capacity</span>
                  <span className="vs-input-val">{ram} GB</span>
                </div>
                <div className="vs-preset-buttons">
                  {RAM_PRESETS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      className={`vs-preset-btn ${ram === val ? 'active' : ''}`}
                      onClick={() => setRam(val)}
                    >
                      {val} GB
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandboxes slider */}
              <div className="vs-input-group">
                <div className="vs-input-label-row">
                  <span>Concurrent Sandboxes</span>
                  <span className="vs-input-val">{numSandboxes}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={numSandboxes}
                  onChange={(e) => setNumSandboxes(parseInt(e.target.value))}
                  className="vs-slider"
                />
              </div>

              {/* Hours per Day slider */}
              <div className="vs-input-group">
                <div className="vs-input-label-row">
                  <span>Expected Usage Duration</span>
                  <span className="vs-input-val">{hoursPerDay} hrs / day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                  className="vs-slider"
                />
              </div>
            </div>

            {/* Right Column: Output & Terminal simulation */}
            <div className="vs-calculator-outputs">
              <div className="vs-metrics-grid">
                <div className="vs-metric-box">
                  <div className="vs-metric-label">per second</div>
                  <div className="vs-metric-value monospace">${costPerSecond.toFixed(8)}</div>
                </div>
                <div className="vs-metric-box">
                  <div className="vs-metric-label">per hour</div>
                  <div className="vs-metric-value monospace">${costPerHour.toFixed(4)}</div>
                </div>
                <div className="vs-metric-box">
                  <div className="vs-metric-label">per month (est)</div>
                  <div className="vs-metric-value monospace">${costPerMonth.toFixed(2)}</div>
                </div>
              </div>

              {/* Live Ticking Terminal Simulation */}
              <div className="vs-terminal-sim">
                <div className="vs-terminal-header">
                  <div className="vs-terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="vs-terminal-title">billing_telemetry.sh</span>
                </div>
                <div className="vs-terminal-body monospace">
                  <div className="vs-term-line text-dim"># Simulating active sandbox session...</div>
                  <div className="vs-term-line">
                    <span className="text-muted">status:</span> <span className="text-green">active</span>
                  </div>
                  <div className="vs-term-line">
                    <span className="text-muted">resources:</span> {cpu} vCPU, {ram} GB RAM
                  </div>
                  <div className="vs-term-line">
                    <span className="text-muted">sandboxes:</span> {numSandboxes} active
                  </div>
                  <div className="vs-term-line">
                    <span className="text-muted">elapsed:</span> <span className="text-yellow">{simTime}s</span>
                  </div>
                  <div className="vs-term-divider"></div>
                  <div className="vs-term-line vs-accumulated-row">
                    <span className="text-muted">accumulated cost:</span>
                    <span className="vs-live-price text-green">${simulatedCost.toFixed(8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Pricing Tables */}
        <section className="vs-tables-section">
          <div className="vs-section-header-compact">
            <h2 className="vs-calc-section-title">// Core Compute Specifications (RAM/CPU)</h2>
            <p className="vs-calc-section-desc">
              Finely tuned billing. Calculate resources by the second. Sandboxes incur zero idle charges when paused.
            </p>
          </div>

          <div className="vs-table-container">
            <table className="vs-pricing-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Rate per Second</th>
                  <th>Rate per Hour</th>
                  <th>Billing Increments</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="vs-table-highlight">vCPU Core (Shared)</td>
                  <td className="monospace">$0.0000021</td>
                  <td className="monospace">$0.0075</td>
                  <td>Per-second, while active</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">vCPU Core (Dedicated)</td>
                  <td className="monospace">$0.0000083</td>
                  <td className="monospace">$0.0300</td>
                  <td>Per-second, while active</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">Memory (RAM) per GB</td>
                  <td className="monospace">$0.0000014</td>
                  <td className="monospace">$0.0050</td>
                  <td>Per-second, while active</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">Ephemeral Disk (10GB base)</td>
                  <td className="monospace">Free</td>
                  <td className="monospace">Free</td>
                  <td>Included in sandbox base</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">Persistent Storage (per GB)</td>
                  <td className="monospace">—</td>
                  <td className="monospace">$0.00013</td>
                  <td>$0.10/GB per Month rate</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">Network Outbound Transfer</td>
                  <td className="monospace">—</td>
                  <td className="monospace">—</td>
                  <td>First 10GB/mo free, then $0.05/GB</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GPU Instances Table */}
          <div className="vs-section-header-compact" style={{ marginTop: '48px' }}>
            <h2 className="vs-calc-section-title">// Dedicated GPU Runtimes</h2>
            <p className="vs-calc-section-desc">
              Scale heavy workloads and LLM fine-tuning instantly. Billed per second of active execution.
            </p>
          </div>

          <div className="vs-table-container">
            <table className="vs-pricing-table">
              <thead>
                <tr>
                  <th>GPU Instance Type</th>
                  <th>VRAM</th>
                  <th>Included Base Compute</th>
                  <th>Rate per Second</th>
                  <th>Rate per Hour</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="vs-table-highlight">NVIDIA T4</td>
                  <td>16 GB GDDR6</td>
                  <td>4 vCPU, 16 GB RAM, 50 GB NVMe</td>
                  <td className="monospace">$0.00016667</td>
                  <td className="monospace text-green">$0.60 / hr</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">NVIDIA A10G</td>
                  <td>24 GB GDDR6</td>
                  <td>8 vCPU, 32 GB RAM, 100 GB NVMe</td>
                  <td className="monospace">$0.00044444</td>
                  <td className="monospace text-green">$1.60 / hr</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">NVIDIA L40S</td>
                  <td>48 GB GDDR6</td>
                  <td>16 vCPU, 96 GB RAM, 200 GB NVMe</td>
                  <td className="monospace">$0.00108333</td>
                  <td className="monospace text-green">$3.90 / hr</td>
                </tr>
                <tr>
                  <td className="vs-table-highlight">NVIDIA H100 (SXM5)</td>
                  <td>80 GB HBM3</td>
                  <td>24 vCPU, 180 GB RAM, 500 GB NVMe</td>
                  <td className="monospace">$0.00222222</td>
                  <td className="monospace text-green">$8.00 / hr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="vs-table-footer-info">
            <p>
              * GPU runtimes are automatically spun down when your sandbox session goes idle. GPU billing is strictly per second of active sandbox runtime. Network ingress is free; network egress is charged at standard rates.
            </p>
          </div>
        </section>

        {/* CTA Section - Matching Landing Page exactly */}
        <section className="vs-cta-section">
          <div className="vs-cta-left">
            <h2 className="vs-cta-title">Ship your first app in minutes</h2>
            <p className="vs-cta-desc">
              Build, run, and monitor secure sandboxes for your AI agents programmatically. Start coding today and get free compute credits instantly.
            </p>
            <div className="vs-cta-actions">
              <button type="button" className="vs-btn-cta" onClick={handleLoginRedirect}>
                GET STARTED <FiArrowRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
              </button>
              <span className="vs-cta-hint">$20 free compute</span>
            </div>
          </div>
          <div className="vs-cta-right vs-dot-grid-bg">
            <CtaGrid />
          </div>
        </section>

        {/* Footer */}
        <footer className="vs-footer">
          <div>
            &copy; 2026 boxty. All rights reserved. &bull; brought to you by <a href="https://staticlabs.ro" target="_blank" rel="noopener noreferrer" className="vs-footer-labs-link">staticlabs</a>
          </div>
          <div className="vs-footer-links">
            <span className="vs-footer-link" onClick={() => navigate('/docs/guide/introduction')}>How It Works</span>
            <span className="vs-footer-link" onClick={() => navigate('/docs/guide/introduction')}>Usage Examples</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
