// Handle sidebar toggle and navigation
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.section-nav details summary').forEach(summary => {
    summary.addEventListener('click', function(e) {
      // Get the link URL from the span
      const span = this.querySelector('.docs-link');
      const href = span.dataset.href;
      
      // Let the details element toggle first
      setTimeout(() => {
        window.location.href = href;
      }, 0);
    });
  });
});
