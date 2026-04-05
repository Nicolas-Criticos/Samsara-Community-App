import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import {
  fetchCircleMembers,
  fetchMemberWelcomeRow,
} from "../../../lib/membersApi.js";
import { randomBubblePosition } from "../../../lib/portalLayout.js";

const BUBBLE_SIZE = 110;
const STAGGER_MS = 900;

export function useCircleBootstrap() {
  const bubbleTimeoutsRef = useRef([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [titleText, setTitleText] = useState("SACRED CIRCLE");
  const [bubbleLayout, setBubbleLayout] = useState([]);

  useEffect(() => {
    let cancelled = false;
    bubbleTimeoutsRef.current.forEach(clearTimeout);
    bubbleTimeoutsRef.current = [];

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session || cancelled) return;
      const uid = data.session.user.id;
      setCurrentUserId(uid);

      const { data: row, error: selfErr } = await fetchMemberWelcomeRow(uid);

      if (selfErr) {
        console.error("Could not load your member row:", selfErr);
      } else if (row?.username && !cancelled) {
        setTitleText(`Welcome, ${row.username}`);
      }

      const { data: list, error: loadErr } = await fetchCircleMembers();

      if (loadErr) {
        console.error("Failed to load members:", loadErr);
        return;
      }

      if (cancelled) return;

      setBubbleLayout([]);
      (list || []).forEach((m, i) => {
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
    })();

    return () => {
      cancelled = true;
      bubbleTimeoutsRef.current.forEach(clearTimeout);
      bubbleTimeoutsRef.current = [];
    };
  }, []);

  return { currentUserId, titleText, bubbleLayout };
}
