import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Layers3,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { getHistory, deleteAnalysis, clearAllHistory } from "../services/api";

export default function Deployments() {
  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [sourceFilter, setSourceFilter] =
    useState("ALL");

  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  // Fetch saved deployment history from SQLite backend
  async function loadHistory() {
    try {
      const data = await getHistory();

      if (data.status === "success") {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Failed to load deployment history:", error);
    }
  }

  const safeCount = history.filter(
    (item) =>
      item.analysis?.prediction ===
      "SAFE TO DEPLOY"
  ).length;

  const reviewCount = history.filter(
    (item) =>
      item.analysis?.prediction ===
      "REVIEW REQUIRED"
  ).length;

  const highRiskCount = history.filter(
    (item) =>
      [
        "RISKY CHANGE",
        "ROLLBACK",
      ].includes(
        item.analysis?.prediction
      )
  ).length;

  const deployments = useMemo(() => {
    const searchTerm = search
      .trim()
      .toLowerCase();

    return history.filter((item) => {
      const context =
        item.context || item || {};

      const analysis =
        item.analysis || {};

      const decision =
        analysis.prediction ||
        "UNKNOWN";

      const source =
        context.data_source ||
        item.data_source ||
        "simulation";

      const searchableText = [
        context.analysis_name,
        context.change_description,
        context.before_version,
        context.after_version,
        analysis.prediction,
        analysis.risk_level,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          searchTerm
        );

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "HIGH RISK"
          ? [
            "RISKY CHANGE",
            "ROLLBACK",
          ].includes(decision)
          : decision === activeFilter);

      const matchesSource =
        sourceFilter === "ALL" ||
        source === sourceFilter;

      return (
        matchesSearch &&
        matchesFilter &&
        matchesSource
      );
    });
  }, [
    history,
    search,
    activeFilter,
    sourceFilter,
  ]);

  // Open Decision Room for selected deployment
  function openDeployment(item) {
    navigate(`/decision-room/${item.id}`);
  }

  // Delete individual deployment record
  async function handleDelete(event, item) {
    event.stopPropagation();

    const context = item.context || item || {};
    const name = context.analysis_name || "this deployment";

    const confirmed = window.confirm(
      `Delete deployment "${name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await deleteAnalysis(item.id);

      if (response.status === "success") {
        setHistory((prev) => prev.filter((h) => h.id !== item.id));
      } else {
        alert(`Failed to delete deployment: ${response.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error deleting deployment:", err);
      alert(`Failed to delete deployment: ${err.message}`);
    }
  }

  // Clear all deployment history records
  async function handleClearHistory() {
    const confirmed = window.confirm(
      "Clear all saved deployment history? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      const response = await clearAllHistory();

      if (response.status === "success") {
        setHistory([]);
        setSearch("");
        setActiveFilter("ALL");
        setSourceFilter("ALL");
      } else {
        alert(`Failed to clear history: ${response.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error clearing history:", err);
      alert(`Failed to clear history: ${err.message}`);
    }
  }

  // Reset search and filter selections
  function clearFilters() {
    setSearch("");
    setActiveFilter("ALL");
    setSourceFilter("ALL");
  }

  const filtersActive =
    search.trim() ||
    activeFilter !== "ALL" ||
    sourceFilter !== "ALL";

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / Deployments
        </span>

        <span className="analysis-draft">
          {history.length} deployments
        </span>
      </header>

      <div className="page-content deployments-page">
        <section className="deployments-heading">
          <div>
            <span className="eyebrow">
              DEPLOYMENTS
            </span>

            <h2>
              Track every system change.
            </h2>

            <p>
              Monitor analyzed deployments,
              compare version transitions, and
              reopen the evidence behind each
              decision.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {history.length > 0 && (
              <button
                type="button"
                className="history-clear-button"
                onClick={handleClearHistory}
              >
                <Trash2 size={15} />
                Clear History
              </button>
            )}

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/new-analysis")
              }
            >
              <Plus size={16} />
              New Analysis
            </button>
          </div>
        </section>

        <section className="deployments-toolbar-section">
          <div className="deployments-search-bar">
            <Search size={18} className="search-icon" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, version, change, risk..."
            />
          </div>

          <select
            className="deployments-source-select"
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All sources
            </option>

            <option value="simulation">
              Demo Simulation
            </option>

            <option value="api">
              Live API
            </option>

            <option value="csv">
              Uploaded CSV
            </option>
          </select>
        </section>

        <div className="deployments-meta-bar">
          <span>
            Showing{" "}
            <strong>
              {deployments.length}
            </strong>{" "}
            of {history.length} deployments
          </span>

          <span>
            Click a deployment to open
            its decision evidence
          </span>
        </div>

        <section className="deployment-stat-grid">
          <DeploymentStat
            icon={Layers3}
            label="Total Analyzed"
            value={history.length}
            active={
              activeFilter === "ALL"
            }
            onClick={() =>
              setActiveFilter("ALL")
            }
          />

          <DeploymentStat
            icon={CheckCircle2}
            label="Safe"
            value={safeCount}
            tone="safe"
            active={
              activeFilter ===
              "SAFE TO DEPLOY"
            }
            onClick={() =>
              setActiveFilter(
                "SAFE TO DEPLOY"
              )
            }
          />

          <DeploymentStat
            icon={Clock3}
            label="Needs Review"
            value={reviewCount}
            tone="review"
            active={
              activeFilter ===
              "REVIEW REQUIRED"
            }
            onClick={() =>
              setActiveFilter(
                "REVIEW REQUIRED"
              )
            }
          />

          <DeploymentStat
            icon={TriangleAlert}
            label="High Risk"
            value={highRiskCount}
            tone="risk"
            active={
              activeFilter ===
              "HIGH RISK"
            }
            onClick={() =>
              setActiveFilter(
                "HIGH RISK"
              )
            }
          />
        </section>

        <section className="deployments-panel">
          <div className="deployments-panel-header">
            <div>
              <span className="eyebrow">
                DEPLOYMENT WORKSPACE
              </span>

              <h3>Analyzed changes</h3>
            </div>
          </div>

          {deployments.length === 0 ? (
            <div className="deployments-empty">
              <div className="deployments-empty-icon">
                <Boxes size={24} />
              </div>

              <h3>
                {history.length === 0
                  ? "No deployments yet"
                  : "No deployments found"}
              </h3>

              <p>
                {history.length === 0
                  ? "Run an analysis and the deployment will appear here automatically."
                  : "Try changing your search or active filter."}
              </p>

              {filtersActive ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      "/new-analysis"
                    )
                  }
                >
                  <Plus size={15} />
                  Run Analysis
                </button>
              )}
            </div>
          ) : (
            <div className="deployment-list">
                {deployments.map(
                  (item, index) => {
                    // Read deployment metadata from top-level SQLite record properties or context object
                    const context =
                      item.context || item || {};

                    const analysis =
                      item.analysis || {};

                    const decision =
                      analysis.prediction ||
                      "UNKNOWN";

                    const confidence =
                      Math.min(
                        Math.max(
                          Number(
                            analysis.confidence ||
                            0
                          ) * 100,
                          0
                        ),
                        100
                      );

                    return (
                      <article
                        className={`deployment-row deployment-row-interactive ${getDecisionClass(
                          decision
                        )}`}
                        key={
                          item.id || index
                        }
                        onClick={() =>
                          openDeployment(
                            item
                          )
                        }
                        role="button"
                        tabIndex={0}
                        style={{
                          "--deployment-delay":
                            `${Math.min(
                              index * 0.05,
                              0.3
                            )}s`,
                        }}
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                            "Enter" ||
                            event.key ===
                            " "
                          ) {
                            openDeployment(
                              item
                            );
                          }
                        }}
                      >
                        <div
                          className={`deployment-status-dot ${getDecisionClass(
                            decision
                          )}`}
                        />

                        <div className="deployment-identity">
                          <span>
                            {formatDate(
                              item.created_at
                            )}
                          </span>

                          <strong>
                            {context.analysis_name ||
                              "Untitled Deployment"}
                          </strong>

                          <p>
                            {context.change_description ||
                              "No description provided."}
                          </p>
                        </div>

                        <div className="deployment-version">
                          <span>
                            VERSION CHANGE
                          </span>

                          <strong>
                            {context.before_version ||
                              "Before"}
                            {" → "}
                            {context.after_version ||
                              "After"}
                          </strong>
                        </div>

                        <div className="deployment-risk">
                          <span>RISK</span>

                          <strong>
                            {analysis.risk_level ||
                              "UNKNOWN"}
                          </strong>
                        </div>

                        <div className="deployment-confidence">
                          <span>
                            CONFIDENCE
                          </span>

                          <strong>
                            {confidence.toFixed(
                              1
                            )}
                            %
                          </strong>

                          <div className="deployment-confidence-track">
                            <span
                              style={{
                                width:
                                  `${confidence}%`,
                              }}
                            />
                          </div>
                        </div>

                        <span
                          className={`deployment-decision ${getDecisionClass(
                            decision
                          )}`}
                        >
                          {decision}
                        </span>

                        <button
                          type="button"
                          className="history-delete-button"
                          onClick={(event) =>
                            handleDelete(
                              event,
                              item
                            )
                          }
                          aria-label="Delete deployment"
                          title="Delete deployment"
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="deployment-open-button"
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            openDeployment(
                              item
                            );
                          }}
                          aria-label="Open deployment"
                        >
                          <ArrowUpRight
                            size={16}
                          />
                        </button>
                      </article>
                    );
                  }
                )}
              </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DeploymentStat({
  icon: Icon,
  label,
  value,
  tone = "",
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`deployment-stat-card deployment-stat-interactive ${tone} ${active
        ? "deployment-stat-active"
        : ""
        }`}
      onClick={onClick}
    >
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <Icon size={18} />
    </button>
  );
}

function formatDate(date) {
  if (!date) {
    return "Date unavailable";
  }

  return new Date(
    date
  ).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDecisionClass(decision) {
  switch (decision) {
    case "SAFE TO DEPLOY":
      return "deployment-safe";

    case "REVIEW REQUIRED":
      return "deployment-review";

    case "RISKY CHANGE":
      return "deployment-risky";

    case "ROLLBACK":
      return "deployment-rollback";

    default:
      return "";
  }
}