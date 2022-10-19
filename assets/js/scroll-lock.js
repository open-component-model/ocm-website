// Adds scroll position lock for default docs sidebar
if (document.querySelector('#docs-sidebar') !== null) {
  let sidebar = document.getElementById('docs-sidebar');

  let pos = sessionStorage.getItem('sidebar-scroll');
  if (pos !== null) {
      sidebar.scrollTop = parseInt(pos, 10);
  }

  window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('sidebar-scroll', sidebar.scrollTop);
  });
}
