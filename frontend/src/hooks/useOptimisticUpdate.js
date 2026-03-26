// Hook for optimistic UI updates with React Query
import { useCallback } from 'react';

export function useOptimisticUpdate(queryKey, updateFn) {
  return useCallback(async (previousData, newData) => {
    // Return optimistically updated data immediately
    if (Array.isArray(previousData)) {
      const index = previousData.findIndex(item => item.id === newData.id);
      if (index !== -1) {
        const updated = [...previousData];
        updated[index] = { ...updated[index], ...newData };
        return updated;
      }
      return [...previousData, newData];
    }
    return { ...previousData, ...newData };
  }, []);
}

export function createOptimisticMutation(base44, entityName, mutationType = 'create') {
  const mutations = {
    create: async (data) => base44.entities[entityName].create(data),
    update: async (id, data) => base44.entities[entityName].update(id, data),
    delete: async (id) => base44.entities[entityName].delete(id),
  };

  return mutations[mutationType] || mutations.create;
}