import { useEffect, useState } from 'react'
import eventsApi from './api/events'

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function OrganizerDashboard() {
  const [cards, setCards] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        console.debug('OrganizerDashboard loading token', localStorage.getItem('accessToken'))
        const c = await eventsApi.getOrganizerDashboardCards()
        const e = await eventsApi.getOrganizerDashboardEvents()
        if (!mounted) return
        setCards(c)
        setEvents(e || [])
      } catch (err) {
        console.error('OrganizerDashboard load error', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-loading">Loading dashboard…</section>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar-nav">
          <div className="nav-brand">
            <span className="nav-brand-icon">📚</span>
            <span>School Events</span>
          </div>

          <nav className="sidebar-menu">
            <button className="sidebar-link active" type="button">Dashboard</button>
            <button className="sidebar-link" type="button">Events</button>
            <button className="sidebar-link" type="button">Registrations</button>
            <button className="sidebar-link" type="button">Notifications</button>
            <button className="sidebar-link" type="button">Create Event</button>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-button">Settings</button>
            <button className="sidebar-button">Log out</button>
          </div>
        </aside>

        <section className="dashboard-main">
          <section className="dashboard-header">
            <div>
              <p className="eyebrow">School Events</p>
              <h1>Welcome back, Organizer</h1>
              <p className="dashboard-subtitle">
                Here's an overview of your events and registrations.
              </p>
            </div>
            <button className="primary-button">+ New Event</button>
          </section>

          <section className="dashboard-cards">
            <article className="dashboard-card">
              <p className="card-label">Total Events</p>
              <p className="card-value">{cards?.totalEvents ?? 0}</p>
            </article>
            <article className="dashboard-card">
              <p className="card-label">Published</p>
              <p className="card-value">{cards?.published ?? 0}</p>
            </article>
            <article className="dashboard-card">
              <p className="card-label">Drafts</p>
              <p className="card-value">{cards?.drafts ?? 0}</p>
            </article>
            <article className="dashboard-card">
              <p className="card-label">Cancelled</p>
              <p className="card-value">{cards?.cancelled ?? 0}</p>
            </article>
            <article className="dashboard-card">
              <p className="card-label">Students</p>
              <p className="card-value">{cards?.registrations ?? 0}</p>
            </article>
            <article className="dashboard-card">
              <p className="card-label">Waitlisted</p>
              <p className="card-value">{cards?.waitlisted ?? 0}</p>
            </article>
          </section>

          <div className="dashboard-grid">
            <section className="dashboard-table-card">
              <div className="table-card-header">
                <div>
                  <p className="eyebrow">Your Events</p>
                  <h2>Event summary</h2>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Capacity</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-row">
                          No events available yet.
                        </td>
                      </tr>
                    ) : (
                      events.map((event, index) => (
                        <tr key={index}>
                          <td>{event.title}</td>
                          <td>
                            <span className={`status-chip status-${String(event.status).toLowerCase()}`}>
                              {String(event.status).toLowerCase()}
                            </span>
                          </td>
                          <td>
                            {event.confirmedRegistrations ?? 0}
                            {event.waitlistedRegistrations ? ` (+${event.waitlistedRegistrations})` : ''}
                          </td>
                          <td>{event.capacity ?? '-'}</td>
                          <td>{formatDate(event.startsAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="dashboard-sidebar">
              <div className="sidebar-card">
                <p className="card-label">Quick Actions</p>
                <button className="primary-button">Create Event</button>
                <button className="secondary-button">Manage Events</button>
                <button className="secondary-button">View Registrations</button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
