import { useEffect, useRef } from 'react';
import './GpuVisualizer.css';

export default function GpuVisualizer() {
  const canvasRef = useRef(null);
  const timeRef = useRef(null);
  const containersRef = useRef(null);
  const gpuUtilRef = useRef(null);
  const gpuCountRef = useRef(null);

  // Canvas drawing loop and direct DOM updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const paddingY = 6;
    const speed = 0.08; // Speed of scrolling (pixels per frame) - slower and extremely fluid

    const dataPoints = [
      10, 12, 28, 25, 45, 38, 92, 60, 60, 60, 60, 35, 12, 12, 12, 12, 35, 35, 35, 60, 12, 12, 20, 28, 20, 32, 45, 45, 52, 42
    ];
    let offsetX = 0;
    let gpuUtil = 92;
    let gpuCount = 5;
    let containers = 144;
    let frameCount = 0;

    // Helper: Update time string directly in the DOM
    const updateTimeText = () => {
      if (!timeRef.current) return;
      const date = new Date();
      let hours = date.getHours();
      let minutes = date.getMinutes();
      let seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime = `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}${ampm}`;
      timeRef.current.textContent = strTime;
    };

    // Initialize DOM values
    updateTimeText();
    if (containersRef.current) containersRef.current.textContent = containers;
    if (gpuUtilRef.current) gpuUtilRef.current.textContent = `${gpuUtil}%`;
    if (gpuCountRef.current) gpuCountRef.current.textContent = `${gpuCount} GPU${gpuCount > 1 ? 's' : ''} active`;

    // Setup Retina HD resolution scaling
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Loop
    const draw = () => {
      frameCount++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // 1. Draw Dotted Grid Background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const dotSpacing = 16;
      for (let x = 0; x < w; x += dotSpacing) {
        for (let y = 0; y < h; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Increment offset and slide points
      const step = w / (dataPoints.length - 1);
      offsetX += speed;

      if (offsetX >= step) {
        const lastVal = dataPoints[dataPoints.length - 1];
        let change = (Math.random() - 0.5) * 8;
        let newVal = Math.round(lastVal + change);
        if (newVal < 10) newVal = 10 + Math.floor(Math.random() * 8);
        if (newVal > 95) newVal = 95 - Math.floor(Math.random() * 8);

        dataPoints.push(newVal);
        dataPoints.shift();
        offsetX -= step;

        gpuUtil = newVal;
        gpuCount = Math.max(1, Math.min(5, Math.ceil(newVal / 20)));

        // Direct DOM Update for live metrics
        if (gpuUtilRef.current) {
          gpuUtilRef.current.textContent = `${gpuUtil}%`;
        }
        if (gpuCountRef.current) {
          gpuCountRef.current.textContent = `${gpuCount} GPU${gpuCount > 1 ? 's' : ''} active`;
        }
      }

      // Update time every 60 frames (~1s)
      if (frameCount % 60 === 0) {
        updateTimeText();
      }

      // Update containers every 240 frames (~4s)
      if (frameCount % 240 === 0) {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = containers + delta;
        if (next >= 135 && next <= 155) {
          containers = next;
        }
        if (containersRef.current) {
          containersRef.current.textContent = containers;
        }
      }

      // 3. Compute Coordinates
      const activeHeight = h - paddingY * 2;
      const coords = dataPoints.map((val, idx) => {
        const x = idx * step - offsetX;
        const y = paddingY + activeHeight - (val / 100) * activeHeight;
        return { x, y };
      });

      if (coords.length > 0) {
        // 4. Generate smooth Bezier curve line on Canvas
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);

        for (let i = 0; i < coords.length - 1; i++) {
          const p0 = coords[i];
          const p1 = coords[i + 1];
          const cp1x = p0.x + (p1.x - p0.x) / 2;
          const cp1y = p0.y;
          const cp2x = p0.x + (p1.x - p0.x) / 2;
          const cp2y = p1.y;
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        // Keep path for gradient filling, then stroke
        const lineStrokePath = new Path2D();
        lineStrokePath.moveTo(coords[0].x, coords[0].y);
        for (let i = 0; i < coords.length - 1; i++) {
          const p0 = coords[i];
          const p1 = coords[i + 1];
          const cp1x = p0.x + (p1.x - p0.x) / 2;
          const cp1y = p0.y;
          const cp2x = p0.x + (p1.x - p0.x) / 2;
          const cp2y = p1.y;
          lineStrokePath.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }

        // Draw Gradient Area under the curve
        ctx.lineTo(coords[coords.length - 1].x, h);
        ctx.lineTo(coords[0].x, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(0, 255, 102, 0.16)');
        grad.addColorStop(1, 'rgba(0, 255, 102, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke neon green line
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke(lineStrokePath);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="vs-gpu-visualizer">
      {/* Top window bar */}
      <div className="vs-gpu-top-bar">
        <div className="vs-gpu-win-dots">
          <span className="dot-green"></span>
          <span className="dot-gray"></span>
          <span className="dot-dark"></span>
        </div>
        <div className="vs-gpu-live-status">
          <span className="status-indicator-dot"></span>
          Live Usage
        </div>
      </div>

      {/* Main Stats Area */}
      <div className="vs-gpu-stats-container">
        <div className="vs-gpu-stat-item">
          <span className="stat-label">Time</span>
          <span ref={timeRef} className="stat-value">--:--:--</span>
        </div>
        <div className="vs-gpu-stat-item">
          <span className="stat-label">Containers</span>
          <span ref={containersRef} className="stat-value">--</span>
        </div>
        <div className="vs-gpu-stat-item">
          <span className="stat-label">GPU Utilization</span>
          <span ref={gpuUtilRef} className="stat-value accent-green">--%</span>
        </div>
      </div>

      {/* Chart Visualizer */}
      <div className="vs-gpu-chart-wrapper">
        <div className="vs-chart-overlay-labels">
          <span className="gpu-model-label">H100s</span>
          <span ref={gpuCountRef} className="gpu-count-badge">-- GPUs active</span>
        </div>

        {/* HTML5 Canvas Live Chart */}
        <div className="vs-gpu-svg-container">
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>
    </div>
  );
}
