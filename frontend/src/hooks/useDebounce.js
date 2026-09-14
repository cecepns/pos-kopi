import { useState, useEffect } from "react";

/**
 * useDebounce Hook
 * Debounces a value with a configurable delay (default 400ms, >= 300ms as required by AGENTS.md)
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
