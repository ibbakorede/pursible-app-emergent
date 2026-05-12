/**
 * Dynamically adjusts Android status bar color to match theme (dark/light)
 * Uses Capacitor's StatusBar plugin for native Android devices
 */

export function initAndroidStatusBar() {
  // Check if Capacitor is available and has StatusBar plugin
  if (typeof window === 'undefined' || !window.Capacitor?.Plugins?.StatusBar) {
    return;
  }

  const StatusBar = window.Capacitor.Plugins.StatusBar;

  const updateStatusBar = (isDark) => {
    try {
      if (isDark) {
        // Dark theme: light status bar with dark background
        StatusBar.setBackgroundColor({ color: '#0D0D0D' }); // --background: 0 0% 5%
        StatusBar.setStyle({ style: 'LIGHT' });
      } else {
        // Light theme: dark status bar with light background
        StatusBar.setBackgroundColor({ color: '#F2F2F2' }); // Light fallback
        StatusBar.setStyle({ style: 'DARK' });
      }
    } catch (e) {
      // StatusBar plugin methods not available on this platform
      console.debug('StatusBar update unavailable:', e.message);
    }
  };

  // Check initial theme preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  updateStatusBar(prefersDark);

  // Listen for theme changes
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleThemeChange = (e) => {
    updateStatusBar(e.matches);
  };
  darkModeQuery.addEventListener('change', handleThemeChange);

  // Also watch for class changes on document root
  const handleMutation = () => {
    const isDark = document.documentElement.classList.contains('dark');
    updateStatusBar(isDark);
  };
  
  const observer = new MutationObserver(handleMutation);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  return () => {
    darkModeQuery.removeEventListener('change', handleThemeChange);
    observer.disconnect();
  };
}