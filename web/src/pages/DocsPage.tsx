import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import testMd from '../docs/test.md?raw'

// Custom components for react-markdown
const components = {
  a({ node, ...props }: any) {
    return (
      <a
        className="text-green-400 hover:underline transition-colors decoration-green-400/50 underline-offset-2"
        {...props}
      />
    )
  },
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '')
    if (!inline && match) {
      return (
        <div className="relative group my-4">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            className="rounded-lg !bg-[#1e1e1e] !border !border-gray-800 !p-4 !m-0"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      )
    }
    // Inline code — render as chip
    return (
      <code
        className="inline-flex items-center rounded-md bg-gray-800 px-1.5 py-0.5 text-sm font-mono text-green-300 border border-gray-700"
        {...props}
      >
        {children}
      </code>
    )
  },
  h1({ node, children, ...props }: any) {
    return (
      <h1 className="text-3xl font-bold text-white mb-6 mt-2" {...props}>
        {children}
      </h1>
    )
  },
  h2({ node, children, ...props }: any) {
    return (
      <h2 className="text-2xl font-semibold text-white mt-10 mb-4 border-b border-gray-800 pb-2" {...props}>
        {children}
      </h2>
    )
  },
  h3({ node, children, ...props }: any) {
    return (
      <h3 className="text-xl font-semibold text-white mt-8 mb-3" {...props}>
        {children}
      </h3>
    )
  },
  p({ node, children, ...props }: any) {
    return (
      <p className="text-gray-300 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    )
  },
  ul({ node, children, ...props }: any) {
    return (
      <ul className="list-disc pl-5 text-gray-300 space-y-1 mb-4" {...props}>
        {children}
      </ul>
    )
  },
  ol({ node, children, ...props }: any) {
    return (
      <ol className="list-decimal pl-5 text-gray-300 space-y-1 mb-4" {...props}>
        {children}
      </ol>
    )
  },
  li({ node, children, ...props }: any) {
    return (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    )
  },
  pre({ children }: any) {
    // react-syntax-highlighter already wraps in a div, so pre is handled by code
    return <>{children}</>
  },
}

export default function DocsPage() {
  const [content, setContent] = useState('')

  useEffect(() => {
    setContent(testMd)
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
