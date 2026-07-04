import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import testMd from '../docs/test.md?raw'

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

// Vite glob import for all guide markdown files
const guideModules = import.meta.glob('../docs/guide/*.md', { query: '?raw', import: 'default', eager: true })

// Vite glob import for all reference markdown files
const referenceModules = import.meta.glob('../docs/reference/*.md', { query: '?raw', import: 'default', eager: true })

// Custom theme for syntax highlighting matching the screenshot colors
const customPrismTheme: { [key: string]: any } = {
  'code[class*="language-"]': {
    color: '#e2e8f0',
    background: 'none',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e2e8f0',
    background: 'none',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: '4',
    hyphens: 'none',
  },
  'comment': { color: '#71717a', fontStyle: 'italic' },
  'prolog': { color: '#71717a' },
  'doctype': { color: '#71717a' },
  'cdata': { color: '#71717a' },
  'punctuation': { color: '#a1a1aa' },
  'property': { color: '#60a5fa' },
  'tag': { color: '#f472b6' },
  'boolean': { color: '#e879f9' },
  'number': { color: '#e879f9' },
  'constant': { color: '#60a5fa' },
  'symbol': { color: '#34d399' },
  'deleted': { color: '#ef4444' },
  'selector': { color: '#34d399' },
  'attr-name': { color: '#34d399' },
  'string': { color: '#fdba74' },
  'char': { color: '#fdba74' },
  'builtin': { color: '#60a5fa' },
  'inserted': { color: '#10b981' },
  'operator': { color: '#a1a1aa' },
  'entity': { color: '#60a5fa', cursor: 'help' },
  'url': { color: '#60a5fa' },
  'variable': { color: '#e2e8f0' },
  'keyword': { color: '#f472b6' },
  'function': { color: '#60a5fa' },
  'class-name': { color: '#60a5fa' },
  'decorator': { color: '#34d399' },
  'atrule': { color: '#f472b6' },
  'attr-value': { color: '#fdba74' },
  'regex': { color: '#fdba74' },
  'important': { color: '#f472b6', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
}

function CopyPageButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition-colors select-none"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </>
        )}
      </svg>
      <span>{copied ? 'Copied URL!' : 'Copy page'}</span>
      <svg className="h-3 w-3 opacity-60 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}

export default function DocsPage() {
  const { slug = 'introduction' } = useParams()
  const [content, setContent] = useState('')

  useEffect(() => {
    if (slug === 'introduction') {
      setContent(testMd)
      return
    }
    
    // Try to load from guide markdown files
    const modulePath = `../docs/guide/${slug}.md`
    if (guideModules[modulePath]) {
      setContent(guideModules[modulePath] as string)
      return
    }

    // Try to load from reference markdown files
    const referenceModulePath = `../docs/reference/${slug}.md`
    if (referenceModules[referenceModulePath]) {
      setContent(referenceModules[referenceModulePath] as string)
    } else {
      setContent(`# Not Found\n\nThis page doesn't exist yet.`)
    }
  }, [slug])

  // Custom components for react-markdown
  const components = {
    a({ node, ...props }: any) {
      return (
        <a
          className="text-[#34d399] hover:underline transition-colors decoration-[#34d399]/40 font-medium"
          {...props}
        />
      )
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      if (!inline && match) {
        return (
          <div className="my-6 rounded-lg bg-[#131314] border border-zinc-800/80 overflow-hidden max-w-full">
            <div className="overflow-x-auto p-5">
              <SyntaxHighlighter
                style={customPrismTheme}
                language={match[1]}
                PreTag="pre"
                customStyle={{
                  margin: 0,
                  padding: 0,
                  background: 'transparent',
                  overflow: 'visible',
                }}
                className="font-mono text-[13.5px]"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          </div>
        )
      }
      return (
        <code
          className="inline-flex items-center rounded bg-zinc-900 px-1.5 py-0.5 text-[13px] font-mono text-[#34d399] border border-zinc-800/80"
          {...props}
        >
          {children}
        </code>
      )
    },
    h1({ node, children, ...props }: any) {
      return (
        <div className="flex items-center justify-between mb-8 mt-2 pb-2">
          <h1 className="text-3xl font-bold text-white tracking-tight" {...props}>
            {children}
          </h1>
          <CopyPageButton />
        </div>
      )
    },
    h2({ node, children, ...props }: any) {
      const text = String(children)
      const id = slugify(text)
      return (
        <h2
          id={id}
          className="text-[20px] font-semibold text-white mt-12 mb-4 scroll-mt-20"
          {...props}
        >
          {children}
        </h2>
      )
    },
    h3({ node, children, ...props }: any) {
      const text = String(children)
      const id = slugify(text)
      return (
        <h3
          id={id}
          className="text-[17px] font-semibold text-white mt-8 mb-3 scroll-mt-20"
          {...props}
        >
          {children}
        </h3>
      )
    },
    p({ node, children, ...props }: any) {
      return (
        <p className="text-zinc-300 leading-relaxed mb-5 text-[15px]" {...props}>
          {children}
        </p>
      )
    },
    ul({ node, children, ...props }: any) {
      return (
        <ul className="list-disc pl-5 text-zinc-300 space-y-2 mb-5 text-[15px]" {...props}>
          {children}
        </ul>
      )
    },
    ol({ node, children, ...props }: any) {
      return (
        <ol className="list-decimal pl-5 text-zinc-300 space-y-2 mb-5 text-[15px]" {...props}>
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
      return <>{children}</>
    },
    table({ node, children, ...props }: any) {
      return (
        <div className="my-6 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-900/10 w-full">
          <table className="w-full border-collapse text-left text-[13.5px] font-sans" {...props}>
            {children}
          </table>
        </div>
      )
    },
    thead({ node, children, ...props }: any) {
      return <thead className="hidden" {...props}>{children}</thead>
    },
    tbody({ node, children, ...props }: any) {
      return <tbody {...props}>{children}</tbody>
    },
    tr({ node, children, ...props }: any) {
      return (
        <tr className="border-b border-zinc-800/85 last:border-b-0 hover:bg-zinc-900/20 transition-colors h-10" {...props}>
          {children}
        </tr>
      )
    },
    td({ node, children, ...props }: any) {
      return (
        <td className="px-4 py-2.5 align-middle text-zinc-300 first:w-1/3" {...props}>
          {children}
        </td>
      )
    },
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  )
}
