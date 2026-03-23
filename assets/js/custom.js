// Custom JS for OCM website
// Necessity: Sidebar section links (<a> inside <summary>) need special click
// handling. Without this, clicking the link text toggles the <details> element
// instead of navigating to the section overview page. This uses event delegation
// so it works even when the script loads after DOM is ready (async bundle).

document.addEventListener('click', (e) => {
  const link = e.target.closest('.section-nav details > summary a.docs-link');
  if (link) {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = link.href;
  }
});
