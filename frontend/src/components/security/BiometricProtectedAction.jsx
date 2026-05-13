import { useCallback } from 'react';
import BiometricLockModal from './BiometricLockModal';
import { useBiometricLock } from '@/hooks/useBiometricLock';

export default function BiometricProtectedAction({ 
  children, 
  onAction,
  operationName = 'Complete this operation'
}) {
  const {
    showBiometricModal,
    setShowBiometricModal,
    checkBiometricAuth,
    handleBiometricSuccess,
  } = useBiometricLock();

  const handleActionWithBiometric = useCallback(async (...args) => {
    const canProceed = await checkBiometricAuth({
      callback: () => onAction?.(...args),
      operationName
    });

    if (canProceed && onAction) {
      onAction(...args);
    }
  }, [checkBiometricAuth, onAction, operationName]);

  // If children is a function, pass the protected handler
  if (typeof children === 'function') {
    return (
      <>
        {children(handleActionWithBiometric)}
        <BiometricLockModal
          open={showBiometricModal}
          onClose={() => setShowBiometricModal(false)}
          onSuccess={handleBiometricSuccess}
          operationName={operationName}
        />
      </>
    );
  }

  return (
    <>
      {children}
      <BiometricLockModal
        open={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleBiometricSuccess}
        operationName={operationName}
      />
    </>
  );
}