import { useState } from 'react'

type ViewName = 'dashboard' | 'events' | 'registrations' | 'notifications'
type CategoryName = 'All' | 'Technology' | 'Career' | 'Workshop' | 'Academic' | 'Social' | 'Business' | 'Wellness'

const categories: CategoryName[] = ['All', 'Technology', 'Career', 'Workshop', 'Academic', 'Social', 'Business', 'Wellness']

const eventCatalog = [
  {
    category: 'Technology',
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
    category: 'Career',
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
    category: 'Workshop',
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
    category: 'Academic',
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
    category: 'Social',
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
    category: 'Technology',
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
  category: event.category,
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

const notifications = [
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
                    <span className="tag category">{event.category}</span>
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

function EventsView() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('All')
  const visibleEvents =
    selectedCategory === 'All'
      ? eventCatalog
      : eventCatalog.filter((event) => event.category === selectedCategory)

  return (
    <section className="page-view">
      <div className="page-heading">
        <h1>Events</h1>
        <p>{visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'} available</p>
      </div>

      <div className="events-filter-row">
        <label className="events-search">
          <span>Search</span>
          <input type="search" placeholder="Search events, locations..." />
        </label>
        <select aria-label="Event status filter" defaultValue="All">
          <option>All</option>
          <option>Published</option>
          <option>Confirmed</option>
          <option>Waitlisted</option>
        </select>
      </div>

      <div className="filter-pills" aria-label="Event categories">
        {categories.map((item) => (
          <button
            type="button"
            className={item === selectedCategory ? 'active' : ''}
            key={item}
            onClick={() => setSelectedCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {visibleEvents.length > 0 ? (
        <div className="event-catalog-grid">
          {visibleEvents.map((event) => (
          <article className={`catalog-card ${event.tags.includes('waitlisted') ? 'waitlist-card' : ''}`} key={event.title}>
            <div className="tag-row">
              <span className="tag neutral">{event.category}</span>
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
              <button type="button">View Details</button>
              <button type="button">{event.tags.includes('waitlisted') ? '#3 Waitlist' : 'Registered'}</button>
            </div>
          </article>
          ))}
        </div>
      ) : (
        <div className="empty-events">
          <h2>No {selectedCategory.toLowerCase()} events yet</h2>
          <p>Try another category or switch back to All.</p>
        </div>
      )}
    </section>
  )
}

function RegistrationsView() {
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
          {['All', 'Confirmed', 'Waitlisted', 'Cancelled'].map((tab) => <button className={tab === 'All' ? 'active' : ''} type="button" key={tab}>{tab}</button>)}
        </div>
        <div className="registrations-table">
          <div className="table-row table-head">
            <span>Event</span><span>Date</span><span>Status</span><span>Waitlist Position</span><span>Actions</span>
          </div>
          {registrations.map((item) => (
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

function NotificationsView() {
  return (
    <section className="page-view notification-page">
      <div className="page-heading split-heading">
        <div>
          <h1>Notifications</h1>
          <p>2 unread notifications</p>
        </div>
        <button type="button">Mark all read</button>
      </div>

      <div className="notification-page-list">
        {notifications.map((item) => (
          <article className={`large-notification ${item.tone}`} key={item.title}>
            <span className="large-notice-icon">{item.icon}</span>
            <div>
              <div className="notice-title-row">
                <h2>{item.title}</h2>
                <span>{item.age}</span>
                {item.unread && <i aria-hidden="true" />}
              </div>
              <strong>{item.type}</strong>
              <p>{item.text}</p>
              <a href="/dashboard">{item.event}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function SchoolDashboard() {
  const [view, setView] = useState<ViewName>('dashboard')
  const [accountOpen, setAccountOpen] = useState(false)

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
            <span>2</span>
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
          <NavButton active={view === 'notifications'} icon="NO" count={2} onClick={() => setView('notifications')}>Notifications</NavButton>
        </nav>
        <div className="side-footer">
          <button type="button"><span>ST</span>Settings</button>
          <button type="button" onClick={logout}><span>LO</span>Log out</button>
        </div>
      </aside>

      <section className="dashboard-content">
        {view === 'dashboard' && <DashboardView setView={setView} />}
        {view === 'events' && <EventsView />}
        {view === 'registrations' && <RegistrationsView />}
        {view === 'notifications' && <NotificationsView />}
      </section>
    </main>
  )
}
