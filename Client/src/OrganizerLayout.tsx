import type { ReactNode } from 'react'
import { clearAuth } from './api/auth'

type CurrentPage = 'dashboard' | 'events' | 'registrations'

interface OrganizerLayoutProps {
  current: CurrentPage
  children: ReactNode
}

function navigate(href: string) {
  window.history.pushState(null, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function OrganizerLayout({ current, children }: OrganizerLayoutProps) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-[280px_minmax(0,1fr)] gap-8 xl:grid-cols-[280px_minmax(0,1.15fr)]">
      <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-10 flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-200 text-xl">📚</span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-700">School Events</p>
            <p className="mt-1 text-sm text-slate-600">Organizer workspace</p>
          </div>
        </div>

        <nav className="space-y-2 text-sm font-semibold text-slate-900">
          {[
            { label: 'Dashboard', href: '/organizer/dashboard', key: 'dashboard' },
            { label: 'Events', href: '/organizer/events', key: 'events' },
            { label: 'Registrations', href: '/organizer/registrations', key: 'registrations' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => navigate(item.href)}
              className={`flex w-full items-center rounded-3xl px-5 py-4 text-left transition ${
                current === item.key
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-10 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Manage events
          </button>
          <button
            type="button"
            onClick={() => navigate('/organizer/registrations')}
            className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            View registrations
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuth()
              window.location.href = '/'
            }}
            className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </aside>

      <section className="space-y-8">{children}</section>
    </div>
  )
}
