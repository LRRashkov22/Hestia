import { type FormEvent, useEffect, useState } from 'react'
import './App.css'
import { changePassword, clearAuth, getCurrentUser, login, register } from './api/auth'
import eventsApi from './api/events'

type Toast = { kind: 'success' | 'info' | 'error'; message: string } | null
type ModalState =
  | { kind: 'register'; eventId: string; title: string; waitlist: boolean }
  | { kind: 'cancelRegistration'; eventId: string; title: string }
  | { kind: 'cancelEvent'; eventId: string; title: string }
  | null

const emptyGuid = '00000000-0000-0000-0000-000000000000'

function routeTo(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getValue<T = unknown>(item: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key] as T
  }
  return undefined
}

function idOf(item: Record<string, unknown>) {
  const id = String(getValue(item, 'id', 'Id') ?? '')
  return id && id !== emptyGuid ? id : ''
}

function eventStatus(value: unknown) {
  if (typeof value === 'number') return value === 1 ? 'Draft' : value === 2 ? 'Published' : value === 3 ? 'Cancelled' : 'Unknown'
  const text = String(value ?? '')
  return text || 'Unknown'
}

function registrationStatus(value: unknown) {
  if (typeof value === 'number') return value === 1 ? 'Confirmed' : value === 2 ? 'Waitlisted' : value === 3 ? 'Cancelled' : 'None'
  const text = String(value ?? '')
  return text || 'None'
}

function formatDate(value: unknown) {
  if (!value) return '-'
  return new Date(String(value)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(value: unknown) {
  if (!value) return ''
  return new Date(String(value)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function capacityPercent(confirmed: number, capacity: number) {
  if (!capacity) return 0
  return Math.min(100, Math.round((confirmed / capacity) * 100))
}

function normalizeEvent(item: Record<string, unknown>) {
  const title = String(getValue(item, 'title', 'Title') ?? 'Untitled event')
  const capacity = Number(getValue(item, 'capacity', 'Capacity') ?? 0)
  const confirmed = Number(getValue(item, 'confirmed', 'Confirmed', 'confirmedRegistrations', 'ConfirmedRegistrations') ?? 0)
  const waitlisted = Number(getValue(item, 'waitlisted', 'Waitlisted', 'waitlistedRegistrations', 'WaitlistedRegistrations') ?? 0)
  const startsAt = getValue<string>(item, 'startsAt', 'StartsAt') ?? ''
  const endsAt = getValue<string>(item, 'endsAt', 'EndsAt') ?? ''
  const fillPercentage = Number(getValue(item, 'fillPercentage', 'FillPercentage') ?? capacityPercent(confirmed, capacity))
  return {
    raw: item,
    id: idOf(item),
    title,
    description: String(getValue(item, 'description', 'Description') ?? ''),
    status: eventStatus(getValue(item, 'status', 'Status') ?? 'Published'),
    registrationStatus: registrationStatus(getValue(item, 'registrationStatus', 'RegistrationStatus')),
    capacity,
    confirmed,
    waitlisted,
    seatsLeft: Number(getValue(item, 'seatsLeft', 'SeatsLeft') ?? Math.max(0, capacity - confirmed)),
    fillPercentage,
    startsAt,
    endsAt,
    location: String(getValue(item, 'location', 'Location') ?? ''),
    url: String(getValue(item, 'url', 'Url') ?? ''),
    organizerName: String(getValue(item, 'organizerName', 'OrganizerName') ?? 'Organizer'),
    waitlistPosition: getValue<number>(item, 'waitlistPosition', 'WaitlistPosition'),
  }
}

function normalizeRegistration(item: Record<string, unknown>) {
  const eventTitle = String(getValue(item, 'eventTitle', 'EventTitle', 'title', 'Title') ?? 'Untitled event')
  const username = String(getValue(item, 'username', 'Username') ?? 'Student')
  return {
    eventId: String(getValue(item, 'eventId', 'EventId') ?? ''),
    username,
    email: String(getValue(item, 'email', 'Email') ?? ''),
    eventTitle,
    title: eventTitle,
    registeredAt: getValue<string>(item, 'registeredAt', 'RegisteredAt') ?? '',
    startsAt: getValue<string>(item, 'startsAt', 'StartsAt') ?? '',
    status: registrationStatus(getValue(item, 'registrationStatus', 'RegistrationStatus')),
    waitlistPosition: getValue<number>(item, 'waitlistPosition', 'WaitlistPosition'),
  }
}

function normalizeNotification(item: Record<string, unknown>) {
  const id = String(getValue(item, 'id', 'Id') ?? '')
  return {
    id,
    type: String(getValue(item, 'type', 'Type') ?? 'Notification'),
    title: String(getValue(item, 'title', 'Title') ?? 'Notification'),
    message: String(getValue(item, 'message', 'Message') ?? ''),
    isRead: Boolean(getValue(item, 'isRead', 'IsRead') ?? false),
    createdAt: String(getValue(item, 'createdAt', 'CreatedAt') ?? ''),
    readAt: getValue<string>(item, 'readAt', 'ReadAt') ?? '',
  }
}

function Badge({ children, tone = 'gray' }: { children: string; tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

function statusTone(status: string): 'green' | 'amber' | 'red' | 'gray' {
  const normalized = status.toLowerCase()
  if (normalized === 'published' || normalized === 'confirmed') return 'green'
  if (normalized === 'draft' || normalized === 'waitlisted') return 'amber'
  if (normalized === 'cancelled') return 'red'
  return 'gray'
}

function Progress({ value }: { value: number }) {
  const tone = value >= 100 ? 'hot' : value >= 80 ? 'warm' : 'cool'
  return (
    <span className="progress" aria-label={`${value}% full`}>
      <span className={`progress-fill ${tone}`} style={{ width: `${value}%` }} />
    </span>
  )
}

function ToastView({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(onClose, 3000)
    return () => window.clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <button type="button" className={`toast toast-${toast.kind}`} onClick={onClose}>
      {toast.message}
    </button>
  )
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<Toast>(null)
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    const update = () => setPath(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])

  const user = getCurrentUser()
  const role = user.role.toLowerCase()
  const isAuthed = Boolean(localStorage.getItem('accessToken'))

  const showToast = (kind: NonNullable<Toast>['kind'], message: string) => setToast({ kind, message })

  if (path === '/register') return <RegisterPage />
  if (!isAuthed) return <LoginPage />

  if (path === '/') {
    routeTo(role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard')
    return null
  }

  if (path.startsWith('/organizer') && role !== 'organizer') {
    routeTo('/student/dashboard')
    return null
  }

  if (path.startsWith('/student') && role !== 'student') {
    routeTo('/organizer/dashboard')
    return null
  }

  const shellProps = { user, search, setSearch }

  return (
    <>
      <AppShell {...shellProps}>
        {path === '/organizer/dashboard' && <OrganizerDashboard />}
        {path === '/organizer/events' && <OrganizerEvents onToast={showToast} onModal={setModal} />}
        {path === '/organizer/registrations' && <OrganizerRegistrations />}
        {path === '/organizer/notifications' && <NotificationsPage />}
        {path === '/organizer/settings' && <SettingsPage user={user} onToast={showToast} />}
        {path === '/organizer/events/new' && <EventForm onToast={showToast} />}
        {path.match(/^\/organizer\/events\/[^/]+\/edit$/) && (
          <EventForm eventId={path.split('/')[3]} onToast={showToast} />
        )}
        {path.match(/^\/organizer\/events\/[^/]+\/view$/) && (
          <OrganizerEventDetails eventId={path.split('/')[3]} onToast={showToast} />
        )}
        {path === '/student/dashboard' && <StudentDashboard search={search} onModal={setModal} />}
        {path === '/student/events' && <StudentEvents search={search} onModal={setModal} />}
        {path.match(/^\/student\/events\/[^/]+$/) && (
          <StudentEventDetails eventId={path.split('/')[3]} onModal={setModal} />
        )}
        {path === '/student/registrations' && <StudentRegistrations />}
        {path === '/student/notifications' && <NotificationsPage />}
        {path === '/student/settings' && <SettingsPage user={user} onToast={showToast} />}
      </AppShell>
      <ConfirmModal
        modal={modal}
        onClose={() => setModal(null)}
        onToast={showToast}
      />
      <ToastView toast={toast} onClose={() => setToast(null)} />
    </>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submitLogin(nextEmail = email, nextPassword = password) {
    setBusy(true)
    setError('')
    try {
      await login(nextEmail, nextPassword)
      const nextRole = getCurrentUser().role.toLowerCase()
      routeTo(nextRole === 'organizer' ? '/organizer/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="brand-block">
          <div className="brand-icon">Cal</div>
          <p>School Events</p>
          <h1>Plan, discover, and fill campus events.</h1>
          <span>Organizer workflows and student registration live in one clean workspace.</span>
        </div>
      </section>
      <section className="auth-card">
        <p className="eyebrow">Secure access</p>
        <h2>Log in</h2>
        <form onSubmit={(event) => { event.preventDefault(); void submitLogin() }} className="stack">
          <label className="field">
            <span>Email address</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="inline-input">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          <div className="split-row muted">
            <label className="check"><input type="checkbox" defaultChecked /> Remember me</label>
          </div>
          {error && <p className="error-banner">{error}</p>}
          <button className="primary full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <div className="demo-grid">
          <button type="button" onClick={() => void submitLogin('test@example.com', 'Passw0rd!')}>Student Demo</button>
          <button type="button" onClick={() => void submitLogin('admin@gmail.com', 'admin')}>Organizer Demo</button>
        </div>
        <p className="auth-footer">New here? <button type="button" onClick={() => routeTo('/register')}>Create one</button></p>
      </section>
    </main>
  )
}

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!name || !email.includes('@') || password.length < 6 || password !== confirm) {
      setError('Complete all fields and make sure both passwords match.')
      return
    }
    try {
      await register(name, email, password)
      await login(email, password)
      routeTo('/student/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <main className="auth-page single">
      <section className="auth-card wide">
        <p className="eyebrow">Create account</p>
        <h2>Join School Events</h2>
        <form onSubmit={submit} className="stack">
          <p className="muted">Student accounts can browse events and register. Organizer access is managed by the admin account.</p>
          <label className="field"><span>Full name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>University email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
          <div className="two-col">
            <label className="field"><span>Password</span><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>
            <label className="field"><span>Confirm password</span><input value={confirm} onChange={(event) => setConfirm(event.target.value)} type="password" /></label>
          </div>
          {error && <p className="error-banner">{error}</p>}
          <button className="primary full">Create account</button>
        </form>
        <p className="auth-footer">Already have an account? <button type="button" onClick={() => routeTo('/')}>Sign in</button></p>
      </section>
    </main>
  )
}

function AppShell({ user, search, setSearch, children }: {
  user: ReturnType<typeof getCurrentUser>
  search: string
  setSearch: (value: string) => void
  children: React.ReactNode
}) {
  const role = user.role.toLowerCase() === 'organizer' ? 'Organizer' : 'Student'
  const base = role === 'Organizer' ? '/organizer' : '/student'
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const items = role === 'Organizer'
    ? [
        ['Dashboard', `${base}/dashboard`],
        ['Events', `${base}/events`],
        ['Registrations', `${base}/registrations`],
        ['Notifications', `${base}/notifications`],
        ['Create Event', `${base}/events/new`],
      ]
    : [
        ['Dashboard', `${base}/dashboard`],
        ['Events', `${base}/events`],
        ['My Registrations', `${base}/registrations`],
        ['Notifications', `${base}/notifications`],
      ]

  useEffect(() => {
    let alive = true
    async function loadUnreadCount() {
      try {
        const count = await eventsApi.getUnreadNotificationCount()
        if (alive) setUnreadNotifications(Number(count ?? 0))
      } catch {
        if (alive) setUnreadNotifications(0)
      }
    }
    void loadUnreadCount()
    const refresh = () => void loadUnreadCount()
    // start realtime subscriptions - ensure SignalR starts and updates unread count (only when authed)
    let stopRealtime: (() => void) | undefined
    if (localStorage.getItem('accessToken')) {
      import('./api/notificationsRealtime')
        .then((m) => { stopRealtime = m.startNotificationsRealtime(() => window.dispatchEvent(new Event('notifications-changed'))) })
        .catch(() => {})
    }
    window.addEventListener('notifications-changed', refresh)
    return () => {
      alive = false
      window.removeEventListener('notifications-changed', refresh)
      try { stopRealtime && stopRealtime() } catch {}
    }
  }, [])

  return (
    <div className="app-frame">
      <header className={`topbar ${role === 'Organizer' ? 'topbar-organizer' : ''}`}>
        <button type="button" className="icon-button">X</button>
        <button type="button" className="brand" onClick={() => routeTo(`${base}/dashboard`)}>
          <span>Cal</span> School Events
        </button>
        {role === 'Student' && (
          <label className="top-search">
            <span>Search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events..." />
          </label>
        )}
        <button type="button" className="bell" onClick={() => routeTo(`${base}/notifications`)}>
          Bell {unreadNotifications > 0 && <span>{unreadNotifications}</span>}
        </button>
        <button type="button" className="user-pill" onClick={() => routeTo(`${base}/settings`)}>
          <span className="avatar">{initials(user.name)}</span>
          <strong>{user.name}</strong>
          <Badge tone="blue">{role}</Badge>
        </button>
      </header>
      <aside className="sidebar">
        <nav>
          {items.map(([label, href]) => (
            <button
              type="button"
              key={href}
              className={window.location.pathname === href ? 'active' : ''}
              onClick={() => routeTo(href)}
            >
              {label}
              {label === 'Notifications' && unreadNotifications > 0 && <em>{unreadNotifications}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" onClick={() => routeTo(`${base}/settings`)}>Settings</button>
          <button type="button" onClick={() => { clearAuth(); window.location.href = '/' }}>Log out</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}

function StatCard({ label, value, tone = 'blue' }: { label: string; value: number | string; tone?: string }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${tone}`}>{label.slice(0, 1)}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function OrganizerDashboard() {
  const [cards, setCards] = useState<Record<string, unknown>>({})
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvent>[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const [cardData, eventData] = await Promise.all([
          eventsApi.getOrganizerDashboardCards(),
          eventsApi.getOrganizerDashboardEvents(),
        ])
        if (!alive) return
        setCards(cardData ?? {})
        setEvents((Array.isArray(eventData) ? eventData : []).map((item) => normalizeEvent(item)))
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    window.addEventListener('organizer-events-changed', refresh)
    return () => window.removeEventListener('organizer-events-changed', refresh)
  }, [])

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Welcome back, {getCurrentUser().name}</h1>
          <p>Here is an overview of your events and registrations.</p>
        </div>
        <button className="primary" onClick={() => routeTo('/organizer/events/new')}>+ New Event</button>
      </div>
      <div className="stat-grid six">
        <StatCard label="Total Events" value={Number(getValue(cards, 'totalEvents', 'TotalEvents') ?? 0)} />
        <StatCard label="Published" value={Number(getValue(cards, 'published', 'Published') ?? 0)} tone="green" />
        <StatCard label="Drafts" value={Number(getValue(cards, 'drafts', 'Drafts') ?? 0)} tone="amber" />
        <StatCard label="Cancelled" value={Number(getValue(cards, 'cancelled', 'Cancelled') ?? 0)} tone="red" />
        <StatCard label="Students" value={Number(getValue(cards, 'registrations', 'Registrations') ?? 0)} tone="purple" />
        <StatCard label="Waitlisted" value={Number(getValue(cards, 'waitlisted', 'Waitlisted') ?? 0)} tone="violet" />
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Your Events</h2>
            <button className="link-button" onClick={() => routeTo('/organizer/events')}>Manage all</button>
          </div>
          <EventTable events={events} compact loading={loading} />
        </section>
        <aside className="side-stack">
          <section className="panel">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="primary full" onClick={() => routeTo('/organizer/events/new')}>+ Create Event</button>
              <button className="outline full" onClick={() => routeTo('/organizer/events')}>Manage Events</button>
              <button className="outline full" onClick={() => routeTo('/organizer/registrations')}>View Registrations</button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}

function EventTable({ events, compact, loading, onModal, onToast, onChanged }: {
  events: ReturnType<typeof normalizeEvent>[]
  compact?: boolean
  loading?: boolean
  onModal?: (modal: ModalState) => void
  onToast?: (kind: NonNullable<Toast>['kind'], message: string) => void
  onChanged?: () => void
}) {
  if (loading) return <div className="empty-state">Loading events...</div>
  if (!events.length) return <div className="empty-state">No events found.</div>
  const viewRegistrations = (event: ReturnType<typeof normalizeEvent>) => {
    if (!event.id) return
    const params = new URLSearchParams({ eventId: event.id, eventTitle: event.title })
    routeTo(`/organizer/registrations?${params.toString()}`)
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{compact ? 'Event' : 'Title'}</th>
            <th>Status</th>
            <th>{compact ? 'Registered' : 'Capacity'}</th>
            {!compact && <th>Confirmed</th>}
            {!compact && <th>Waitlist</th>}
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={event.id || `${event.title}-${index}`}>
              <td>
                <strong>{event.title}</strong>
              </td>
              <td><Badge tone={statusTone(event.status)}>{event.status.toLowerCase()}</Badge></td>
              <td>{compact ? `${event.confirmed}/${event.capacity}` : event.capacity}</td>
              {!compact && (
                <td>
                  <span className="inline-progress">{event.confirmed}<Progress value={capacityPercent(event.confirmed, event.capacity)} /></span>
                </td>
              )}
              {!compact && <td className={event.waitlisted ? 'amber-text' : ''}>{event.waitlisted || '-'}</td>}
              <td>{formatDate(event.startsAt)}</td>
              <td>
                <div className="actions">
                  {event.status === 'Draft' && (
                    <button disabled={!event.id} onClick={() => routeTo(`/organizer/events/${event.id}/edit`)}>Edit</button>
                  )}
                  <button disabled={!event.id} onClick={() => viewRegistrations(event)}>View</button>
                  {!compact && event.status === 'Draft' && (
                    <button
                      disabled={!event.id}
                      onClick={async () => {
                        if (!event.id) return
                        await eventsApi.publishEvent(event.id)
                        onToast?.('success', `${event.title} published.`)
                        onChanged?.()
                      }}
                    >
                      Publish
                    </button>
                  )}
                  {!compact && event.status !== 'Cancelled' && (
                    <button
                      disabled={!event.id}
                      onClick={() => event.id && onModal?.({ kind: 'cancelEvent', eventId: event.id, title: event.title })}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrganizerEvents({ onToast, onModal }: {
  onToast: (kind: NonNullable<Toast>['kind'], message: string) => void
  onModal: (modal: ModalState) => void
}) {
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvent>[]>([])
  const [filter, setFilter] = useState('All')
  const [localSearch, setLocalSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const data = await eventsApi.getEvents(undefined, localSearch || undefined)
        if (alive) setEvents((Array.isArray(data) ? data : []).map((item) => normalizeEvent(item)))
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [localSearch, refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    window.addEventListener('organizer-events-changed', refresh)
    return () => window.removeEventListener('organizer-events-changed', refresh)
  }, [])

  const counts = {
    All: events.length,
    Published: events.filter((event) => event.status === 'Published').length,
    Draft: events.filter((event) => event.status === 'Draft').length,
    Cancelled: events.filter((event) => event.status === 'Cancelled').length,
  }
  const visibleEvents = filter === 'All' ? events : events.filter((event) => event.status === filter)

  return (
    <section className="page">
      <div className="page-head">
        <div><h1>Event Management</h1><p>Manage all your events in one place.</p></div>
        <button className="primary" onClick={() => routeTo('/organizer/events/new')}>+ New Event</button>
      </div>
      <div className="summary-tabs">
        {(['All', 'Published', 'Draft', 'Cancelled'] as const).map((item) => (
          <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>
            <strong>{counts[item]}</strong><span>{item}</span>
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="panel-toolbar">
          <div className="tabs">
            {['All', 'Published', 'Draft', 'Cancelled'].map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <input value={localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder="Search..." />
        </div>
        <EventTable
          events={visibleEvents}
          loading={loading}
          onModal={onModal}
          onToast={onToast}
          onChanged={() => setRefreshKey((value) => value + 1)}
        />
      </section>
    </section>
  )
}

function OrganizerRegistrations() {
  const initialParams = new URLSearchParams(window.location.search)
  const [tab, setTab] = useState<'Confirmed' | 'Waitlisted'>('Confirmed')
  const [rows, setRows] = useState<ReturnType<typeof normalizeRegistration>[]>([])
  const [query, setQuery] = useState('')
  const [eventFilter, setEventFilter] = useState(initialParams.get('eventId') ?? '')
  const [eventFilterTitle, setEventFilterTitle] = useState(initialParams.get('eventTitle') ?? '')
  const [pendingEventFilter, setPendingEventFilter] = useState(initialParams.get('eventId') ?? '')
  const [eventOptions, setEventOptions] = useState<ReturnType<typeof normalizeEvent>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const data = await eventsApi.getOrganizerRegistrations(
          tab,
          query || undefined,
          eventFilter || undefined,
        )
        if (alive) setRows((Array.isArray(data) ? data : []).map((item) => normalizeRegistration(item)))
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [tab, query, eventFilter])

  useEffect(() => {
    let alive = true
    eventsApi.getEvents()
      .then((data) => {
        if (alive) setEventOptions((Array.isArray(data) ? data : []).map((item) => normalizeEvent(item)))
      })
      .catch(() => {
        if (alive) setEventOptions([])
      })
    return () => { alive = false }
  }, [])

  function applyEventFilter() {
    const selected = eventOptions.find((event) => event.id === pendingEventFilter)
    setEventFilter(pendingEventFilter)
    setEventFilterTitle(selected?.title ?? '')
    if (pendingEventFilter) {
      const params = new URLSearchParams({
        eventId: pendingEventFilter,
        eventTitle: selected?.title ?? '',
      })
      window.history.pushState(null, '', `/organizer/registrations?${params.toString()}`)
    } else {
      window.history.pushState(null, '', '/organizer/registrations')
    }
  }

  function clearEventFilter() {
    setEventFilter('')
    setEventFilterTitle('')
    setPendingEventFilter('')
    routeTo('/organizer/registrations')
  }

  return (
    <section className="page">
      <div className="page-head">
        <div><h1>Registrations</h1><p>View and manage student registrations.</p></div>
        <button className="outline">Export CSV</button>
      </div>
      <div className="stat-grid two">
        <StatCard label="Confirmed Students" value={tab === 'Confirmed' ? rows.length : '-'} tone="green" />
        <StatCard label="Waitlisted Students" value={tab === 'Waitlisted' ? rows.length : '-'} tone="amber" />
      </div>
      <section className="panel">
        {eventFilter && (
          <div className="filter-notice">
            <span>Showing registrations for <strong>{eventFilterTitle || 'selected event'}</strong></span>
            <button type="button" className="link-button" onClick={clearEventFilter}>Clear filter</button>
          </div>
        )}
        <div className="panel-toolbar">
          <div className="tabs">
            <button className={tab === 'Confirmed' ? 'active' : ''} onClick={() => setTab('Confirmed')}>Confirmed</button>
            <button className={tab === 'Waitlisted' ? 'active' : ''} onClick={() => setTab('Waitlisted')}>Waitlist</button>
          </div>
          <div className="registration-filters">
            <select value={pendingEventFilter} onChange={(event) => setPendingEventFilter(event.target.value)}>
              <option value="">All events</option>
              {eventOptions.map((event) => (
                <option key={event.id || event.title} value={event.id}>{event.title}</option>
              ))}
            </select>
            <button type="button" className="outline" onClick={applyEventFilter}>Show event</button>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students..." />
          </div>
        </div>
        <RegistrationTable rows={rows} waitlist={tab === 'Waitlisted'} loading={loading} />
      </section>
    </section>
  )
}

function RegistrationTable({ rows, waitlist, loading }: {
  rows: ReturnType<typeof normalizeRegistration>[]
  waitlist?: boolean
  loading?: boolean
}) {
  if (loading) return <div className="empty-state">Loading registrations...</div>
  if (!rows.length) return <div className="empty-state">No registrations match this view.</div>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {waitlist && <th>Position</th>}
            <th>Student</th>
            <th>Email</th>
            <th>Event</th>
            <th>{waitlist ? 'Joined' : 'Registered'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.email}-${row.eventTitle}-${index}`}>
              {waitlist && <td className="amber-text">#{row.waitlistPosition ?? '-'}</td>}
              <td><span className="avatar small">{initials(row.username)}</span><strong>{row.username}</strong></td>
              <td>{row.email}</td>
              <td>{row.eventTitle}</td>
              <td>{formatDate(row.registeredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EventForm({ eventId, onToast }: { eventId?: string; onToast: (kind: NonNullable<Toast>['kind'], message: string) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    capacity: '',
    url: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  })
  const [status, setStatus] = useState('Unsaved')
  const [error, setError] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  const [busyAction, setBusyAction] = useState<'draft' | 'publish' | null>(null)

  useEffect(() => {
    if (!eventId) return
    const currentEventId = eventId
    let alive = true
    async function load() {
      try {
        const event = normalizeEvent(await eventsApi.getEvent(currentEventId))
        if (!alive) return
        setForm({
          title: event.title,
          description: event.description,
          capacity: String(event.capacity),
          url: event.url,
          location: event.location,
          startDate: event.startsAt ? new Date(event.startsAt).toISOString().slice(0, 10) : '',
          startTime: event.startsAt ? new Date(event.startsAt).toISOString().slice(11, 16) : '',
          endDate: event.endsAt ? new Date(event.endsAt).toISOString().slice(0, 10) : '',
          endTime: event.endsAt ? new Date(event.endsAt).toISOString().slice(11, 16) : '',
        })
        setStatus(event.status)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load event')
      }
    }
    void load()
    return () => { alive = false }
  }, [eventId])

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const checklist = [
    ['Title added', Boolean(form.title)],
    ['Description written', Boolean(form.description)],
    ['Capacity set', Number(form.capacity) > 0],
    ['Date & time set', Boolean(form.startDate && form.startTime && form.endDate && form.endTime)],
    ['Location added', Boolean(form.location)],
  ] as const

  async function save(publish: boolean) {
    setError('')
    setBusyAction(publish ? 'publish' : 'draft')
    if (checklist.some(([, ok]) => !ok)) {
      setError('Complete the required fields before saving.')
      setBusyAction(null)
      return
    }
    const startsAt = new Date(`${form.startDate}T${form.startTime}`)
    const endsAt = new Date(`${form.endDate}T${form.endTime}`)
    if (endsAt <= startsAt) {
      setError('End date and time must be after the start.')
      setBusyAction(null)
      return
    }
    const payload = {
      title: form.title,
      description: form.description,
      capacity: Number(form.capacity),
      url: form.url || null,
      location: form.location,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      publish,
    }
    try {
      if (eventId) await eventsApi.updateEvent(eventId, payload)
      else await eventsApi.createEvent(payload)
      setStatus(publish ? 'Published' : 'Draft')
      onToast('success', publish ? 'Event published.' : 'Event saved as draft.')
      window.setTimeout(() => routeTo('/organizer/events'), publish ? 900 : 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save event.')
    } finally {
      setBusyAction(null)
    }
  }

  function showPreview() {
    setError('')
    if (!form.title.trim()) {
      setError('Add an event title before previewing.')
      return
    }
    setPreviewVisible(true)
  }

  return (
    <section className="page narrow">
      <button className="link-button back" onClick={() => routeTo('/organizer/events')}>Back</button>
      <div className="page-head">
        <div>
          <h1>{eventId ? 'Edit Event' : 'Create Event'}</h1>
          <p>Fill in the details below to create a new event.</p>
        </div>
        <div className="head-actions">
          <button className="outline" onClick={showPreview}>Preview</button>
          <button className="outline" disabled={busyAction !== null} onClick={() => void save(false)}>
            {busyAction === 'draft' ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="primary" disabled={busyAction !== null} onClick={() => void save(true)}>
            {busyAction === 'publish' ? 'Publishing...' : eventId ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </div>
      {error && <p className="error-banner">{error}</p>}
      {previewVisible && (
        <section className="panel detail-hero preview-panel">
          <span className="card-strip" />
          <div className="split-row">
            <Badge tone={statusTone(status)}>{status}</Badge>
            <button className="link-button" onClick={() => setPreviewVisible(false)}>Close preview</button>
          </div>
          <h1>{form.title}</h1>
          <p>{form.description || 'No description provided.'}</p>
          <dl className="info-grid">
            <dt>Date</dt><dd>{form.startDate ? formatDate(`${form.startDate}T${form.startTime || '00:00'}`) : '-'}</dd>
            <dt>Time</dt><dd>{form.startTime || '-'} - {form.endTime || '-'}</dd>
            <dt>Location</dt><dd>{form.location || '-'}</dd>
            <dt>Capacity</dt><dd>{form.capacity || '-'}</dd>
            {form.url && <><dt>Website</dt><dd><a href={form.url}>{form.url}</a></dd></>}
          </dl>
        </section>
      )}
      <div className="form-grid">
        <div className="form-main stack">
          <section className="panel form-panel">
            <h2>Basic Information</h2>
            <label className="field"><span>Event Title *</span><input value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
            <label className="field"><span>Description *</span><textarea rows={5} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
            <div className="two-col">
              <label className="field"><span>Capacity *</span><input type="number" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} /></label>
              <label className="field"><span>Event URL</span><input value={form.url} onChange={(event) => update('url', event.target.value)} placeholder="https://..." /></label>
            </div>
          </section>
          <section className="panel form-panel">
            <h2>Date & Time</h2>
            <div className="two-col">
              <label className="field"><span>Start Date *</span><input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
              <label className="field"><span>End Date *</span><input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} /></label>
              <label className="field"><span>Start Time *</span><input type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} /></label>
              <label className="field"><span>End Time *</span><input type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} /></label>
            </div>
          </section>
          <section className="panel form-panel">
            <h2>Location</h2>
            <label className="field"><span>Location *</span><input value={form.location} onChange={(event) => update('location', event.target.value)} /></label>
          </section>
        </div>
        <aside className="side-stack">
          <section className="panel">
            <h2>Publishing</h2>
            <dl className="meta-list"><dt>Status</dt><dd><Badge tone={statusTone(status)}>{status}</Badge></dd><dt>Organizer</dt><dd>{getCurrentUser().name}</dd></dl>
            <div className="quick-actions">
              <button className="primary full" disabled={busyAction !== null} onClick={() => void save(true)}>
                {busyAction === 'publish' ? 'Publishing...' : 'Publish Event'}
              </button>
              <button className="outline full" disabled={busyAction !== null} onClick={() => void save(false)}>
                {busyAction === 'draft' ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </section>
          <section className="panel">
            <h2>Checklist</h2>
            {checklist.map(([label, ok]) => <p key={label} className={ok ? 'checkline done' : 'checkline'}>{ok ? 'OK' : '--'} {label}</p>)}
          </section>
        </aside>
      </div>
    </section>
  )
}

function OrganizerEventDetails({ eventId }: { eventId: string; onToast: (kind: NonNullable<Toast>['kind'], message: string) => void }) {
  const [event, setEvent] = useState<ReturnType<typeof normalizeEvent> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    eventsApi.getEvent(eventId)
      .then((data) => { if (alive) setEvent(normalizeEvent(data)) })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load event'))
    return () => { alive = false }
  }, [eventId])

  if (error) return <section className="page"><p className="error-banner">{error}</p></section>
  if (!event) return <section className="page"><div className="empty-state">Loading event...</div></section>
  return <EventDetailView event={event} backPath="/organizer/events" />
}

function StudentDashboard({ search, onModal }: { search: string; onModal: (modal: ModalState) => void }) {
  const [cards, setCards] = useState<Record<string, unknown>>({})
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvent>[]>([])
  const [registrations, setRegistrations] = useState<ReturnType<typeof normalizeRegistration>[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    async function load() {
      const [cardData, eventData, registrationData] = await Promise.all([
        eventsApi.getStudentDashboardCards(),
        eventsApi.getStudentDashboardUpcomingEvents(),
        eventsApi.getStudentUpcomingRegistrations(),
      ])
      if (!alive) return
      setCards(cardData ?? {})
      setEvents((Array.isArray(eventData) ? eventData : []).map((item) => normalizeEvent(item)))
      setRegistrations((Array.isArray(registrationData) ? registrationData : []).map((item) => normalizeRegistration(item)))
    }
    void load()
    return () => { alive = false }
  }, [refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    window.addEventListener('student-events-changed', refresh)
    return () => window.removeEventListener('student-events-changed', refresh)
  }, [])

  const filtered = events.filter((event) => event.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <section className="page">
      <div className="page-head"><div><h1>Welcome back, {getCurrentUser().name}</h1><p>Discover campus events and manage your registrations.</p></div></div>
      <div className="stat-grid four">
        <StatCard label="Total Events" value={Number(getValue(cards, 'totalEvents', 'TotalEvents') ?? 0)} />
        <StatCard label="Registered" value={Number(getValue(cards, 'registered', 'Registered') ?? 0)} tone="green" />
        <StatCard label="Waitlisted" value={Number(getValue(cards, 'waitlisted', 'Waitlisted') ?? 0)} tone="amber" />
        <StatCard label="Notifications" value={Number(getValue(cards, 'notifications', 'Notifications') ?? 0)} tone="purple" />
      </div>
      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head"><h2>Upcoming Events</h2><button className="link-button" onClick={() => routeTo('/student/events')}>View all</button></div>
          <div className="event-card-grid compact">
            {filtered.map((event) => <StudentEventCard key={event.id || event.title} event={event} onModal={onModal} />)}
          </div>
        </section>
        <aside className="side-stack">
          <section className="panel">
            <div className="panel-head"><h2>My Registrations</h2><button className="link-button" onClick={() => routeTo('/student/registrations')}>See all</button></div>
            {registrations.length ? registrations.map((item) => (
              <div key={`${item.title}-${item.registeredAt}`} className="mini-row">
                <strong>{item.title}</strong>
                <span>{formatDate(item.startsAt)} · {item.status}</span>
              </div>
            )) : <div className="empty-state small">No registrations yet.</div>}
          </section>
          <NotificationsPreview />
        </aside>
      </div>
    </section>
  )
}

function StudentEvents({ search, onModal }: { search: string; onModal: (modal: ModalState) => void }) {
  const [events, setEvents] = useState<ReturnType<typeof normalizeEvent>[]>([])
  const [localSearch, setLocalSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    eventsApi.getStudentAvailableEvents()
      .then((data) => { if (alive) setEvents((Array.isArray(data) ? data : []).map((item) => normalizeEvent(item))) })
      .catch(() => { if (alive) setEvents([]) })
    return () => { alive = false }
  }, [refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    window.addEventListener('student-events-changed', refresh)
    return () => window.removeEventListener('student-events-changed', refresh)
  }, [])

  const query = `${search} ${localSearch}`.trim().toLowerCase()
  const filtered = events.filter((event) => {
    const haystack = `${event.title} ${event.description} ${event.location}`.toLowerCase()
    return !query || haystack.includes(query)
  })

  return (
    <section className="page">
      <div className="page-head"><div><h1>Events Catalog</h1><p>Search and register for upcoming campus events.</p></div></div>
      <section className="panel">
        <div className="panel-toolbar wrap">
          <input value={localSearch} onChange={(event) => setLocalSearch(event.target.value)} placeholder="Search title, description, or location..." />
        </div>
      </section>
      <div className="event-card-grid">
        {filtered.map((event) => <StudentEventCard key={event.id || event.title} event={event} onModal={onModal} />)}
      </div>
    </section>
  )
}

function StudentEventCard({ event, onModal }: { event: ReturnType<typeof normalizeEvent>; onModal: (modal: ModalState) => void }) {
  const full = event.seatsLeft <= 0
  const registered = event.registrationStatus === 'Confirmed'
  const waitlisted = event.registrationStatus === 'Waitlisted'
  return (
    <article className={`event-card ${full ? 'full-card' : ''}`}>
      <span className="card-strip" />
      <div className="split-row">
        {registered ? <Badge tone="green">Confirmed</Badge> : waitlisted ? <Badge tone="amber">Waitlisted</Badge> : full ? <Badge tone="amber">Full</Badge> : <Badge tone="green">Published</Badge>}
      </div>
      <h2>{event.title}</h2>
      <p>{event.description || event.location || 'Upcoming campus event.'}</p>
      <dl className="event-meta">
        <dt>Date</dt><dd>{formatDate(event.startsAt)}</dd>
        <dt>Time</dt><dd>{formatTime(event.startsAt)} - {formatTime(event.endsAt)}</dd>
        <dt>Location</dt><dd>{event.location || '-'}</dd>
      </dl>
      <Progress value={event.fillPercentage} />
      <p className="capacity-line">{event.confirmed}/{event.capacity} registered · {event.seatsLeft} seats left</p>
      <div className="card-actions">
        <button className="outline" disabled={!event.id} onClick={() => routeTo(`/student/events/${event.id}`)}>View Details</button>
        {!registered && !waitlisted && (
          <button
            className="primary"
            disabled={!event.id}
            onClick={() => event.id && onModal({ kind: 'register', eventId: event.id, title: event.title, waitlist: full })}
          >
            {full ? 'Join Waitlist' : 'Register'}
          </button>
        )}
      </div>
    </article>
  )
}

function StudentEventDetails({ eventId, onModal }: { eventId: string; onModal: (modal: ModalState) => void }) {
  const [event, setEvent] = useState<ReturnType<typeof normalizeEvent> | null>(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let alive = true
    eventsApi.getStudentEventDetails(eventId)
      .then((data) => { if (alive) setEvent(normalizeEvent(data)) })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load event'))
    return () => { alive = false }
  }, [eventId, refreshKey])

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1)
    window.addEventListener('student-events-changed', refresh)
    return () => window.removeEventListener('student-events-changed', refresh)
  }, [])

  if (error) return <section className="page"><p className="error-banner">{error}</p></section>
  if (!event) return <section className="page"><div className="empty-state">Loading event...</div></section>
  return (
    <EventDetailView
      event={event}
      backPath="/student/events"
      studentAction={
        <StudentActionCard event={event} onModal={onModal} />
      }
    />
  )
}

function StudentActionCard({ event, onModal }: { event: ReturnType<typeof normalizeEvent>; onModal: (modal: ModalState) => void }) {
  const full = event.confirmed >= event.capacity
  if (event.registrationStatus === 'Confirmed' || event.registrationStatus === 'Waitlisted') {
    return (
      <section className="panel action-panel">
        <h2>{event.registrationStatus === 'Confirmed' ? "You're registered" : "You're on the waitlist"}</h2>
        {event.waitlistPosition && <p>Position #{event.waitlistPosition}</p>}
        <button className="danger full" onClick={() => onModal({ kind: 'cancelRegistration', eventId: event.id, title: event.title })}>Cancel Registration</button>
      </section>
    )
  }
  return (
    <section className="panel action-panel">
      <h2>{full ? 'Event full' : `${event.capacity - event.confirmed} seats available`}</h2>
      <button className="primary full" onClick={() => onModal({ kind: 'register', eventId: event.id, title: event.title, waitlist: full })}>
        {full ? 'Join Waitlist' : 'Register Now'}
      </button>
    </section>
  )
}

function EventDetailView({ event, backPath, studentAction }: {
  event: ReturnType<typeof normalizeEvent>
  backPath: string
  studentAction?: React.ReactNode
}) {
  return (
    <section className="page">
      <button className="link-button back" onClick={() => routeTo(backPath)}>Back</button>
      <section className="detail-hero panel">
        <span className="card-strip" />
        <div className="split-row">
          <Badge tone={statusTone(event.status)}>{event.status}</Badge>
        </div>
        <h1>{event.title}</h1>
        <p>{event.description || 'No description provided.'}</p>
      </section>
      <div className="detail-grid">
        <section className="panel">
          <h2>Event information</h2>
          <dl className="info-grid">
            <dt>Date</dt><dd>{formatDate(event.startsAt)}</dd>
            <dt>Time</dt><dd>{formatTime(event.startsAt)} - {formatTime(event.endsAt)}</dd>
            <dt>Location</dt><dd>{event.location || '-'}</dd>
            <dt>Organizer</dt><dd>{event.organizerName}</dd>
            {event.url && <><dt>Website</dt><dd><a href={event.url}>{event.url}</a></dd></>}
          </dl>
        </section>
        <section className="panel">
          <h2>Capacity</h2>
          <Progress value={capacityPercent(event.confirmed, event.capacity)} />
          <div className="mini-stats">
            <span><strong>{event.capacity}</strong>Capacity</span>
            <span><strong>{event.confirmed}</strong>Confirmed</span>
            <span><strong>{event.waitlisted}</strong>Waitlist</span>
          </div>
        </section>
        {studentAction}
      </div>
    </section>
  )
}

function StudentRegistrations() {
  const [rows, setRows] = useState<ReturnType<typeof normalizeRegistration>[]>([])
  const [tab, setTab] = useState('All')

  useEffect(() => {
    let alive = true
    eventsApi.getMyRegistrations()
      .then((data) => { if (alive) setRows((Array.isArray(data) ? data : []).map((item) => normalizeRegistration(item))) })
      .catch(() => { if (alive) setRows([]) })
    return () => { alive = false }
  }, [])

  const filtered = tab === 'All' ? rows : rows.filter((row) => row.status === tab)
  const counts = {
    Confirmed: rows.filter((row) => row.status === 'Confirmed').length,
    Waitlisted: rows.filter((row) => row.status === 'Waitlisted').length,
    Cancelled: rows.filter((row) => row.status === 'Cancelled').length,
  }

  return (
    <section className="page">
      <div className="page-head"><div><h1>My Registrations</h1><p>Track your event registrations and waitlist positions.</p></div></div>
      <div className="stat-grid three">
        <StatCard label="Confirmed" value={counts.Confirmed} tone="green" />
        <StatCard label="Waitlisted" value={counts.Waitlisted} tone="amber" />
        <StatCard label="Cancelled" value={counts.Cancelled} tone="red" />
      </div>
      <section className="panel">
        <div className="tabs">{['All', 'Confirmed', 'Waitlisted', 'Cancelled'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Event</th><th>Event Date</th><th>Status</th><th>Waitlist</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={`${row.eventId}-${row.registeredAt}`}>
                  <td><strong>{row.title}</strong><span>Registered {formatDate(row.registeredAt)}</span></td>
                  <td>{formatDate(row.startsAt)}</td>
                  <td><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                  <td>{row.waitlistPosition ? `#${row.waitlistPosition}` : '-'}</td>
                  <td><button disabled={!row.eventId} onClick={() => routeTo(`/student/events/${row.eventId}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <div className="empty-state">No registrations for this filter.</div>}
        </div>
      </section>
    </section>
  )
}

function NotificationsPreview() {
  const [notifications, setNotifications] = useState<ReturnType<typeof normalizeNotification>[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function loadPreview() {
      try {
        setError('')
        const data = await eventsApi.getNotifications()
        if (alive) setNotifications((Array.isArray(data) ? data : []).map((item) => normalizeNotification(item)).slice(0, 2))
      } catch (err) {
        if (alive) {
          setNotifications([])
          setError(err instanceof Error ? err.message : 'Unable to load notifications.')
        }
      }
    }
    void loadPreview()
    const refresh = () => void loadPreview()
    window.addEventListener('notifications-changed', refresh)
    return () => {
      alive = false
      window.removeEventListener('notifications-changed', refresh)
    }
  }, [])

  return (
    <section className="panel">
      <div className="panel-head"><h2>Notifications</h2><button className="link-button" onClick={() => routeTo('/student/notifications')}>See all</button></div>
      {error ? <div className="empty-state small">{error}</div> : notifications.length ? notifications.map((notification) => (
        <div className="mini-row" key={notification.id || `${notification.title}-${notification.createdAt}`}>
          <strong>{notification.title}</strong>
          <span>{notification.message}</span>
        </div>
      )) : <div className="empty-state small">No notifications yet.</div>}
    </section>
  )
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<ReturnType<typeof normalizeNotification>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const unreadCount = notifications.filter((item) => !item.isRead).length

  async function loadNotifications() {
    setLoading(true)
    setError('')
    try {
      const data = await eventsApi.getNotifications()
      setNotifications((Array.isArray(data) ? data : []).map((item) => normalizeNotification(item)))
    } catch (err) {
      setNotifications([])
      setError(err instanceof Error ? err.message : 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
    const refresh = () => void loadNotifications()
    window.addEventListener('notifications-changed', refresh)
    return () => window.removeEventListener('notifications-changed', refresh)
  }, [])

  async function markOneRead(notificationId: string) {
    if (!notificationId) return
    await eventsApi.markNotificationRead(notificationId)
    setNotifications((current) =>
      current.map((item) => item.id === notificationId ? { ...item, isRead: true, readAt: new Date().toISOString() } : item),
    )
    window.dispatchEvent(new Event('notifications-changed'))
  }

  async function markAllRead() {
    await eventsApi.markAllNotificationsRead()
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })))
    window.dispatchEvent(new Event('notifications-changed'))
  }

  return (
    <section className="page narrow">
      <div className="page-head">
        <div><h1>Notifications</h1><p>{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'No unread notifications'}</p></div>
        {unreadCount > 0 && <button className="link-button" onClick={() => void markAllRead()}>Mark all read</button>}
      </div>
      {error ? (
        <p className="error-banner">{error}</p>
      ) : loading ? (
        <div className="empty-state">Loading notifications...</div>
      ) : notifications.length ? notifications.map((notification) => (
        <button
          key={notification.id || `${notification.title}-${notification.createdAt}`}
          className={`notification-card ${notification.isRead ? '' : 'unread'}`}
          onClick={() => void markOneRead(notification.id)}
        >
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <em>{formatDate(notification.createdAt)}</em>
        </button>
      )) : (
        <div className="empty-state">No notifications yet.</div>
      )}
    </section>
  )
}

function SettingsPage({ user, onToast }: { user: ReturnType<typeof getCurrentUser>; onToast: (kind: NonNullable<Toast>['kind'], message: string) => void }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  async function updatePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError('')

    if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      setPasswordError('Use your current password and make sure the new passwords match with at least 8 characters.')
      return
    }

    setPasswordBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onToast('success', 'Password updated successfully.')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Password update failed.')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <section className="page narrow">
      <div className="page-head"><div><h1>Settings</h1><p>Manage profile and preferences.</p></div></div>
      <section className="panel form-panel">
        <h2>Profile</h2>
        <div className="two-col">
          <label className="field"><span>Full Name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        </div>
        <p><Badge tone="blue">{user.role || 'Role'}</Badge></p>
        <button className="primary" onClick={() => onToast('success', 'Profile updated successfully.')}>Save Profile</button>
      </section>
      <form className="panel form-panel" onSubmit={updatePassword}>
        <h2>Change Password</h2>
        <label className="field">
          <span>Current Password</span>
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <div className="two-col">
          <label className="field">
            <span>New Password</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label className="field">
            <span>Confirm Password</span>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
        </div>
        {passwordError && <p className="error-banner">{passwordError}</p>}
        <button className="primary" disabled={passwordBusy}>{passwordBusy ? 'Updating...' : 'Update Password'}</button>
      </form>
    </section>
  )
}

function ConfirmModal({ modal, onClose, onToast }: {
  modal: ModalState
  onClose: () => void
  onToast: (kind: NonNullable<Toast>['kind'], message: string) => void
}) {
  if (!modal) return null

  async function confirm() {
    if (!modal) return
    if (modal.kind === 'register') {
      await eventsApi.registerForEvent(modal.eventId)
      onToast('success', modal.waitlist ? 'Added to waitlist.' : 'Registration confirmed.')
      window.dispatchEvent(new Event('student-events-changed'))
      window.dispatchEvent(new Event('notifications-changed'))
    }
    if (modal.kind === 'cancelRegistration') {
      await eventsApi.cancelRegistration(modal.eventId)
      onToast('info', 'Registration cancelled.')
      window.dispatchEvent(new Event('student-events-changed'))
      window.dispatchEvent(new Event('notifications-changed'))
    }
    if (modal.kind === 'cancelEvent') {
      await eventsApi.cancelEvent(modal.eventId)
      onToast('success', `${modal.title} cancelled.`)
      window.dispatchEvent(new Event('organizer-events-changed'))
    }
    onClose()
    routeTo(window.location.pathname)
  }

  const title = modal.kind === 'cancelEvent'
    ? 'Cancel event?'
    : modal.kind === 'cancelRegistration'
      ? 'Cancel registration?'
      : modal.waitlist ? 'Join waitlist?' : 'Confirm registration?'

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <h2>{title}</h2>
        <p>{modal.title}</p>
        <div className="modal-actions">
          <button className="outline" onClick={onClose}>Keep</button>
          <button className={modal.kind === 'register' ? 'primary' : 'danger'} onClick={() => void confirm()}>
            {modal.kind === 'register' ? (modal.waitlist ? 'Join Waitlist' : 'Register') : 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
