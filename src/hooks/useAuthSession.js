import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { queryKeys } from "../lib/queryKeys.js";

export const authSessionQueryKey = queryKeys.authSession();

async function fetchAuthSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Shared Supabase session; kept in sync via onAuthStateChange.
 */
export function useAuthSession() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: authSessionQueryKey,
    queryFn: fetchAuthSession,
    staleTime: 60_000,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(authSessionQueryKey, session);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return query;
}
