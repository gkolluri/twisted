(function () {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('contact-form-status');
  if (!form || !statusEl) return;

  const submitBtn = form.querySelector('button[type="submit"]');

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `contact-form-status contact-form-status--${type}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('', 'idle');

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      company: formData.get('company'),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setStatus('Sending your message…', 'pending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Could not send message. Please try calling us.');
      }

      form.reset();
      setStatus(data.message || 'Thanks! Your message has been sent.', 'success');
    } catch (err) {
      setStatus(err.message || 'Something went wrong. Please call or email us directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
})();
