# Haptic Feedback Integration Guide

## Overview
Haptic feedback has been integrated throughout the app for key user interactions, automatically respecting system-wide haptic settings on iOS and Android.

---

## 1. How It Works

### System-Level Integration
- **Capacitor Haptics API**: Uses `@capacitor/haptics` for native haptic feedback
- **Automatic System Respect**: iOS/Android automatically honor device haptic settings
- **No Additional Permissions**: Works seamlessly with system preferences
- **Web Fallback**: Silently fails on web—no errors or disruptions

### Haptics Manager
The `lib/haptics.js` module provides:
- Centralized control: `setHapticsEnabled(bool)` and `areHapticsEnabled()`
- Pattern variations: light, medium, heavy impacts + notifications
- Custom patterns: confirmation (double tap), errors
- Safe defaults: All functions silently fail if haptics unavailable

---

## 2. Implemented Interactions

### ✅ Transactions
**Pages**: `WithdrawNGN`, `ConvertFunds`
- **Light haptic** on "Continue" buttons (navigation)
- **Confirmation haptic** on final transaction submit
- **Success notification** on completion

```javascript
import { useHaptics } from '@/hooks/useHaptics';

const { confirm: confirmHaptic, light: lightHaptic } = useHaptics();

// On Continue button
onClick={() => {
  lightHaptic();
  setStep('confirm');
}}

// On final submit
onClick={() => {
  confirmHaptic();
  submitTransaction();
}}
```

### ✅ Pull-to-Refresh
**Hook**: `hooks/usePullToRefresh.jsx`
- **Medium haptic** when user reaches refresh threshold
- **Success notification** on refresh completion

Haptic feedback triggers at 80px pull distance, providing tactile confirmation before release:
```javascript
if (distance > threshold && !hapticTriggeredRef.current) {
  triggerHaptic('medium');
  hapticTriggeredRef.current = true;
}
```

### ✅ Toggle Switches
**Component**: `components/ui/switch`
- **Selection haptic** on every toggle
- **Natural feedback**: Matches iOS/Android native behavior

```javascript
const handleCheckedChange = (checked) => {
  triggerSelection(); // Light, quick haptic
  onCheckedChange?.(checked);
};
```

### ✅ Currency Swaps
**Page**: `ConvertFunds`
- **Medium haptic** on swap button click
- **Confirmation haptic** on final conversion

```javascript
const swapCurrencies = () => {
  mediumHaptic();
  // ... swap logic
};
```

---

## 3. Haptic Patterns Reference

| Pattern | Use Case | API |
|---------|----------|-----|
| **Light** | Navigation, simple actions | `triggerHaptic('light')` |
| **Medium** | Confirmations, threshold reached | `triggerHaptic('medium')` |
| **Heavy** | Important confirmations | `triggerHaptic('heavy')` |
| **Selection** | Toggle/switch changes | `triggerSelection()` |
| **Success** | Transaction complete | `triggerNotification('success')` |
| **Warning** | Alerts, cautions | `triggerNotification('warning')` |
| **Error** | Failures, validation errors | `triggerNotification('error')` |
| **Confirm** | Double-tap pattern | `triggerConfirmation()` (2× medium) |

---

## 4. Using Haptics in Components

### Basic Setup
```javascript
import { useHaptics } from '@/hooks/useHaptics';

export default function MyComponent() {
  const { light, medium, confirm, success } = useHaptics();

  return (
    <button onClick={() => { light(); /* action */ }}>
      Click Me
    </button>
  );
}
```

### With Async Operations
```javascript
const handleSubmit = async () => {
  confirm(); // Preview haptic
  try {
    await submitForm();
    success(); // Success feedback
  } catch (err) {
    errorHaptic(); // Error feedback
  }
};
```

### Conditional (if needed)
```javascript
import { areHapticsEnabled, setHapticsEnabled } from '@/lib/haptics';

if (areHapticsEnabled()) {
  light(); // Only trigger if enabled
}
```

---

## 5. System Preferences

### User Control
Users can disable haptics globally:
- **iOS**: Settings → Sounds & Haptics → Haptic Strength (Silent mode also disables)
- **Android**: Settings → Vibration (toggle per app or system-wide)

### App Behavior
- ✅ Respects system settings automatically
- ✅ Works with silent mode on iOS
- ✅ No additional permissions needed
- ✅ No user preferences in-app required

---

## 6. Testing Haptic Feedback

### Physical Device Testing
1. **iOS**: Remove from Silent mode, enable Haptic Strength
2. **Android**: Ensure vibration is enabled in settings
3. Test each interaction type

### Verification Checklist
- [ ] Buttons produce haptic on tap
- [ ] Swaps trigger medium haptic
- [ ] Switches trigger light selection haptic
- [ ] Pull-to-refresh triggers at threshold
- [ ] Transaction completion triggers success feedback
- [ ] Works with system haptics disabled (silent mode)

---

## 7. Performance Notes

### Optimization
- Haptic triggers are **non-blocking** (async but fire-and-forget)
- No performance impact even on older devices
- Gracefully degrades on web/unsupported environments
- Ref tracking prevents duplicate haptics in rapid sequences

### Best Practices
1. **Don't overuse**: 1-2 haptics per interaction max
2. **Match pattern to action**: Light for navigation, medium for confirmations
3. **User gesture only**: Never trigger without user action
4. **Async safe**: Use haptics before/after async operations freely

---

## 8. Current Implementation Status

### ✅ Complete
- Core haptics library with system respect
- Pull-to-refresh haptic feedback
- Toggle switch haptics
- Transaction confirmation haptics
- Currency swap haptics
- Error/success notifications

### Future Enhancements
- Advanced haptic patterns (vibrato, intensity curves)
- Haptic preferences modal (optional in-app toggle)
- Analytics on haptic interaction completion rates

---

## 9. Troubleshooting

| Issue | Solution |
|-------|----------|
| No haptic feedback | Check device settings, ensure haptic strength enabled |
| Duplicate haptics | System already tracks—no code changes needed |
| Haptics on web preview | Expected—Capacitor unavailable in browser |
| Performance degradation | Not caused by haptics—verify other code |

---

## 10. API Reference

### `lib/haptics.js`
```javascript
// Impact patterns
triggerHaptic('light' | 'medium' | 'heavy')

// Notifications
triggerNotification('success' | 'warning' | 'error')

// Selection feedback
triggerSelection()

// Custom patterns
triggerConfirmation() // Double medium tap
triggerError() // Single heavy

// Control
setHapticsEnabled(boolean)
areHapticsEnabled() => boolean
initHaptics() => Promise<boolean>
```

### `hooks/useHaptics.js`
```javascript
const {
  light,      // () => void
  medium,     // () => void
  heavy,      // () => void
  success,    // () => void
  warning,    // () => void
  error,      // () => void
  selection,  // () => void
  confirm,    // () => void
  errorHaptic // () => void
} = useHaptics();
```

---

## Summary

Haptic feedback is now deeply integrated into key user interactions—transactions, navigation, switches, and refresh actions—while automatically respecting system-wide haptic settings. The implementation is performant, accessible, and enhances the native mobile experience without requiring any user configuration.