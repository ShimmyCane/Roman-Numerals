// Shared by every page: the look (stylesheet) and remembering the chosen look between pages.
// Only the look name is stored, on this device, in localStorage. Nothing about students is stored.
(function () {
  const LOOKS = ['sunny', 'candy', 'folder', 'garden', 'poster'];
  const KEY = 'romanLook';

  function savedLook() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function saveLook(name) {
    try {
      localStorage.setItem(KEY, name);
    } catch (e) {
      // Private windows can block storage. The look still works for this page.
    }
  }

  // Swaps the look stylesheet and marks the matching settings button.
  function applyLook(name) {
    if (!LOOKS.includes(name)) name = 'sunny';
    const link = document.getElementById('look-css');
    if (link) link.href = `looks/${name}.css`;
    document.querySelectorAll('[data-look]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.look === name)));
    saveLook(name);
    return name;
  }

  window.RomanShared = { LOOKS, savedLook, applyLook };
})();
