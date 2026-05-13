import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint } from 'lucide-react';

export default function BiometricPrompt({
  biometricUser,
  biometricLoading,
  biometricTypeName,
  onBiometricLogin,
  onUsePassword,
}) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
          <Fingerprint className="w-10 h-10 text-primary" />
        </div>
        <p className="text-sm text-gray-400 mb-6">{biometricUser}</p>

        <Button
          onClick={onBiometricLogin}
          disabled={biometricLoading}
          className="w-full rounded-xl h-13 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white text-base font-semibold mb-4 shadow-lg shadow-primary/25 transition-all duration-300"
        >
          {biometricLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Verifying...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 mr-2" /> Use {biometricTypeName}
            </>
          )}
        </Button>

        <button
          onClick={onUsePassword}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Use password instead
        </button>
      </div>
    </div>
  );
}
