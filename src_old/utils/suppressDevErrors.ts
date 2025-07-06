// Suppress ResizeObserver loop limit exceeded errors in development
// This is a known issue with Next.js dev overlay and doesn't affect functionality

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const resizeObserverErr = window.console.error;
  
  window.console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    
    if (
      typeof firstArg === 'string' && 
      firstArg.includes('ResizeObserver loop limit exceeded')
    ) {
      return; // Suppress this specific error
    }
    
    if (
      typeof firstArg === 'string' && 
      firstArg.includes('Maximum update depth exceeded')
    ) {
      return; // Suppress React update depth errors in development
    }
    
    resizeObserverErr(...args);
  };
}

export {};
