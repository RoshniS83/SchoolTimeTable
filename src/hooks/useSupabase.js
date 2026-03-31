import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export function useSupabase(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref so we always have the latest value synchronously
  const latestValue = useRef(initialValue);

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
          if (data && data.value !== null && data.value !== undefined) {
            latestValue.current = data.value;
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
      // Compute the new value BEFORE touching React state
      // This avoids the async-capture bug where valueToStore was null
      const valueToStore = typeof value === 'function'
        ? value(latestValue.current)
        : value;

      // Guard: never save null/undefined to Supabase (would violate NOT NULL)
      if (valueToStore === null || valueToStore === undefined) {
        console.warn(`Skipping Supabase save for "${key}" — value is null/undefined`);
        return;
      }

      // Optimistic local update
      latestValue.current = valueToStore;
      setStoredValue(valueToStore);

      // Persist to cloud
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
