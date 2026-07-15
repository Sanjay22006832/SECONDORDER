import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  GitBranch,
  Layers3,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const outcomeClasses = [
  {
    name: "SAFE TO DEPLOY",
    description: "Positive deployment pattern",
    icon: CheckCircle2,
    tone: "safe",
  },
  {
    name: "REVIEW REQUIRED",
    description: "Mixed or uncertain signals",
    icon: Clock3,
    tone: "review",
  },
  {
    name: "RISKY CHANGE",
    description: "High-risk deployment pattern",
    icon: ShieldAlert,
    tone: "risky",
  },
  {
    name: "ROLLBACK",
    description: "Critical negative pattern",
    icon: RotateCcw,
    tone: "rollback",
  },
];

const featureLabels = {
  clicks_change: "Clicks",
  conversion_rate_change: "Conversion Rate",
  latency_change: "Latency",
  error_rate_change: "Error Rate",
};

export default function ModelIntelligence() {
  const navigate = useNavigate();

  const storedResult = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "secondorder_result"
        ) || "null"
      );
    } catch {
      return null;
    }
  }, []);

  const analysis =
    storedResult?.analysis || {};

  const modelInfo =
    analysis.model_info || {};

  const featureImportance =
    modelInfo.feature_importance || {};

  const accuracy =
    Number(
      modelInfo.test_accuracy || 0
    ) * 100;

  const features = Object.entries(
    featureImportance
  ).sort((a, b) => b[1] - a[1]);

  const topFeature =
    features.length > 0
      ? featureLabels[features[0][0]] ||
        features[0][0]
      : "Waiting for analysis";

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / Model Intelligence
        </span>

        <span className="model-status">
          <span className="live-dot" />
          Model active
        </span>
      </header>

      <div className="page-content model-page">
        <section className="model-heading">
          <div>
            <span className="eyebrow">
              MODEL INTELLIGENCE
            </span>

            <h2>
              Inside the decision engine.
            </h2>

            <p>
              Understand the trained model behind
              SECONDORDER deployment decisions.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/new-analysis")
            }
          >
            Run New Analysis
            <ArrowRight size={16} />
          </button>
        </section>

        <section className="model-hero-card model-interactive-hero">
          <div className="model-hero-glow" />

          <div className="model-hero-icon">
            <BrainCircuit size={27} />
          </div>

          <div className="model-hero-content">
            <span className="eyebrow">
              <Sparkles size={12} />
              ACTIVE MODEL
            </span>

            <h1>
              {modelInfo.name ||
                "Random Forest Classifier"}
            </h1>

            <p>
              Multi-class deployment risk
              classification using four system
              behavior signals.
            </p>

            <div className="model-hero-insight">
              <span>
                MOST INFLUENTIAL SIGNAL
              </span>

              <strong>
                {topFeature}
              </strong>
            </div>
          </div>

          <div className="model-version">
            <span>MODEL VERSION</span>

            <strong>
              v{modelInfo.version || "1.0.0"}
            </strong>
          </div>
        </section>

        <section className="model-stat-grid">
          <ModelStat
            icon={CheckCircle2}
            label="Test Accuracy"
            value={
              accuracy > 0
                ? `${accuracy.toFixed(1)}%`
                : "—"
            }
            delay="0s"
          />

          <ModelStat
            icon={Database}
            label="Training Samples"
            value={formatNumber(
              modelInfo.training_samples
            )}
            delay="0.07s"
          />

          <ModelStat
            icon={Database}
            label="Testing Samples"
            value={formatNumber(
              modelInfo.testing_samples
            )}
            delay="0.14s"
          />

          <ModelStat
            icon={Layers3}
            label="Outcome Classes"
            value="4"
            delay="0.21s"
          />
        </section>

        <section className="model-content-grid">
          <div className="model-feature-card model-interactive-surface">
            <div className="model-section-heading">
              <div>
                <span className="eyebrow">
                  FEATURE IMPORTANCE
                </span>

                <h3>
                  What influences the model?
                </h3>
              </div>

              <span className="model-section-meta">
                Random Forest
              </span>
            </div>

            {features.length > 0 ? (
              <div className="feature-importance-list">
                {features.map(
                  (
                    [feature, importance],
                    index
                  ) => {
                    const percentage =
                      Number(importance) * 100;

                    return (
                      <div
                        className="feature-importance-item model-interactive-feature"
                        key={feature}
                        style={{
                          "--feature-delay":
                            `${index * 0.1}s`,
                        }}
                      >
                        <div className="feature-importance-header">
                          <div>
                            <span className="feature-rank">
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </span>

                            <strong>
                              {featureLabels[
                                feature
                              ] || feature}
                            </strong>
                          </div>

                          <span>
                            {percentage.toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>

                        <div className="feature-importance-track">
                          <div
                            className="feature-importance-fill model-animated-feature-fill"
                            style={{
                              "--feature-width":
                                `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                              "--feature-delay":
                                `${index * 0.1}s`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="model-empty-state">
                <p>
                  Run a fresh analysis to load
                  model feature importance.
                </p>
              </div>
            )}
          </div>

          <div className="model-classes-card model-interactive-surface">
            <span className="eyebrow">
              PREDICTION SPACE
            </span>

            <h3>
              Four possible outcomes
            </h3>

            <div className="model-class-list">
              {outcomeClasses.map(
                (item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className={`model-class-item model-interactive-class ${item.tone}`}
                      key={item.name}
                    >
                      <span className="model-class-number">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      <span className="model-class-icon">
                        <Icon size={16} />
                      </span>

                      <div>
                        <strong>
                          {item.name}
                        </strong>

                        <p>
                          {item.description}
                        </p>
                      </div>

                      <ArrowRight
                        className="model-class-arrow"
                        size={15}
                      />
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section className="pipeline-card model-interactive-surface">
          <div className="model-section-heading">
            <div>
              <span className="eyebrow">
                PREDICTION PIPELINE
              </span>

              <h3>
                From system signals to decision
              </h3>
            </div>

            <GitBranch size={20} />
          </div>

          <div className="pipeline-flow">
            <PipelineStep
              number="01"
              title="Collect"
              text="Before and after deployment signals"
              delay="0s"
            />

            <PipelineArrow delay="0.12s" />

            <PipelineStep
              number="02"
              title="Transform"
              text="Calculate percentage-change features"
              delay="0.24s"
            />

            <PipelineArrow delay="0.36s" />

            <PipelineStep
              number="03"
              title="Predict"
              text="Random Forest evaluates the pattern"
              delay="0.48s"
            />

            <PipelineArrow delay="0.6s" />

            <PipelineStep
              number="04"
              title="Decide"
              text="Return class probabilities and outcome"
              delay="0.72s"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function ModelStat({
  icon: Icon,
  label,
  value,
  delay,
}) {
  return (
    <article
      className="model-stat-card model-interactive-stat"
      style={{
        "--model-stat-delay": delay,
      }}
    >
      <div className="model-stat-icon">
        <Icon size={18} />
      </div>

      <span>{label}</span>

      <strong>{value}</strong>
    </article>
  );
}

function PipelineStep({
  number,
  title,
  text,
  delay,
}) {
  return (
    <div
      className="pipeline-step model-interactive-pipeline-step"
      style={{
        "--pipeline-delay": delay,
      }}
    >
      <span>{number}</span>

      <strong>{title}</strong>

      <p>{text}</p>
    </div>
  );
}

function PipelineArrow({ delay }) {
  return (
    <ArrowRight
      className="pipeline-arrow model-animated-pipeline-arrow"
      size={17}
      style={{
        "--pipeline-delay": delay,
      }}
    />
  );
}

function formatNumber(value) {
  const number = Number(value || 0);

  if (!number) {
    return "—";
  }

  return number.toLocaleString();
}