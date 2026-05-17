import nodemailer from "nodemailer";

let _transport: nodemailer.Transporter | null = null;
function transport() {
  if (_transport) return _transport;
  _transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASS || "" },
    tls: { rejectUnauthorized: false },
  });
  return _transport;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}) {
  const from = opts.from || process.env.SMTP_FROM || "noreply@example.com";
  return transport().sendMail({
    from: `Ampera <${from}>`,
    to: Array.isArray(opts.to) ? opts.to.join(",") : opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
}

export function emailLayout(title: string, body: string, ctaUrl?: string, ctaLabel?: string) {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px;color:#111">
    <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#1D4ED8,#0EA5E9);padding:20px 24px;color:white">
        <div style="font-size:20px;font-weight:700">Ampera</div>
        <div style="font-size:13px;opacity:.9">${title}</div>
      </div>
      <div style="padding:24px;font-size:15px;line-height:1.55">${body}
        ${ctaUrl ? `<div style="margin-top:20px"><a href="${ctaUrl}" style="display:inline-block;background:#1D4ED8;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${ctaLabel || "Apri"}</a></div>` : ""}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px">Ampera - Il gestionale che ragiona come un elettricista</div>
    </div>
  </body></html>`;
}
