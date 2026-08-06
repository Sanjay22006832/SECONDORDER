import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Search,
  ArrowUpRight,
  History,
  Trash2,
  ShieldCheck,
  Clock3,
  TriangleAlert,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

export default function DecisionHistory() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [decisionFilter, setDecisionFilter] =
    useState("ALL");


const [sourceFilter, setSourceFilter] =
  useState("ALL");

const [deleteTarget, setDeleteTarget] =
  useState(null);

const [toast, setToast] =
  useState(null);

const [history, setHistory] = useState([]);

useEffect(() => {
  loadHistory();
}, []);

const filteredHistory = useMemo(() => {
  const searchTerm = search
    .trim()
    .toLowerCase();

  return history.filter((item) => {
    const context = item;
    const analysis = item.analysis || {};

    const searchableText = [
      context.analysis_name,
      context.before_version,
      context.after_version,
      context.change_description,
      analysis.prediction,
      analysis.risk_level,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const decision =
      analysis.prediction || "UNKNOWN";

    const source =
      context.data_source || "simulation";

    const matchesSearch =
      searchableText.includes(searchTerm);

    const matchesDecision =
      decisionFilter === "ALL" ||
      (decisionFilter === "HIGH RISK"
        ? [
          "RISKY CHANGE",
          "ROLLBACK",
        ].includes(decision)
        : decision === decisionFilter);

    const matchesSource =
      sourceFilter === "ALL" ||
      source === sourceFilter;

    return (
      matchesSearch &&
      matchesDecision &&
      matchesSource
    );
  });
}, [
  history,
  search,
  decisionFilter,
  sourceFilter,
]);

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
    item.analysis?.prediction ===
    "ROLLBACK"
).length;

async function loadHistory() {

  try {
    const response = await fetch(`${API}/history`);
    const data = await response.json();

    if (data.status === "success") {
      setHistory(data.history);
    }
  } catch (error) {
    console.error(error);
  }
}

function openAnalysis(item) {
  navigate(`/decision-room/${item.id}`);
}

function requestDelete(event, item) {
  event.stopPropagation();

  setDeleteTarget(item);
}

function cancelDelete() {
  setDeleteTarget(null);
}

async function confirmDelete() {

  if (!deleteTarget) return;

  await fetch(`${API}/history/${deleteTarget.id}`, {
    method: "DELETE",
  });

  await loadHistory();

  setDeleteTarget(null);
}

function requestClearHistory() {
  setDeleteTarget({
    clearAll: true,
    analysis_name: "all saved decisions",
  });
}

async function confirmClearHistory() {

  await fetch(`${API}/history`, {
    method: "DELETE",
  });

  await loadHistory();

  setDeleteTarget(null);

  setToast({
    title: "History cleared",
    message: "All saved decisions were removed from Decision History.",
  });

  window.setTimeout(() => setToast(null), 3500);
}

function clearFilters() {
  setSearch("");
  setDecisionFilter("ALL");
  setSourceFilter("ALL");
}

const filtersActive =
  search.trim() ||
  decisionFilter !== "ALL" ||
  sourceFilter !== "ALL";

return (
  <main className="product-main">
    <header className="topbar">
      <span className="breadcrumb">
        Workspace / Decision History
      </span>

      <span className="analysis-draft">
        {history.length} saved analyses
      </span>
    </header>

    <div className="page-content history-page">
      <section className="history-heading">
        <div>
          <span className="eyebrow">
            DECISION HISTORY
          </span>

          <h2>
            Every decision, preserved.
          </h2>

          <p>
            Search, filter, and reopen the exact
            evidence behind previous deployment
            decisions.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            className="history-clear-button"
            onClick={requestClearHistory}
          >
            <Trash2 size={15} />
            Clear history
          </button>
        )}
      </section>

      <section className="history-stat-grid">
        <HistoryStat
          icon={History}
          label="Total Decisions"
          value={history.length}
          active={decisionFilter === "ALL"}
          onClick={() =>
            setDecisionFilter("ALL")
          }
        />

        <HistoryStat
          icon={ShieldCheck}
          label="Safe"
          value={safeCount}
          active={
            decisionFilter ===
            "SAFE TO DEPLOY"
          }
          onClick={() =>
            setDecisionFilter(
              "SAFE TO DEPLOY"
            )
          }
        />

        <HistoryStat
          icon={Clock3}
          label="Needs Review"
          value={reviewCount}
          active={
            decisionFilter ===
            "REVIEW REQUIRED"
          }
          onClick={() =>
            setDecisionFilter(
              "REVIEW REQUIRED"
            )
          }
        />

        <HistoryStat
          icon={TriangleAlert}
          label="High Risk"
          value={highRiskCount}
          active={
            decisionFilter === "HIGH RISK"
          }
          onClick={() =>
            setDecisionFilter("HIGH RISK")
          }
        />
      </section>

      <section className="history-toolbar">
        <div className="history-search">
          <Search size={16} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, version, change, risk..."
          />
        </div>

        <select
          className="history-filter"
          value={decisionFilter}
          onChange={(event) =>
            setDecisionFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            All decisions
          </option>

          <option value="SAFE TO DEPLOY">
            Safe to Deploy
          </option>

          <option value="REVIEW REQUIRED">
            Review Required
          </option>

          <option value="HIGH RISK">
            High Risk
          </option>

          <option value="RISKY CHANGE">
            Risky Change
          </option>

          <option value="ROLLBACK">
            Rollback
          </option>
        </select>

        <select
          className="history-filter"
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

      {filteredHistory.length === 0 ? (
        <section className="history-empty">
          <div className="history-empty-icon">
            <History size={24} />
          </div>

          <h3>
            {history.length === 0
              ? "No decisions yet"
              : "No matching analyses"}
          </h3>

          <p>
            {history.length === 0
              ? "Run a new analysis and the result will appear here automatically."
              : "Try changing your search or filters."}
          </p>

          {history.length === 0 ? (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/new-analysis")
              }
            >
              Start New Analysis
            </button>
          ) : (
            filtersActive && (
              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )
          )}
        </section>
      ) : (
        <section className="history-list">
          <div className="history-results-header">
            <span>
              {filteredHistory.length} of{" "}
              {history.length} decisions
            </span>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredHistory.map(
            (item, index) => {
              const analysis =
                item.analysis || {};

              const context = item;

              const decision =
                analysis.prediction ||
                "UNKNOWN";

              const confidence = (
                Number(
                  analysis.confidence || 0
                ) * 100
              ).toFixed(1);

              return (
                <article
                  className="history-card"
                  key={item.id || index}
                  onClick={() =>
                    openAnalysis(item)
                  }
                >
                  <div
                    className={`history-decision-line ${getDecisionClass(
                      decision
                    )}`}
                  />

                  <div className="history-card-main">
                    <div className="history-card-top">
                      <div>
                        <span className="history-date">
                          {formatDate(
                            item.created_at
                          )}
                        </span>

                        <h3>
                          {context.analysis_name ||
                            "Untitled Analysis"}
                        </h3>

                        <p>
                          {context.before_version ||
                            "Before"}
                          {" → "}
                          {context.after_version ||
                            "After"}
                        </p>
                      </div>

                      <span
                        className={`history-decision-badge ${getDecisionClass(
                          decision
                        )}`}
                      >
                        {decision}
                      </span>
                    </div>

                    <p className="history-description">
                      {context.change_description ||
                        "No change description provided."}
                    </p>

                    <div className="history-card-footer">
                      <div className="history-meta">
                        <div>
                          <span>
                            Confidence
                          </span>

                          <strong>
                            {confidence}%
                          </strong>
                        </div>

                        <div>
                          <span>
                            Risk
                          </span>

                          <strong>
                            {analysis.risk_level ||
                              "UNKNOWN"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Data Source
                          </span>

                          <strong>
                            {formatSource(
                              context.data_source
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Analyzed
                          </span>

                          <strong>
                            {formatDate(item.created_at)}
                          </strong>
                        </div>
                      </div>

                      <div className="history-card-actions">
                        <button
                          type="button"
                          className="history-delete-button"
                          onClick={(event) =>
                            requestDelete(
                              event,
                              item
                            )
                          }
                          aria-label={`Delete ${context.analysis_name ||
                            "analysis"
                            }`}
                          title="Delete decision"
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          type="button"
                          className="history-open-button"
                          onClick={(event) => {
                            event.stopPropagation();

                            openAnalysis(item);
                          }}
                        >
                          Open Decision

                          <ArrowUpRight
                            size={15}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}
    </div>

    {deleteTarget && (
      <div
        className="so-modal-backdrop"
        onMouseDown={cancelDelete}
      >
        <div
          className="so-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="so-modal-icon">
            <Trash2 size={20} />
          </div>

          <div className="so-modal-content">
            <span className="eyebrow">
              DECISION HISTORY
            </span>

            <h3 id="delete-modal-title">
              {deleteTarget.clearAll
                ? "Clear decision history?"
                : "Delete decision?"}
            </h3>

            <p>
              {deleteTarget.clearAll ? (
                <>
                  Remove all{" "}
                  <strong>
                    {history.length} saved
                    decisions
                  </strong>{" "}
                  from Decision History? This
                  action cannot be undone.
                </>
              ) : (
                <>
                  Remove{" "}
                  <strong>
                    “
                    {deleteTarget.analysis_name ||
                      "Untitled Analysis"}
                    ”
                  </strong>{" "}
                  from Decision History? This
                  action cannot be undone.
                </>
              )}
            </p>
          </div>

          <div className="so-modal-actions">
            <button
              type="button"
              className="so-modal-cancel"
              onClick={cancelDelete}
            >
              Cancel
            </button>

            <button
              type="button"
              className="so-modal-delete"
              onClick={
                deleteTarget.clearAll
                  ? confirmClearHistory
                  : confirmDelete
              }
            >
              <Trash2 size={15} />

              {deleteTarget.clearAll
                ? "Clear History"
                : "Delete Decision"}
            </button>
          </div>
        </div>
      </div>
    )}

    {toast && (
      <div
        className="so-toast"
        role="status"
        aria-live="polite"
      >
        <div className="so-toast-icon">
          <Trash2 size={16} />
        </div>

        <div>
          <strong>
            {toast.title}
          </strong>

          <p>
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    )}
  </main>
);
}

function HistoryStat({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`history-stat-card history-stat-interactive ${active ? "history-stat-active" : ""
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

  return new Date(date).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function formatSource(source) {
  switch (source) {
    case "simulation":
      return "Demo Simulation";

    case "api":
      return "Live API";

    case "csv":
      return "Uploaded CSV";

    default:
      return "Unknown";
  }
}



function getDecisionClass(decision) {
  switch (decision) {
    case "SAFE TO DEPLOY":
      return "history-safe";

    case "REVIEW REQUIRED":
      return "history-review";

    case "RISKY CHANGE":
      return "history-risky";

    case "ROLLBACK":
      return "history-rollback";

    default:
      return "";
  }
}