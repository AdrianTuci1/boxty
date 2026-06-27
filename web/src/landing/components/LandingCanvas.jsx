import { useEffect, useRef } from 'react';

export default function LandingCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const height = 420;
    const dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = '100%';
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const boxSize = 68;
    const halfBox = boxSize / 2;

    // Node definitions relative to horizontal center (centerX)
    const baseNodes = [
      { id: 1, col: -3, row: 0, speed: 1.2, phase: 0, peakTime: 1.2 },
      { id: 2, col: -1, row: -1, speed: -0.6, phase: 1.1, peakTime: 2.4 },
      { id: 3, col: 0, row: 1, speed: 1.0, phase: 2.2, peakTime: 2.4 },
      { id: 4, col: 2, row: 0, speed: -1.0, phase: 3.3, peakTime: 3.6 },
      { id: 5, col: 4, row: 1, speed: 1.4, phase: 4.4, peakTime: 4.8 },
      { id: 6, col: 1, row: 2, speed: 0.7, phase: 5.5, peakTime: 3.6 }
    ];

    // Helper: Interpolate between grey (rgba 113, 113, 122) and green (rgba 0, 255, 102)
    function lerpColor(factor, alpha = 1.0) {
      const r = Math.round(113 + (0 - 113) * factor);
      const g = Math.round(113 + (255 - 113) * factor);
      const b = Math.round(122 + (102 - 122) * factor);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Helper: Safe rounded rectangle rendering
    function drawRoundRect(ctx, x, y, width, height, radius) {
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius);
      } else {
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
      }
    }

    // Helper: Draw 2D rotating line-only star
    function draw2DStar(ctx, cx, cy, size, angle, color) {
      const inner = size * 0.35;
      const spikes = 4;
      let rot = angle - Math.PI / 2;
      const step = Math.PI / spikes;

      const isGreen = color === '#00ff66';
      const strokeColor = color;
      const detailColor = isGreen ? 'rgba(0, 255, 102, 0.35)' : 'rgba(113, 113, 122, 0.35)';

      // 1. Draw outer spiked outline
      ctx.beginPath();
      let x = cx + Math.cos(rot) * size;
      let y = cy + Math.sin(rot) * size;
      ctx.moveTo(x, y);

      for (let i = 0; i < spikes; i++) {
        rot += step;
        x = cx + Math.cos(rot) * inner;
        y = cy + Math.sin(rot) * inner;
        ctx.lineTo(x, y);

        rot += step;
        x = cx + Math.cos(rot) * size;
        y = cy + Math.sin(rot) * size;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Draw cross connecting lines
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle - Math.PI / 2) * size, cy + Math.sin(angle - Math.PI / 2) * size);
      ctx.lineTo(cx + Math.cos(angle + Math.PI / 2) * size, cy + Math.sin(angle + Math.PI / 2) * size);
      ctx.moveTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
      ctx.lineTo(cx + Math.cos(angle + Math.PI) * size, cy + Math.sin(angle + Math.PI) * size);
      ctx.strokeStyle = detailColor;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // 3. Central core dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    }

    // Helper: Draw Node Box
    function drawNodeBox(ctx, x, y, color, _factor) {
      const rx = x - halfBox;
      const ry = y - halfBox;

      const isGreen = color === '#00ff66';

      // Dark solid background
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      drawRoundRect(ctx, rx, ry, boxSize, boxSize, 6);
      ctx.fill();

      // Outer border
      ctx.strokeStyle = isGreen ? 'rgba(0, 255, 102, 0.25)' : '#27272c';
      ctx.lineWidth = 1;
      ctx.beginPath();
      drawRoundRect(ctx, rx, ry, boxSize, boxSize, 6);
      ctx.stroke();

      // Inner border
      ctx.strokeStyle = isGreen ? 'rgba(0, 255, 102, 0.15)' : 'rgba(113, 113, 122, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      drawRoundRect(ctx, rx + 6, ry + 6, boxSize - 12, boxSize - 12, 4);
      ctx.stroke();

      // Visual Ports (In/Out)
      // Input Port (Left side)
      ctx.strokeStyle = isGreen ? 'rgba(0, 255, 102, 0.5)' : 'rgba(113, 113, 122, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx, ry + halfBox, 4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(rx, ry + halfBox, 2, 0, Math.PI * 2);
      ctx.fill();

      // Output Port (Right side)
      ctx.strokeStyle = isGreen ? 'rgba(0, 255, 102, 0.5)' : 'rgba(113, 113, 122, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rx + boxSize, ry + halfBox, 4, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(rx + boxSize, ry + halfBox, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Helper: Draw connection path
    function drawPath(ctx, points, isDotted, color, width = 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (isDotted) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Helper: Find coordinate path position for animating particles
    function getPointAlongPath(path, progress) {
      let lengths = [];
      let totalLength = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i+1].x - path[i].x;
        const dy = path[i+1].y - path[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        lengths.push(len);
        totalLength += len;
      }

      const targetLen = progress * totalLength;
      let currentLen = 0;

      for (let i = 0; i < path.length - 1; i++) {
        if (currentLen + lengths[i] >= targetLen) {
          const segProgress = (targetLen - currentLen) / lengths[i];
          const x = path[i].x + (path[i+1].x - path[i].x) * segProgress;
          const y = path[i].y + (path[i+1].y - path[i].y) * segProgress;
          return { x, y };
        }
        currentLen += lengths[i];
      }
      return path[path.length - 1];
    }

    // Cosine smoothing pulse helper for node lights
    function getNodeActivation(t, peak, duration = 2.0) {
      const diff = Math.abs(t - peak);
      if (diff > duration / 2) return 0;
      return 0.5 + 0.5 * Math.cos((diff / (duration / 2)) * Math.PI);
    }

    // Linear ramp transition helper for lines
    function getLineActivation(t, start, end, fade = 0.2) {
      if (t >= start && t <= end) return 1.0;
      if (t < start && t >= start - fade) {
        return (t - (start - fade)) / fade;
      }
      if (t > end && t <= end + fade) {
        return 1.0 - (t - end) / fade;
      }
      return 0.0;
    }

    // Canvas Draw Frame loop
    const render = () => {
      time += 0.015;

      const w = canvas.width / dpr;
      const h = height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw dot grid edge-to-edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const startX = centerX % 80;
      for (let gx = startX; gx < w; gx += 80) {
        for (let gy = 20; gy < h; gy += 80) {
          ctx.fillRect(gx - 1, gy - 1, 2, 2);
        }
      }

      // Draw dashed major grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      for (let gx = startX; gx < w; gx += 80) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 20; gy < h; gy += 80) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.setLineDash([]); // Reset

      // Re-calculate live box coordinates centered around centerX
      const liveNodes = baseNodes.map(node => ({
        ...node,
        x: centerX + node.col * 80,
        y: centerY + node.row * 80
      }));

      // ==========================================
      // TRANSMISSION LOGIC PROPAGATION WAVE
      // 8-second cycle timeline:
      // - 0.0 to 1.2: Packet moves Left In -> Node 1
      // - 1.2 to 2.4: Packet splits Node 1 -> Node 2 & 3
      // - 2.4 to 3.6: Packet routes: Node 2 -> Node 4, Node 3 -> Node 4 & 6
      // - 3.6 to 4.8: Packet routes: Node 4 -> Node 5, Node 6 -> Node 5
      // - 4.8 to 6.0: Packet outputs Node 5 -> Right Out
      // - 6.0 to 8.0: Cool down stage (all standby)
      // ==========================================
      const cycleTime = time % 8.0;

      // Active state definitions for each Pathway
      const isPathLeftInActive = cycleTime >= 0.0 && cycleTime < 1.2;
      const isPath1to2Active = cycleTime >= 1.2 && cycleTime < 2.4;
      const isPath1to3Active = cycleTime >= 1.2 && cycleTime < 2.4;
      const isPath2to4Active = cycleTime >= 2.4 && cycleTime < 3.6;
      const isPath3to4Active = cycleTime >= 2.4 && cycleTime < 3.6;
      const isPath3to6Active = cycleTime >= 2.4 && cycleTime < 3.6;
      const isPath4to5Active = cycleTime >= 3.6 && cycleTime < 4.8;
      const isPath6to5Active = cycleTime >= 3.6 && cycleTime < 4.8;
      const isPathRightOutActive = cycleTime >= 4.8 && cycleTime < 6.0;

      // Calculate dynamic midpoints for orthogonal routing
      const midX_1to2 = (liveNodes[0].x + halfBox + liveNodes[1].x - halfBox) / 2;
      const midX_1to3 = (liveNodes[0].x + halfBox + liveNodes[2].x - halfBox) / 2;
      const midX_2to4 = (liveNodes[1].x + halfBox + liveNodes[3].x - halfBox) / 2;
      const midX_3to4 = (liveNodes[2].x + halfBox + liveNodes[3].x - halfBox) / 2;
      const midX_3to6 = (liveNodes[2].x + halfBox + liveNodes[5].x - halfBox) / 2;
      const midX_4to5 = (liveNodes[3].x + halfBox + liveNodes[4].x - halfBox) / 2;
      const midX_6to5 = (liveNodes[5].x + halfBox + liveNodes[4].x - halfBox) / 2;

      // Map paths configurations with exact active windows
      // Every single node has at least one input line and one output line
      const pathsConfig = [
        // Left input line -> Node 1 left (green)
        {
          id: 'leftIn',
          start: 0.0,
          end: 1.2,
          active: isPathLeftInActive,
          color: '#00ff66',
          points: [
            { x: 0, y: centerY },
            { x: liveNodes[0].x - halfBox, y: centerY }
          ]
        },
        // Node 1 right -> Node 2 left (grey loop)
        {
          id: 'n1to2',
          start: 1.2,
          end: 2.4,
          active: isPath1to2Active,
          color: '#71717a',
          points: [
            { x: liveNodes[0].x + halfBox, y: liveNodes[0].y },
            { x: midX_1to2, y: liveNodes[0].y },
            { x: midX_1to2, y: liveNodes[1].y },
            { x: liveNodes[1].x - halfBox, y: liveNodes[1].y }
          ]
        },
        // Node 1 right -> Node 3 left (green spine)
        {
          id: 'n1to3',
          start: 1.2,
          end: 2.4,
          active: isPath1to3Active,
          color: '#00ff66',
          points: [
            { x: liveNodes[0].x + halfBox, y: liveNodes[0].y },
            { x: midX_1to3, y: liveNodes[0].y },
            { x: midX_1to3, y: liveNodes[2].y },
            { x: liveNodes[2].x - halfBox, y: liveNodes[2].y }
          ]
        },
        // Node 2 right -> Node 4 left (grey loop output)
        {
          id: 'n2to4',
          start: 2.4,
          end: 3.6,
          active: isPath2to4Active,
          color: '#71717a',
          points: [
            { x: liveNodes[1].x + halfBox, y: liveNodes[1].y },
            { x: midX_2to4, y: liveNodes[1].y },
            { x: midX_2to4, y: liveNodes[3].y },
            { x: liveNodes[3].x - halfBox, y: liveNodes[3].y }
          ]
        },
        // Node 3 right -> Node 4 left (green spine)
        {
          id: 'n3to4',
          start: 2.4,
          end: 3.6,
          active: isPath3to4Active,
          color: '#00ff66',
          points: [
            { x: liveNodes[2].x + halfBox, y: liveNodes[2].y },
            { x: midX_3to4, y: liveNodes[2].y },
            { x: midX_3to4, y: liveNodes[3].y },
            { x: liveNodes[3].x - halfBox, y: liveNodes[3].y }
          ]
        },
        // Node 3 right -> Node 6 left (grey loop)
        {
          id: 'n3to6',
          start: 2.4,
          end: 3.6,
          active: isPath3to6Active,
          color: '#71717a',
          points: [
            { x: liveNodes[2].x + halfBox, y: liveNodes[2].y },
            { x: midX_3to6, y: liveNodes[2].y },
            { x: midX_3to6, y: liveNodes[5].y },
            { x: liveNodes[5].x - halfBox, y: liveNodes[5].y }
          ]
        },
        // Node 4 right -> Node 5 left (green spine)
        {
          id: 'n4to5',
          start: 3.6,
          end: 4.8,
          active: isPath4to5Active,
          color: '#00ff66',
          points: [
            { x: liveNodes[3].x + halfBox, y: liveNodes[3].y },
            { x: midX_4to5, y: liveNodes[3].y },
            { x: midX_4to5, y: liveNodes[4].y },
            { x: liveNodes[4].x - halfBox, y: liveNodes[4].y }
          ]
        },
        // Node 6 right -> Node 5 left (grey loop output)
        {
          id: 'n6to5',
          start: 3.6,
          end: 4.8,
          active: isPath6to5Active,
          color: '#71717a',
          points: [
            { x: liveNodes[5].x + halfBox, y: liveNodes[5].y },
            { x: midX_6to5, y: liveNodes[5].y },
            { x: midX_6to5, y: liveNodes[4].y },
            { x: liveNodes[4].x - halfBox, y: liveNodes[4].y }
          ]
        },
        // Node 5 right -> Right edge (green output line)
        {
          id: 'rightOut',
          start: 4.8,
          end: 6.0,
          active: isPathRightOutActive,
          color: '#00ff66',
          points: [
            { x: liveNodes[4].x + halfBox, y: liveNodes[4].y },
            { x: w, y: liveNodes[4].y }
          ]
        }
      ];

      // Draw connection lines (Green if active, Grey if inactive)
      pathsConfig.forEach(path => {
        const factor = getLineActivation(cycleTime, path.start, path.end);
        const lineColor = lerpColor(factor, path.color === '#00ff66' ? (0.15 + 0.35 * factor) : (0.12 + 0.18 * factor));
        
        drawPath(ctx, path.points, false, lineColor, 1.5);
      });

      // 4. Draw moving data particles along active pathways
      pathsConfig.forEach(path => {
        if (cycleTime >= path.start && cycleTime <= path.end) {
          const progress = (cycleTime - path.start) / (path.end - path.start);
          const pt = getPointAlongPath(path.points, progress);

          const particleColor = path.color === '#00ff66' ? 'rgba(0, 255, 102, 1.0)' : 'rgba(161, 161, 170, 0.9)';

          ctx.fillStyle = particleColor;
          ctx.shadowColor = path.color === '#00ff66' ? '#00ff66' : 'rgba(0,0,0,0)';
          ctx.shadowBlur = path.color === '#00ff66' ? 8 : 0;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          const endPt = path.points[path.points.length - 1];
          ctx.fillStyle = particleColor;
          ctx.fillRect(endPt.x - 2, endPt.y - 2, 4, 4);
        }
      });

      // 5. Draw the centered boxes and their rotating 2D wireframe stars
      liveNodes.forEach(node => {
        const factor = getNodeActivation(cycleTime, node.peakTime, 2.0);
        const nodeColor = lerpColor(factor);

        drawNodeBox(ctx, node.x, node.y, nodeColor, factor);
        
        // Active stars spin faster, inactive stars spin slower
        const currentSpeed = node.speed * (0.3 + 1.2 * factor);
        const rotationAngle = time * currentSpeed + node.phase;
        
        draw2DStar(ctx, node.x, node.y, 14, rotationAngle, nodeColor);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        display: 'block',
        background: 'transparent',
      }}
      className="vs-network-canvas"
    />
  );
}
