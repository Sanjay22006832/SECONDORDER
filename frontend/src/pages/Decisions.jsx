import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";

const decisions = [
  {
    icon: CheckCircle2,
    className: "decision-safe-card",
    label: "SAFE TO DEPLOY",
    action: "KEEP THE CHANGE",
    text: "The overall signal pattern indicates positive or acceptable system behavior with no critical reliability risk.",
  },
  {
    icon: Clock3,
    className: "decision-review-card",
    label: "REVIEW REQUIRED",
    action: "INVESTIGATE FIRST",
    text: "The deployment contains mixed evidence. Some metrics improved while another signal introduced meaningful uncertainty.",
  },
  {
    icon: RotateCcw,
    className: "decision-rollback-card",
    label: "ROLLBACK",
    action: "REVERSE THE CHANGE",
    text: "The deployment shows a high-risk pattern where reliability or system health has deteriorated significantly.",
  },
];

export default function Decisions() {
  const navigate = useNavigate();

  return (
    <main className="info-page">
      <InfoNavigation
        navigate={navigate}
        active="Decisions"
      />

      <section className="info-hero">
        <span className="info-eyebrow">
          DECISION OUTPUT
        </span>

        <h1>
          Evidence should end
          <span>in an action.</span>
        </h1>

        <p>
          SECONDORDER does not stop at charts
          and percentage changes. It converts
          the full signal pattern into a clear
          deployment recommendation.
        </p>

        <button
          type="button"
          className="info-primary-button"
          onClick={() =>
            navigate("/decision-room")
          }
        >
          Open Decision Room
          <ArrowRight size={17} />
        </button>
      </section>

      <section className="info-section">
        <div className="info-section-heading">
          <span>THREE OUTCOMES</span>

          <h2>
            Know what happens next.
          </h2>
        </div>

        <div className="decision-info-grid">
          {decisions.map((decision) => {
            const Icon = decision.icon;

            return (
              <article
                className={`info-card decision-info-card ${decision.className}`}
                key={decision.label}
              >
                <span className="info-icon">
                  <Icon size={23} />
                </span>

                <span className="decision-action">
                  {decision.action}
                </span>

                <h3>{decision.label}</h3>

                <p>{decision.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="info-cta">
        <div>
          <span className="info-eyebrow">
            YOUR NEXT DECISION
          </span>

          <h2>
            Analyze a real system change.
          </h2>
        </div>

        <button
          type="button"
          className="info-primary-button"
          onClick={() =>
            navigate("/new-analysis")
          }
        >
          Start new analysis
          <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
}

function InfoNavigation({
  navigate,
  active,
}) {
  return (
    <header className="info-navigation">
      <button
        type="button"
        className="info-brand"
        onClick={() => navigate("/")}
      >
        <span>SO</span>
        <strong>SECONDORDER</strong>
      </button>

      <nav>
        {[
          ["Platform", "/platform"],
          ["Intelligence", "/intelligence"],
          ["Decisions", "/decisions"],
        ].map(([label, path]) => (
          <button
            type="button"
            key={label}
            className={
              active === label ? "active" : ""
            }
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="info-back-button"
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={16} />
        Home
      </button>
    </header>
  );
}