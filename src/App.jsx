import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CirclePage from "./pages/circle/index.jsx";
import LoginPage from "./pages/login/index.jsx";
import ProjectsPage from "./pages/projects/index.jsx";

function LegacyFieldRedirect() {
  const { realm } = useParams();
  return <Navigate to={`/projects/${realm}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/circle"
        element={
          <ProtectedRoute>
            <CirclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:realm"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/field/:realm" element={<LegacyFieldRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
