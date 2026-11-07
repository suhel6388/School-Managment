import nodemailer, { type Transporter } from "nodemailer";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user ? { user, pass: pass ?? "" } : undefined,
  });
  return transporter;
}

/**
 * Sends transactional email. Authentication emails (verification, password
 * reset) must never be silently dropped, so production throws when SMTP is
 * not configured. In development the message (including the action link) is
 * written to the server log so the flow can be tested without a mail server.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const from = process.env.BETTER_AUTH_EMAIL_FROM ?? "ICE School Manager <no-reply@localhost>";

  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and BETTER_AUTH_EMAIL_FROM.",
      );
    }
    console.info(
      [
        "[mail:dev] SMTP is not configured; printing the message instead.",
        `To: ${message.to}`,
        `From: ${from}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
      ].join("\n"),
    );
    return;
  }

  await getTransporter().sendMail({
    from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
