import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { submitKegRequest } from '../lib/api/keg-request.functions'
import { KegTurnstile } from './KegTurnstile'

type KegBrand = { name: string; day: string }

export function KegRequestForm({ brands, siteKey, onClose }: {
  brands: readonly KegBrand[]
  siteKey: string
  onClose: () => void
}) {
  const [brand, setBrand] = useState('')
  const [token, setToken] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [securityFailed, setSecurityFailed] = useState(false)
  const requestId = useRef<string | null>(null)
  const inFlight = useRef(false)
  const pickupDay = brands.find(item => item.name === brand)?.day ?? ''
  const receiveToken = useCallback((value: string) => { setToken(value); setSecurityFailed(false) }, [])
  const failSecurity = useCallback(() => { setToken(''); setSecurityFailed(true) }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    if (!token) { setError('Please complete security verification.'); return }
    if (pickupDay !== 'Wednesday' && pickupDay !== 'Friday') { setError('For unlisted pickup schedules, please email the store directly.'); return }
    const values = new FormData(event.currentTarget)
    requestId.current ??= crypto.randomUUID()
    inFlight.current = true
    setPending(true)
    setError('')
    try {
      const result = await submitKegRequest({ data: {
        name: String(values.get('name') ?? ''), phone: String(values.get('phone') ?? ''),
        brand, pickupDay, notes: String(values.get('notes') ?? ''),
        requestId: requestId.current, turnstileToken: token,
      } })
      if (result.success) setSent(true)
      else setError(result.error)
    } catch {
      setError('Could not confirm submission. Check the fields and retry, or email the store directly.')
    } finally {
      inFlight.current = false
      setPending(false)
      setToken('')
      setAttempt(value => value + 1)
    }
  }

  if (sent) return <div className="success" role="status">
    <strong>Request submitted.</strong>
    <p>Your request was accepted by our email service for 777liquorstorehi@gmail.com. Our team will confirm availability, pickup day and pricing. This is not a confirmed order; keg cost must be paid in advance.</p>
    <button type="button" className="button" onClick={onClose}>Close</button>
  </div>

  return <form onSubmit={submit} onChange={() => { requestId.current = null; setError('') }} aria-busy={pending}>
    <label>Name<input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" disabled={pending}/></label>
    <label>Phone<input name="phone" required type="tel" minLength={7} maxLength={40} autoComplete="tel" placeholder="(808) 555-0123" disabled={pending}/></label>
    <label>Brand<select name="brand" required value={brand} onChange={e => setBrand(e.target.value)} disabled={pending}>
      <option value="">Select a brand</option>
      {brands.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
    </select></label>
    <label>Pickup day<select value={pickupDay} disabled aria-label="Pickup day determined by brand">
      <option value="">Select a brand first</option>
      <option value="Wednesday">Wednesday morning</option>
      <option value="Friday">Friday morning</option>
    </select><small className="field-note">Pickup day is automatically determined by the brand selected. Wednesday = Wednesday-scheduled brands; Friday = Friday-scheduled brands.</small></label>
    {brand && !pickupDay && <p className="field-note">Please email the store to confirm availability and pickup for this brand.</p>}
    <label>Notes<textarea name="notes" maxLength={2000} placeholder="Size, quantity, event date, or questions" disabled={pending}/></label>
    <p className="fine">Kegs are pickup only. Keg cost is due in advance. Pump rental is optional and charged separately; rented pumps must be returned. Pickup availability is subject to brand schedule.</p>
    {siteKey ? <KegTurnstile siteKey={siteKey} attempt={attempt} onToken={receiveToken} onFailure={failSecurity}/> : <p role="alert">Online requests are not configured yet. Email the store below.</p>}
    {securityFailed && <p role="alert">Security verification could not load. <button type="button" disabled={pending} onClick={() => { setSecurityFailed(false); setAttempt(value => value + 1) }}>Retry verification</button></p>}
    {error && <p role="alert">{error}</p>}
    <button className="button" type="submit" disabled={pending || !token || !pickupDay}>{pending ? 'Sending request…' : 'Submit pre-order request →'}</button>
    <p className="fine">We use your contact details to respond to this inquiry. Trouble submitting? <a href="mailto:777liquorstorehi@gmail.com?subject=Keg%20pre-order%20inquiry">Email the store directly</a>.</p>
  </form>
}
