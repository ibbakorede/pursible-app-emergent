/**
 * RateExpiryBadge - Countdown timer for rate expiry
 */
import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

export default function RateExpiryBadge({ 
  expirySeconds = 60, 
  onExpire 
}) {
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  
  const resetTimer = useCallback(() => {
    setSecondsLeft(expirySeconds);
  }, [expirySeconds]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Timer expired - refetch rates and reset
          if (onExpire) {
            onExpire();
          }
          return expirySeconds;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expirySeconds, onExpire]);
  
  // Format seconds to M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div 
      className="flex items-center gap-3"
      style={{
        background: 'rgba(239,159,39,0.08)',
        border: '0.5px solid rgba(239,159,39,0.3)',
        borderRadius: '12px',
        padding: '10px 14px'
      }}
      data-testid="rate-expiry-badge"
    >
      <Clock 
        className="w-5 h-5 flex-shrink-0" 
        style={{ color: '#FAC775' }} 
      />
      <div className="flex flex-col">
        <span 
          className="text-sm font-semibold"
          style={{ color: '#FAC775' }}
        >
          Rate expires in {formatTime(secondsLeft)}
        </span>
        <span 
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Confirm now to lock this rate
        </span>
      </div>
    </div>
  );
}
