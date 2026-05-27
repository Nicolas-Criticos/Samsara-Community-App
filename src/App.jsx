import { Navigate, Route, Routes, useParams } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ProjectCompletionCelebration from "./components/ProjectCompletionCelebration.jsx";
import CirclePage from "./pages/circle/index.jsx";
import LoginPage from "./pages/login/index.jsx";
import ProjectsPage from "./pages/projects/index.jsx";
import ProjectDetailPage from "./pages/detail/index.jsx";
import VgLayout from "./pages/vg/layout/VgLayout.jsx";
import VgDashboard from "./pages/vg/dashboard/index.jsx";
import VgAnimals from "./pages/vg/animals/index.jsx";
import VgProduce from "./pages/vg/produce/index.jsx";
import VgAccommodation from "./pages/vg/accommodation/index.jsx";
import VgHistory from "./pages/vg/history/index.jsx";

function LegacyFieldRedirect() {
  const { realm } = useParams();
  return <Navigate to={`/projects/${realm}`} replace />;
}

export default function App() {
  return (
    <>
    <ProjectCompletionCelebration />
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
        path="/projects/:realm/:projectSlug"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
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
      <Route
        path="/vg"
        element={
          <ProtectedRoute>
            <VgLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<VgDashboard />} />
        <Route path="animals" element={<VgAnimals />} />
        <Route path="produce" element={<VgProduce />} />
        <Route path="accommodation" element={<VgAccommodation />} />
        <Route path="history" element={<VgHistory />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
