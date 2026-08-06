import "./DecisionHero.css";

export default function DecisionHero({
  decision,
  confidence,
  risk,
  version,
  source,
  status,
  generated,
  recommendation,
}) {
  return (
    <section className="decision-hero">

      <div className="hero-left">

        <p className="hero-label">
          ML Deployment Decision
        </p>

        <h1 className={`hero-decision ${decision.toLowerCase().replace(/\s+/g, "-")}`}>
          {decision}
        </h1>

        <p className="hero-description">
          {recommendation}
        </p>

        <div className="hero-details">

          <div>
            <span>Version</span>
            <strong>{version}</strong>
          </div>

          <div>
            <span>Risk</span>
            <strong>{risk}</strong>
          </div>

          <div>
            <span>Source</span>
            <strong>{source}</strong>
          </div>

          <div>
            <span>Status</span>
            <strong>{status}</strong>
          </div>

          <div>
            <span>Generated</span>
            <strong>{generated}</strong>
          </div>

        </div>

      </div>

      <div className="hero-right">

        <p className="confidence-label">
          MODEL CONFIDENCE
        </p>

        <h1 className="confidence-score">
          {confidence}%
        </h1>

        <div className="confidence-circle">

          <div
            className="confidence-fill"
            style={{
              width: `${confidence}%`,
            }}
          />

        </div>

      </div>

    </section>
  );
}