import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default credentials provided for the application
const DEFAULT_URL = 'https://azvjbirktskzbvdvqaxk.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dmpiaXJrdHNremJ2ZHZxYXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODIzNTcsImV4cCI6MjA4MjY1ODM1N30.RxZTNCwFyu8dg8zoefZ5YOsJ8iIH-47OJRzrMQ0ny2Y';

// Helper to get environment variables or localStorage values
const getEnv = (key: string) => {
  // 1. Try import.meta.env (Vite)
  const envVal = (import.meta as any).env?.[key];
  if (envVal && envVal !== 'YOUR_SUPABASE_URL_HERE' && envVal !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
    return envVal;
  }
  
  // 2. Try LocalStorage (for runtime config in demos/containers)
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  
  return null;
}

// Use env vars/local storage if available, otherwise use provided defaults
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Validate URL format to prevent "Invalid URL" errors
const isValidUrl = (url: string | null) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Export null if configuration is missing, app will handle this state
export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;