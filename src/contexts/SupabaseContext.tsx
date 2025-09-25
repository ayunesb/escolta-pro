import React, { createContext, useContext } from 'react';
import { supabase } from '../lib/storage';

export type SupabaseClientLike = unknown;

const SupabaseContext = createContext<SupabaseClientLike>(supabase as unknown);

export function SupabaseProvider({ client, children }: { client?: SupabaseClientLike; children: React.ReactNode }) {
  return <SupabaseContext.Provider value={client ?? (supabase as unknown)}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return useContext(SupabaseContext) as SupabaseClientLike;
}

export default SupabaseContext;
