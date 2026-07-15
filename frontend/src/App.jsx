import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import LandingPage from "./pages/LandingPage";
import CommandCenter from "./pages/CommandCenter";
import NewAnalysis from "./pages/NewAnalysis";
import DecisionRoom from "./pages/DecisionRoom";
import DecisionHistory from "./pages/DecisionHistory";
import ModelIntelligence from "./pages/ModelIntelligence";
import Deployments from "./pages/Deployments";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";

import Platform from "./pages/Platform";
import Intelligence from "./pages/Intelligence";
import Decisions from "./pages/Decisions";
import Help from "./pages/Help";

function AppRoutes() {
  const location = useLocation();

  const publicPages = [
    "/",
    "/platform",
    "/intelligence",
    "/decisions",
  ];

  const isPublicPage = publicPages.includes(
    location.pathname
  );

  if (isPublicPage) {
    return (
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/platform"
          element={<Platform />}
        />

        <Route
          path="/intelligence"
          element={<Intelligence />}
        />

        <Route
          path="/decisions"
          element={<Decisions />}
        />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <Routes>
        <Route
          path="/command-center"
          element={<CommandCenter />}
        />

        <Route
          path="/deployments"
          element={<Deployments />}
        />

        <Route
          path="/new-analysis"
          element={<NewAnalysis />}
        />

        <Route
          path="/history"
          element={<DecisionHistory />}
        />

        <Route
          path="/model"
          element={<ModelIntelligence />}
        />

        <Route
          path="/integrations"
          element={<Integrations />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/decision-room"
          element={<DecisionRoom />}
        />

        <Route
          path="/help"
          element={<Help />}
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}