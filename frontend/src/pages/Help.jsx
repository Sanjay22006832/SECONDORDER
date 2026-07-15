import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Database,
  PlayCircle,
  Plug,
  Search,
} from "lucide-react";

const helpSections = [
  {
    icon: PlayCircle,
    title: "Getting Started",
    text: "Understand the SECONDORDER workflow and run your first deployment analysis.",
  },
  {
    icon: BarChart3,
    title: "Running an Analysis",
    text: "Configure a system change, select a data source, and generate a decision.",
  },
  {
    icon: Plug,
    title: "Live API Integration",
    text: "Connect an application to the FastAPI ingestion endpoint and send live signals.",
  },
  {
    icon: BrainCircuit,
    title: "Understanding Decisions",
    text: "Learn how confidence, risk level, signal changes, and model predictions work.",
  },
  {
    icon: Database,
    title: "Decision History",
    text: "Search saved analyses and reopen the exact evidence behind earlier decisions.",
  },
  {
    icon: BookOpen,
    title: "Troubleshooting",
    text: "Resolve backend connection, missing data, local storage, and analysis issues.",
  },
];

export default function Help() {
  const navigate = useNavigate();

  return (
    <main className="product-main">
      <header className="topbar">
        <button
          type="button"
          className="help-breadcrumb-button"
          onClick={() =>
            navigate("/command-center")
          }
        >
          Workspace / Help & Documentation
        </button>
      </header>

      <div className="page-content help-page">
        <section className="help-hero">
          <span className="eyebrow">
            HELP & DOCUMENTATION
          </span>

          <h2>
            How can we help?
          </h2>

          <p>
            Learn how to collect deployment
            signals, run analyses, understand
            model decisions, and connect your
            systems to SECONDORDER.
          </p>

          <div className="help-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search documentation..."
            />
          </div>
        </section>

        <section className="help-grid">
          {helpSections.map((section) => {
            const Icon = section.icon;

            return (
              <article
                className="help-card"
                key={section.title}
              >
                <span className="help-card-icon">
                  <Icon size={22} />
                </span>

                <h3>{section.title}</h3>
                <p>{section.text}</p>

                <button type="button">
                  Read guide
                  <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
        </section>

        <section className="help-quick-start">
          <div>
            <span className="eyebrow">
              QUICK START
            </span>

            <h3>
              Ready to analyze a system change?
            </h3>

            <p>
              Start with demo simulation or
              connect your live application.
            </p>
          </div>

          <div className="help-quick-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/new-analysis")
              }
            >
              Run Analysis
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate("/integrations")
              }
            >
              View Integrations
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}