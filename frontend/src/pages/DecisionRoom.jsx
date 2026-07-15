import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  GitCompareArrows,
  Database,
} from "lucide-react";

export default function DecisionRoom() {
  const navigate = useNavigate();

  const storedResult = localStorage.getItem(
    "secondorder_result"
  );

  if (!storedResult) {
    return (
      <main className="product-main">
        <div className="page-content">
          <h2>No analysis found</h2>

          <p className="decision-room-muted">
            Run a new analysis to generate a decision.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/new-analysis")
            }
          >
            Start New Analysis
          </button>
        </div>
      </main>
    );
  }

  let result;

  try {
    result = JSON.parse(storedResult);
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <main className="product-main">
        <div className="page-content">
          <h2>
            Analysis could not be loaded
          </h2>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/new-analysis")
            }
          >
            Start New Analysis
          </button>
        </div>
      </main>
    );
  }

  const analysis = result.analysis || {};
  const context = result.context || {};
  const insights = analysis.insights || {};
  const aiReasoning = analysis.ai_reasoning || {};

  const decision =
    analysis.prediction || "UNKNOWN";

  const confidence = (
    Number(analysis.confidence || 0) * 100
  ).toFixed(1);

  /*
 
  Use dynamic ML reasoning first.
  If unavailable, use old warning reasons.
  */



  const classProbabilities =
    analysis.class_probabilities || {};

  const analysisName =
    context.analysis_name ||
    "Untitled Analysis";

  const beforeVersion =
    context.before_version || "Before";

  const afterVersion =
    context.after_version || "After";

  const changeDescription =
    context.change_description ||
    "No change description provided.";

  const dataSource =
    context.data_source || "simulation";

  return (
    <main className="product-main">
      <header className="topbar">
        <button
          className="decision-back-button"
          onClick={() =>
            navigate("/new-analysis")
          }
        >
          <ArrowLeft size={16} />
          New Analysis
        </button>

        <span className="analysis-draft">
          Analysis complete
        </span>
      </header>

      <div className="page-content decision-room-page">

        {/* ======================================
            PAGE HEADING
        ====================================== */}

        <section className="decision-room-heading">
          <div>
            <span className="eyebrow">
              DECISION ROOM
            </span>

            <h2>{analysisName}</h2>

            <p>
              Review the system change,
              deployment evidence, and Random
              Forest prediction.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate("/new-analysis")
            }
          >
            <RotateCcw size={15} />
            Run another analysis
          </button>
        </section>

        {/* ======================================
            DEPLOYMENT CONTEXT
        ====================================== */}

        <section className="deployment-context-card">
          <div className="deployment-context-main">
            <div className="deployment-context-icon">
              <GitCompareArrows size={20} />
            </div>

            <div>
              <span className="eyebrow">
                SYSTEM CHANGE
              </span>

              <h3>
                {beforeVersion}
                {" → "}
                {afterVersion}
              </h3>

              <p>{changeDescription}</p>
            </div>
          </div>

          <div className="deployment-context-source">
            <Database size={15} />

            <div>
              <span>DATA SOURCE</span>

              <strong>
                {formatDataSource(dataSource)}
              </strong>
            </div>
          </div>
        </section>

        {/* ======================================
            MAIN ML DECISION
        ====================================== */}

        <section
          className={`decision-result-hero ${getDecisionClass(
            decision
          )}`}
        >
          <div>
            <div className="analysis-label">
              <Sparkles size={15} />
              ML DEPLOYMENT DECISION
            </div>

            <h1>{decision}</h1>

            <p className="decision-result-summary">
              {analysis.summary ||
                "The deployment signals were analyzed successfully."}
            </p>

            <div className="decision-meta-row">
              <div>
                <span>
                  Version transition
                </span>

                <strong>
                  {beforeVersion}
                  {" → "}
                  {afterVersion}
                </strong>
              </div>

              <div>
                <span>
                  Signals analyzed
                </span>

                <strong>
                  {result.signals_generated ||
                    0}
                </strong>
              </div>

              <div>
                <span>Risk level</span>

                <strong>
                  {analysis.risk_level ||
                    "UNKNOWN"}
                </strong>
              </div>
            </div>
          </div>

          <div className="decision-confidence">
            <span>
              MODEL CONFIDENCE
            </span>

            <strong>
              {confidence}%
            </strong>

            <p>
              Random Forest prediction
            </p>
          </div>
        </section>

        {/* ======================================
            DECISION CONTENT
        ====================================== */}

        <section className="decision-room-grid">

          {/* LEFT COLUMN */}

          <div className="decision-main-column">

            {/* SIGNAL EVIDENCE */}

            <div className="decision-section-heading">
              <span className="eyebrow">
                SIGNAL EVIDENCE
              </span>

              <h3>What changed?</h3>
            </div>

            <div className="decision-metric-grid">

              <DecisionMetric
                title="Clicks"
                data={insights.clicks}
              />

              <DecisionMetric
                title="Conversion Rate"
                data={insights.conversion_rate}
              />

              <DecisionMetric
                title="Latency"
                data={insights.latency}
              />

              <DecisionMetric
                title="Error Rate"
                data={insights.error_rate}
              />

            </div>

            <div className="executive-summary-card">

              <div className="decision-card-icon">
                <Sparkles size={18} />
              </div>

              <div>

                <span className="eyebrow">
                  AI EXECUTIVE SUMMARY
                </span>

                <h3>
                  Executive Summary
                </h3>

                <p className="summary-text">
                  {aiReasoning.summary}
                </p>

              </div>

            </div>

            {/* ==================================
                DYNAMIC DECISION REASONING
            ================================== */}

            <div className="decision-explanation-card">
              <div className="decision-card-icon">
                <Sparkles size={19} />
              </div>

              <div>
                <span className="eyebrow">
                  AI DEPLOYMENT ANALYSIS
                </span>

                <h3>
                  Engineering assessment
                </h3>

                <div className="ai-analysis-section">
                  <h4>Deployment Intent</h4>

                  <p>
                    {aiReasoning.deployment_intent ||
                      "Unknown"}
                  </p>
                </div>

                <div className="ai-analysis-section">
                  <h4>
                    Components Affected
                  </h4>

                  {(aiReasoning.components || [])
                    .length > 0 ? (
                    <ul>
                      {aiReasoning.components.map(
                        (component) => (
                          <li key={component}>
                            {component}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No components identified.
                    </p>
                  )}
                </div>

                <div className="ai-analysis-section">
                  <h4>
                    Positive Impacts
                  </h4>

                  {(aiReasoning.positive_impacts ||
                    []).length > 0 ? (
                    <ul>
                      {aiReasoning.positive_impacts.map(
                        (impact) => (
                          <li key={impact}>
                            {impact}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No positive impacts identified.
                    </p>
                  )}
                </div>

                <div className="ai-analysis-section">
                  <h4>
                    Potential Risks
                  </h4>

                  {(aiReasoning.risks || [])
                    .length > 0 ? (
                    <ul>
                      {aiReasoning.risks.map(
                        (risk) => (
                          <li key={risk}>
                            {risk}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No significant risks identified.
                    </p>
                  )}
                </div>


              </div>
            </div>
          </div>
          {/* ====================================
              RIGHT COLUMN
          ==================================== */}

          <aside className="decision-side-column">
            <div className="decision-side-card">

              <div className="decision-card-icon">
                <Sparkles size={18} />
              </div>

              <span className="eyebrow">
                AI RECOMMENDATION
              </span>

              <div className="recommendation-content">

                <div className="recommendation-text">
                  {aiReasoning.recommendation}
                </div>

                <div className="recommendation-meta">

                  <div
                    className={`risk-pill ${(
                      analysis.risk_level || ""
                    ).toLowerCase()}`}
                  >
                    {analysis.risk_level || "UNKNOWN"}
                  </div>

                  <div className="confidence-pill">
                    Confidence {(analysis.confidence * 100).toFixed(1)}%
                  </div>

                </div>

              </div>

            </div>

            {/* ==================================
                ML CLASS PROBABILITIES
            ================================== */}

            <div className="decision-side-card">
              <span className="eyebrow">
                ML PREDICTION
              </span>

              <h3>
                Outcome probabilities
              </h3>

              {Object.keys(
                classProbabilities
              ).length > 0 ? (
                <div className="probability-list">
                  {Object.entries(
                    classProbabilities
                  ).map(
                    ([
                      className,
                      probability,
                    ]) => {
                      const percentage =
                        Number(probability) *
                        100;

                      const isWinner =
                        className === decision;

                      return (
                        <div
                          className={`probability-item ${isWinner
                            ? "winner"
                            : ""
                            }`}
                          key={className}
                        >
                          <div className="probability-header">
                            <span>
                              {className}
                            </span>

                            <strong>
                              {percentage.toFixed(
                                1
                              )}
                              %
                            </strong>
                          </div>

                          <div className="probability-track">
                            <div
                              className="probability-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="decision-room-muted">
                  Run a new analysis to
                  generate Random Forest class
                  probabilities.
                </p>
              )}

              <div className="model-output-divider" />

              <div className="model-output-row">
                <span>Model</span>

                <strong>
                  {analysis.model_info
                    ?.name ||
                    "Random Forest Classifier"}
                </strong>
              </div>

              <div className="model-output-row">
                <span>
                  Model version
                </span>

                <strong>
                  {analysis.model_info
                    ?.version ||
                    "1.0.0"}
                </strong>
              </div>

              <div className="model-output-row">
                <span>
                  Outcome classes
                </span>

                <strong>
                  {Object.keys(
                    classProbabilities
                  ).length || 4}
                </strong>
              </div>

              <div className="model-output-row">
                <span>
                  Analysis status
                </span>

                <strong>
                  Complete
                </strong>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

/*
==========================================
DECISION METRIC COMPONENT
==========================================
*/

function DecisionMetric({
  title,
  data,
}) {
  if (!data) {
    return (
      <article className="decision-metric-card">
        <span>{title}</span>

        <strong>—</strong>

        <p>No data</p>
      </article>
    );
  }

  const percentage = Number(
    data.percentage_change || 0
  );

  return (
    <article className="decision-metric-card">
      <span>{title}</span>

      <strong>
        {percentage > 0 ? "+" : ""}
        {percentage.toFixed(1)}%
      </strong>

      <p>
        {Number(
          data.before || 0
        ).toFixed(3)}

        {" → "}

        {Number(
          data.after || 0
        ).toFixed(3)}
      </p>

      <div
        className={`decision-metric-status ${data.impact || ""
          }`}
      >
        {data.impact || "unknown"}
      </div>
    </article>
  );
}

/*
==========================================
FORMAT DATA SOURCE
==========================================
*/

function formatDataSource(source) {
  switch (source) {
    case "simulation":
      return "Demo Simulation";

    case "api":
      return "Live API";

    case "csv":
      return "Uploaded CSV";

    default:
      return source;
  }
}

/*
==========================================
DECISION COLOR CLASS
==========================================
*/

function getDecisionClass(decision) {
  switch (decision) {
    case "SAFE TO DEPLOY":
      return "result-safe";

    case "REVIEW REQUIRED":
      return "result-review";

    case "RISKY CHANGE":
      return "result-risky";

    case "ROLLBACK":
      return "result-rollback";

    default:
      return "";
  }
}