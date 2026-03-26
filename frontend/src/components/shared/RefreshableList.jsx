import { useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

export default function RefreshableList({ queryKey, children }) {
  const queryClient = useQueryClient();
  const { isPulling, pullProgress } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey });
  });

  return (
    <div className="relative">
      {isPulling && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"
          style={{ opacity: Math.min(pullProgress / 80, 1) }}
        >
          <div 
            className="w-4 h-4 rounded-full border-2 border-transparent border-t-primary animate-spin"
            style={{ animationPlayState: isPulling ? 'running' : 'paused' }}
          />
        </div>
      )}
      {children}
    </div>
  );
}