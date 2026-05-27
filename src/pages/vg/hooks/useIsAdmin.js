import { useCurrentMember } from "./useCurrentMember.js";

export function useIsAdmin() {
  const { data } = useCurrentMember();
  return data?.role === "Admin";
}
