import './CtaGrid.css';

export default function CtaGrid() {
  const boxes = [
    { id: 1, col: 2, row: 1, delay: '0s' },
    { id: 2, col: 4, row: 1, delay: '1s' },
    { id: 3, col: 1, row: 2, delay: '2s' },
    { id: 4, col: 3, row: 3, delay: '3s' },
    { id: 5, col: 4, row: 3, delay: '4s' },
    { id: 6, col: 2, row: 4, delay: '5s' }
  ];

  return (
    <div className="vs-cta-grid-container">
      <div className="vs-cta-grid">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="vs-cta-grid-box"
            style={{
              gridColumn: box.col,
              gridRow: box.row,
              animationDelay: box.delay
            }}
          >
            {/* Inner box border mockup */}
            <div 
              className="vs-cta-box-inner" 
              style={{ animationDelay: box.delay }}
            />
            {/* Centered rotating/pulsing SVG Star */}
            <svg 
              className="vs-cta-box-star" 
              style={{ animationDelay: box.delay }} 
              width="32" 
              height="32" 
              viewBox="0 0 32 32"
            >
              <path 
                d="M 16 4 L 19 13 L 28 16 L 19 19 L 16 28 L 13 19 L 4 16 L 13 13 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
