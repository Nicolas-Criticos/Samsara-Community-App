import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  fetchCircleMembers,
  fetchMemberWelcomeRow,
} from "../../../lib/membersApi.js";
import { queryKeys } from "../../../lib/queryKeys.js";
import { randomBubblePosition } from "../../../lib/portalLayout.js";
import { useAuthSession } from "../../../hooks/useAuthSession.js";

const BUBBLE_SIZE = 110;
const STAGGER_MS = 900;

export function useCircleBootstrap() {
  const bubbleTimeoutsRef = useRef([]);
  const [bubbleLayout, setBubbleLayout] = useState([]);
  const { data: session } = useAuthSession();
  const userId = session?.user?.id;

  const welcomeQuery = useQuery({
    queryKey: queryKeys.memberWelcome(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await fetchMemberWelcomeRow(userId);
      if (error) throw error;
      return data;
    },
    enabled: Boolean(userId),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.circleMembers(),
    queryFn: async () => {
      const { data, error } = await fetchCircleMembers();
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(userId),
  });

  const titleText =
    welcomeQuery.data?.username != null
      ? `Welcome, ${welcomeQuery.data.username}`
      : "SACRED CIRCLE";

  useEffect(() => {
    if (welcomeQuery.error) {
      console.error("Could not load your member row:", welcomeQuery.error);
    }
  }, [welcomeQuery.error]);

  useEffect(() => {
    if (membersQuery.error) {
      console.error("Failed to load members:", membersQuery.error);
    }
  }, [membersQuery.error]);

  useEffect(() => {
    const list = membersQuery.data;
    if (!list) return undefined;

    let cancelled = false;
    bubbleTimeoutsRef.current.forEach(clearTimeout);
    bubbleTimeoutsRef.current = [];

    setBubbleLayout([]);
    list.forEach((m, i) => {
      const id = setTimeout(() => {
        if (!cancelled) {
          setBubbleLayout((prev) => [
            ...prev,
            { member: m, ...randomBubblePosition(BUBBLE_SIZE) },
          ]);
        }
      }, i * STAGGER_MS);
      bubbleTimeoutsRef.current.push(id);
    });

    return () => {
      cancelled = true;
      bubbleTimeoutsRef.current.forEach(clearTimeout);
      bubbleTimeoutsRef.current = [];
    };
  }, [membersQuery.data]);

  return {
    currentUserId: userId ?? null,
    titleText,
    bubbleLayout,
  };
}
