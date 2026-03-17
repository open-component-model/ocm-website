/**
 * Schema Reference — collapse/expand + anchor navigation
 *
 * Loaded conditionally on pages that use the {{< json-schema >}} shortcode
 * via the .Page.Store "hasSchemaReference" flag (see baseof.html).
 */
(function () {
  // Toggle direct children visibility when a +/- button is clicked
  document.querySelectorAll('.ocm-schema-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-schema-toggle');
      var isExpanded = btn.classList.contains('ocm-schema-expanded');
      var rows = document.querySelectorAll('[data-schema-parent="' + targetId + '"]');

      if (isExpanded) {
        hideDescendants(targetId);
        btn.classList.remove('ocm-schema-expanded');
        btn.querySelector('.ocm-schema-toggle-icon').textContent = '+';
      } else {
        rows.forEach(function (row) { row.style.display = ''; });
        btn.classList.add('ocm-schema-expanded');
        btn.querySelector('.ocm-schema-toggle-icon').textContent = '\u2212';
      }
    });
  });

  function hideDescendants(parentId) {
    var children = document.querySelectorAll('[data-schema-parent="' + parentId + '"]');
    children.forEach(function (row) {
      row.style.display = 'none';
      var childBtn = row.querySelector('.ocm-schema-toggle.ocm-schema-expanded');
      if (childBtn) {
        childBtn.classList.remove('ocm-schema-expanded');
        childBtn.querySelector('.ocm-schema-toggle-icon').textContent = '+';
      }
      var childId = row.getAttribute('data-schema-id');
      if (childId) hideDescendants(childId);
    });
  }

  // Expand a row and all its ancestors so it becomes visible
  function expandToRow(row) {
    var parentId = row.getAttribute('data-schema-parent');
    if (!parentId) return;
    var parentRow = document.querySelector('[data-schema-id="' + parentId + '"]');
    if (!parentRow) return;
    // Recurse up first
    expandToRow(parentRow);
    // Expand the parent
    var btn = parentRow.querySelector('.ocm-schema-toggle');
    if (btn && !btn.classList.contains('ocm-schema-expanded')) {
      var directChildren = document.querySelectorAll('[data-schema-parent="' + parentId + '"]');
      directChildren.forEach(function (r) { r.style.display = ''; });
      btn.classList.add('ocm-schema-expanded');
      btn.querySelector('.ocm-schema-toggle-icon').textContent = '\u2212';
    }
  }

  // Navigate to a field by hash: expand ancestors, scroll, highlight
  function navigateToHash() {
    var hash = window.location.hash.replace('#', '');
    if (!hash) return;
    var target = document.getElementById(hash);
    if (!target || !target.classList.contains('ocm-schema-field-row')) return;
    expandToRow(target);
    target.style.display = '';
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('ocm-schema-highlight');
    setTimeout(function () { target.classList.remove('ocm-schema-highlight'); }, 2000);
  }

  // Initial state: depth > 0 rows with collapsed parents are hidden
  document.querySelectorAll('.ocm-schema-field-row[data-schema-parent]').forEach(function (row) {
    var parentId = row.getAttribute('data-schema-parent');
    var parentRow = document.querySelector('[data-schema-id="' + parentId + '"]');
    if (parentRow) {
      var parentBtn = parentRow.querySelector('.ocm-schema-toggle');
      if (parentBtn && !parentBtn.classList.contains('ocm-schema-expanded')) {
        row.style.display = 'none';
      }
    }
  });

  // Handle initial hash and hash changes
  navigateToHash();
  window.addEventListener('hashchange', navigateToHash);
})();
