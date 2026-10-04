import { useEffect, useRef } from 'react'

type TurnstileAPI = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  remove: (id: string) => void
}
type TurnstileWindow = Window & { turnstile?: TurnstileAPI }
let loading: Promise<TurnstileAPI> | undefined

function loadTurnstile(): Promise<TurnstileAPI> {
  const win = window as TurnstileWindow
  if (win.turnstile) return Promise.resolve(win.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileAPI>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    const timer = window.setTimeout(() => { script.remove(); reject(new Error('Verification timed out')) }, 15000)
    script.onload = () => {
      window.clearTimeout(timer)
      if (win.turnstile) resolve(win.turnstile)
      else reject(new Error('Verification unavailable'))
    }
    script.onerror = () => { window.clearTimeout(timer); script.remove(); reject(new Error('Verification unavailable')) }
    document.head.appendChild(script)
  }).catch(error => { loading = undefined; throw error })
  return loading
}

export function KegTurnstile({ siteKey, attempt, onToken, onFailure }: {
  siteKey: string
  attempt: number
  onToken: (token: string) => void
  onFailure: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!siteKey || !container.current) { onFailure(); return }
    let disposed = false
    let widget: string | undefined
    let api: TurnstileAPI | undefined
    loadTurnstile().then(instance => {
      api = instance
      if (disposed || !container.current) return
      widget = instance.render(container.current, {
        sitekey: siteKey, action: 'keg-request', theme: 'auto', size: 'flexible',
        callback: (token: string) => { if (!disposed) onToken(token) },
        'expired-callback': () => { if (!disposed) onToken('') },
        'error-callback': () => { if (!disposed) onFailure() },
      })
    }).catch(() => { if (!disposed) onFailure() })
    return () => { disposed = true; if (widget !== undefined) api?.remove(widget) }
  }, [siteKey, attempt, onToken, onFailure])
  return <div ref={container} aria-label="Security verification" />
}
