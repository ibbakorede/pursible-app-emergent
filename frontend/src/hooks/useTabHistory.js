import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tabHistoryManager, TAB_KEYS } from '@/lib/TabHistoryManager';

const PATH_TO_TAB = {
  '/': TAB_KEYS.HOME,
  '/wallet': TAB_KEYS.WALLET,
  '/convert': TAB_KEYS.CONVERT,
  '/transactions': TAB_KEYS.TRANSACTIONS,
  '/profile': TAB_KEYS.PROFILE,
};

// Only the 5 main tab roots — sub-pages are handled by navigate(-1) in useBackGesture
const MAIN_TAB_PATHS = Object.keys(PATH_TO_TAB);

export function useTabHistory() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current tab from location
  const currentTab = Object.entries(PATH_TO_TAB).find(([path]) =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )?.[1] || TAB_KEYS.HOME;

  useEffect(() => {
    // Only track main tab roots — skip sub-pages to prevent stack accumulation
    if (!MAIN_TAB_PATHS.includes(location.pathname)) return;
    tabHistoryManager.setCurrentTab(currentTab);
    tabHistoryManager.pushPath(currentTab, location.pathname, location.state);
  }, [location.pathname, currentTab]);

  const switchTab = (tabKey) => {
    const stack = tabHistoryManager.getStack(tabKey);
    const path = stack.length > 0 ? stack[stack.length - 1].path : Object.entries(PATH_TO_TAB).find(([, t]) => t === tabKey)?.[0] || '/';
    navigate(path);
  };

  const goBack = () => {
    const stack = tabHistoryManager.getStack(currentTab);
    if (stack.length > 1) {
      stack.pop(); // Remove current
      const prevEntry = stack[stack.length - 1];
      // Use replace to prevent adding back entry to browser history
      navigate(prevEntry.path, { state: prevEntry.state, replace: true });
    }
  };

  return {
    currentTab,
    switchTab,
    goBack,
    stack: tabHistoryManager.getStack(currentTab),
  };
}