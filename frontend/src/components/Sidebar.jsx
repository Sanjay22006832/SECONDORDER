import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Rocket,
  PlusCircle,
  BrainCircuit,
  Plug,
  Settings,
  CircleHelp,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const productItems = [
  {
    icon: LayoutDashboard,
    label: "Command Center",
    path: "/command-center",
  },
  {
    icon: Rocket,
    label: "Deployments",
    path: "/deployments",
  },
  {
    icon: BrainCircuit,
    label: "Model Intelligence",
    path: "/model",
  },
];

const workspaceItems = [
  {
    icon: Plug,
    label: "Integrations",
    path: "/integrations",
  },
  {
    icon: Settings,
    label: "Settings",
    path: "/settings",
  },
];

function NavItem({ icon: Icon, label, path, isCollapsed }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`
      }
      title={isCollapsed ? label : undefined}
    >
      <Icon size={18} />
      {!isCollapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function Sidebar({ isCollapsed: propIsCollapsed, onToggle }) {
  const navigate = useNavigate();
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalIsCollapsed;

  function toggleSidebar() {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsCollapsed((prev) => !prev);
    }
  }

  function goHome() {
    navigate("/");
  }

  function openHelp() {
    navigate("/help");
  }

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* BRAND HEADER */}
      <div className="sidebar-header">
        <button
          type="button"
          className="brand brand-button"
          onClick={goHome}
          title="Return to SECONDORDER home"
        >
          <div className="brand-mark">SO</div>

          {!isCollapsed && (
            <div className="brand-copy">
              <h1>SECONDORDER</h1>
              <span>Decision Intelligence</span>
            </div>
          )}
        </button>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* PRIMARY ACTION */}
      <div className="sidebar-primary-container">
        <NavLink
          to="/new-analysis"
          className={({ isActive }) =>
            `sidebar-primary-action ${isActive ? "active" : ""}`
          }
          title={isCollapsed ? "New Analysis" : undefined}
        >
          <PlusCircle size={18} />
          {!isCollapsed && <span>New Analysis</span>}
        </NavLink>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {!isCollapsed && <p className="nav-heading">PRODUCT</p>}

        {productItems.map((item) => (
          <NavItem key={item.label} {...item} isCollapsed={isCollapsed} />
        ))}

        {!isCollapsed && <p className="nav-heading workspace-heading">WORKSPACE</p>}

        {workspaceItems.map((item) => (
          <NavItem key={item.label} {...item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* UTILITY FOOTER */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="help-button"
          onClick={openHelp}
          title={isCollapsed ? "Help & Documentation" : undefined}
        >
          <CircleHelp size={18} />
          {!isCollapsed && <span>Help & Documentation</span>}
        </button>
      </div>
    </aside>
  );
}
