import { useEffect, useState } from 'react'
import eventsApi from './api/events'
import OrganizerLayout from './OrganizerLayout'

function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type EventDetail = {
  id: string
  title: string
  description: string
  status: string
  capacity: number
  startsAt: string
  endsAt: string
  location?: string
  url?: string
}

export default function OrganizerEventView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const result = await eventsApi.getEvent(eventId)
        if (!mounted) return
        setEvent(result)
      } catch (err: any) {
        setError(err?.message || 'Unable to load event.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [eventId])

  const navigateBack = () => {
    window.history.pushState(null, '', '/organizer/events')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white px-8 py-14 shadow-[0_30px_80px_rgba(15,23,42,0.08)] text-slate-700">
          Loading event…
        </div>
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-6xl rounded-[32px] bg-white px-8 py-14 shadow-[0_30px_80px_rgba(15,23,42,0.08)] text-slate-700">
          <p className="text-lg font-semibold text-slate-900">Unable to load event</p>
          <p className="mt-3 text-sm text-slate-600">{error ?? 'Event not found.'}</p>
          <button
            type="button"
            onClick={navigateBack}
            className="mt-6 rounded-[18px] bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Back to events
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <OrganizerLayout current="events">
        <div className="space-y-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky-800">School Events</p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">View Event</h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600">Review the event details and student interest.</p>
            </div>
            <button
              type="button"
              onClick={navigateBack}
              className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Back to events
            </button>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 text-slate-500">
                    <span className="text-sm uppercase tracking-[0.3em]">Status</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{event.status}</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-slate-900">{event.title}</h2>
                  <p className="text-sm text-slate-600">{event.description}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Capacity</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{event.capacity}</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Event URL</p>
                    <p className="mt-3 text-base font-semibold text-slate-900">{event.url || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div>
                  <p className="text-sm text-slate-500">Start</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(event.startsAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">End</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{formatDate(event.endsAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{event.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OrganizerLayout>
    </main>
  )
}
