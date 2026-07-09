(function () {
  function trackClick(label, url, type) {
    if (typeof gtag !== 'function') return;
    gtag('event', 'links_button_click', {
      button_label: label,
      button_url: url,
      button_type: type,
      page_path: '/links',
    });
  }

  function labelFromLink(link) {
    const labelEl = link.querySelector('.links-btn-label');
    return (labelEl || link).textContent.trim();
  }

  document.addEventListener('click', (event) => {
    const stackLink = event.target.closest('.links-stack a');
    if (stackLink) {
      const type = stackLink.classList.contains('links-btn--primary') ? 'menu' : 'social';
      trackClick(labelFromLink(stackLink), stackLink.href, type);
      return;
    }

    const footerLink = event.target.closest('.links-page-footer a');
    if (footerLink) {
      const type = footerLink.href.startsWith('tel:') ? 'footer_phone' : 'footer_website';
      trackClick(footerLink.textContent.trim(), footerLink.href, type);
    }
  });
})();
