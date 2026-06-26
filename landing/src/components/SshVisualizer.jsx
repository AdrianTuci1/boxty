import { useState, useEffect } from 'react';
import './SshVisualizer.css';

export default function SshVisualizer() {
  const [lines, setLines] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [state, setState] = useState({ phase: 0, charIndex: 0 });
  const [seconds, setSeconds] = useState(45);

  // Walkthrough ticking time counter
  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine prompt text dynamically depending on shell environment
  const getActivePrompt = () => {
    if (state.phase === 2 || state.phase === 4) {
      return 'my-agent-sandbox:~$ ';
    }
    return '~ % ';
  };

  // Typewriter walkthrough logic
  useEffect(() => {
    let timer;
    const commands = [
      'boxty ssh my-agent-sandbox',
      'python workspace/agent.py --port 8080',
      'exit',
      'boxty tunnel my-agent-sandbox 8080:8080'
    ];

    const outputs = [
      [
        { type: 'log', text: 'Connecting to my-agent-sandbox.ssh.boxty.dev...' },
        { type: 'success', text: '✓ Connection established. Secure terminal active.' }
      ],
      [
        { type: 'log', text: '[agent] Starting API server on port 8080...' },
        { type: 'info', text: '[agent] Model weights loaded. Listening for incoming requests...' }
      ],
      [
        { type: 'log', text: 'logout' },
        { type: 'log', text: 'Connection to ssh.boxty.dev closed.' }
      ],
      [
        { type: 'success', text: '✓ Forwarding local port 8080 to my-agent-sandbox:8080' },
        { type: 'info', text: '  Tunnel active. Press Ctrl+C to close.' }
      ]
    ];

    if (state.phase === 0) {
      // Type Command 1 (ssh connect)
      const cmd = commands[0];
      if (state.charIndex < cmd.length) {
        timer = setTimeout(() => {
          setCurrentInput(cmd.slice(0, state.charIndex + 1));
          setState(prev => ({ ...prev, charIndex: prev.charIndex + 1 }));
        }, 50);
      } else {
        // Output Command 1
        timer = setTimeout(() => {
          setLines(prev => [
            ...prev,
            { type: 'command', prompt: '~ % ', text: cmd },
            ...outputs[0]
          ]);
          setCurrentInput('');
          setState({ phase: 1, charIndex: 0 });
        }, 600);
      }
    } else if (state.phase === 1) {
      timer = setTimeout(() => {
        setState({ phase: 2, charIndex: 0 });
      }, 1500);
    } else if (state.phase === 2) {
      // Type Command 2 (run agent server inside sandbox)
      const cmd = commands[1];
      if (state.charIndex < cmd.length) {
        timer = setTimeout(() => {
          setCurrentInput(cmd.slice(0, state.charIndex + 1));
          setState(prev => ({ ...prev, charIndex: prev.charIndex + 1 }));
        }, 50);
      } else {
        // Output Command 2
        timer = setTimeout(() => {
          setLines(prev => [
            ...prev,
            { type: 'command', prompt: 'my-agent-sandbox:~$ ', text: cmd },
            ...outputs[1]
          ]);
          setCurrentInput('');
          setState({ phase: 3, charIndex: 0 });
        }, 600);
      }
    } else if (state.phase === 3) {
      timer = setTimeout(() => {
        setState({ phase: 4, charIndex: 0 });
      }, 1500);
    } else if (state.phase === 4) {
      // Type Command 3 (exit SSH session)
      const cmd = commands[2];
      if (state.charIndex < cmd.length) {
        timer = setTimeout(() => {
          setCurrentInput(cmd.slice(0, state.charIndex + 1));
          setState(prev => ({ ...prev, charIndex: prev.charIndex + 1 }));
        }, 60);
      } else {
        // Output Command 3
        timer = setTimeout(() => {
          setLines(prev => [
            ...prev,
            { type: 'command', prompt: 'my-agent-sandbox:~$ ', text: cmd },
            ...outputs[2]
          ]);
          setCurrentInput('');
          setState({ phase: 5, charIndex: 0 });
        }, 600);
      }
    } else if (state.phase === 5) {
      timer = setTimeout(() => {
        setState({ phase: 6, charIndex: 0 });
      }, 1500);
    } else if (state.phase === 6) {
      // Type Command 4 (open local tunnel)
      const cmd = commands[3];
      if (state.charIndex < cmd.length) {
        timer = setTimeout(() => {
          setCurrentInput(cmd.slice(0, state.charIndex + 1));
          setState(prev => ({ ...prev, charIndex: prev.charIndex + 1 }));
        }, 50);
      } else {
        // Output Command 4
        timer = setTimeout(() => {
          setLines(prev => [
            ...prev,
            { type: 'command', prompt: '~ % ', text: cmd },
            ...outputs[3]
          ]);
          setCurrentInput('');
          setState({ phase: 7, charIndex: 0 });
        }, 600);
      }
    } else if (state.phase === 7) {
      timer = setTimeout(() => {
        setLines([]);
        setState({ phase: 0, charIndex: 0 });
      }, 6000);
    }

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <div className="vs-ssh-visualizer">
      {/* Top Walkthrough Header - Simplified without control dots */}
      <div className="vs-ssh-top-bar">
        <div className="vs-ssh-middle-title">
          REMOTE SSH WORKSTATION WALKTHROUGH
        </div>
        <div className="vs-ssh-time-badge-text">
          {formatTime(seconds)}
        </div>
      </div>

      {/* Terminal View Body */}
      <div className="vs-ssh-terminal-body-full">
        {/* Typewriter Printed Lines */}
        {lines.map((l, index) => {
          if (l.type === 'command') {
            return (
              <div key={index} className="vs-term-line">
                <span className="vs-term-prompt">{l.prompt}</span>
                {l.text}
              </div>
            );
          }
          if (l.type === 'success') {
            return (
              <div key={index} className="vs-term-line success">
                {l.text}
              </div>
            );
          }
          if (l.type === 'info') {
            return (
              <div key={index} className="vs-term-line info">
                {l.text}
              </div>
            );
          }
          if (l.type === 'log') {
            return (
              <div key={index} className="vs-term-line log">
                {l.text}
              </div>
            );
          }
          return null;
        })}

        {/* Active Typewriter Cursor Line */}
        {state.phase !== 7 && (
          <div className="vs-term-line">
            <span className="vs-term-prompt">{getActivePrompt()}</span>
            {currentInput}
            <span className="vs-term-cursor"></span>
          </div>
        )}
        {state.phase === 7 && (
          <div className="vs-term-line">
            <span className="vs-term-prompt">~ %</span>
            <span className="vs-term-cursor"></span>
          </div>
        )}
      </div>
    </div>
  );
}
