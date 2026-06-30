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

type OrganizerRegistration = {
  username: string
  email: string
  eventTitle: string
  registeredAt: string
  waitlistPosition?: number
}

export default function OrganizerRegistrations() {
  const [registrations, setRegistrations] = useState<OrganizerRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('Confirmed')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const result = await eventsApi.getOrganizerRegistrations(statusFilter, search || undefined)
        if (!mounted) return
        setRegistrations(result || [])
      } catch (err) {
        console.error('OrganizerRegistrations load failed', err)
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
      <OrganizerLayout current="registrations">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sky-800">School Registrations</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Registrations</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">Review student registration activity across your events.</p>
          </div>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {['Confirmed', 'Waitlisted', 'Cancelled'].map((option) => (
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
                <span className="sr-only">Search registrations</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student or event"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_40px_80px_rgba(15,23,42,0.06)]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-700">Registrations</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Student responses</h2>
            </div>
            <p className="text-sm text-slate-500">{loading ? 'Loading...' : `${registrations.length} records`}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-4 font-semibold">Student</th>
                  <th className="py-4 font-semibold">Event</th>
                  <th className="py-4 font-semibold">Registered</th>
                  <th className="py-4 font-semibold">Waitlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">Loading registrations…</td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">No registrations found for this filter.</td>
                  </tr>
                ) : (
                  registrations.map((registration, index) => (
                    <tr key={index} className="odd:bg-slate-50">
                      <td className="py-5 pr-6">
                        <p className="font-semibold text-slate-900">{registration.username}</p>
                        <p className="mt-1 text-sm text-slate-500">{registration.email}</p>
                      </td>
                      <td className="py-5 pr-6">
                        <p className="font-semibold text-slate-900">{registration.eventTitle}</p>
                      </td>
                      <td className="py-5 pr-6">{formatDate(registration.registeredAt)}</td>
                      <td className="py-5">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {registration.waitlistPosition ? `#${registration.waitlistPosition}` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </OrganizerLayout>
    </main>
  )
}
