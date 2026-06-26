import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Search, Monitor, ExternalLink } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { docHeadingsMap } from '../docs/mockDocsData'

interface DocsLayoutProps {
  children: ReactNode
}

const topbarLinks = [
  { label: 'Guide', path: '/docs/guide/introduction' },
  { label: 'Examples', path: '/docs/examples' },
  { label: 'Reference', path: '/docs/reference/reference' },
  { label: 'Playground', path: '/playground' },
]

interface SidebarItem {
  label: string;
  slug: string;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

const guideSidebarSections: SidebarSection[] = [
  {
    title: 'Getting started',
    items: [
      { label: 'Introduction', slug: 'introduction' },
      { label: 'Account setup', slug: 'modal-user-account-setup' },
      { label: 'Project structure', slug: 'project-structure' },
      { label: 'Local data', slug: 'local-data' },
      { label: 'Global variables', slug: 'global-variables' },
      { label: 'Async API', slug: 'async' },
      { label: 'Parametrized functions', slug: 'parametrized-functions' },
      { label: 'Dynamic function config', slug: 'dynamic-function-config' },
      { label: 'Lifecycle functions', slug: 'lifecycle-functions' },
    ]
  },
  {
    title: 'Custom container images',
    items: [
      { label: 'Defining Images', slug: 'images' },
      { label: 'Using existing container images', slug: 'existing-images' },
      { label: 'Named images', slug: 'named-images' },
      { label: 'Fast pull from registry', slug: 'fast-pull-from-registry' }
    ]
  },
  {
    title: 'GPUs and other resources',
    items: [
      { label: 'GPU acceleration', slug: 'gpu' },
      { label: 'GPU health', slug: 'gpu-health' },
      { label: 'GPU metrics', slug: 'gpu-metrics' },
      { label: 'Using CUDA on Boxty', slug: 'cuda' },
      { label: 'Configuring CPU, memory, and disk', slug: 'resources' },
      { label: 'Region selection', slug: 'region-selection' },
      { label: 'Preemption', slug: 'preemption' },
      { label: 'Timeouts', slug: 'timeouts' },
      { label: 'Retries', slug: 'retries' },
    ]
  },
  {
    title: 'Scaling out',
    items: [
      { label: 'Scaling out', slug: 'scale' },
      { label: 'Input concurrency', slug: 'concurrent-inputs' },
      { label: 'Batch processing', slug: 'batch-processing' },
      { label: 'Job queues', slug: 'job-queue' },
      { label: 'Dynamic batching', slug: 'dynamic-batching' },
      { label: 'Multi-node clusters (Beta)', slug: 'multi-node-training' }
    ]
  },
  {
    title: 'Deployment',
    items: [
      { label: 'Apps, Functions, and entrypoints', slug: 'apps' },
      { label: 'Managing deployments', slug: 'managing-deployments' },
      { label: 'Continuous deployment', slug: 'continuous-deployment' },
      { label: 'Trigger deployed functions', slug: 'trigger-deployed-functions' },
      { label: 'Feature maturity', slug: 'feature-maturity' },
      { label: 'Environment variables', slug: 'environment_variables' },
    ]
  },
  {
    title: 'Web endpoints',
    items: [
      { label: 'Web Functions', slug: 'webhooks' },
      { label: 'Web Function URLs', slug: 'webhook-urls' },
      { label: 'Request timeouts', slug: 'webhook-timeouts' },
      { label: 'Proxy auth', slug: 'webhook-proxy-auth' },
      { label: 'Streaming endpoints', slug: 'streaming-endpoints' },
      { label: 'Servers', slug: 'servers' },
      { label: 'Tunnels', slug: 'tunnels' },
    ]
  },
  {
    title: 'Storage',
    items: [
      { label: 'Volumes', slug: 'volumes' },
      { label: 'Cloud bucket mounts', slug: 'cloud-bucket-mounts' },
      { label: 'Dicts', slug: 'dicts' },
      { label: 'Queues', slug: 'queues' },
      { label: 'Secrets', slug: 'secrets' },
      { label: 'Model weights', slug: 'model-weights' },
      { label: 'Memory snapshots', slug: 'memory-snapshots' },
      { label: 'Customer supplied encryption keys', slug: 'customer-supplied-encryption-keys' },
    ]
  },
  {
    title: 'Sandbox',
    items: [
      { label: 'Sandboxes', slug: 'sandboxes' },
      { label: 'Running commands', slug: 'sandbox-spawn' },
      { label: 'Filesystem access', slug: 'sandbox-files' },
      { label: 'Networking and security', slug: 'sandbox-networking' },
      { label: 'Resources and pricing', slug: 'sandbox-resources' },
      { label: 'Snapshots', slug: 'sandbox-snapshots' },
      { label: 'VM Sandboxes (Alpha)', slug: 'vm-sandboxes' },
    ]
  },
  {
    title: 'LLM inference',
    items: [
      { label: 'Endpoints', slug: 'endpoints' },
      { label: 'Endpoint benchmarks', slug: 'endpoint-benchmarks' },
      { label: 'Endpoint metrics', slug: 'endpoint-metrics' },
      { label: 'High-performance LLM inference', slug: 'high-performance-llm-inference' },
      { label: 'Notebooks', slug: 'notebooks' },
      { label: 'Jupyter notebooks', slug: 'jupyter-notebooks' },
      { label: 'Developing with LLMs', slug: 'developing-with-llms' },
      { label: 'Dataset ingestion', slug: 'dataset-ingestion' },
    ]
  },
  {
    title: 'Networking',
    items: [
      { label: 'Cluster networking', slug: 'private-networking' },
      { label: 'Proxies', slug: 'proxy-ips' },
      { label: 'S3 gateway endpoints', slug: 's3-gateway-endpoints' },
      { label: 'OIDC integration', slug: 'oidc-integration' },
    ]
  },
  {
    title: 'Observability',
    items: [
      { label: 'Audit logs', slug: 'audit-logs' },
      { label: 'Datadog integration', slug: 'datadog-integration' },
      { label: 'OpenTelemetry integration', slug: 'otel-integration' },
      { label: 'Slack notifications', slug: 'slack-notifications' },
    ]
  },
  {
    title: 'Security',
    items: [
      { label: 'Security overview', slug: 'security' },
      { label: 'RBAC', slug: 'rbac' },
      { label: 'SAML SSO', slug: 'saml-sso' },
      { label: 'Okta SSO', slug: 'okta-sso' },
      { label: 'Restricted access', slug: 'restricted-access' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Workspaces', slug: 'workspaces' },
      { label: 'Environments', slug: 'environments' },
      { label: 'Service users', slug: 'service-users' },
      { label: 'Billing', slug: 'billing' },
      { label: 'Cold start performance', slug: 'cold-start' },
      { label: 'Troubleshooting', slug: 'troubleshooting' },
      { label: 'Developing and debugging', slug: 'developing-debugging' },
    ]
  },
  {
    title: 'Client SDKs',
    items: [
      { label: 'JavaScript and Go SDKs', slug: 'sdk-javascript-go' },
    ]
  },
  {
    title: 'Migration',
    items: [
      { label: 'Boxty 1.0 migration', slug: 'modal-1-0-migration' },
    ]
  },
  {
    title: 'Scheduling',
    items: [
      { label: 'Cron jobs', slug: 'cron' },
    ]
  }
];

const referenceSidebarSections: SidebarSection[] = [
  {
    items: [
      { label: 'boxty.App', slug: 'app' },
      { label: 'boxty.Client', slug: 'client' },
      { label: 'boxty.CloudBucketMount', slug: 'cloudbucketmount' },
      { label: 'boxty.Cls', slug: 'cls' },
      { label: 'boxty.Cron', slug: 'cron' },
      { label: 'boxty.Dict', slug: 'dict' },
      { label: 'boxty.Environment', slug: 'environment' },
      { label: 'boxty.Error', slug: 'error' },
      { label: 'boxty.FilePatternMatcher', slug: 'filepatternmatcher' },
      { label: 'boxty.Function', slug: 'function' },
      { label: 'boxty.FunctionCall', slug: 'functioncall' },
      { label: 'boxty.Image', slug: 'image' },
      { label: 'boxty.Period', slug: 'period' },
      { label: 'boxty.Probe', slug: 'probe' },
      { label: 'boxty.Proxy', slug: 'proxy' },
      { label: 'boxty.Queue', slug: 'queue' },
      { label: 'boxty.Retries', slug: 'retries' },
      { label: 'boxty.Sandbox', slug: 'sandbox' },
      { label: 'boxty.SandboxSnapshot', slug: 'sandboxsnapshot' },
      { label: 'boxty.Secret', slug: 'secret' },
      { label: 'boxty.Server', slug: 'server' },
      { label: 'boxty.Tunnel', slug: 'tunnel' },
      { label: 'boxty.Volume', slug: 'volume' },
      { label: 'boxty.Workspace', slug: 'workspace' },
      { label: 'boxty.asgi_app', slug: 'asgi_app' },
      { label: 'boxty.batched', slug: 'batched' },
      { label: 'boxty.billing', slug: 'billing' },
      { label: 'boxty.call_graph', slug: 'call_graph' },
      { label: 'boxty.concurrent', slug: 'concurrent' },
      { label: 'boxty.config', slug: 'config' },
      { label: 'boxty.container_process', slug: 'container_process' },
      { label: 'boxty.current_function_call_id', slug: 'current_function_call_id' },
      { label: 'boxty.current_input_id', slug: 'current_input_id' },
      { label: 'boxty.enable_output', slug: 'enable_output' },
      { label: 'boxty.enter', slug: 'enter' },
      { label: 'boxty.exception', slug: 'exception' },
      { label: 'boxty.exit', slug: 'exit' },
      { label: 'boxty.fastapi_endpoint', slug: 'fastapi_endpoint' },
      { label: 'boxty.file_io', slug: 'file_io' },
      { label: 'boxty.forward', slug: 'forward' },
      { label: 'boxty.interact', slug: 'interact' },
      { label: 'boxty.io_streams', slug: 'io_streams' },
      { label: 'boxty.is_local', slug: 'is_local' },
      { label: 'boxty.method', slug: 'method' },
      { label: 'boxty.parameter', slug: 'parameter' },
      { label: 'boxty.web_server', slug: 'web_server' },
      { label: 'boxty.wsgi_app', slug: 'wsgi_app' }
    ]
  }
];

export default function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { slug = 'introduction' } = useParams()

  const [activeHeading, setActiveHeading] = useState('')

  const isReference = location.pathname.startsWith('/docs/reference')
  const sidebarSections = isReference ? referenceSidebarSections : guideSidebarSections
  const pathPrefix = isReference ? '/docs/reference' : '/docs/guide'

  // Get active headings for current page
  const headings = docHeadingsMap[slug] || []

  // Scroll Spy to highlight active TOC subheading
  useEffect(() => {
    if (headings.length === 0) return

    const handleScroll = () => {
      const scrollContainer = document.getElementById('docs-main-scroll-container')
      if (!scrollContainer) return

      let currentActive = headings[0]?.slug || ''
      const scrollPosition = scrollContainer.scrollTop + 140

      // Check if scroll has reached the bottom
      const isAtBottom = 
        Math.abs(scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollContainer.scrollTop) < 10

      if (isAtBottom) {
        currentActive = headings[headings.length - 1]?.slug || ''
      } else {
        for (const heading of headings) {
          const el = document.getElementById(heading.slug)
          if (el) {
            const offsetTop = el.offsetTop
            if (scrollPosition >= offsetTop) {
              currentActive = heading.slug
            }
          }
        }
      }
      setActiveHeading(currentActive)
    }

    const scrollContainer = document.getElementById('docs-main-scroll-container')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll)
      // Initial call
      handleScroll()
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [headings, slug])

  const isActiveTopbar = (path: string) => {
    if (path === '/docs/examples' || path === '/playground') {
      return location.pathname.startsWith(path)
    }
    if (path === '/docs/guide/introduction') {
      return location.pathname.startsWith('/docs/guide')
    }
    if (path === '/docs/reference/reference') {
      return location.pathname.startsWith('/docs/reference')
    }
    return location.pathname === path
  }

  const handleTOCClick = (targetSlug: string) => {
    const el = document.getElementById(targetSlug)
    const scrollContainer = document.getElementById('docs-main-scroll-container')
    if (el && scrollContainer) {
      scrollContainer.scrollTo({
        top: el.offsetTop - 30,
        behavior: 'smooth'
      })
      setActiveHeading(targetSlug)
    }
  }

  const renderHeadings = () => {
    if (headings.length === 0) return null

    return (
      <div className="space-y-0.5 select-none">
        {headings.map((heading) => {
          const isHeadingActive = activeHeading === heading.slug
          const isLevel2 = heading.level > 1
          return (
            <button
              key={heading.slug}
              onClick={() => handleTOCClick(heading.slug)}
              className={`w-full h-8 flex items-center rounded-lg text-[13.5px] transition-all ${
                isHeadingActive
                  ? 'bg-zinc-800/40 text-white font-medium shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30'
              } ${isLevel2 ? 'pl-7 pr-3' : 'px-3'}`}
            >
              <span className="truncate">{heading.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0d0e] text-zinc-300 font-sans antialiased">
      {/* Topbar - Slim version (48px) */}
      <header className="h-[48px] flex items-center justify-between border-b border-zinc-800 bg-[#0c0d0e] px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-12">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center select-none">
            <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 8.2L11 3.5v12.3L3 20.5V8.2z" fill="#10B981" />
              <path d="M13 3.5l8 4.7v12.3l-8-4.7V3.5z" fill="#059669" />
            </svg>
            <span className="text-[16px] font-bold text-white tracking-tight ml-2">
              Boxty<span className="text-[#34d399] ml-1">Docs</span>
            </span>
          </Link>

          {/* Topbar navigation links */}
          <nav className="flex items-center h-[48px]">
            {topbarLinks.map((link) => {
              const active = isActiveTopbar(link.path)
              return (
                <div key={link.path} className="relative h-full flex items-center px-4">
                  <Link
                    to={link.path}
                    className={`text-[13.5px] font-medium transition-colors ${
                      active ? 'text-[#34d399]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#34d399] rounded-t-full" />
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-6">
          {/* Search bar */}
          <div className="relative w-52">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <Search className="h-3 w-3 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search"
              readOnly
              onClick={() => navigate('/docs/search')}
              className="w-full text-[12px] bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 pl-8 pr-11 py-1 rounded-lg outline-none cursor-pointer transition-all"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8.5px] font-mono font-medium text-zinc-500 bg-zinc-800/60 border border-zinc-700/60">
                <span>⌘</span><span>K</span>
              </kbd>
            </div>
          </div>

          {/* Dashboard Link */}
          <Link
            to="/apps/adrian-tucicovenco/main"
            className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#34d399] hover:text-[#2bb882] transition-colors"
          >
            <Monitor className="h-3.5 w-3.5" strokeWidth={2} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[280px] flex-shrink-0 border-r border-zinc-800 bg-[#0c0d0e] flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-4 space-y-4 select-none">
            {sidebarSections.map((section, idx) => (
              <div key={idx} className="space-y-0.5">
                {section.title && (
                  section.items.length > 0 ? (
                    <Link
                      to={`${pathPrefix}/${section.items[0].slug}`}
                      className="h-8 flex items-center text-[13px] font-semibold text-zinc-400 hover:text-white px-3 select-none mt-1 transition-colors cursor-pointer"
                    >
                      {section.title}
                    </Link>
                  ) : (
                    <div className="h-8 flex items-center text-[13px] font-semibold text-zinc-400 px-3 select-none mt-1">
                      {section.title}
                    </div>
                  )
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isItemActive = slug === item.slug
                    const isMono = item.label.startsWith('boxty.')
                    return (
                      <li key={item.slug}>
                        <Link
                          to={`${pathPrefix}/${item.slug}`}
                          className={`w-full h-8 flex items-center rounded-lg text-[13.5px] transition-all ${
                            isItemActive
                              ? 'bg-zinc-800/40 text-white font-medium shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30'
                          } ${section.title ? 'pl-7 pr-3' : 'px-3'} ${isMono ? 'font-mono text-[12px]' : ''}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Center Content & Right Sidebar Container - Unified scroll container to place scrollbar on the far right */}
        <div
          id="docs-main-scroll-container"
          className="relative flex-1 flex overflow-y-auto bg-[#0c0d0e] scroll-smooth"
        >
          {/* Main content column - Adjusted top padding to make Title (Introduction) closer to the top */}
          <main className="flex-1 min-w-0">
            <div className="max-w-[780px] mx-auto px-10 pt-8 pb-12">
              {children}
            </div>
          </main>

          {/* Right Sidebar (Table of Contents) - Sticky to viewport but inside the scroll container */}
          <aside className="w-[280px] flex-shrink-0 bg-[#0c0d0e] sticky top-0 h-[calc(100vh-48px)] flex flex-col p-6 space-y-6 overflow-y-auto hidden xl:block select-none">
            {/* TOC Headings */}
            {renderHeadings()}

            {/* "See it in action" Card */}
            <div className="rounded-lg border border-[#34d399]/25 bg-zinc-900/10 p-4 space-y-3">
              <h5 className="text-[12.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                See it in action
              </h5>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/docs/guide/hello-world"
                    className="flex items-center gap-1.5 text-[13.5px] text-white hover:text-[#34d399] transition-colors"
                  >
                    Hello, world!
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs/guide/web-scraper"
                    className="flex items-center gap-1.5 text-[13.5px] text-white hover:text-[#34d399] transition-colors"
                  >
                    A simple web scraper
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
