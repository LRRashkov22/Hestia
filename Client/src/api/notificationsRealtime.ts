import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'

let connection: ReturnType<HubConnectionBuilder['build']> | null = null

function resolveHubUrl() {
  // Prefer explicit API base URL in env (works in dev/prod); fallback to relative path
  const base = (import.meta as any).env?.VITE_API_BASE_URL || ''
  if (base) return `${base.replace(/\/$/, '')}/hubs/notifications`
  return '/hubs/notifications'
}

export function startNotificationsRealtime(onChanged: () => void) {
  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(resolveHubUrl(), {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('notificationsChanged', () => {
      console.debug('[signalr] notificationsChanged')
      onChanged()
    })
    connection.on('notificationCreated', () => {
      console.debug('[signalr] notificationCreated')
      onChanged()
    })

    connection.onclose((err) => {
      console.warn('[signalr] connection closed', err)
    })
  }

  if (connection.state === HubConnectionState.Disconnected) {
    void connection
      .start()
      .then(() => console.info('[signalr] connected to', resolveHubUrl()))
      .catch((e) => {
        console.error('[signalr] failed to start', e)
        connection = null
      })
  }

  return () => {
    if (!connection) return
    connection.off('notificationsChanged')
    connection.off('notificationCreated')
  }
}
