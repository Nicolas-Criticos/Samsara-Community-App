import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CirclePage from "./pages/CirclePage.jsx";
import ProjectFieldPage from "./pages/ProjectFieldPage.jsx";

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
        path="/field/:realm"
        element={
          <ProtectedRoute>
            <ProjectFieldPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
