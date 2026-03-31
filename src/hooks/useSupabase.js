import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useSupabase(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    let mounted = true;
    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('app_data')
          .select('value')
          .eq('key', key)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error(`Error fetching ${key} from Supabase:`, error);
        }

        if (mounted) {
          if (data && data.value !== null) {
            setStoredValue(data.value);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error(`Unexpected error fetching ${key}:`, err);
        if (mounted) setIsLoading(false);
      }
    }
    fetchFromSupabase();

    return () => { mounted = false; };
  }, [key]);

  // Save to Supabase
  const setValue = async (value) => {
    try {
      let valueToStore;
      // Optimistic local update using functional pattern to get latest state
      setStoredValue(prev => {
        valueToStore = value instanceof Function ? value(prev) : value;
        return valueToStore;
      });

      // Save to cloud
      // valueToStore is synchronously computed in the callback above
      const { error } = await supabase
        .from('app_data')
        .upsert(
          { key, value: valueToStore },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`Error saving ${key} to Supabase:`, error);
      }
    } catch (error) {
      console.error(`Unexpected error saving ${key}:`, error);
    }
  };

  return [storedValue, setValue, isLoading];
}
