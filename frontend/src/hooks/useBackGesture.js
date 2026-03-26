import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/hooks/useTabHistory';

// Only the 5 main tab roots — everything else is a sub-page
const MAIN_TAB_PATHS = ['/', '/wallet', '/convert', '/transactions', '/profile'];

export function useBackGesture() {
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack, stack } = useTabHistory();
  const lastBackTimeRef = useRef(0);

  useEffect(() => {
    const isSubPage = !MAIN_TAB_PATHS.includes(location.pathname);

    const handleBack = () => {
      // Debounce guard: popstate and Capacitor backButton can both fire for
      // the same hardware back press on Android — ignore the second within 300ms
      const now = Date.now();
      if (now - lastBackTimeRef.current < 300) return;
      lastBackTimeRef.current = now;

      if (isSubPage) {
        // Sub-pages: use browser history — one press goes back to previous page
        navigate(-1);
      } else if (stack && stack.length > 1) {
        // Main tabs: use independent per-tab history stack
        goBack();
      }
    };

    window.addEventListener('popstate', handleBack);

    if (window.Capacitor) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('backButton', handleBack);
      }).catch(() => {
        // Silently fail if Capacitor not available (web environment)
      });
    }

    return () => {
      window.removeEventListener('popstate', handleBack);
    };
  }, [goBack, stack, navigate, location.pathname]);
}