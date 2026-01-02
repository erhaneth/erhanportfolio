/**
 * Production-safe logging utility
 * - console.log: Only in development
 * - console.error: Always (for production debugging)
 * - console.warn: Only in development
 */

const isDevelopment = () => {
  try {
    // @ts-ignore - Vite provides this at build time
    return import.meta.env?.DEV === true;
  } catch {
    return false;
  }
};

const isProduction = () => !isDevelopment();

export const logger = {
  // Only log in development
  log: (...args: any[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },

  // Always log errors (needed for production debugging)
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Only warn in development
  warn: (...args: any[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },

  // Only info in development
  info: (...args: any[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },

  // Debug mode (only in development)
  debug: (...args: any[]) => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  },

  // Group logs (only in development)
  group: (label: string) => {
    if (isDevelopment()) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment()) {
      console.groupEnd();
    }
  },
};

// For server-side (Netlify functions) - always log errors, conditionally log others
export const serverLogger = {
  log: (...args: any[]) => {
    // In production, you might want to use a logging service
    // For now, we'll log everything on server-side (functions need debugging)
    console.log(...args);
  },

  error: (...args: any[]) => {
    console.error(...args);
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },
};


