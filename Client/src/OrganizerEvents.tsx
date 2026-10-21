import { useEffect, useState } from 'react'
import eventsApi from './api/events'
import OrganizerLayout from './OrganizerLayout'

const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type SchoolEvent = {
  title: string
  status: string
  capacity: number
  confirmed: number
  waitlisted: number
  startsAt: string
}

export default function OrganizerEvents() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const result = await eventsApi.getEvents(
          statusFilter === 'All' ? undefined : statusFilter,
          search || undefined,
        )
        if (!mounted) return
        setEvents(result || [])
      } catch (err) {
        console.error('OrganizerEvents load failed', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [statusFilter, search])

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <OrganizerLayout current="events">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-800">School Events</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Events manager</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">Browse and manage your upcoming event listings.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.history.pushState(null, '', '/organizer/events/new')
              window.dispatchEvent(new PopStateEvent('popstate'))
            }}
            className="inline-flex items-center justify-center rounded-[18px] bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/10 transition hover:bg-sky-700"
          >
            + Create event
          </button>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {['All', 'Published', 'Draft', 'Cancelled'].map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    statusFilter === option
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="min-w-[260px]">
              <label className="relative block">
                <span className="sr-only">Search events</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search events"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-700">Event list</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-900">Your events</h2>
              </div>
              <p className="text-sm text-slate-500">Showing {events.length} events</p>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-500">Loading events…</div>
            ) : events.length === 0 ? (
              <div className="py-16 text-center text-slate-500">No events found.</div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div key={index} className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{formatDate(event.startsAt)}</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-900">{event.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">Capacity {event.capacity} · Confirmed {event.confirmed}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className={`rounded-full px-3 py-1 font-semibold ${
                          event.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : event.status === 'Draft'
                            ? 'bg-amber-100 text-amber-700'
                            : event.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {event.status}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">Waitlisted {event.waitlisted}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-700">Events summary</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Top status</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{statusFilter}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Search query</p>
                <p className="mt-2 text-base text-slate-900">{search || 'No search entered'}</p>
              </div>
            </div>
          </aside>
        </section>
      </OrganizerLayout>
    </main>
  )
}
