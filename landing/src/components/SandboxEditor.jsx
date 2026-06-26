import { useState } from 'react';
import { FiCopy, FiCheck, FiKey } from 'react-icons/fi';
import './SandboxEditor.css';

export default function SandboxEditor() {
  const [activeTab, setActiveTab] = useState('python');
  const [copied, setCopied] = useState(false);

  const codeData = {
    python: {
      fileName: 'sandbox.py',
      installCmd: 'pip install boxty',
      code: [
        { type: 'comment', text: '# Create a sandbox' },
        { type: 'keyword-line', parts: [
          { type: 'keyword', text: 'from' },
          { type: 'text', text: ' boxty.sandbox ' },
          { type: 'keyword', text: 'import' },
          { type: 'text', text: ' Sandbox' }
        ]},
        { type: 'empty' },
        { type: 'text-line', parts: [
          { type: 'text', text: 'sbx = Sandbox.' },
          { type: 'function', text: 'create' },
          { type: 'text', text: '()' }
        ]},
        { type: 'empty' },
        { type: 'comment', text: '# Run a command' },
        { type: 'text-line', parts: [
          { type: 'text', text: 'result = sbx.' },
          { type: 'function', text: 'run' },
          { type: 'text', text: '(' },
          { type: 'string', text: '"/bin/sh"' },
          { type: 'text', text: ', ' },
          { type: 'arg', text: 'args' },
          { type: 'text', text: '=[' },
          { type: 'string', text: '"-c"' },
          { type: 'text', text: ', ' },
          { type: 'string', text: '"pip install pandas && python train.py"' },
          { type: 'text', text: '])' }
        ]},
        { type: 'text-line', parts: [
          { type: 'function', text: 'print' },
          { type: 'text', text: '(result.stdout)' }
        ]}
      ],
      rawCode: `# Create a sandbox\nfrom boxty.sandbox import Sandbox\n\nsbx = Sandbox.create()\n\n# Run a command\nresult = sbx.run("/bin/sh", args=["-c", "pip install pandas && python train.py"])\nprint(result.stdout)`,
      terminalHeader: '$ python sandbox.py',
      terminalLogs: [
        { text: 'sandbox created sbx_9ap6irq · boxty/ubuntu-minimal · 465 ms', success: true },
        { text: 'pip install pandas · 1.7 s', success: true },
        { text: 'train.py · epoch 5/5 · loss 0.0412 · 7.3 s', success: true }
      ]
    },
    typescript: {
      fileName: 'sandbox.ts',
      installCmd: 'npm install boxty',
      code: [
        { type: 'comment', text: '// Create a sandbox' },
        { type: 'keyword-line', parts: [
          { type: 'keyword', text: 'import' },
          { type: 'text', text: ' { Sandbox } ' },
          { type: 'keyword', text: 'from' },
          { type: 'text', text: ' ' },
          { type: 'string', text: '"boxty"' },
          { type: 'text', text: ';' }
        ]},
        { type: 'empty' },
        { type: 'text-line', parts: [
          { type: 'keyword', text: 'const' },
          { type: 'text', text: ' sbx = ' },
          { type: 'keyword', text: 'await' },
          { type: 'text', text: ' Sandbox.' },
          { type: 'function', text: 'create' },
          { type: 'text', text: '();' }
        ]},
        { type: 'empty' },
        { type: 'comment', text: '// Run a command' },
        { type: 'text-line', parts: [
          { type: 'keyword', text: 'const' },
          { type: 'text', text: ' result = ' },
          { type: 'keyword', text: 'await' },
          { type: 'text', text: ' sbx.' },
          { type: 'function', text: 'run' },
          { type: 'text', text: '(' },
          { type: 'string', text: '"/bin/sh"' },
          { type: 'text', text: ', {' }
        ]},
        { type: 'text-line', parts: [
          { type: 'text', text: '  ' },
          { type: 'arg', text: 'args' },
          { type: 'text', text: ': [' },
          { type: 'string', text: '"-c"' },
          { type: 'text', text: ', ' },
          { type: 'string', text: '"pip install pandas && python train.py"' },
          { type: 'text', text: ']' }
        ]},
        { type: 'text-line', parts: [
          { type: 'text', text: '});' }
        ]},
        { type: 'text-line', parts: [
          { type: 'text', text: 'console.' },
          { type: 'function', text: 'log' },
          { type: 'text', text: '(result.stdout);' }
        ]}
      ],
      rawCode: `// Create a sandbox\nimport { Sandbox } from "boxty";\n\nconst sbx = await Sandbox.create();\n\n// Run a command\nconst result = await sbx.run("/bin/sh", {\n  args: ["-c", "pip install pandas && python train.py"]\n});\nconsole.log(result.stdout);`,
      terminalHeader: '$ npx tsx sandbox.ts',
      terminalLogs: [
        { text: 'sandbox created sbx_9ap6irq · boxty/ubuntu-minimal · 490 ms', success: true },
        { text: 'npm install pandas · 1.8 s', success: true },
        { text: 'train.py · epoch 5/5 · loss 0.0412 · 7.1 s', success: true }
      ]
    },
    cli: {
      fileName: '~ $ boxty',
      installCmd: 'curl -fsSL https://boxty.dev/install.sh | sh',
      code: [
        { type: 'comment', text: '# Create a new sandbox session' },
        { type: 'text-line', parts: [
          { type: 'keyword', text: 'boxty' },
          { type: 'text', text: ' sandbox create ' },
          { type: 'arg', text: '--image' },
          { type: 'text', text: ' ' },
          { type: 'string', text: 'ubuntu-minimal' }
        ]},
        { type: 'empty' },
        { type: 'comment', text: '# Run shell commands inside the sandbox' },
        { type: 'text-line', parts: [
          { type: 'keyword', text: 'boxty' },
          { type: 'text', text: ' sandbox run ' },
          { type: 'arg', text: 'sbx_9ap6irq' },
          { type: 'text', text: ' ' },
          { type: 'string', text: '"pip install pandas && python train.py"' }
        ]}
      ],
      rawCode: `# Create a new sandbox session\nboxty sandbox create --image ubuntu-minimal\n\n# Run shell commands inside the sandbox\nboxty sandbox run sbx_9ap6irq "pip install pandas && python train.py"`,
      terminalHeader: '$ boxty run',
      terminalLogs: [
        { text: 'sandbox created sbx_9ap6irq · boxty/ubuntu-minimal · 430 ms', success: true },
        { text: 'run command completed successfully · 8.5 s', success: true }
      ]
    }
  };

  const current = codeData[activeTab];

  function handleCopy() {
    navigator.clipboard.writeText(current.rawCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="vs-code-editor-screenshot">
      {/* Top Header */}
      <div className="vs-editor-top-bar">
        <div className="vs-editor-win-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="vs-editor-header-actions">
          <button 
            type="button" 
            className={`vs-btn-copy-setup ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <FiCheck size={12} style={{ verticalAlign: 'middle' }} />
            ) : (
              <FiCopy size={12} style={{ verticalAlign: 'middle' }} />
            )}
            {copied ? 'COPIED SETUP' : 'COPY SETUP FOR MY AGENTS'}
          </button>
          <div className="vs-editor-status">
            <span className="vs-pulse-indicator"></span>
            RUNNING
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="vs-editor-tabs-bar">
        <button 
          type="button"
          className={`vs-editor-tab ${activeTab === 'python' ? 'active' : ''}`}
          onClick={() => setActiveTab('python')}
        >
          <span className="vs-tab-title">PYTHON</span>
          <span className="vs-tab-file">sandbox.py</span>
        </button>
        <button 
          type="button"
          className={`vs-editor-tab ${activeTab === 'typescript' ? 'active' : ''}`}
          onClick={() => setActiveTab('typescript')}
        >
          <span className="vs-tab-title">TYPESCRIPT</span>
          <span className="vs-tab-file">sandbox.ts</span>
        </button>
        <button 
          type="button"
          className={`vs-editor-tab ${activeTab === 'cli' ? 'active' : ''}`}
          onClick={() => setActiveTab('cli')}
        >
          <span className="vs-tab-title">CLI</span>
          <span className="vs-tab-file">~ $ boxty</span>
        </button>
        <div className="vs-editor-tabs-empty"></div>
      </div>

      {/* Install Command Bar */}
      <div className="vs-editor-install-bar">
        <div className="vs-install-cmd">
          <span className="vs-shell-symbol">$</span>
          {' '}{current.installCmd}
        </div>
        <button type="button" className="vs-btn-get-key">
          GET API KEY <FiKey style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
        </button>
      </div>

      {/* Code Editor Body */}
      <div className="vs-editor-code-body">
        <pre className="vs-code-display">
          <code>
            {current.code.map((line, index) => {
              if (line.type === 'comment') {
                return (
                  <div key={index} className="vs-code-line comment">
                    {line.text}
                  </div>
                );
              }
              if (line.type === 'empty') {
                return <div key={index} className="vs-code-line empty">{" "}</div>;
              }
              return (
                <div key={index} className="vs-code-line">
                  {line.parts.map((part, pIdx) => (
                    <span key={pIdx} className={`code-${part.type}`}>
                      {part.text}
                    </span>
                  ))}
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Custom Mock Scrollbar */}
      <div className="vs-mock-scrollbar-track">
        <div className="vs-mock-scrollbar-thumb"></div>
      </div>

      {/* Execution Output (Terminal) */}
      <div className="vs-editor-terminal">
        <div className="vs-terminal-header">
          <div className="vs-terminal-title">
            <span className="vs-shell-symbol">$</span>
            {' '}{current.terminalHeader}
          </div>
          <div className="vs-terminal-badge">
            <span className="vs-ran-indicator"></span>
            RAN
          </div>
        </div>
        <div className="vs-terminal-body">
          {current.terminalLogs.map((log, index) => (
            <div key={index} className="vs-terminal-log">
              <span className="vs-log-check">✓</span>
              {log.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
