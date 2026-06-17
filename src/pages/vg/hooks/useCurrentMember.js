import { useQuery } from '@tanstack/react-query';
import { useAuthSession } from '../../../hooks/useAuthSession.js';
import { fetchCurrentMember } from '../../../lib/vg/api.js';

export function useCurrentMember() {
  const { data: session } = useAuthSession();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['vg', 'currentMember', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await fetchCurrentMember(userId);
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useIsAdmin() {
  const { data: member } = useCurrentMember();
  return member?.role === 'Admin';
}
