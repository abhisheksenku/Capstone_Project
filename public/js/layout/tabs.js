/* ============================================================================
   FIN-GUARD TAB SYSTEM
   Handles tab switching inside views (Overview, Analytics, etc.)
============================================================================ */

/**
 * Initializes tab behavior for all `.tab-btn` elements.
 * Expected HTML:
 *  - Button with class `tab-btn`
 *  - data-target="tab-id"
 *  - Content panels with class `tab-content` and matching IDs
 */
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  if (!tabButtons.length || !tabContents.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      if (!targetId) return;

      // Deactivate all tabs
      tabButtons.forEach((b) => b.classList.remove("active"));

      // Hide all tab panels
      tabContents.forEach((c) => c.classList.add("hidden"));

      // Activate clicked tab
      btn.classList.add("active");

      // Show matching panel
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.remove("hidden");
      }
    });
  });
}

export {
  initTabs,
};
