import { useEffect, useState } from 'react'
import { getStudentEventDetails, cancelEvent } from './api/events'

type ViewName = 'dashboard' | 'events' | 'eventDetails' | 'registrations' | 'notifications' | 'settings'

type NotificationItem = {
  icon: string
  title: string
  type: string
  text: string
  event: string
  age: string
  tone: 'success' | 'warning' | 'plain'
  unread?: boolean
}

type EventItem = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  registered: string
  seatsLeft: string
  progress: number
  tags: string[]
  waitlist?: string
}

const eventCatalog: EventItem[] = [
  {
    id: '3d09c452-8efa-4cfc-9c1f-b57c8e7f1b8f',
    title: 'Annual Hackathon 2025',
    description: 'A 48-hour coding competition where teams of 2-4 students build innovative solutions to real-world problems.',
    date: 'Jul 15, 2025',
    time: '09:00 - 18:00',
    location: 'Engineering Building, Room 401',
    registered: '87/120 registered',
    seatsLeft: '33 seats left',
    progress: 73,
    tags: ['published', 'confirmed'],
  },
  {
    id: 'a4b1d7ad-eca3-4b9e-a6d6-5b2c9c8d7f93',
    title: 'Career Fair - Summer 2025',
    description: 'Meet recruiters from 50+ top companies spanning technology, finance, healthcare, and consulting.',
    date: 'Jul 22, 2025',
    time: '10:00 - 16:00',
    location: 'Student Union Ballroom',
    registered: '312/500 registered',
    seatsLeft: '188 seats left',
    progress: 62,
    tags: ['published', 'cancelled'],
  },
  {
    id: 'b66e3c19-38a8-46ef-af1e-d4f7c3f66726',
    title: 'Design Thinking Workshop',
    description: 'An immersive half-day workshop exploring human-centered design principles and practical product discovery.',
    date: 'Jul 28, 2025',
    time: '14:00 - 18:00',
    location: 'Innovation Hub, Floor 2',
    registered: '40/40 registered',
    seatsLeft: 'Event full',
    progress: 100,
    waitlist: '8 waitlisted',
    tags: ['published', 'Full', 'waitlisted'],
  },
  {
    id: 'c4e4f137-ff91-4f79-a8a3-1b24b5d7c6a8',
    title: 'Research Symposium 2025',
    description: 'Graduate students and faculty present their latest research findings across departments.',
    date: 'Aug 5, 2025',
    time: '09:00 - 17:00',
    location: 'Science Center Auditorium',
    registered: '145/200 registered',
    seatsLeft: '55 seats left',
    progress: 73,
    tags: ['published', 'confirmed'],
  },
  {
    id: 'd2b88a4e-cc1d-4d78-9996-c4564f4b8e9b',
    title: 'International Food Festival',
    description: 'Celebrate cultural diversity with food, music, and performances from student organizations.',
    date: 'Aug 12, 2025',
    time: '12:00 - 20:00',
    location: 'Central Campus Lawn',
    registered: '234/800 registered',
    seatsLeft: '566 seats left',
    progress: 29,
    tags: ['published'],
  },
  {
    id: 'f4d3ab7e-6faf-42b7-8c1c-9c1b0a8c9f91',
    title: 'AI & Ethics Panel Discussion',
    description: 'Industry leaders and academics discuss the ethical implications of artificial intelligence in society.',
    date: 'Aug 20, 2025',
    time: '18:00 - 20:30',
    location: 'Law School Moot Court',
    registered: '89/150 registered',
    seatsLeft: '61 seats left',
    progress: 59,
    tags: ['published'],
  },
]

const upcomingEvents = eventCatalog.slice(0, 4).map((event) => ({
  status: event.tags.includes('waitlisted') ? 'Waitlisted' : 'Registered',
  title: event.title,
  date: event.date,
  time: event.time,
  location: event.location,
  seats: event.registered.replace(' registered', ' seats'),
  full: event.tags.includes('Full'),
}))

const registrations = [
  { title: 'Annual Hackathon 2025', date: 'Jul 15, 2025', registered: 'Registered Jun 10, 2025', status: 'confirmed', waitlist: '-' },
  { title: 'Design Thinking Workshop', date: 'Jul 28, 2025', registered: 'Registered Jun 12, 2025', status: 'waitlisted', waitlist: '#3' },
  { title: 'Research Symposium 2025', date: 'Aug 5, 2025', registered: 'Registered Jun 14, 2025', status: 'confirmed', waitlist: '-' },
  { title: 'Career Fair - Summer 2025', date: 'Jul 22, 2025', registered: 'Registered Jun 8, 2025', status: 'cancelled', waitlist: '-' },
]

const initialNotifications: NotificationItem[] = [
  {
    icon: 'OK',
    title: 'Registration Confirmed',
    type: 'CONFIRMED',
    text: 'Your registration for Annual Hackathon 2025 has been confirmed. See you on July 15th!',
    event: 'Annual Hackathon 2025',
    age: '4d ago',
    tone: 'success',
    unread: true,
  },
  {
    icon: 'WL',
    title: 'Added to Waitlist',
    type: 'WAITLISTED',
    text: "The Design Thinking Workshop is full. You've been added to the waitlist at position #3.",
    event: 'Design Thinking Workshop',
    age: '2d ago',
    tone: 'warning',
    unread: true,
  },
  {
    icon: 'NEW',
    title: 'New Event Available',
    type: 'NEW EVENT',
    text: 'Research Symposium 2025 has been published and is now open for registration.',
    event: 'Research Symposium 2025',
    age: '5d ago',
    tone: 'plain',
  },
  {
    icon: 'UP',
    title: "You've Been Promoted!",
    type: 'PROMOTED',
    text: 'A spot opened up in the Design Thinking Workshop. Your registration is now confirmed.',
    event: 'Design Thinking Workshop',
    age: '1d ago',
    tone: 'plain',
  },
  {
    icon: 'REM',
    title: 'Event Reminder',
    type: 'REMINDER',
    text: "Annual Hackathon 2025 is starting in 5 days. Don't forget to check in at 9:00 AM.",
    event: 'Annual Hackathon 2025',
    age: '6d ago',
    tone: 'plain',
  },
]

function logout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('role')
  window.location.href = '/'
}

function NavButton({
  active,
  children,
  count,
  icon,
  onClick,
}: {
  active: boolean
  children: string
  count?: number
  icon: string
  onClick: () => void
}) {
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick}>
      <span>{icon}</span>
      {children}
      {count ? <em>{count}</em> : null}
    </button>
  )
}

function DashboardView({ setView }: { setView: (view: ViewName) => void }) {
  return (
    <>
      <div className="dashboard-heading">
        <h1>Good morning, Alex <span aria-hidden="true">!</span></h1>
        <p>Here's what's happening with your events today.</p>
      </div>

      <section className="metric-grid" aria-label="Summary">
        <article className="metric-card">
          <div><p>Total Events</p><strong>6</strong><span>Available to join</span></div>
          <i className="metric-icon blue">EV</i>
        </article>
        <article className="metric-card">
          <div><p>Registered</p><strong>2</strong><span>Confirmed spots</span></div>
          <i className="metric-icon green">OK</i>
        </article>
        <article className="metric-card">
          <div><p>Waitlisted</p><strong>1</strong><span>Pending spots</span></div>
          <i className="metric-icon orange">WL</i>
        </article>
        <article className="metric-card">
          <div><p>Notifications</p><strong>2</strong><span>Unread</span></div>
          <i className="metric-icon purple">!</i>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="events-panel">
          <div className="section-title">
            <h2>Upcoming Events</h2>
            <button type="button" onClick={() => setView('events')}>View all -&gt;</button>
          </div>

          <div className="event-list">
            {upcomingEvents.map((event) => (
              <article className="event-card" key={event.title}>
                <div className="event-main">
                  <div className="tag-row">
                    {event.full && <span className="tag full">Full</span>}
                    <span className={`tag ${event.status.toLowerCase()}`}>{event.status}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p>{event.date} <span>{event.time}</span></p>
                  <p>{event.location} <span>{event.seats}</span></p>
                </div>
                <button type="button">View</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

type StudentEventDetails = EventItem & {
  website?: string
  organizer?: string
  capacityDescription?: string
}

function EventDetailsView({
  event,
  onBack,
  onRequestCancel,
  cancelDialogOpen,
  cancelLoading,
  cancelError,
  onCancelConfirm,
  onCancelDialogClose,
  loading,
  error,
}: {
  event: StudentEventDetails
  onBack: () => void
  onRequestCancel: () => void
  cancelDialogOpen: boolean
  cancelLoading: boolean
  cancelError: string | null
  onCancelConfirm: () => void
  onCancelDialogClose: () => void
  loading: boolean
  error: string | null
}) {
  const registeredCount = parseInt(event.registered || '0', 10) || 0
  const capacityCount = parseInt((event.registered.split('/')[1] || '').replace(/\D/g, ''), 10) || registeredCount
  const waitlistCount = event.waitlist ? parseInt(event.waitlist.replace(/\D/g, ''), 10) || 0 : Math.max(capacityCount - registeredCount, 0)

  return (
    <section className="page-view event-details-page">
      <div className="page-heading event-details-heading">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back to Events
        </button>
      </div>

      {loading && <p className="loading-text">Loading event details...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="event-details-hero">
        <div className="event-details-main">
          <div className="tag-row">
            {event.tags.map((tag) => (
              <span className={`tag ${tag.toLowerCase()}`} key={tag}>{tag}</span>
            ))}
          </div>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
        </div>

        <aside className="event-details-summary">
          <div className={`status-chip ${event.tags.includes('cancelled') ? 'status-cancelled' : 'status-published'}`}>
            {event.tags.includes('cancelled') ? 'Registration cancelled' : "You're registered!"}
          </div>
          <p>See you on {event.date}</p>
          <button
            type="button"
            disabled={loading || event.tags.includes('cancelled')}
            className="primary-button"
            onClick={onRequestCancel}
          >
            Cancel Registration
          </button>
        </aside>
      </div>

      {cancelDialogOpen && (
        <div className="modal-backdrop" aria-modal="true" role="dialog">
          <div className="cancel-confirmation-modal">
            <div className="modal-header">
              <h2>Cancel Registration</h2>
              <button type="button" className="icon-button close-button" aria-label="Close" onClick={onCancelDialogClose}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to cancel your registration for <strong>{event.title}</strong>? If you're confirmed, your spot may go to the next person on the waitlist.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onCancelDialogClose}>
                Keep Registration
              </button>
              <button type="button" className="primary-button" onClick={onCancelConfirm} disabled={cancelLoading}>
                {cancelLoading ? 'Cancelling...' : 'Cancel Registration'}
              </button>
            </div>
            {cancelError && <p className="cancel-error-text">{cancelError}</p>}
          </div>
        </div>
      )}

      <div className="event-detail-grid event-detail-summary-grid">
        <section className="event-detail-card event-detail-large-card">
          <h2>Event Details</h2>
          <div className="event-detail-list">
            <div>
              <span>Date</span>
              <strong>{event.date}</strong>
            </div>
            <div>
              <span>Time</span>
              <strong>{event.time}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{event.location}</strong>
            </div>
            {event.organizer && (
              <div>
                <span>Organizer</span>
                <strong>{event.organizer}</strong>
              </div>
            )}
            {event.website && (
              <div>
                <span>Website</span>
                <strong><a href={event.website} target="_blank" rel="noreferrer">{event.website}</a></strong>
              </div>
            )}
          </div>
        </section>

        <section className="event-detail-card event-detail-large-card capacity-card">
          <h2>Capacity</h2>
          <div className="capacity-grid">
            <div>
              <span>Capacity</span>
              <strong>{capacityCount}</strong>
            </div>
            <div>
              <span>Confirmed</span>
              <strong>{registeredCount}</strong>
            </div>
            <div>
              <span>Waitlist</span>
              <strong>{waitlistCount}</strong>
            </div>
          </div>
          <div className="progress-track large-progress">
            <i style={{ width: `${Math.min((registeredCount / Math.max(capacityCount, 1)) * 100, 100)}%` }} />
          </div>
          <p className="event-summary-copy">{event.seatsLeft} • {event.registered}</p>
        </section>
      </div>
    </section>
  )
}

function EventsView() {
  const [events, setEvents] = useState<EventItem[]>(eventCatalog)
  const [selectedStatus, setSelectedStatus] = useState<string>('All')
  const [searchText, setSearchText] = useState<string>('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [eventDetails, setEventDetails] = useState<StudentEventDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  
  let visibleEvents = events
  
  if (selectedStatus !== 'All') {
    visibleEvents = visibleEvents.filter((event) => {
      const statusLower = selectedStatus.toLowerCase()
      return event.tags.some((tag) => tag.toLowerCase() === statusLower)
    })
  }

  if (searchText.trim()) {
    const query = searchText.toLowerCase()
    visibleEvents = visibleEvents.filter((event) =>
      event.title.toLowerCase().includes(query) ||
      event.description.toLowerCase().includes(query) ||
      event.location.toLowerCase().includes(query)
    )
  }

  const selectedEvent = selectedEventId
    ? events.find((event) => event.id === selectedEventId) ?? null
    : null

  useEffect(() => {
    if (!selectedEventId || !selectedEvent) {
      setEventDetails(null)
      setDetailsError(null)
      setLoadingDetails(false)
      return
    }

    setLoadingDetails(true)
    setDetailsError(null)
    setEventDetails(selectedEvent)

    void getStudentEventDetails(selectedEventId)
      .then((details) => {
        setEventDetails({ ...selectedEvent, ...details } as StudentEventDetails)
      })
      .catch((err) => {
        setDetailsError(err?.message || 'Unable to load event details from the server.')
      })
      .finally(() => setLoadingDetails(false))

  }, [selectedEventId, selectedEvent])

  const handleRequestCancel = () => {
    setCancelDialogOpen(true)
    setCancelError(null)
  }

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false)
    setCancelError(null)
  }

  const handleConfirmCancel = () => {
    if (!selectedEventId) return
    setCancelLoading(true)
    setCancelError(null)

    void cancelEvent(selectedEventId)
      .then(() => {
        setCancelDialogOpen(false)
        setCancelLoading(false)
        setEvents((current) =>
          current.map((event) =>
            event.id === selectedEventId
              ? {
                  ...event,
                  tags: [...new Set([...(event.tags.filter((tag) => tag !== 'confirmed')), 'cancelled'])],
                }
              : event,
          ),
        )
        setEventDetails((current) =>
          current
            ? {
                ...current,
                tags: [...new Set([...(current.tags.filter((tag) => tag !== 'confirmed')), 'cancelled'])],
              }
            : current,
        )
      })
      .catch((err) => {
        setCancelError(err?.message || 'Unable to cancel your registration. Please try again.')
      })
      .finally(() => setCancelLoading(false))
  }

  if (selectedEvent) {
    return (
      <EventDetailsView
        event={eventDetails ?? selectedEvent}
        onBack={() => setSelectedEventId(null)}
        onRequestCancel={handleRequestCancel}
        cancelDialogOpen={cancelDialogOpen}
        cancelLoading={cancelLoading}
        onCancelConfirm={handleConfirmCancel}
        onCancelDialogClose={handleCancelDialogClose}
        cancelError={cancelError}
        loading={loadingDetails}
        error={detailsError}
      />
    )
  }

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Events</h1>
        <p>{visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'} available</p>
      </div>

      <div className="events-filter-row">
        <label className="events-search">
          <span>Search</span>
          <input type="search" placeholder="Search events, locations..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </label>
        <select aria-label="Event status filter" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option>All</option>
          <option>Published</option>
          <option>Confirmed</option>
          <option>Waitlisted</option>
        </select>
      </div>

      {visibleEvents.length > 0 ? (
        <div className="event-catalog-grid">
          {visibleEvents.map((event) => (
          <article className={`catalog-card ${event.tags.includes('waitlisted') ? 'waitlist-card' : ''}`} key={event.id}>
            <div className="tag-row">
              {event.tags.map((tag) => <span className={`tag ${tag.toLowerCase()}`} key={tag}>{tag}</span>)}
            </div>
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <ul>
              <li>{event.date} - {event.time}</li>
              <li>{event.location}</li>
              <li>{event.registered}{event.waitlist ? <strong> - {event.waitlist}</strong> : null}</li>
            </ul>
            <div className="progress-row">
              <span>{event.seatsLeft}</span>
              <span>{event.progress}%</span>
            </div>
            <div className="progress-track">
              <i style={{ width: `${event.progress}%` }} />
            </div>
            <div className="catalog-actions">
              <button type="button" onClick={() => setSelectedEventId(event.id)}>View Details</button>
              <button type="button">{event.tags.includes('waitlisted') ? '#3 Waitlist' : 'Registered'}</button>
            </div>
          </article>
          ))}
        </div>
      ) : (
        <div className="empty-events">
          <h2>No events found</h2>
          <p>Try another search or status filter.</p>
        </div>
      )}
    </section>
  )
}

function RegistrationsView() {
  const [selectedTab, setSelectedTab] = useState<string>('All')
  
  const filteredRegistrations = selectedTab === 'All'
    ? registrations
    : registrations.filter((reg) => reg.status === selectedTab.toLowerCase())

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>My Registrations</h1>
        <p>Manage all your event registrations</p>
      </div>

      <section className="registration-stats" aria-label="Registration summary">
        <article><strong className="success-text">2</strong><span>Confirmed</span></article>
        <article><strong className="warning-text">1</strong><span>Waitlisted</span></article>
        <article><strong>1</strong><span>Cancelled</span></article>
      </section>

      <section className="registrations-table-card">
        <div className="table-tabs">
          {['All', 'Confirmed', 'Waitlisted', 'Cancelled'].map((tab) => (
            <button
              className={tab === selectedTab ? 'active' : ''}
              type="button"
              key={tab}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="registrations-table">
          <div className="table-row table-head">
            <span>Event</span><span>Date</span><span>Status</span><span>Waitlist Position</span><span>Actions</span>
          </div>
          {filteredRegistrations.map((item) => (
            <div className="table-row" key={item.title}>
              <div><strong>{item.title}</strong><small>{item.registered}</small></div>
              <span>{item.date}</span>
              <span><em className={item.status}>{item.status}</em></span>
              <span className={item.waitlist === '#3' ? 'warning-text' : ''}>{item.waitlist}</span>
              <span className="table-actions"><button type="button">View</button>{item.status !== 'cancelled' && <button type="button">Cancel</button>}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function NotificationsView({
  notifications,
  unreadCount,
  onMarkAllRead,
}: {
  notifications: NotificationItem[]
  unreadCount: number
  onMarkAllRead: () => void
}) {
  // hide numeric prefixes in the displayed type and text (cleanup any injected numbers)
  const stripLeadingNumbers = (s: string) => s.replace(/^\s*\d+\s*/, '')
  return (
    <section className="page-view notification-page">
      <div className="page-heading split-heading">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={onMarkAllRead}>
          Mark all read
        </button>
      </div>

      <div className="notification-page-list">
        {notifications.map((item) => (
          <article className={`large-notification ${item.tone}`} key={item.title}>
            <span className="large-notice-icon">{item.icon}</span>
            <div>
              <div className="notice-title-row">
                <h2>{stripLeadingNumbers(item.title)}</h2>
                <span>{item.age}</span>
                {item.unread && <i aria-hidden="true" />}
              </div>
              <strong>{stripLeadingNumbers(item.type)}</strong>
              <p>{stripLeadingNumbers(item.text)}</p>
              <a href="/dashboard">{item.event}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettingsView() {
  const [fullName, setFullName] = useState('Alex Chen')
  const [email, setEmail] = useState('alex@university.edu')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <section className="page-view settings-page">
      <div className="page-heading">
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-container">
        <section className="settings-card">
          <div className="settings-header">
            <div>
              <h2>Profile</h2>
              <p>Update your account information</p>
            </div>
          </div>
          <div className="settings-content">
            <div className="settings-form-row">
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <button className="primary-button">Save Profile</button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-header">
            <div>
              <h2>Change Password</h2>
              <p>Keep your account secure</p>
            </div>
          </div>
          <div className="settings-content">
            <div className="form-field">
              <label>Current Password</label>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            </div>
            <div className="settings-form-row">
              <div className="form-field">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
              <div className="form-field">
                <label>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
            </div>
            <button className="primary-button">Update Password</button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default function SchoolDashboard() {
  const [view, setView] = useState<ViewName>('dashboard')
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [accountOpen, setAccountOpen] = useState(false)

  const unreadCount = notifications.filter((item) => item.unread).length
  const markAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
  }

  return (
    <main className="school-app">
      <header className="school-topbar">
        <div className="topbar-brand">
          <button className="icon-button muted-button" aria-label="Close">x</button>
          <div className="brand-calendar" aria-hidden="true">[]</div>
          <strong>School Events</strong>
        </div>

        <label className="search-field">
          <span aria-hidden="true">Search</span>
          <input type="search" placeholder="Search events..." />
        </label>

        <div className="topbar-profile">
          <button className="bell-button" type="button" aria-label="Notifications" onClick={() => setView('notifications')}>
            !
            <span>{unreadCount}</span>
          </button>
          <button
            className="profile-trigger"
            type="button"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            onClick={() => setAccountOpen((open) => !open)}
          >
            <div className="avatar" aria-hidden="true">AC</div>
            <strong>Alex Chen</strong>
            <span className="role-pill">Student</span>
            <span className="chevron" aria-hidden="true">v</span>
          </button>
          {accountOpen && (
            <div className="account-menu" role="menu">
              <div className="account-menu-header">
                <strong>Alex Chen</strong>
                <span>alex@university.edu</span>
              </div>
              <button type="button" role="menuitem" onClick={() => setAccountOpen(false)}>
                <span>ST</span>
                Settings
              </button>
              <button className="danger" type="button" role="menuitem" onClick={logout}>
                <span>LO</span>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <aside className="school-sidebar">
        <nav className="side-nav" aria-label="Primary">
          <NavButton active={view === 'dashboard'} icon="DB" onClick={() => setView('dashboard')}>Dashboard</NavButton>
          <NavButton active={view === 'events'} icon="EV" onClick={() => setView('events')}>Events</NavButton>
          <NavButton active={view === 'registrations'} icon="MR" onClick={() => setView('registrations')}>My Registrations</NavButton>
          <NavButton active={view === 'notifications'} icon="NO" count={unreadCount} onClick={() => setView('notifications')}>Notifications</NavButton>
        </nav>
        <div className="side-footer">
          <button type="button" onClick={() => setView('settings')}><span>ST</span>Settings</button>
          <button type="button" onClick={logout}><span>LO</span>Log out</button>
        </div>
      </aside>

      <section className="dashboard-content">
        {view === 'dashboard' && <DashboardView setView={setView} />}
        {view === 'events' && <EventsView />}
        {view === 'registrations' && <RegistrationsView />}
        {view === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={markAllRead}
          />
        )}
        {view === 'settings' && <SettingsView />}
      </section>
    </main>
  )
}
