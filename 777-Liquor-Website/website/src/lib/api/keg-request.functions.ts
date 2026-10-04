import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const recipient = '777liquorstorehi@gmail.com'
const pickupSchedule: Record<string, string> = {
  "Bud Light": "Wednesday",
  "Budweiser": "Wednesday",
  "Michelob ULTRA": "Wednesday",
  "Busch": "Wednesday",
  "Busch Light": "Wednesday",
  "Natural Light": "Wednesday",
  "Rolling Rock": "Wednesday",
  "Stella Artois": "Wednesday",
  "Kona Big Wave": "Wednesday",
  "Kona Longboard": "Wednesday",
  "Kona Hanalei Island IPA": "Wednesday",
  "Kona Castaway IPA": "Wednesday",
  "Aloha Beer Co.": "Wednesday",
  "Coors Light": "Friday",
  "Coors Banquet": "Friday",
  "Miller Lite": "Friday",
  "Modelo Especial": "Friday",
  "Corona Extra": "Friday",
  "Pacifico": "Friday",
  "Dos Equis Lager": "Friday",
  "Heineken": "Friday",
  "Guinness": "Friday",
  "Sapporo": "Friday",
  "Asahi Super Dry": "Friday",
  "KIRIN ICHIBAN": "Friday",
  "Pabst Blue Ribbon": "Friday",
  "Sierra Nevada Pale Ale": "Friday"
}
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(40).refine(v => v.replace(/\D/g, '').length >= 7, 'Enter a valid phone number'),
  brand: z.string().trim().min(1).max(120),
  pickupDay: z.enum(['Wednesday', 'Friday']),
  notes: z.string().trim().max(2000),
  requestId: z.string().uuid(),
  turnstileToken: z.string().min(1).max(2048),
})

type EmailEnvironment = {
  RESEND_API_KEY?: string
  KEG_EMAIL_FROM?: string
  TURNSTILE_SECRET_KEY?: string
  KEG_ALLOWED_HOSTNAMES?: string
}
type Result = { success: true; emailId: string } | { success: false; error: string }

export const submitKegRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    if (!Object.prototype.hasOwnProperty.call(pickupSchedule, data.brand) || pickupSchedule[data.brand] !== data.pickupDay) {
      return { success: false, error: 'Select a listed brand and its scheduled pickup day, or email the store for other brands.' }
    }
    const { env } = await import('cloudflare:workers')
    const config = env as unknown as EmailEnvironment
    const allowed = (config.KEG_ALLOWED_HOSTNAMES ?? '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean)
    if (!config.RESEND_API_KEY || !config.KEG_EMAIL_FROM || !config.TURNSTILE_SECRET_KEY || !allowed.length) {
      return { success: false, error: 'Online requests are temporarily unavailable. Please email 777liquorstorehi@gmail.com.' }
    }
    try {
      const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: config.TURNSTILE_SECRET_KEY, response: data.turnstileToken }),
        signal: AbortSignal.timeout(10000),
      })
      const verification = await check.json() as { success?: boolean; action?: string; hostname?: string }
      if (!check.ok || verification.success !== true || verification.action !== 'keg-request' ||
          !allowed.includes((verification.hostname ?? '').toLowerCase())) {
        return { success: false, error: 'Security verification expired or failed. Please verify again and retry.' }
      }
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `keg-request/${data.requestId}`,
        },
        body: JSON.stringify({
          from: config.KEG_EMAIL_FROM, to: [recipient],
          subject: '777 Liquor - new keg pre-order inquiry',
          text: [
            'New keg pre-order inquiry from the website', `Request ID: ${data.requestId}`, '',
            `Customer: ${data.name}`, `Phone: ${data.phone}`, `Brand requested: ${data.brand}`,
            `Requested pickup schedule: ${data.pickupDay} morning`, '',
            'Customer notes:', data.notes || '(none)', '',
            'This is an inquiry, not a paid or confirmed order.',
            'Confirm availability, pickup date and price with the customer.',
            'Keg cost is due in advance. Pump rental is separate.',
          ].join('\n'),
        }),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        console.error('Keg email provider rejected request', response.status)
        return { success: false, error: 'Your request was not confirmed. Please retry or email 777liquorstorehi@gmail.com.' }
      }
      const email = await response.json() as { id?: string }
      if (!email.id) return { success: false, error: 'Could not confirm submission. Please retry or email the store.' }
      return { success: true, emailId: email.id }
    } catch {
      return { success: false, error: 'Could not confirm submission. Please retry; repeated attempts with unchanged details use the same request ID.' }
    }
  })
