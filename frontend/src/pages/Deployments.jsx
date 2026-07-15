import {
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
  TriangleAlert,
  X,
} from "lucide-react";

export default function Deployments() {
  const navigate = useNavigate();

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const history = useMemo(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem(
          "secondorder_history"
        ) || "[]"
      );

      return Array.isArray(savedHistory)
        ? savedHistory
        : [];
    } catch {
      return [];
    }
  }, []);

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
        item.context || {};

      const analysis =
        item.analysis || {};

      const decision =
        analysis.prediction ||
        "UNKNOWN";

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

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [
    history,
    search,
    activeFilter,
  ]);

  function openDeployment(item) {
    localStorage.setItem(
      "secondorder_result",
      JSON.stringify(item)
    );

    navigate("/decision-room");
  }

  function clearFilters() {
    setSearch("");
    setActiveFilter("ALL");
  }

  const filtersActive =
    search.trim() ||
    activeFilter !== "ALL";

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
        </section>

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

            <div className="deployment-toolbar">
              <div className="deployment-search">
                <Search size={15} />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search deployments..."
                />

                {search && (
                  <button
                    type="button"
                    className="deployment-search-clear"
                    onClick={() =>
                      setSearch("")
                    }
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="deployment-clear-filters"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
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
            <>
              <div className="deployment-results-meta">
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

              <div className="deployment-list">
                {deployments.map(
                  (item, index) => {
                    const context =
                      item.context || {};

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
            </>
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
      className={`deployment-stat-card deployment-stat-interactive ${tone} ${
        active
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