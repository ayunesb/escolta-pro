import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useOptimisticUpdate<T extends { id: string }>(
  initialData: T[],
  updateFn: (id: string, updates: Partial<T>) => Promise<void>,
  onError?: (error: unknown) => void
) {
  const [data, setData] = useState<T[]>(initialData);

  const optimisticUpdate = useCallback(async (
    id: string, 
    updates: Partial<T>,
    optimisticData?: Partial<T>
  ) => {
    // Apply optimistic update immediately
    const previousData = [...data];
    setData(prev => 
      prev.map(item => 
        item.id === id
          ? ({ ...item, ...(optimisticData || updates) } as T)
          : item
      )
    );

    try {
      // Perform actual update
      await updateFn(id, updates);
      
      // If successful, apply the real updates
      setData(prev => 
        prev.map(item => 
          item.id === id
            ? ({ ...item, ...updates } as T)
            : item
        )
      );
    } catch (error) {
      // Revert on error
      setData(previousData);
      
      if (onError) {
        onError(error as unknown);
      } else {
        toast({
          title: 'Update failed',
          description: 'Changes have been reverted',
          variant: 'destructive'
        });
      }
    }
  }, [data, updateFn, onError]);

  return {
    data,
    setData,
    optimisticUpdate
  };
}

export function useOptimisticAdd<T extends { id: string }>(
  initialData: T[],
  addFn: (item: Partial<T>) => Promise<T>,
  onError?: (error: unknown) => void
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);

  const optimisticAdd = useCallback(async (
    item: Partial<T>,
    optimisticItem?: T
  ) => {
    setIsAdding(true);
    
    // Generate temporary ID for optimistic item
    const tempId = `temp_${Date.now()}`;
    const optimisticData = optimisticItem || ( { 
      ...item, 
      id: tempId,
      created_at: new Date().toISOString()
    } as unknown as T );

    // Add optimistic item immediately
    setData(prev => [optimisticData, ...prev]);

    try {
      // Perform actual add
      const newItem = await addFn(item);
      
      // Replace optimistic item with real item
      setData(prev => 
        prev.map(existingItem => 
          existingItem.id === tempId ? newItem : existingItem
        )
      );
    } catch (error) {
      // Remove optimistic item on error
      setData(prev => 
        prev.filter(existingItem => existingItem.id !== tempId)
      );
      
      if (onError) {
        onError(error as unknown);
      } else {
        toast({
          title: 'Failed to add item',
          description: 'Please try again',
          variant: 'destructive'
        });
      }
    } finally {
      setIsAdding(false);
    }
  }, [addFn, onError]);

  return {
    data,
    setData,
    optimisticAdd,
    isAdding
  };
}