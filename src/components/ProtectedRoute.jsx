import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

export default function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, session: null });

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setState({ loading: false, session });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, session });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state.loading) {
    return null;
  }

  if (!state.session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
