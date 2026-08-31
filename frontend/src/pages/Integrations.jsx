import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Check,
  Clipboard,
  Code2,
  Database,
  ExternalLink,
  Play,
  RefreshCw,
  Server,
  Sliders,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import {
  getCurrentApiBaseUrl,
  checkApiHealth,
  startLiveSession,
  ingestMetric,
  getLiveAnalysis,
} from "../services/api";

const DEFAULT_GUIDED_FORM = {
  before: {
    clicks: "1000",
    conversion_rate: "0.05",
    latency: "250",
    error_rate: "0.02",
  },
  after: {
    clicks: "1150",
    conversion_rate: "0.058",
    latency: "220",
    error_rate: "0.015",
  },
};

const DEFAULT_JSON_PAYLOAD = JSON.stringify(
  [
    { metric_name: "clicks", value: 1000, version: "before" },
    { metric_name: "conversion_rate", value: 0.05, version: "before" },
    { metric_name: "latency", value: 250, version: "before" },
    { metric_name: "error_rate", value: 0.02, version: "before" },
    { metric_name: "clicks", value: 1150, version: "after" },
    { metric_name: "conversion_rate", value: 0.058, version: "after" },
    { metric_name: "latency", value: 220, version: "after" },
    { metric_name: "error_rate", value: 0.015, version: "after" },
  ],
  null,
  2
);

const METRIC_DEFINITIONS = [
  { key: "clicks", label: "Clicks", description: "User interaction volume" },
  { key: "conversion_rate", label: "Conversion Rate", description: "Successful outcome ratio (e.g. 0.05)" },
  { key: "latency", label: "Latency (ms)", description: "System response time" },
  { key: "error_rate", label: "Error Rate", description: "Failed request ratio (e.g. 0.02)" },
];

export default function Integrations() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("guided"); // "guided" | "json"
  const [changeDescription, setChangeDescription] = useState("Live API Ingestion Run");
  const [guidedForm, setGuidedForm] = useState(DEFAULT_GUIDED_FORM);
  const [jsonInput, setJsonInput] = useState(DEFAULT_JSON_PAYLOAD);

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");
  const [signalsSent, setSignalsSent] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const [apiOnline, setApiOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState("");
  const [connectionFeedback, setConnectionFeedback] = useState(null);

  const apiBaseUrl = getCurrentApiBaseUrl();
  const ingestEndpoint = `${apiBaseUrl}/ingest`;

  // Check backend API connectivity and status
  async function checkConnection() {
    try {
      setChecking(true);
      setConnectionFeedback(null);

      const currentUrl = getCurrentApiBaseUrl();
      await checkApiHealth();

      setApiOnline(true);
      setConnectionFeedback({
        type: "success",
        message: `Connected: SECONDORDER API is online and reachable at ${currentUrl}`,
      });
    } catch (error) {
      setApiOnline(false);
      setConnectionFeedback({
        type: "error",
        message: error.message || "Unable to reach the SECONDORDER API.",
      });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkConnection();
  }, []);

  async function copyText(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  }

  function handleGuidedChange(version, key, value) {
    setGuidedForm((prev) => ({
      ...prev,
      [version]: {
        ...prev[version],
        [key]: value,
      },
    }));
  }

  async function handleGuidedSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    // Validate fields
    for (const version of ["before", "after"]) {
      for (const m of METRIC_DEFINITIONS) {
        const val = guidedForm[version][m.key];
        if (val === "" || val === null || val === undefined || isNaN(Number(val))) {
          const capVersion = version.charAt(0).toUpperCase() + version.slice(1);
          setErrorMessage(`Enter a valid numeric value for ${capVersion} → ${m.label}.`);
          return;
        }
      }
    }

    // Build 8 signals
    const signals = [];
    for (const m of METRIC_DEFINITIONS) {
      signals.push({
        metric_name: m.key,
        value: Number(guidedForm.before[m.key]),
        version: "before",
      });
      signals.push({
        metric_name: m.key,
        value: Number(guidedForm.after[m.key]),
        version: "after",
      });
    }

    await executeLiveAnalysisFlow(signals);
  }

  async function handleJsonSubmit(e) {
    e.preventDefault();
    setErrorMessage(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (err) {
      setErrorMessage(`Invalid JSON syntax: ${err.message}`);
      return;
    }

    const validMetrics = new Set(["clicks", "conversion_rate", "latency", "error_rate"]);
    let signals = [];

    if (Array.isArray(parsed)) {
      signals = parsed;
    } else if (typeof parsed === "object" && parsed !== null) {
      signals = [parsed];
    } else {
      setErrorMessage("JSON payload must be a JSON object or array of metric signal objects.");
      return;
    }

    // Validate signals
    for (let i = 0; i < signals.length; i++) {
      const item = signals[i];
      if (!item || typeof item !== "object") {
        setErrorMessage(`Signal #${i + 1} must be an object.`);
        return;
      }
      if (!validMetrics.has(String(item.metric_name).toLowerCase())) {
        setErrorMessage(`Signal #${i + 1}: Invalid metric_name "${item.metric_name}". Expected clicks, conversion_rate, latency, or error_rate.`);
        return;
      }
      if (typeof item.value !== "number" || isNaN(item.value)) {
        setErrorMessage(`Signal #${i + 1}: "value" must be a valid number.`);
        return;
      }
      if (!["before", "after"].includes(String(item.version).toLowerCase())) {
        setErrorMessage(`Signal #${i + 1}: "version" must be "before" or "after".`);
        return;
      }
    }

    if (signals.length < 8) {
      setErrorMessage(`The backend requires all 8 metric signals (4 metrics x 2 versions). You provided ${signals.length} signals. Please provide all 8 signals or switch to Guided Mode.`);
      return;
    }

    await executeLiveAnalysisFlow(signals);
  }

  async function executeLiveAnalysisFlow(signals) {
    try {
      setSubmitting(true);
      setSignalsSent(0);
      setSubmitProgress("Initializing Live API session...");

      // 1. Start live session
      await startLiveSession({
        analysis_name: "Live API Ingestion Run",
        before_version: "v1.0 Baseline",
        after_version: "v1.1 Candidate",
        change_description: changeDescription || "Live API Ingestion Run",
      });

      // 2. Ingest signals sequentially
      for (let i = 0; i < signals.length; i++) {
        setSubmitProgress(`Sending signal ${i + 1} of ${signals.length}...`);
        setSignalsSent(i + 1);

        const ingestRes = await ingestMetric(signals[i]);
        if (ingestRes.status !== "success") {
          throw new Error(ingestRes.error || ingestRes.detail || `Failed to ingest signal ${i + 1}`);
        }
      }

      // 3. Request evaluation
      setSubmitProgress("Analyzing deployment signals...");
      const result = await getLiveAnalysis();

      if (result.status === "success" && result.analysis_id) {
        setSubmitProgress("Analysis ready! Opening Decision Room...");
        navigate(`/decision-room/${result.analysis_id}`);
      } else {
        throw new Error(result.message || "Live API analysis failed or model was not ready.");
      }
    } catch (err) {
      console.error("Live API analysis error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during Live API ingestion.");
      setSubmitting(false);
    }
  }

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / Integrations
        </span>

        <span className={`integration-top-status ${apiOnline ? "online" : "offline"}`}>
          <span />
          {checking
            ? "Checking API"
            : apiOnline
            ? "API Online"
            : "API Offline"}
        </span>
      </header>

      <div className="page-content integrations-page">
        <section className="integrations-heading">
          <div>
            <span className="eyebrow">INTEGRATIONS & LIVE API</span>
            <h2>Live API Console</h2>
            <p>
              Send deployment signals directly to SECONDORDER through the live ingestion API,
              or use the guided console below to run instant live API evaluations.
            </p>
          </div>

          <button
            className="integration-refresh-button"
            onClick={checkConnection}
            disabled={checking || submitting}
          >
            <RefreshCw
              size={15}
              className={checking ? "integration-spin" : ""}
            />
            {checking ? "Checking..." : "Check connection"}
          </button>
        </section>

        {connectionFeedback && (
          <div
            className={
              connectionFeedback.type === "error"
                ? "analysis-run-error"
                : "settings-message"
            }
            style={{ marginBottom: "20px" }}
          >
            {connectionFeedback.type === "success" ? (
              <Check size={15} />
            ) : (
              <TriangleAlert size={15} />
            )}
            <span>{connectionFeedback.message}</span>
          </div>
        )}

        {/* LIVE API CONSOLE PANEL */}
        <section className="live-api-console-panel">
          <div className="console-tab-header">
            <div className="console-tabs">
              <button
                type="button"
                className={`console-tab ${mode === "guided" ? "active" : ""}`}
                onClick={() => setMode("guided")}
                disabled={submitting}
              >
                <Sliders size={15} />
                Guided Form
              </button>

              <button
                type="button"
                className={`console-tab ${mode === "json" ? "active" : ""}`}
                onClick={() => setMode("json")}
                disabled={submitting}
              >
                <Code2 size={15} />
                Advanced JSON Mode
              </button>
            </div>

            <div className="console-context-input">
              <label>Change Description:</label>
              <input
                type="text"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="e.g. Production v2.4 Release Metrics"
                disabled={submitting}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="live-api-error-banner">
              <TriangleAlert size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitting && (
            <div className="live-api-progress-banner">
              <div className="progress-info">
                <RefreshCw size={16} className="integration-spin" />
                <span>{submitProgress}</span>
                <strong>{signalsSent} / 8 signals</strong>
              </div>
              <div className="progress-bar-track">
                <span style={{ width: `${Math.round((signalsSent / 8) * 100)}%` }} />
              </div>
            </div>
          )}

          {mode === "guided" ? (
            <form onSubmit={handleGuidedSubmit} className="console-guided-form">
              <div className="guided-columns-grid">
                {/* BEFORE COLUMN */}
                <div className="guided-version-column">
                  <div className="version-header before">
                    <span className="version-tag">BEFORE</span>
                    <h4>Pre-Deployment Baseline</h4>
                  </div>

                  <div className="guided-fields-list">
                    {METRIC_DEFINITIONS.map((m) => (
                      <div key={m.key} className="guided-field-item">
                        <div className="field-label-group">
                          <label>{m.label}</label>
                          <span className="field-desc">{m.description}</span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={guidedForm.before[m.key]}
                          onChange={(e) => handleGuidedChange("before", m.key, e.target.value)}
                          placeholder="e.g. 100"
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AFTER COLUMN */}
                <div className="guided-version-column">
                  <div className="version-header after">
                    <span className="version-tag">AFTER</span>
                    <h4>Post-Deployment Observed</h4>
                  </div>

                  <div className="guided-fields-list">
                    {METRIC_DEFINITIONS.map((m) => (
                      <div key={m.key} className="guided-field-item">
                        <div className="field-label-group">
                          <label>{m.label}</label>
                          <span className="field-desc">{m.description}</span>
                        </div>
                        <input
                          type="number"
                          step="any"
                          value={guidedForm.after[m.key]}
                          onChange={(e) => handleGuidedChange("after", m.key, e.target.value)}
                          placeholder="e.g. 120"
                          disabled={submitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="console-action-footer">
                <p className="console-footer-note">
                  Submitting generates all 8 metric signals and evaluates decision intelligence.
                </p>

                <button
                  type="submit"
                  className="primary-button live-analysis-run-btn"
                  disabled={submitting || !apiOnline}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="integration-spin" />
                      Running Live Analysis...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Live Analysis
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJsonSubmit} className="console-json-form">
              <div className="json-editor-container">
                <div className="json-editor-header">
                  <span>POST Payload (8 Metric Signals Array)</span>
                  <button
                    type="button"
                    className="json-reset-btn"
                    onClick={() => setJsonInput(DEFAULT_JSON_PAYLOAD)}
                    disabled={submitting}
                  >
                    Reset Example
                  </button>
                </div>

                <textarea
                  className="json-textarea"
                  rows={14}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste JSON array of metric objects..."
                  disabled={submitting}
                />
              </div>

              <div className="console-action-footer">
                <p className="console-footer-note">
                  JSON Mode validates payload fields and ingests all signals sequentially into the live session.
                </p>

                <button
                  type="submit"
                  className="primary-button live-analysis-run-btn"
                  disabled={submitting || !apiOnline}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="integration-spin" />
                      Ingesting JSON Signals...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Ingest JSON Signals
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* API DOCUMENTATION & OVERVIEW SECTION */}
        <section className="integration-main-grid">
          <div className="integration-main-column">
            <article className="integration-panel">
              <div className="integration-panel-heading">
                <div>
                  <span className="eyebrow">LIVE ENDPOINT</span>
                  <h3>Direct REST API Access</h3>
                </div>
                <span className="integration-method">POST</span>
              </div>

              <div className="integration-endpoint">
                <code>{ingestEndpoint}</code>
                <button
                  type="button"
                  onClick={() => copyText(ingestEndpoint, "endpoint")}
                >
                  <Clipboard size={14} />
                  {copied === "endpoint" ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="integration-help-text">
                External tools (e.g. CI/CD pipelines, curl, or custom monitoring) can POST individual metric signals to this endpoint. You can also run live evaluations directly using the Live API Console above.
              </p>
            </article>
          </div>

          <aside className="integration-side-column">
            <article className="integration-panel">
              <span className="eyebrow">DOCUMENTATION</span>
              <h3>FastAPI Interactive Docs</h3>
              <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 16px" }}>
                Inspect OpenAPI specifications and try live requests directly via Swagger UI.
              </p>
              <button
                type="button"
                className="integration-docs-button"
                onClick={() => window.open(`${apiBaseUrl}/docs`, "_blank")}
              >
                Open FastAPI Docs
                <ExternalLink size={15} />
              </button>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}