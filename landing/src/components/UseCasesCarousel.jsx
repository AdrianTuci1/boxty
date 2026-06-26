import { useState, useEffect } from 'react';
import { FiArrowLeft, FiArrowRight, FiCpu, FiMessageSquare, FiImage, FiVideo } from 'react-icons/fi';
import './UseCasesCarousel.css';

const useCases = [
  {
    icon: <FiCpu />,
    title: "Coding Agents & Workspace",
    desc: "Run autonomous loops. Install npm/pip packages, write files, compile binaries, and execute unit test suites in safe environments.",
    specs: { cpu: "4 vCPUs", ram: "8 GB RAM", network: "Full access" },
    visualizer: (
      <div className="vs-card-visualizer vis-coding">
        <div className="vs-vis-term">
          <div className="vs-vis-term-header">
            <span></span><span></span><span></span>
          </div>
          <div className="vs-vis-term-body">
            <div className="term-ln cmd">$ npm run test</div>
            <div className="term-ln success">✓ 12 tests passed</div>
            <div className="term-ln info">Done in 0.45s</div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: <FiMessageSquare />,
    title: "Model Inference & Scales",
    desc: "Evaluate checkpoints, run agent prompts, process bulk inference tasks, and serve model evaluations dynamically.",
    specs: { cpu: "8 vCPUs", ram: "16 GB RAM", network: "Restricted" },
    visualizer: (
      <div className="vs-card-visualizer vis-inference">
        <div className="vs-vis-chat">
          <div className="chat-bubble prompt">"run security audit..."</div>
          <div className="chat-bubble response">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: <FiImage />,
    title: "Image Generation",
    desc: "Generate graphic assets, process custom image prompts, validate visual outputs, and run diff comparisons securely.",
    specs: { cpu: "2 vCPUs", ram: "4 GB RAM", network: "Isolated" },
    visualizer: (
      <div className="vs-card-visualizer vis-image">
        <div className="vs-vis-image-box">
          <div className="vs-image-grid-pattern"></div>
          <div className="vs-image-vector">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="vs-image-progress">
            <div className="vs-image-progress-bar" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: <FiVideo />,
    title: "Video Processing Runtimes",
    desc: "Render frames, execute ffmpeg media pipelines, transcode high-resolution clips, and inspect video metadata.",
    specs: { cpu: "4 vCPUs", ram: "8 GB RAM", network: "Restricted" },
    visualizer: (
      <div className="vs-card-visualizer vis-video">
        <div className="vs-vis-video-box">
          <div className="vs-video-play-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="vs-video-timeline">
            <span className="time-indicator" style={{ left: '45%' }}></span>
          </div>
          <div className="vs-video-meta">
            <span>00:04 / 00:10</span>
            <span>H.264</span>
          </div>
        </div>
      </div>
    )
  }
];

export default function UseCasesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setVisibleCount(1);
      } else if (window.innerWidth <= 992) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ensure currentIndex stays within bounds if resizing changes visibleCount
  useEffect(() => {
    const maxIndex = useCases.length - visibleCount;
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [visibleCount, currentIndex]);

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(useCases.length - visibleCount, prev + 1));
  };

  const maxIndex = useCases.length - visibleCount;

  return (
    <div className="vs-carousel-section">
      <div className="vs-carousel-header">
        <div className="vs-carousel-titles">
          <span className="vs-carousel-pretitle">[04] Sandbox Use Cases</span>
          <h2 className="vs-carousel-title">Built for any agent workload</h2>
        </div>
        <div className="vs-carousel-controls">
          <button 
            type="button" 
            className="vs-carousel-btn" 
            onClick={prevSlide} 
            disabled={currentIndex === 0}
            aria-label="Previous slide"
          >
            <FiArrowLeft />
          </button>
          <button 
            type="button" 
            className="vs-carousel-btn" 
            onClick={nextSlide} 
            disabled={currentIndex >= maxIndex}
            aria-label="Next slide"
          >
            <FiArrowRight />
          </button>
        </div>
      </div>

      <div className="vs-carousel-container">
        <div 
          className="vs-carousel-track" 
          style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
        >
          {useCases.map((uc, index) => (
            <div 
              key={index} 
              className="vs-carousel-card-wrapper"
              style={{ flex: `0 0 ${100 / visibleCount}%` }}
            >
              <div className="vs-carousel-card">
                {/* Visualizer at the top */}
                <div className="vs-carousel-card-top">
                  {uc.visualizer}
                </div>

                {/* Description at the bottom */}
                <div className="vs-carousel-card-bottom">
                  <h3 className="vs-uc-title">{uc.title}</h3>
                  <p className="vs-uc-desc">{uc.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
