import { useEffect, useState } from 'react'
import eventsApi from './api/events'
import { clearAuth } from './api/auth'

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

  const navigate = (href: string) => {
    window.history.pushState(null, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const createEvent = () => navigate('/organizer/events/new')
  const goToEvents = () => navigate('/organizer/events')
  const goToRegistrations = () => navigate('/organizer/registrations')
  const editEvent = (eventId: string) => navigate(`/organizer/events/${eventId}/edit`)
  const viewEvent = (eventId: string) => navigate(`/organizer/events/${eventId}/view`)
  const logout = () => {
    clearAuth()
    window.location.href = '/'
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
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
      <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
        <section className="mx-auto max-w-6xl rounded-[32px] bg-white px-8 py-14 shadow-[0_30px_80px_rgba(15,23,42,0.08)] text-slate-700">
          Loading dashboard…
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-[280px_minmax(0,1fr)] gap-8 xl:grid-cols-[280px_minmax(0,1.15fr)]">
        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-10 flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-200 text-xl">📚</span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-700">School Events</p>
            </div>
          </div>

          <nav className="space-y-2 text-sm font-semibold text-slate-900">
            <button
              type="button"
              onClick={() => navigate('/organizer/dashboard')}
              className="flex w-full items-center rounded-3xl bg-slate-200 px-5 py-3 text-left transition hover:bg-slate-300"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate('/organizer/events')}
              className="flex w-full items-center rounded-3xl px-5 py-3 text-left transition hover:bg-slate-100"
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => navigate('/organizer/registrations')}
              className="flex w-full items-center rounded-3xl px-5 py-3 text-left transition hover:bg-slate-100"
            >
              Registrations
            </button>
            <button className="flex w-full items-center rounded-3xl px-5 py-3 text-left transition hover:bg-slate-100">Notifications</button>
            <button
              type="button"
              onClick={createEvent}
              className="flex w-full items-center rounded-3xl px-5 py-3 text-left transition hover:bg-slate-100"
            >
              Create Event
            </button>
          </nav>

          <div className="mt-10 space-y-3">
            <button className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Settings</button>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="space-y-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-800">School Events</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Welcome back, Organizer</h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">Here&apos;s an overview of your events and registrations.</p>
            </div>
            <button
              type="button"
              onClick={createEvent}
              className="inline-flex items-center justify-center rounded-[18px] bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 transition hover:bg-sky-700"
            >
              + New Event
            </button>
          </div>

          <section className="grid gap-4 xl:grid-cols-6">
            {[
              { label: 'Total Events', value: cards?.totalEvents ?? 0, icon: '📅' },
              { label: 'Published', value: cards?.published ?? 0, icon: '✅' },
              { label: 'Drafts', value: cards?.drafts ?? 0, icon: '📝' },
              { label: 'Cancelled', value: cards?.cancelled ?? 0, icon: '✖️' },
              { label: 'Students', value: cards?.registrations ?? 0, icon: '👥' },
              { label: 'Waitlisted', value: cards?.waitlisted ?? 0, icon: '⏳' },
            ].map((item) => (
              <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">{item.icon}</div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-700">Your Events</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">Event summary</h2>
                </div>
                <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">Manage all</button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-4 font-semibold">Event</th>
                      <th className="py-4 font-semibold">Status</th>
                      <th className="py-4 font-semibold">Registered</th>
                      <th className="py-4 font-semibold">Date</th>
                      <th className="py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">No events available yet.</td>
                      </tr>
                    ) : (
                      events.map((event, index) => (
                        <tr key={index} className="odd:bg-slate-50">
                          <td className="py-5 pr-6">
                            <div className="max-w-xs">
                              <p className="font-semibold text-slate-900">{event.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatDate(event.startsAt)}</p>
                            </div>
                          </td>
                          <td className="py-5 pr-6">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              event.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                              event.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                              event.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {String(event.status).toLowerCase()}
                            </span>
                          </td>
                          <td className="py-5 pr-6">{event.confirmedRegistrations ?? 0}{event.waitlistedRegistrations ? ` (+${event.waitlistedRegistrations})` : ''}</td>
                          <td className="py-5 pr-6">{formatDate(event.startsAt)}</td>
                          <td className="py-5">
                            <div className="flex gap-2">
                              {event.status === 'Draft' ? (
                    <button
                      type="button"
                      onClick={() => editEvent(event.id)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => viewEvent(event.id)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                  >
                    View
                  </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">Quick Actions</p>
              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={createEvent}
                  className="w-full rounded-[18px] bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={goToEvents}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Manage Events
                </button>
                <button
                  type="button"
                  onClick={goToRegistrations}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  View Registrations
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
