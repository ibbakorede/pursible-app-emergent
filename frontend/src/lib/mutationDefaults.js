import { toast } from 'sonner';

/**
 * Default mutation configuration ensuring optimistic updates properly roll back on failure
 * All mutations in pages/ should use these patterns
 */

export const createMutationConfig = (options = {}) => {
  const {
    onSuccess,
    onError,
    successMessage = 'Operation completed',
    errorMessage = 'Operation failed. Please try again.',
    optimisticData = null,
  } = options;

  return {
    onSuccess: (data, variables, context) => {
      toast.success(successMessage);
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback was already handled by React Query
      if (context?.rollback) {
        toast.error('Operation failed. Your changes have been reverted.');
      } else {
        toast.error(errorMessage);
      }
      onError?.(error, variables, context);
    },
  };
};

/**
 * Helper for optimistic updates with rollback
 */
export const optimisticUpdateHelper = {
  /**
   * Save previous data for rollback
   */
  savePreviousData: (queryClient, queryKey) => {
    return queryClient.getQueryData(queryKey);
  },

  /**
   * Optimistically update data
   */
  updateOptimistic: (queryClient, queryKey, newData) => {
    queryClient.setQueryData(queryKey, newData);
  },

  /**
   * Rollback on error
   */
  rollback: (queryClient, queryKey, previousData) => {
    if (previousData) {
      queryClient.setQueryData(queryKey, previousData);
    }
  },
};