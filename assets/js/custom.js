// Put your custom JS code here
console.log('=== CUSTOM JS LOADED ===');

// Prevent multiple executions with a more robust check
if (window.ocmSidebarToggleSetup) {
  console.log('OCM Sidebar toggle already setup, skipping...');
} else {
  window.ocmSidebarToggleSetup = true;
  
  // Function to setup the sidebar toggle
  function setupSidebarToggle() {
    console.log('=== Setting up OCM sidebar toggles ===');
    
    // Remove any existing listeners first
    if (window.ocmSidebarClickHandler) {
      document.removeEventListener('click', window.ocmSidebarClickHandler, true);
    }
    
    // Create the click handler
    window.ocmSidebarClickHandler = function(e) {
      // Check if clicked element is a docs-link in a summary
      if (e.target.classList.contains('docs-link')) {
        const closestSummary = e.target.closest('summary');
        if (closestSummary) {
          const link = e.target;
          const summary = closestSummary;
          const details = summary.closest('details');
          
          // Only handle links in the sidebar navigation
          if (details) {
            const sectionNav = details.closest('.section-nav');
            
            if (sectionNav) {
              console.log('Sidebar link clicked:', link.textContent);
              
              // Prevent default link behavior
              e.preventDefault();
              e.stopPropagation();
              
              // Toggle the details state
              details.open = !details.open;
              
              // Only navigate if it's a different page
              const currentPath = window.location.pathname;
              const linkPath = new URL(link.href).pathname;
              
              console.log('Current path:', currentPath);
              console.log('Link path:', linkPath);
              
              if (currentPath !== linkPath) {
                console.log('Different page - navigating...');
                console.log('Navigation start time:', new Date().getTime());
                // Immediate navigation - no delay needed
                window.location.href = link.href;
              } else {
                console.log('Same page - only toggling');
              }
            }
          }
        }
      }
    };
    
    // Add the event listener
    document.addEventListener('click', window.ocmSidebarClickHandler, true);
    console.log('OCM Event delegation setup complete');
  }
  
  // Setup when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSidebarToggle);
  } else {
    // DOM already loaded
    setupSidebarToggle();
  }
}
