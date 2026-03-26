import { CURRENCIES } from '@/lib/currencies';

// SVG logos for cryptocurrencies
const USDCLogo = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2775CA"/>
    <path d="M20.5 18.5c0-2-1.2-2.7-3.5-3-1.7-.3-2-.7-2-1.5s.5-1.3 1.5-1.3c.9 0 1.4.3 1.6 1.1.1.2.2.3.4.3h1c.2 0 .4-.2.3-.4-.2-1.2-1-2.1-2.3-2.4v-1.5c0-.2-.2-.4-.5-.4h-.9c-.2 0-.4.2-.4.4v1.4c-1.6.3-2.6 1.4-2.6 2.8 0 1.9 1.2 2.6 3.5 2.9 1.6.3 2 .8 2 1.6 0 .8-.7 1.4-1.7 1.4-1.3 0-1.8-.5-2-1.4 0-.2-.2-.3-.4-.3h-1c-.2 0-.4.2-.4.4.2 1.5 1.2 2.4 2.9 2.7v1.5c0 .2.2.4.4.4h1c.2 0 .4-.2.4-.4v-1.5c1.7-.3 2.7-1.4 2.7-3z" fill="#fff"/>
  </svg>
);

const USDTLogo = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#26A17B"/>
    <path d="M17.9 17.1v-.1c-.1 0-.8-.1-2-.1s-1.8.1-2 .1v.1c-3.5.2-6.1.8-6.1 1.6 0 .8 2.6 1.4 6.1 1.6v5.1h3.9v-5.1c3.5-.2 6.1-.8 6.1-1.6.1-.8-2.5-1.4-6-1.6zm-2 2.6c-3.8 0-6.9-.6-6.9-1.3s3.1-1.3 6.9-1.3 6.9.6 6.9 1.3-3.1 1.3-6.9 1.3z" fill="#fff"/>
    <path d="M17.9 14.3v-2.7h5.4V8.1H8.6v3.5H14v2.7c-4 .2-7 .9-7 1.9 0 1 3 1.7 7 1.9v.1h3.9v-.1c4-.2 7-.9 7-1.9 0-1-3-1.8-7-1.9z" fill="#fff"/>
  </svg>
);

const USFlag = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F0F0F0"/>
    <g clipPath="url(#us-clip)">
      <rect y="0" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="4.92" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="9.85" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="14.77" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="19.69" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="24.62" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="29.54" width="32" height="2.46" fill="#BD3D44"/>
      <rect y="2.46" width="32" height="2.46" fill="#fff"/>
      <rect y="7.38" width="32" height="2.46" fill="#fff"/>
      <rect y="12.31" width="32" height="2.46" fill="#fff"/>
      <rect y="17.23" width="32" height="2.46" fill="#fff"/>
      <rect y="22.15" width="32" height="2.46" fill="#fff"/>
      <rect y="27.08" width="32" height="2.46" fill="#fff"/>
      <rect width="14" height="17" fill="#192F5D"/>
    </g>
    <defs><clipPath id="us-clip"><circle cx="16" cy="16" r="16"/></clipPath></defs>
  </svg>
);

const NigeriaFlag = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F0F0F0"/>
    <g clipPath="url(#ng-clip)">
      <rect width="10.67" height="32" fill="#008751"/>
      <rect x="10.67" width="10.67" height="32" fill="#fff"/>
      <rect x="21.33" width="10.67" height="32" fill="#008751"/>
    </g>
    <defs><clipPath id="ng-clip"><circle cx="16" cy="16" r="16"/></clipPath></defs>
  </svg>
);

export default function CurrencyIcon({ currency, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const c = CURRENCIES[currency];

  const logos = {
    USD: <USFlag className={sizes[size]} />,
    USDC: <USDCLogo className={sizes[size]} />,
    USDT: <USDTLogo className={sizes[size]} />,
    NGN: <NigeriaFlag className={sizes[size]} />,
  };

  if (logos[currency]) {
    return <div className="flex-shrink-0">{logos[currency]}</div>;
  }

  return (
    <div className={`${sizes[size]} rounded-full ${c?.bg || 'bg-slate-100'} ${c?.color || 'text-slate-600'} flex items-center justify-center flex-shrink-0`}>
      <span className="text-sm font-bold">{currency?.[0]}</span>
    </div>
  );
}