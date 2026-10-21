import { useEffect, useState } from 'react'
import eventsApi from './api/events'
import OrganizerLayout from './OrganizerLayout'

type Mode = 'create' | 'edit'

type FormState = {
  title: string
  description: string
  capacity: string
  url: string
  location: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  publish: boolean
}

function formatDateInput(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(0, 10)
}

function formatTimeInput(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toISOString().slice(11, 16)
}

function getDateTime(date: string, time: string) {
  if (!date || !time) return null
  return new Date(`${date}T${time}`)
}

export default function OrganizerEventForm({ mode, eventId }: { mode: Mode; eventId?: string }) {
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    capacity: '0',
    url: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    publish: false,
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !eventId) return

    let mounted = true
    async function load() {
      try {
        const event = await eventsApi.getEvent(eventId!)
        if (!mounted) return
        const startsAt = new Date(event.startsAt)
        const endsAt = new Date(event.endsAt)
        setForm({
          title: event.title ?? '',
          description: event.description ?? '',
          capacity: String(event.capacity ?? 0),
          url: event.url ?? '',
          location: event.location ?? '',
          startDate: formatDateInput(startsAt),
          startTime: formatTimeInput(startsAt),
          endDate: formatDateInput(endsAt),
          endTime: formatTimeInput(endsAt),
          publish: false,
        })
      } catch (err: any) {
        setError(err?.message || 'Unable to load event. Only draft events may be edited.')
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [mode, eventId])

  const saveEvent = async (publish: boolean) => {
    setError(null)
    setMessage(null)
    const startsAt = getDateTime(form.startDate, form.startTime)
    const endsAt = getDateTime(form.endDate, form.endTime)
    if (!startsAt || !endsAt) {
      setError('Please complete the start and end date/time.')
      return
    }

    const payload = {
      title: form.title,
      description: form.description,
      capacity: Number(form.capacity),
      url: form.url || undefined,
      location: form.location || undefined,
      startsAt,
      endsAt,
      publish,
    }

    try {
      if (mode === 'edit' && eventId) {
        await eventsApi.updateEvent(eventId, payload)
        setMessage(publish ? 'Event updated and published.' : 'Draft saved successfully.')
      } else {
        await eventsApi.createEvent(payload)
        setMessage(publish ? 'Event published successfully.' : 'Draft created successfully.')
      }
      window.history.pushState(null, '', '/organizer/events')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (err: any) {
      setError(err?.message || 'Unable to save event. Please try again.')
    }
  }

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const navigate = (href: string) => {
    window.history.pushState(null, '', href)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const heading = mode === 'edit' ? 'Edit Event' : 'Create Event'
  const actionLabel = mode === 'edit' ? 'Update & Publish' : 'Publish'

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
      <OrganizerLayout current="events">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-800">School Events</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">{heading}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">Fill in the details below to {mode === 'edit' ? 'update your event' : 'create a new event'}.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Back to events
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
            <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Event Title *</span>
                  <input
                    value={form.title}
                    onChange={handleChange('title')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="e.g. Annual Hackathon 2025"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Event URL (optional)</span>
                  <input
                    value={form.url}
                    onChange={handleChange('url')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="https://..."
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Description *</span>
                <textarea
                  value={form.description}
                  onChange={handleChange('description')}
                  rows={5}
                  className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="Describe the event..."
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Capacity *</span>
                  <input
                    type="number"
                    min="0"
                    value={form.capacity}
                    onChange={handleChange('capacity')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="e.g. 120"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Date & Time</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Start Date *</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={handleChange('startDate')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>End Date *</span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={handleChange('endDate')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Start Time *</span>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={handleChange('startTime')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>End Time *</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={handleChange('endTime')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
              <label className="space-y-2 text-sm text-slate-700">
                <span>Location *</span>
                <input
                  value={form.location}
                  onChange={handleChange('location')}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="e.g. Engineering Building, Room 401"
                />
              </label>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-700">Publishing</p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-slate-500">Status</p>
                  <strong className="mt-2 block text-slate-900">{mode === 'edit' ? 'Draft' : 'Unsaved'}</strong>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="text-slate-500">Organizer</p>
                  <strong className="mt-2 block text-slate-900">You</strong>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => saveEvent(false)}
                  className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => saveEvent(true)}
                  className="w-full rounded-[18px] bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  {actionLabel}
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-700">Checklist</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  'Title added',
                  'Description written',
                  'Capacity set',
                  'Date & time set',
                  'Location added',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {(message || error) && (
              <div className={`rounded-[28px] border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error ?? message}
              </div>
            )}
          </aside>
        </div>
      </OrganizerLayout>
    </main>
  )
}
