import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Gauge,
  MousePointerClick,
  Percent,
  Timer,
  TriangleAlert,
} from "lucide-react";

const signals = [
  {
    icon: MousePointerClick,
    name: "Clicks",
    direction: "Higher can be better",
    text: "Measures user interaction volume before and after the change.",
  },
  {
    icon: Percent,
    name: "Conversion rate",
    direction: "Higher is better",
    text: "Measures whether more users complete the desired outcome.",
  },
  {
    icon: Timer,
    name: "Latency",
    direction: "Lower is better",
    text: "Measures system response time and performance after deployment.",
  },
  {
    icon: TriangleAlert,
    name: "Error rate",
    direction: "Lower is better",
    text: "Measures failed requests and reliability problems introduced by the change.",
  },
];

export default function Intelligence() {
  const navigate = useNavigate();

  return (
    <main className="info-page">
      <InfoNavigation
        navigate={navigate}
        active="Intelligence"
      />

      <section className="info-hero">
        <span className="info-eyebrow">
          SYSTEM INTELLIGENCE
        </span>

        <h1>
          One metric never tells
          <span>the whole story.</span>
        </h1>

        <p>
          SECONDORDER analyzes multiple signals
          together. The model looks for combined
          patterns, conflicts, reliability risks,
          and performance gains before producing
          a deployment decision.
        </p>

        <button
          type="button"
          className="info-primary-button"
          onClick={() => navigate("/model")}
        >
          Open Model Intelligence
          <ArrowRight size={17} />
        </button>
      </section>

      <section className="info-section">
        <div className="info-section-heading">
          <span>SIGNAL MODEL</span>

          <h2>
            Four signals. One system view.
          </h2>
        </div>

        <div className="signal-info-grid">
          {signals.map((signal) => {
            const Icon = signal.icon;

            return (
              <article
                className="info-card"
                key={signal.name}
              >
                <span className="info-icon">
                  <Icon size={21} />
                </span>

                <h3>{signal.name}</h3>

                <strong className="signal-direction">
                  {signal.direction}
                </strong>

                <p>{signal.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="intelligence-feature">
        <div className="intelligence-feature-icon">
          <BrainCircuit size={34} />
        </div>

        <div>
          <span className="info-eyebrow">
            RANDOM FOREST MODEL
          </span>

          <h2>
            Pattern recognition across the
            complete deployment.
          </h2>

          <p>
            The model evaluates the relationship
            between all available signals and
            predicts whether the observed change
            resembles a safe, uncertain, or
            high-risk deployment pattern.
          </p>
        </div>

        <div className="confidence-example">
          <Gauge size={22} />

          <span>MODEL CONFIDENCE</span>
          <strong>87.4%</strong>

          <div>
            <span />
          </div>
        </div>
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