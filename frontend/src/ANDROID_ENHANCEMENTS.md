# Android Mobile App Enhancements

## Overview
Comprehensive Android-optimized features ensuring smooth UX, seamless navigation, and native-like interactions.

---

## 1. Independent Tab History Stacks

Each bottom navigation tab maintains its own independent history stack, preserving user navigation state when switching tabs.

### Implementation
- **File**: `lib/TabHistoryManager.js`
- **Hook**: `hooks/useTabHistory.js`
- **Usage**: Automatically integrated in `UserLayout`

### How It Works
```jsx
const { currentTab, switchTab, goBack, stack } = useTabHistory();
// Automatically manages separate history per tab
// goBack() navigates within current tab's stack only
```

### Benefits
- Switch tabs without losing scroll position or form state
- Independent back navigation per tab
- Smooth tab-to-tab transitions

---

## 2. Android Hardware Back Button Handler

Intercepts Android hardware back button and integrates with TabHistoryManager for proper navigation behavior.

### Implementation
- **File**: `hooks/useBackGesture.js`
- **Integrated in**: `UserLayout`

### How It Works
```jsx
useBackGesture(); // Automatically hooked up in UserLayout
// - Listens for popstate and Capacitor back button events
// - Uses goBack() for in-tab navigation
// - Falls back to browser navigation if no more history
```

### Behavior
1. If user is deep in a tab stack → navigate back within tab
2. If user is at root of tab → go to previous tab (if applicable)
3. If at app root → trigger exit confirmation (prevents accidental closes)

### Native Integration
Supports both:
- Web `popstate` events
- Capacitor/Cordova native back button events

---

## 3. Mobile-Friendly Bottom Sheet Selects

Replaced all standard HTML `<select>` and dropdown menus with native-feeling bottom sheet components optimized for touch interactions.

### Component
- **File**: `components/shared/BottomSheetSelect.jsx`
- **Framework**: Framer Motion + Radix UI

### Features
- **Swipe-to-dismiss**: Users can swipe down to close
- **Full-screen options**: No cramped dropdowns on small screens
- **Touch-optimized**: Large hit areas, easy to tap
- **Searchable**: Auto-searches when >5 options available
- **Smooth animations**: Spring-based transitions (25ms damping)

### Usage
```jsx
<BottomSheetSelect
  open={isOpen}
  onOpenChange={setIsOpen}
  value={selectedValue}
  onValueChange={(value) => setSelected(value)}
  placeholder="Choose option"
  searchPlaceholder="Search..."
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
  ]}
  renderOption={(opt) => <span>{opt.label}</span>}
>
  {/* Trigger element */}
  <Input readOnly value={selected} />
</BottomSheetSelect>
```

### Refactored Pages
- **pages/BankAccounts.jsx**: Bank selection now uses bottom sheet
- **pages/WithdrawNGN.jsx**: Bank selection in withdrawal flow now uses bottom sheet

### Accessibility
- Keyboard support (Enter/Escape)
- Touch-friendly animations
- Clear visual feedback on selection

---

## 4. Optimistic UI Updates with React Query

All financial transactions (convert, withdraw, deposit) implement optimistic updates using `onMutate` hooks.

### Pattern
```jsx
const mutation = useMutation({
  mutationFn: async () => { /* API call */ },
  onMutate: async () => {
    // 1. Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey });
    
    // 2. Save previous data for rollback
    const previousData = queryClient.getQueryData(queryKey);
    
    // 3. Update UI optimistically
    queryClient.setQueryData(queryKey, optimisticData);
    
    return { previousData };
  },
  onSuccess: () => {
    // Revalidate with server data
    queryClient.invalidateQueries({ queryKey });
  },
  onError: (err, vars, context) => {
    // Rollback on error
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  },
});
```

### Affected Operations
- **Convert**: Wallet balance updates immediately
- **Withdraw**: NGN balance deducts instantly
- **Deposit**: Wallet balance updates with pending status

### Benefits
- Zero perceived latency
- Smooth user experience
- Automatic error recovery
- No spinner delays

---

## 5. Route Memoization for Animation Performance

All route components are wrapped in `React.memo` to prevent unnecessary re-renders during Framer Motion animations.

### Implementation
- **File**: `components/shared/MemoizedRoute.jsx`
- **Usage in App.jsx**: All routes use memoized components

```jsx
const MemoHome = memoizeRoute(Home);
<Route path="/" element={<MemoHome />} />
```

### Benefits
- Prevents jank during slide-in/slide-out animations
- Maintains 60fps transition smoothness
- Reduces memory usage and CPU load
- Especially important on lower-end Android devices

---

## Safe Area Insets

All layouts respect device safe areas (notches, rounded corners, etc.).

### Implementation
- **CSS**: `index.css` - Sets `padding-bottom: env(safe-area-inset-bottom)`
- **Tailwind**: `tailwind.config.js` - Defines safe spacing utilities
- **Usage**: `pb-safe` class on nav elements

---

## Complete Feature Stack

| Feature | File | Status |
|---------|------|--------|
| Tab History | `lib/TabHistoryManager.js` | ✅ Active |
| Back Gesture Handler | `hooks/useBackGesture.js` | ✅ Active |
| Bottom Sheet Selects | `components/shared/BottomSheetSelect.jsx` | ✅ Active |
| Optimistic Updates | `pages/*.jsx` (mutations) | ✅ Active |
| Route Memoization | `components/shared/MemoizedRoute.jsx` | ✅ Active |
| Safe Area Support | `index.css` + `tailwind.config.js` | ✅ Active |

---

## Testing Checklist

- [ ] Test hardware back button on Android device
- [ ] Switch between tabs and verify history state preservation
- [ ] Test withdraw/convert flows with network delay
- [ ] Verify bank selection bottom sheet on small screens
- [ ] Check smooth 60fps animations on Pixel 4a (reference device)
- [ ] Test notch/safe area rendering
- [ ] Verify pull-to-refresh functionality
- [ ] Test form state preservation across tab switches

---

## Performance Targets

- **Tab Switch**: <100ms (instant)
- **Animation FPS**: 60fps (no drops)
- **Mutation Feedback**: 0ms perceived latency (optimistic)
- **Bundle Size**: No significant increase from bottom sheet refactor

---

## Future Enhancements

- [ ] Haptic feedback on button taps (Capacitor)
- [ ] Native app badge notifications
- [ ] Offline transaction queueing
- [ ] Advanced gesture navigation (swipe left/right for tab switching)