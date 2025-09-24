import React, { createContext, useContext } from 'react';
import { supabase } from '../lib/storage';

export type SupabaseClientLike = any;

const SupabaseContext = createContext<SupabaseClientLike>(supabase);

export function SupabaseProvider({ client, children }: { client?: SupabaseClientLike; children: React.ReactNode }) {
  return <SupabaseContext.Provider value={client ?? supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return useContext(SupabaseContext);
}

export default SupabaseContext;
