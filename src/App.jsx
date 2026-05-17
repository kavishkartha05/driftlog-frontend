import { useState, useEffect, useCallback } from 'react'

const NOTION_API = '/api/notion'

function notionFetch(path, token, options = {}) {
  return fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

function extractPropValue(prop) {
  if (!prop) return null
  switch (prop.type) {
    case 'title': return prop.title?.map(t => t.plain_text).join('') || ''
    case 'rich_text': return prop.rich_text?.map(t => t.plain_text).join('') || ''
    case 'select': return prop.select?.name || ''
    case 'number': return prop.number ?? null
    case 'checkbox': return prop.checkbox ?? false
    case 'url': return prop.url || ''
    default: return null
  }
}

function findProp(properties, ...names) {
  for (const name of names) {
    const key = Object.keys(properties).find(k => k.toLowerCase() === name.toLowerCase())
    if (key) return extractPropValue(properties[key])
  }
  return null
}

function findRawProp(properties, ...names) {
  for (const name of names) {
    const key = Object.keys(properties).find(k => k.toLowerCase() === name.toLowerCase())
    if (key) return properties[key]
  }
  return null
}

const DECISION_BADGE = {
  Architectural: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Security: 'bg-red-500/20 text-red-300 border-red-500/30',
  Performance: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Dependency: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  API: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Refactor: 'bg-green-500/20 text-green-300 border-green-500/30',
  Migration: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

function decisionBadgeClass(type) {
  return DECISION_BADGE[type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'
}

function healthTextClass(score) {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

function healthBgClass(score) {
  if (score >= 8) return 'bg-emerald-400/10 border-emerald-400/20'
  if (score >= 5) return 'bg-yellow-400/10 border-yellow-400/20'
  return 'bg-red-400/10 border-red-400/20'
}

function healthGlowStyle(score) {
  if (score >= 8) return { boxShadow: '0 0 10px rgba(52,211,153,0.5)' }
  if (score >= 5) return { boxShadow: '0 0 10px rgba(250,204,21,0.5)' }
  return { boxShadow: '0 0 10px rgba(248,113,113,0.5)' }
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function DriftlogIcon({ className, id }) {
  const gradId = `dl-grad-${id}`
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        d="M2 9 C7 3 17 3 22 9"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2 15 C7 9 17 9 22 15"
        stroke={`url(#${gradId})`}
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
      <span className="shrink-0 mt-0.5">⚠</span>
      <span>{message}</span>
    </div>
  )
}

function PrimaryButton({ onClick, disabled, loading, children }) {
  const isDisabled = disabled || loading
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="group px-6 py-3 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed hover:scale-105 hover:rotate-1"
      style={isDisabled ? {} : { background: 'linear-gradient(135deg, #6366f1, #22d3ee)' }}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className="group-hover:-rotate-1 transition-all duration-200">{children}</span>
    </button>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
    >
      Back
    </button>
  )
}

function StepProgress({ step, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
              i + 1 < step
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : i + 1 === step
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {i + 1 < step ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 transition-all duration-300 ${i + 1 < step ? 'bg-indigo-600' : 'bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Wizard steps ─────────────────────────────────────────────────────────────

function Step1({ token, setToken, onNext }) {
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  async function validate() {
    if (!token.trim()) { setError('Please enter your Notion API token.'); return }
    setValidating(true)
    setError('')
    try {
      const res = await notionFetch('/v1/users/me', token)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || `Validation failed (${res.status}). Check your token.`)
        return
      }
      onNext()
    } catch {
      setError('Could not reach Notion API. Make sure the dev server proxy is running.')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Connect Notion</h2>
        <p className="text-slate-400 text-sm">Enter your Notion integration token. We'll validate it before continuing.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Notion API Token</label>
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && validate()}
          placeholder="secret_..."
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-slate-500">
          Create an integration at notion.so/my-integrations and copy the Internal Integration Token.
        </p>
      </div>
      <ErrorBanner message={error} />
      <PrimaryButton onClick={validate} loading={validating} disabled={!token.trim()}>
        {validating ? 'Validating…' : 'Validate & Continue'}
      </PrimaryButton>
    </div>
  )
}

function Step2({ token, dbId, setDbId, onNext, onBack }) {
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  async function validate() {
    const id = dbId.replace(/-/g, '').trim()
    if (!id) { setError('Please enter a Database ID.'); return }
    setValidating(true)
    setError('')
    try {
      const res = await notionFetch(`/v1/databases/${id}`, token)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || `Database not found (${res.status}). Check the ID and make sure the integration has access.`)
        return
      }
      setDbId(id)
      onNext()
    } catch {
      setError('Could not reach Notion API.')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Notion Database</h2>
        <p className="text-slate-400 text-sm">Provide the ID of the Notion database where ADRs will be stored.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Database ID</label>
        <input
          type="text"
          value={dbId}
          onChange={e => setDbId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && validate()}
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <p className="text-xs text-slate-500">
          Found in the database URL: notion.so/workspace/<span className="text-slate-400">{'{'}</span>database-id<span className="text-slate-400">{'}'}</span>?v=…
        </p>
      </div>
      <ErrorBanner message={error} />
      <div className="flex gap-3">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={validate} loading={validating} disabled={!dbId.trim()}>
          {validating ? 'Validating…' : 'Validate & Continue'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function Step3({ webhookUrl, onNext, onBack }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">GitHub Webhook</h2>
        <p className="text-slate-400 text-sm">Add this URL as a webhook in your GitHub repository to start capturing PR events.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Webhook URL</label>
        <div className="flex gap-2">
          <code className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-indigo-300 text-sm font-mono break-all min-w-0">
            {webhookUrl}
          </code>
          <button
            onClick={copy}
            className={`px-4 py-3 rounded-lg border font-medium text-sm transition-all whitespace-nowrap ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
        <p className="text-sm font-medium text-slate-300">Setup instructions</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-400">
          <li>Go to your GitHub repo → <span className="text-slate-300">Settings → Webhooks → Add webhook</span></li>
          <li>Paste the URL above into <span className="text-slate-300">Payload URL</span></li>
          <li>Set Content type to <code className="text-slate-300">application/json</code></li>
          <li>Under events, select <span className="text-slate-300">Pull requests</span></li>
          <li>Click <span className="text-slate-300">Add webhook</span></li>
        </ol>
      </div>
      <div className="flex gap-3">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onNext}>I've added the webhook →</PrimaryButton>
      </div>
    </div>
  )
}

function Step4({ onNext, onBack }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-5 py-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">Worker is ready</h2>
          <p className="text-slate-400 text-sm mt-1">Your Driftlog agent is configured and listening for GitHub events.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '🔗', label: 'Webhook', status: 'Connected' },
          { icon: '📦', label: 'Notion', status: 'Connected' },
          { icon: '🤖', label: 'Agent', status: 'Active' },
        ].map(({ icon, label, status }) => (
          <div key={label} className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
            <div className="text-sm font-medium text-emerald-400 mt-1">{status}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <BackButton onClick={onBack} />
        <PrimaryButton onClick={onNext}>View Activity Feed →</PrimaryButton>
      </div>
    </div>
  )
}

// ─── Setup wizard shell ───────────────────────────────────────────────────────

function SetupWizard({ webhookUrl, onComplete }) {
  const [step, setStep] = useState(1)
  const [notionToken, setNotionToken] = useState('')
  const [databaseId, setDatabaseId] = useState('')

  const TOTAL_STEPS = 4

  return (
    <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <DriftlogIcon className="w-9 h-9" id="lg" />
          <div>
            <div className="font-bold text-white text-lg leading-none">Driftlog</div>
            <div className="text-xs text-slate-500 mt-0.5">Autonomous architectural memory</div>
          </div>
        </div>

        <div
          className="bg-[#080818] rounded-2xl p-8"
          style={{ border: '1px solid rgba(99,102,241,0.25)', boxShadow: '0 0 40px rgba(99,102,241,0.1)' }}
        >
          <StepProgress step={step} total={TOTAL_STEPS} />

          {step === 1 && (
            <Step1
              token={notionToken}
              setToken={setNotionToken}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              token={notionToken}
              dbId={databaseId}
              setDbId={setDatabaseId}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3
              webhookUrl={webhookUrl}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4
              onNext={() => onComplete(notionToken, databaseId)}
              onBack={() => setStep(3)}
            />
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Credentials are stored only in browser memory — never sent anywhere except Notion.
        </p>
      </div>
    </div>
  )
}

// ─── ADR card ─────────────────────────────────────────────────────────────────

function ADRCard({ entry }) {
  const [hovered, setHovered] = useState(false)
  const props = entry.properties || {}

  const title = findProp(props, 'PR Title', 'Title', 'Name', 'PR')
  const system = findProp(props, 'System Affected', 'System', 'Component', 'Service')
  const decisionType = findProp(props, 'Decision Type', 'Type', 'Category', 'Decision')
  const healthRaw = findRawProp(props, 'Health Score', 'Score', 'Health')
  const healthScore = healthRaw?.type === 'number' ? healthRaw.number : null
  const hasDrift = findProp(props, 'Drift', 'Drift Warning', 'Has Drift', 'Drifted')
  const summary = findProp(props, 'Summary', 'Description', 'Rationale', 'Details')
  const prUrl = findProp(props, 'PR URL', 'PR Link', 'GitHub URL', 'Link')

  const createdAt = entry.created_time
    ? new Date(entry.created_time).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div
      className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-all duration-200 flex flex-col gap-4"
      style={hovered ? { boxShadow: '0 0 20px rgba(99,102,241,0.2)' } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hasDrift && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-amber-400 shrink-0">⚠</span>
          <span className="text-amber-300 text-xs font-medium">Architectural drift detected — decision may be outdated</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
            {title || <span className="text-slate-500 font-mono text-xs">{entry.id}</span>}
          </h3>
          {system && (
            <p className="text-slate-500 text-xs mt-1">
              <span className="text-slate-400">System:</span> {system}
            </p>
          )}
        </div>
        {healthScore !== null && (
          <div
            className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg border ${healthBgClass(healthScore)}`}
            style={healthGlowStyle(healthScore)}
          >
            <span className={`text-lg font-bold leading-none ${healthTextClass(healthScore)}`}>{healthScore}</span>
            <span className="text-xs text-slate-500 mt-0.5">health</span>
          </div>
        )}
      </div>

      {decisionType && (
        <div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${decisionBadgeClass(decisionType)}`}>
            {decisionType}
          </span>
        </div>
      )}

      {summary && (
        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{summary}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-auto">
        <span className="text-xs text-slate-600">{createdAt}</span>
        <div className="flex items-center gap-3">
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              PR
            </a>
          )}
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.887l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z" />
              </svg>
              Notion
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Activity feed ────────────────────────────────────────────────────────────

function ActivityFeed({ token, databaseId, onReset }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filter, setFilter] = useState('all')
  const [countdown, setCountdown] = useState(10)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [resetHovered, setResetHovered] = useState(false)

  const poll = useCallback(async () => {
    try {
      const res = await notionFetch(`/v1/databases/${databaseId}/query`, token, {
        method: 'POST',
        body: JSON.stringify({
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 50,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.message || `Fetch failed (${res.status})`)
        return
      }
      const data = await res.json()
      setEntries(data.results || [])
      setLastUpdated(new Date())
      setError('')
    } catch {
      setError('Polling failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [token, databaseId])

  useEffect(() => {
    poll()
    const pollId = setInterval(() => {
      poll()
      setCountdown(10)
    }, 10_000)
    const tickId = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1))
    }, 1_000)
    return () => {
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [poll])

  const decisionTypes = [
    ...new Set(
      entries
        .map(e => findProp(e.properties || {}, 'Decision Type', 'Type', 'Category', 'Decision'))
        .filter(Boolean)
    ),
  ]

  const driftCount = entries.filter(e =>
    findProp(e.properties || {}, 'Drift', 'Drift Warning', 'Has Drift', 'Drifted')
  ).length

  const filtered =
    filter === 'all'
      ? entries
      : filter === 'drift'
      ? entries.filter(e => findProp(e.properties || {}, 'Drift', 'Drift Warning', 'Has Drift', 'Drifted'))
      : entries.filter(
          e => findProp(e.properties || {}, 'Decision Type', 'Type', 'Category', 'Decision') === filter
        )

  return (
    <div
      className="min-h-screen bg-[#050510] relative"
      onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <div
        style={{
          position: 'fixed',
          left: mousePos.x,
          top: mousePos.y,
          width: '600px',
          height: '600px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'none',
        }}
      />
      <header
        className="bg-[#080818] backdrop-blur sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(99,102,241,0.4)' }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DriftlogIcon className="w-7 h-7" id="sm" />
            <span className="font-semibold text-white text-sm">Driftlog</span>
            <span
              className="relative flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-full"
              style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
            <span className="text-xs text-cyan-400">refreshing in {countdown}s</span>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-slate-500 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={onReset}
              onMouseEnter={() => setResetHovered(true)}
              onMouseLeave={() => setResetHovered(false)}
              className="px-3 py-1.5 bg-slate-800 text-xs font-medium rounded-lg transition-all duration-200"
              style={{
                border: `1px solid ${resetHovered ? 'rgba(239,68,68,0.6)' : 'rgb(51,65,85)'}`,
                background: resetHovered ? 'rgb(220,38,38)' : '',
                color: resetHovered ? 'white' : 'rgb(148,163,184)',
                boxShadow: resetHovered ? '0 0 15px rgba(239,68,68,0.6)' : 'none',
              }}
            >
              Reset setup
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{entries.length}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Total ADRs</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className={`text-3xl font-bold ${driftCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {driftCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Drift Warnings</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="text-3xl font-bold text-white">{decisionTypes.length}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">Decision Types</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'drift', ...decisionTypes].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filter === f
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f === 'drift' ? '⚠ Drift' : f}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} />}

        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-slate-500 text-sm">Fetching ADR entries…</span>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl">
              📋
            </div>
            <p className="text-slate-400 text-sm font-medium">No ADR entries yet</p>
            <p className="text-slate-600 text-xs text-center max-w-xs">
              Open a pull request in your connected repo to trigger the Driftlog agent.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(entry => (
              <ADRCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const stored = {
    token: localStorage.getItem('driftlog_token') || '',
    dbId: localStorage.getItem('driftlog_db_id') || '',
  }
  const [ready, setReady] = useState(!!(stored.token && stored.dbId))
  const [notionToken, setNotionToken] = useState(stored.token)
  const [databaseId, setDatabaseId] = useState(stored.dbId)

  const webhookUrl =
    import.meta.env.VITE_WEBHOOK_URL || 'https://your-worker.example.workers.dev/webhook'

  function handleComplete(token, dbId) {
    localStorage.setItem('driftlog_token', token)
    localStorage.setItem('driftlog_db_id', dbId)
    setNotionToken(token)
    setDatabaseId(dbId)
    setReady(true)
  }

  function handleReset() {
    localStorage.removeItem('driftlog_token')
    localStorage.removeItem('driftlog_db_id')
    setReady(false)
    setNotionToken('')
    setDatabaseId('')
  }

  if (!ready) {
    return <SetupWizard webhookUrl={webhookUrl} onComplete={handleComplete} />
  }

  return <ActivityFeed token={notionToken} databaseId={databaseId} onReset={handleReset} />
}
