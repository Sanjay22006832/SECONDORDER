import { Menu, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function getPageName(pathname) {
  if (pathname.startsWith("/decision-room")) return "Decision Room";

  const pages = {
    "/command-center": "Command Center",
    "/deployments": "Deployments",
    "/new-analysis": "New Analysis",
    "/history": "Decision History",
    "/model": "Model Intelligence",
    "/integrations": "Integrations",
    "/settings": "Settings",
    "/help": "Help & Documentation",
  };

  return pages[pathname] || "Workspace";
}

export default function GlobalNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  function toggleSidebar() {
    const sidebarToggle = document.querySelector(
      ".sidebar.sidebar-overlay .sidebar-toggle"
    );
    const sidebarReopen = document.querySelector(
      ".sidebar-reopen-button"
    );

    (sidebarToggle || sidebarReopen)?.click();
  }

  return (
    <header className="global-navigation">
      <button
        type="button"
        className="global-navigation-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={19} />
      </button>

      <button
        type="button"
        className="global-navigation-brand"
        onClick={() => navigate("/")}
      >
        <span>SO</span>
        <strong>SECONDORDER</strong>
      </button>

      <span className="global-navigation-page-name">
        {getPageName(location.pathname)}
      </span>

      <button
        type="button"
        className="global-navigation-settings"
        onClick={() => navigate("/settings")}
        aria-label="Open settings"
      >
        <Settings size={17} />
      </button>
    </header>
  );
}
