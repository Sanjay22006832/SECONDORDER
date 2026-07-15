import { useEffect, useState } from "react";
import {
  Activity,
  Check,
  Clipboard,
  Code2,
  Database,
  ExternalLink,
  RefreshCw,
  Server,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";
const INGEST_ENDPOINT = `${API_BASE_URL}/ingest`;

const requestExample = `{
  "metric_name": "latency",
  "value": 270,
  "version": "after"
}`;

const metrics = [
  {
    name: "clicks",
    description: "User interaction volume",
  },
  {
    name: "conversion_rate",
    description: "Successful outcome ratio",
  },
  {
    name: "latency",
    description: "System response time",
  },
  {
    name: "error_rate",
    description: "Failed request ratio",
  },
];

export default function Integrations() {
  const [apiOnline, setApiOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState("");

  async function checkConnection() {
    try {
      setChecking(true);

      const response = await fetch(
        `${API_BASE_URL}/health`
      );

      setApiOnline(response.ok);
    } catch {
      setApiOnline(false);
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

      setTimeout(() => {
        setCopied("");
      }, 1500);
    } catch {
      setCopied("");
    }
  }

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / Integrations
        </span>

        <span
          className={`integration-top-status ${
            apiOnline ? "online" : "offline"
          }`}
        >
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
            <span className="eyebrow">
              INTEGRATIONS
            </span>

            <h2>
              Connect your systems.
            </h2>

            <p>
              Send deployment signals from any application
              to SECONDORDER through the live ingestion API.
            </p>
          </div>

          <button
            className="integration-refresh-button"
            onClick={checkConnection}
            disabled={checking}
          >
            <RefreshCw
              size={15}
              className={
                checking ? "integration-spin" : ""
              }
            />

            {checking
              ? "Checking..."
              : "Check connection"}
          </button>
        </section>

        <section className="integration-overview-grid">
          <article className="integration-status-card">
            <div className="integration-card-icon">
              <Server size={20} />
            </div>

            <span className="eyebrow">
              API STATUS
            </span>

            <h3>
              {apiOnline
                ? "SECONDORDER is online"
                : "Backend unavailable"}
            </h3>

            <p>
              {apiOnline
                ? "The FastAPI backend is ready to receive deployment signals."
                : "Start the backend server to enable live ingestion."}
            </p>

            <div
              className={`integration-connection-state ${
                apiOnline ? "online" : "offline"
              }`}
            >
              <span />

              {apiOnline
                ? "Connected"
                : "Disconnected"}
            </div>
          </article>

          <article className="integration-status-card">
            <div className="integration-card-icon">
              <Activity size={20} />
            </div>

            <span className="eyebrow">
              INGESTION MODE
            </span>

            <h3>Real-time REST API</h3>

            <p>
              Metrics are accepted individually and analyzed
              as before-and-after deployment evidence.
            </p>

            <div className="integration-feature">
              <Check size={13} />
              Automatic live session tracking
            </div>
          </article>

          <article className="integration-status-card">
            <div className="integration-card-icon">
              <Database size={20} />
            </div>

            <span className="eyebrow">
              SIGNAL MODEL
            </span>

            <h3>4 deployment metrics</h3>

            <p>
              SECONDORDER compares four core signals across
              the before and after versions.
            </p>

            <div className="integration-feature">
              <Check size={13} />
              Random Forest decision output
            </div>
          </article>
        </section>

        <section className="integration-main-grid">
          <div className="integration-main-column">
            <article className="integration-panel">
              <div className="integration-panel-heading">
                <div>
                  <span className="eyebrow">
                    LIVE ENDPOINT
                  </span>

                  <h3>Send a deployment signal</h3>
                </div>

                <span className="integration-method">
                  POST
                </span>
              </div>

              <div className="integration-endpoint">
                <code>{INGEST_ENDPOINT}</code>

                <button
                  onClick={() =>
                    copyText(
                      INGEST_ENDPOINT,
                      "endpoint"
                    )
                  }
                >
                  <Clipboard size={14} />

                  {copied === "endpoint"
                    ? "Copied"
                    : "Copy"}
                </button>
              </div>

              <p className="integration-help-text">
                Start a Live API session from New Analysis,
                then send metrics to this endpoint.
              </p>
            </article>

            <article className="integration-panel">
              <div className="integration-panel-heading">
                <div>
                  <span className="eyebrow">
                    REQUEST BODY
                  </span>

                  <h3>JSON format</h3>
                </div>

                <Code2 size={19} />
              </div>

              <div className="integration-code-block">
                <pre>{requestExample}</pre>

                <button
                  onClick={() =>
                    copyText(
                      requestExample,
                      "json"
                    )
                  }
                >
                  <Clipboard size={14} />

                  {copied === "json"
                    ? "Copied"
                    : "Copy JSON"}
                </button>
              </div>

              <div className="integration-field-grid">
                <IntegrationField
                  name="metric_name"
                  type="string"
                  description="One of the four supported metrics."
                />

                <IntegrationField
                  name="value"
                  type="number"
                  description="The observed metric value."
                />

                <IntegrationField
                  name="version"
                  type="string"
                  description="Must be before or after."
                />
              </div>
            </article>
          </div>

          <aside className="integration-side-column">
            <article className="integration-panel">
              <span className="eyebrow">
                SUPPORTED SIGNALS
              </span>

              <h3>Required metrics</h3>

              <div className="integration-metric-list">
                {metrics.map((metric) => (
                  <div
                    className="integration-metric"
                    key={metric.name}
                  >
                    <div>
                      <Activity size={14} />

                      <code>{metric.name}</code>
                    </div>

                    <p>{metric.description}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="integration-panel">
              <span className="eyebrow">
                CONNECTION FLOW
              </span>

              <h3>How it works</h3>

              <div className="integration-step-list">
                <IntegrationStep
                  number="01"
                  text="Start a Live API session."
                />

                <IntegrationStep
                  number="02"
                  text="Send before and after metrics."
                />

                <IntegrationStep
                  number="03"
                  text="SECONDORDER tracks collection progress."
                />

                <IntegrationStep
                  number="04"
                  text="The Random Forest model generates a decision."
                />
              </div>
            </article>

            <button
              className="integration-docs-button"
              onClick={() =>
                window.open(
                  `${API_BASE_URL}/docs`,
                  "_blank"
                )
              }
            >
              Open FastAPI Docs
              <ExternalLink size={15} />
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function IntegrationField({
  name,
  type,
  description,
}) {
  return (
    <div className="integration-field">
      <div>
        <code>{name}</code>
        <span>{type}</span>
      </div>

      <p>{description}</p>
    </div>
  );
}

function IntegrationStep({ number, text }) {
  return (
    <div className="integration-step">
      <span>{number}</span>
      <p>{text}</p>
    </div>
  );
}