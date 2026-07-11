function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function normalizePayload(body = {}) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    subject: String(body.subject || '').trim(),
    message: String(body.message || '').trim(),
    company: String(body.company || '').trim(),
  };
}

function validatePayload(data) {
  if (data.company) throw createError('Invalid submission.');
  if (!data.name) throw createError('Please enter your name.');
  if (!data.email || !isValidEmail(data.email)) throw createError('Please enter a valid email.');
  if (!data.subject) throw createError('Please select a subject.');
  if (!data.message || data.message.length < 10) throw createError('Please enter a message (at least 10 characters).');
  if (data.message.length > 5000) throw createError('Message is too long.');
}

async function sendViaResend(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw createError('Contact form is not configured yet. Please call or email us directly.', 503);
  }

  const to = process.env.CONTACT_TO_EMAIL || 'info@twisteddfw.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'Twisted Website <onboarding@resend.dev>';

  const text = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Subject: ${data.subject}`,
    '',
    data.message,
  ].filter(Boolean).join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `Twisted Contact: ${data.subject}`,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createError(`Could not send message (${response.status}). ${detail}`, 502);
  }
}

async function handleContactSubmission(body) {
  const data = normalizePayload(body);
  validatePayload(data);
  await sendViaResend(data);
  return { ok: true, message: 'Thanks! Your message has been sent.' };
}

module.exports = {
  handleContactSubmission,
  normalizePayload,
  validatePayload,
};
