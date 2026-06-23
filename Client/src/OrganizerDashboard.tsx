import { useEffect, useState } from 'react'
import eventsApi from './api/events'

export default function OrganizerDashboard() {
  const [cards, setCards] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        // ignore
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  if (loading) return <main className="login-shell"><section className="form-panel">Loading...</section></main>

  return (
    <main className="login-shell">
      <section style={{width: '100%'}} className="form-panel">
        <h1>Organizer Dashboard</h1>
        <div style={{display: 'flex', gap: 12, marginBottom: 16}}>
          <div style={{padding:12, border:'1px solid #eee', borderRadius:8}}>Total Events<br/>{cards?.totalEvents ?? '-'}</div>
          <div style={{padding:12, border:'1px solid #eee', borderRadius:8}}>Published<br/>{cards?.published ?? '-'}</div>
          <div style={{padding:12, border:'1px solid #eee', borderRadius:8}}>Drafts<br/>{cards?.drafts ?? '-'}</div>
        </div>

        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th style={{textAlign:'left', borderBottom:'1px solid #eee', padding:8}}>Title</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #eee', padding:8}}>Status</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #eee', padding:8}}>Capacity</th>
              <th style={{textAlign:'left', borderBottom:'1px solid #eee', padding:8}}>Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev:any, i:number) => (
              <tr key={i}>
                <td style={{padding:8, borderBottom:'1px solid #f6f6f6'}}>{ev.title}</td>
                <td style={{padding:8, borderBottom:'1px solid #f6f6f6'}}>{ev.status}</td>
                <td style={{padding:8, borderBottom:'1px solid #f6f6f6'}}>{ev.capacity}</td>
                <td style={{padding:8, borderBottom:'1px solid #f6f6f6'}}>{ev.confirmed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
