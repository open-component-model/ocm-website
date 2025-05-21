// Put your custom JS code here
// Funktion, die sowohl das Details-Element umschaltet als auch zur Seite navigiert
function toggleAndNavigate(event, url) {
  // Verhindere das Standard-Verhalten des Details-Elements
  event.preventDefault();
  
  // Finde das übergeordnete details-Element
  const detailsElement = event.currentTarget.closest('details');
  
  // Toggle das details-Element 
  if (detailsElement) {
    detailsElement.open = !detailsElement.open;
  }
  
  // Navigiere zur Seite (mit einer kleinen Verzögerung, um dem Toggle-Effekt Zeit zu geben)
  setTimeout(() => {
    window.location.href = url;
  }, 150);
}