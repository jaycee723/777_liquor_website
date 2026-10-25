import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEFAULT_RECIPIENTS = ["777liquorstorehi@gmail.com", "justin@777liquor.com"];
const SUBJECT_PREFIX = "[Keg Order]";

function parseRecipients(value: string | undefined): string[] {
  const list = (value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^[^\s@<>,]+@[^\s@<>,]+\.[^\s@<>,]+$/.test(v));
  return list.length ? list : DEFAULT_RECIPIENTS;
}
const pickupSchedule: Record<string, string> = {
  "Bud Light": "Wednesday",
  Budweiser: "Wednesday",
  "Michelob ULTRA": "Wednesday",
  Busch: "Wednesday",
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
  Pacifico: "Friday",
  "Dos Equis Lager": "Friday",
  Heineken: "Friday",
  Guinness: "Friday",
  Sapporo: "Friday",
  "Asahi Super Dry": "Friday",
  "KIRIN ICHIBAN": "Friday",
  "Pabst Blue Ribbon": "Friday",
  "Sierra Nevada Pale Ale": "Friday",
};
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Enter a valid phone number"),
  brand: z.string().trim().min(1).max(120),
  pickupDay: z.enum(["Wednesday", "Friday"]),
  notes: z.string().trim().max(2000),
  requestId: z.string().uuid(),
  turnstileToken: z.string().min(1).max(2048),
});

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  KEG_EMAIL_FROM?: string;
  KEG_EMAIL_TO?: string;
  TURNSTILE_SECRET_KEY?: string;
  KEG_ALLOWED_HOSTNAMES?: string;
};
type Result = { success: true; emailId: string } | { success: false; error: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getEmailConfig(): Promise<EmailEnvironment> {
  let cfEnv: Partial<EmailEnvironment> = {};
  try {
    const cf = await import("cloudflare:workers");
    cfEnv = (cf.env as unknown as EmailEnvironment) ?? {};
  } catch {
    // Non-workerd runtime (e.g. Node.js dev server, test runner)
  }

  const nodeEnv = typeof process !== "undefined" ? process.env : {};

  return {
    RESEND_API_KEY: cfEnv.RESEND_API_KEY || nodeEnv.RESEND_API_KEY,
    KEG_EMAIL_FROM: cfEnv.KEG_EMAIL_FROM || nodeEnv.KEG_EMAIL_FROM,
    KEG_EMAIL_TO: cfEnv.KEG_EMAIL_TO || nodeEnv.KEG_EMAIL_TO,
    TURNSTILE_SECRET_KEY: cfEnv.TURNSTILE_SECRET_KEY || nodeEnv.TURNSTILE_SECRET_KEY,
    KEG_ALLOWED_HOSTNAMES: cfEnv.KEG_ALLOWED_HOSTNAMES || nodeEnv.KEG_ALLOWED_HOSTNAMES,
  };
}

export const submitKegRequest = createServerFn({ method: "POST" })
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    if (
      !Object.prototype.hasOwnProperty.call(pickupSchedule, data.brand) ||
      pickupSchedule[data.brand] !== data.pickupDay
    ) {
      return {
        success: false,
        error:
          "Select a listed brand and its scheduled pickup day, or email the store for other brands.",
      };
    }

    const config = await getEmailConfig();
    const allowed = (config.KEG_ALLOWED_HOSTNAMES ?? "")
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    if (!config.RESEND_API_KEY || !config.KEG_EMAIL_FROM) {
      console.error("Missing required email configuration: RESEND_API_KEY or KEG_EMAIL_FROM");
      return {
        success: false,
        error:
          "Online requests are temporarily unavailable. Please email 777liquorstorehi@gmail.com.",
      };
    }

    if (config.TURNSTILE_SECRET_KEY) {
      try {
        const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: config.TURNSTILE_SECRET_KEY,
            response: data.turnstileToken,
          }),
          signal: AbortSignal.timeout(10000),
        });
        const verification = (await check.json()) as {
          success?: boolean;
          action?: string;
          hostname?: string;
        };

        const hostname = (verification.hostname ?? "").toLowerCase();
        const hostnameAllowed =
          allowed.length === 0 ||
          allowed.includes(hostname) ||
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname.endsWith(".run.app") ||
          hostname.endsWith(".workers.dev") ||
          hostname.endsWith(".pages.dev");

        if (
          !check.ok ||
          verification.success !== true ||
          verification.action !== "keg-request" ||
          !hostnameAllowed
        ) {
          console.warn("Turnstile validation failure:", verification);
          return {
            success: false,
            error: "Security verification expired or failed. Please verify again and retry.",
          };
        }
      } catch (error) {
        console.error("Turnstile verification error:", error);
        return {
          success: false,
          error: "Security verification could not be completed. Please retry.",
        };
      }
    }

    const recipients = parseRecipients(config.KEG_EMAIL_TO);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `keg-request/${data.requestId}`,
        },
        body: JSON.stringify({
          from: config.KEG_EMAIL_FROM,
          to: recipients,
          subject: `${SUBJECT_PREFIX} 777 Liquor - new keg pre-order inquiry: ${data.brand}`,
          text: [
            "New keg pre-order inquiry from the website",
            `Request ID: ${data.requestId}`,
            "",
            `Customer: ${data.name}`,
            `Phone: ${data.phone}`,
            `Brand requested: ${data.brand}`,
            `Requested pickup schedule: ${data.pickupDay} morning`,
            "",
            "Customer notes:",
            data.notes || "(none)",
            "",
            "This is an inquiry, not a paid or confirmed order.",
            "Confirm availability, pickup date and price with the customer.",
            "Keg cost is due in advance. Pump rental is separate.",
          ].join("\n"),
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; color: #111; line-height: 1.5; padding: 20px;">
              <h2 style="color: #12494a; margin-top: 0; padding-bottom: 8px; border-bottom: 2px solid #2a8f8f;">
                New Keg Pre-Order Inquiry
              </h2>
              <p style="font-size: 15px; color: #444;">
                A customer submitted a keg pre-order inquiry through the 777 Liquor website.
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7; width: 160px;">Customer Name</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7;">${escapeHtml(data.name)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7;">Phone Number</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7;"><a href="tel:${escapeHtml(data.phone)}" style="color: #12494a; font-weight: 600;">${escapeHtml(data.phone)}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7;">Brand Requested</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7;"><strong style="font-size: 15px; color: #12494a;">${escapeHtml(data.brand)}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7;">Pickup Schedule</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7;">${escapeHtml(data.pickupDay)} morning</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7;">Customer Notes</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7;">${escapeHtml(data.notes || "(none)")}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: 600; background: #f7f9f9; border: 1px solid #e1e7e7;">Request ID</td>
                  <td style="padding: 10px; border: 1px solid #e1e7e7; font-family: monospace; font-size: 12px; color: #666;">${escapeHtml(data.requestId)}</td>
                </tr>
              </table>
              <div style="background: #f0f7f7; border-left: 4px solid #12494a; padding: 12px 16px; margin-top: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #333;">
                  <strong>Order Policy:</strong> This is an inquiry, not a paid or confirmed order. Confirm availability, pickup date and pricing with the customer. Full keg cost is due in advance. Pump rental is separate and must be returned after use.
                </p>
              </div>
            </div>
          `,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Resend API rejected email request:", response.status, errorText);
        return {
          success: false,
          error:
            "Your request was not confirmed. Please retry or email 777liquorstorehi@gmail.com.",
        };
      }

      const email = (await response.json()) as { id?: string };
      if (!email.id) {
        console.error("Resend API returned response without email id");
        return {
          success: false,
          error: "Could not confirm submission. Please retry or email the store.",
        };
      }

      return { success: true, emailId: email.id };
    } catch (error) {
      console.error("Failed to send keg request email via Resend:", error);
      return {
        success: false,
        error:
          "Could not confirm submission. Please retry; repeated attempts with unchanged details use the same request ID.",
      };
    }
  });
