import { useState } from "react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Rocket,
  PlusCircle,
  History,
  BrainCircuit,
  Plug,
  Settings,
  CircleHelp,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const mainItems = [
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
    icon: PlusCircle,
    label: "New Analysis",
    path: "/new-analysis",
  },
  {
    icon: History,
    label: "Decision History",
    path: "/history",
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

function NavItem({
  icon: Icon,
  label,
  path,
  onNavigate,
}) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `nav-item ${
          isActive ? "active" : ""
        }`
      }
      onClick={onNavigate}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] =
    useState(false);

  function closeSidebar() {
    setIsOpen(false);
  }

  function openSidebar() {
    setIsOpen(true);
  }

  function goHome() {
    closeSidebar();
    navigate("/");
  }

  function openHelp() {
    closeSidebar();
    navigate("/help");
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="sidebar-reopen-button"
        onClick={openSidebar}
        aria-label="Open sidebar"
        title="Open sidebar"
      >
        <PanelLeftOpen size={19} />
      </button>
    );
  }

  return (
    <aside className="sidebar sidebar-overlay">
      <div className="sidebar-header">
        <button
          type="button"
          className="brand brand-button"
          onClick={goHome}
          title="Return to SECONDORDER home"
        >
          <div className="brand-mark">
            SO
          </div>

          <div className="brand-copy">
            <h1>SECONDORDER</h1>

            <span>
              Decision Intelligence
            </span>
          </div>
        </button>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={closeSidebar}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-heading">
          PRODUCT
        </p>

        {mainItems.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            onNavigate={closeSidebar}
          />
        ))}

        <p className="nav-heading workspace-heading">
          WORKSPACE
        </p>

        {workspaceItems.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="help-button"
          onClick={openHelp}
        >
          <CircleHelp size={18} />

          <span>
            Help & Documentation
          </span>
        </button>

      </div>
    </aside>
  );
}
