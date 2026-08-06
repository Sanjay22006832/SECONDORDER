import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BrainCircuit,
  Clock3,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { getAnalysis } from "../services/api";

export default function CommandCenter() {
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProductData();

  }, []);



  async function loadProductData() {
    try {
      const liveAnalysis = await getAnalysis();

      setAnalysis(liveAnalysis);
      setError(null);
    } catch (err) {
      setError(err.message);
    }

    try {
      const savedLatest = JSON.parse(
        localStorage.getItem(
          "secondorder_result"
        ) || "null"
      );

      const savedHistory = JSON.parse(
        localStorage.getItem(
          "secondorder_history"
        ) || "[]"
      );

      setLatestResult(savedLatest);
      setHistory(savedHistory);
    } catch {
      setLatestResult(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  function openLatestDecision() {
    if (!latestResult && !analysis) {
      navigate("/new-analysis");
      return;
    }

    navigate("/decision-room");
  }

  function openHistoryFilter(filter) {
    localStorage.setItem(
      "secondorder_history_filter",
      filter
    );

    navigate("/history");
  }

  const latestAnalysis =
    latestResult?.analysis || analysis || {};

  const latestContext =
    latestResult?.context || {};

  const decision =
    latestAnalysis.prediction ||
    "WAITING FOR DATA";

  const confidence = (
    Number(latestAnalysis.confidence || 0) * 100
  ).toFixed(1);

  const insights =
    latestAnalysis.insights || {};

  const modelInfo =
    latestAnalysis.model_info || {};

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
      item.analysis?.prediction ===
      "RISKY CHANGE" ||
      item.analysis?.prediction === "ROLLBACK"
  ).length;

  const recentHistory = history.slice(0, 4);

  return (
    <main className="product-main">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Workspace / </span>

          <Link
            to="/command-center"
            className="breadcrumb-page-link"
          >
            Command Center
          </Link>
        </div>

        <div className="topbar-actions">
          <button className="icon-button">
            <Search size={18} />
          </button>

          <button className="icon-button">
            <Bell size={18} />
          </button>

          <div className="avatar">S</div>
        </div>
      </header>

      <div className="page-content command-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">
              COMMAND CENTER
            </span>

            <h2>
              Deployment intelligence,
              <br />
              in one place.
            </h2>

            <p>
              Understand what changed, how the model
              sees it, and what to do next.
            </p>
          </div>

          <div className="live-status">
            <span className="live-dot" />
            Random Forest active
          </div>
        </section>

        {error && (
          <div className="api-error">
            Backend connection error: {error}
          </div>
        )}

        <section
          className={`decision-card command-interactive-decision ${getDecisionClass(
            decision
          )}`}
          onClick={openLatestDecision}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              openLatestDecision();
            }
          }}
        >
          <div className="decision-content">
            <div className="analysis-label">
              <Sparkles size={15} />
              LATEST ML DECISION
            </div>

            <p className="deployment-name">
              {latestContext.analysis_name ||
                "Current deployment"}
            </p>

            <h1 className="decision-title">
              {decision}
            </h1>

            <p className="decision-description">
              {latestAnalysis.summary ||
                "Run a new analysis to generate deployment intelligence."}
            </p>

            {latestContext.before_version && (
              <div className="command-version">
                {latestContext.before_version}
                {" → "}
                {latestContext.after_version}
              </div>
            )}

            <div className="decision-actions">
              <button
                className="primary-button"
                onClick={(event) => {
                  event.stopPropagation();
                  openLatestDecision();
                }}
              >
                Open Decision Room
                <ArrowUpRight size={16} />
              </button>

              <button
                className="secondary-button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate("/new-analysis");
                }}
              >
                Start New Analysis
              </button>
            </div>
          </div>

          <div className="confidence-panel">
            <span>MODEL CONFIDENCE</span>

            <strong>{confidence}%</strong>

            <p>
              Risk level:{" "}
              {latestAnalysis.risk_level ||
                "UNKNOWN"}
            </p>
          </div>

          <div className="command-card-open-hint">
            Open intelligence
            <ArrowUpRight size={14} />
          </div>
        </section>

        <section className="command-stat-grid">
          <CommandStat
            icon={History}
            label="Total Analyses"
            value={history.length}
            text="Saved decisions"
            onClick={() =>
              openHistoryFilter("ALL")
            }
          />

          <CommandStat
            icon={ShieldCheck}
            label="Safe"
            value={safeCount}
            text="Approved patterns"
            tone="safe"
            onClick={() =>
              openHistoryFilter(
                "SAFE TO DEPLOY"
              )
            }
          />

          <CommandStat
            icon={Clock3}
            label="Needs Review"
            value={reviewCount}
            text="Mixed signals"
            tone="review"
            onClick={() =>
              openHistoryFilter(
                "REVIEW REQUIRED"
              )
            }
          />

          <CommandStat
            icon={TriangleAlert}
            label="High Risk"
            value={highRiskCount}
            text="Risky or rollback"
            tone="risk"
            onClick={() =>
              openHistoryFilter("HIGH RISK")
            }
          />
        </section>

        <section className="section-header">
          <div>
            <span className="eyebrow">
              SYSTEM OVERVIEW
            </span>

            <h3>Latest deployment pulse</h3>
          </div>

          <span className="section-meta">
            Before → After
          </span>
        </section>

        <section className="metric-grid">
          <MetricCard
            title="Clicks"
            data={insights.clicks}
            delay="0s"
          />

          <MetricCard
            title="Conversion Rate"
            data={insights.conversion_rate}
            delay="0.08s"
          />

          <MetricCard
            title="Latency"
            data={insights.latency}
            delay="0.16s"
          />

          <MetricCard
            title="Error Rate"
            data={insights.error_rate}
            delay="0.24s"
          />
        </section>

        <section className="command-lower-grid">
          <div className="command-activity-card command-hover-surface">
            <div className="command-card-heading">
              <div>
                <span className="eyebrow">
                  RECENT ACTIVITY
                </span>

                <h3>Latest analyzed changes</h3>
              </div>

              <button
                className="command-text-button"
                onClick={() =>
                  navigate("/history")
                }
              >
                View all
                <ArrowRight size={14} />
              </button>
            </div>

            {recentHistory.length > 0 ? (
              <div className="command-activity-list">
                {recentHistory.map(
                  (item, index) => {
                    const itemAnalysis =
                      item.analysis || {};

                    const itemContext =
                      item.context || {};

                    const itemDecision =
                      itemAnalysis.prediction ||
                      "UNKNOWN";

                    return (
                      <button
                        className="command-activity-row"
                        key={item.id || index}
                        onClick={() =>
                          openSavedDecision(
                            item,
                            navigate
                          )
                        }
                      >
                        <span
                          className={`command-activity-dot ${getActivityClass(
                            itemDecision
                          )}`}
                        />

                        <div>
                          <strong>
                            {itemContext.analysis_name ||
                              "Untitled Analysis"}
                          </strong>

                          <p>
                            {itemContext.before_version ||
                              "Before"}
                            {" → "}
                            {itemContext.after_version ||
                              "After"}
                          </p>
                        </div>

                        <span
                          className={`command-activity-decision ${getActivityClass(
                            itemDecision
                          )}`}
                        >
                          {itemDecision}
                        </span>

                        <ArrowUpRight size={15} />
                      </button>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="command-empty">
                <p>No saved analyses yet.</p>

                <button
                  className="primary-button"
                  onClick={() =>
                    navigate("/new-analysis")
                  }
                >
                  Run First Analysis
                </button>
              </div>
            )}
          </div>

          <aside
            className="command-model-card command-interactive-model"
            onClick={() => navigate("/model")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                navigate("/model");
              }
            }}
          >
            <div className="command-model-icon">
              <BrainCircuit size={22} />
            </div>

            <span className="eyebrow">
              MODEL STATUS
            </span>

            <h3>
              {modelInfo.name ||
                "Random Forest Classifier"}
            </h3>

            <p>
              Active four-class deployment risk
              prediction model.
            </p>

            <div className="command-model-details">
              <div>
                <span>Version</span>

                <strong>
                  v{modelInfo.version || "1.0.0"}
                </strong>
              </div>

              <div>
                <span>Test accuracy</span>

                <strong>
                  {modelInfo.test_accuracy
                    ? `${(
                      Number(
                        modelInfo.test_accuracy
                      ) * 100
                    ).toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Outcome classes</span>
                <strong>4</strong>
              </div>
            </div>

            <button
              className="command-model-button"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/model");
              }}
            >
              Open Model Intelligence
              <ArrowRight size={15} />
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function CommandStat({
  icon: Icon,
  label,
  value,
  text,
  tone = "",
  onClick,
}) {
  return (
    <button
      type="button"
      className={`command-stat-card command-interactive-stat ${tone}`}
      onClick={onClick}
    >
      <div className="command-stat-top">
        <span>{label}</span>
        <Icon size={16} />
      </div>

      <strong>{value}</strong>

      <div className="command-stat-bottom">
        <p>{text}</p>
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}

function MetricCard({
  title,
  data,
  delay,
}) {
  if (!data) {
    return (
      <article className="metric-card command-interactive-metric">
        <span className="metric-title">
          {title}
        </span>

        <strong className="metric-value">
          —
        </strong>

        <p>No data available</p>
      </article>
    );
  }

  const percentage = Number(
    data.percentage_change || 0
  );

  const progressWidth = Math.min(
    Math.max(Math.abs(percentage), 18),
    100
  );

  return (
    <article
      className="metric-card command-interactive-metric"
      style={{
        "--metric-delay": delay,
        "--metric-progress": `${progressWidth}%`,
      }}
    >
      <span className="metric-title">
        {title}
      </span>

      <strong className="metric-value">
        {percentage > 0 ? "+" : ""}
        {percentage.toFixed(1)}%
      </strong>

      <p>
        {data.before} → {data.after}
      </p>

      <span
        className={`metric-impact ${data.impact || ""
          }`}
      >
        {data.impact}
      </span>

      <div className="metric-line">
        <span />
      </div>

      <div className="metric-hover-detail">
        <span>Signal movement</span>

        <strong>
          {Math.abs(percentage).toFixed(1)}%
        </strong>
      </div>
    </article>
  );
}

function openSavedDecision(item, navigate) {
  localStorage.setItem(
    "secondorder_result",
    JSON.stringify(item)
  );

  navigate("/decision-room");
}

function getDecisionClass(decision) {
  switch (decision) {
    case "SAFE TO DEPLOY":
      return "decision-safe";

    case "REVIEW REQUIRED":
      return "decision-review";

    case "RISKY CHANGE":
      return "decision-risky";

    case "ROLLBACK":
      return "decision-rollback";

    default:
      return "";
  }
}

function getActivityClass(decision) {
  switch (decision) {
    case "SAFE TO DEPLOY":
      return "activity-safe";

    case "REVIEW REQUIRED":
      return "activity-review";

    case "RISKY CHANGE":
      return "activity-risky";

    case "ROLLBACK":
      return "activity-rollback";

    default:
      return "";
  }
}
