import { useAuthSession } from "../hooks/useAuthSession.js";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isPending, data: session } = useAuthSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}
