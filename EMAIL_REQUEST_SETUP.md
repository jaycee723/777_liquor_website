# Keg request email setup

Recipient: 777liquorstorehi@gmail.com (fixed server-side).
The existing keg modal imports KegRequestForm. Existing CSS and brand schedules are preserved.
The server also validates brand schedules; if you change the homepage schedule, update the
matching pickupSchedule in src/lib/api/keg-request.functions.ts at the same time.
No orders are confirmed or payments processed by this integration.

## Required configuration

In the Cloudflare Worker runtime variables/secrets:
- RESEND_API_KEY: secret, from a Resend account (sending-only API key).
- TURNSTILE_SECRET_KEY: secret, from a Cloudflare Turnstile Managed widget.
- KEG_EMAIL_FROM: variable, an authorized Resend sender.
- KEG_ALLOWED_HOSTNAMES: variable, exact comma-separated allowed hostnames, without schemes
  or paths. Example: 777liquor.com,www.777liquor.com
  Include the exact workers.dev hostname if testing there.

In Workers Builds build variables:
- VITE_TURNSTILE_SITE_KEY: the public site key for that widget. Rebuild after setting it.

Do NOT put secrets in GitHub or in VITE_ variables. Add the exact hostnames to the Turnstile
widget's allowlist too. If an externally configured CSP overrides the application's policy,
it must allow https://challenges.cloudflare.com in script-src and frame-src.

For an initial no-DNS test, create the Resend account with 777liquorstorehi@gmail.com and use
777 Liquor <onboarding@resend.dev> as KEG_EMAIL_FROM. The testing sender only sends to its
account owner's email. For production, verify an authorized sending domain separately.
Do not use gmail.com as a sending domain you can verify. No DNS changes are made by this code.

## Build and test

Use repository root /, build command npm run build, deploy command npx wrangler deploy.
For validation before a deployment, run:

```sh
npm install
npm run build
npx wrangler deploy --dry-run
```

The integration was reviewed structurally but not built or live-tested in the assistant's
network-restricted environment. Test a preview with matching runtime secrets and hostname
configuration first. A push to main may auto-deploy if Workers Builds is connected.

Verify a test request reaches Gmail (check spam), missing secrets do not show success,
provider failures show an error, expired verification can be retried, and repeated clicks
cannot send concurrently. The success screen means the provider accepted the message,
not guaranteed inbox delivery. Confirm delivery in Resend logs and the mailbox.

Requests use an idempotency key to reduce duplicate emails on retries with unchanged details.
A timeout can occur after provider acceptance; the UI says not confirmed and permits retry.
Refreshing/reopening the form or editing details generates a different ID. Watch for duplicates.
Turnstile is not a full rate limiter. Monitor quotas/abuse and add Worker rate limiting for
high-traffic use. No customer data or credentials are logged by the new handler.

For an unlisted brand without a scheduled pickup day, the form points customers to email;
it does not invent a Wednesday/Friday schedule.
