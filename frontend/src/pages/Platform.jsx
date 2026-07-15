import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Database,
  GitCompareArrows,
  Radio,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Radio,
    title: "Collect signals",
    text: "Receive clicks, conversion rate, latency, and error rate from a simulation or live REST API.",
  },
  {
    number: "02",
    icon: Database,
    title: "Build evidence",
    text: "Group observations into before and after versions so every system change has a clear comparison.",
  },
  {
    number: "03",
    icon: GitCompareArrows,
    title: "Compare the change",
    text: "Measure how every signal moved instead of judging the deployment from one metric alone.",
  },
  {
    number: "04",
    icon: BrainCircuit,
    title: "Analyze the pattern",
    text: "The Random Forest model evaluates the combined signal pattern and estimates the likely outcome.",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Make the decision",
    text: "SECONDORDER presents the outcome, confidence, risk level, and evidence behind the recommendation.",
  },
];

export default function Platform() {
  const navigate = useNavigate();

  return (
    <main className="info-page">
      <InfoNavigation
        navigate={navigate}
        active="Platform"
      />

      <section className="info-hero">
        <span className="info-eyebrow">
          THE PLATFORM
        </span>

        <h1>
          From system change
          <span>to evidence-backed action.</span>
        </h1>

        <p>
          SECONDORDER turns raw deployment
          signals into a structured decision.
          It follows the complete change,
          compares the before-and-after pattern,
          and shows what should happen next.
        </p>

        <button
          type="button"
          className="info-primary-button"
          onClick={() =>
            navigate("/command-center")
          }
        >
          Enter the platform
          <ArrowRight size={17} />
        </button>
      </section>

      <section className="info-section">
        <div className="info-section-heading">
          <span>HOW IT WORKS</span>

          <h2>
            One continuous decision pipeline.
          </h2>
        </div>

        <div className="platform-flow-grid">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                className="info-card platform-step-card"
                key={step.number}
              >
                <div className="info-card-top">
                  <span className="info-icon">
                    <Icon size={21} />
                  </span>

                  <span className="step-number">
                    {step.number}
                  </span>
                </div>

                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="info-cta">
        <div>
          <span className="info-eyebrow">
            READY TO ANALYZE
          </span>

          <h2>
            See the complete workflow in action.
          </h2>
        </div>

        <button
          type="button"
          className="info-primary-button"
          onClick={() =>
            navigate("/new-analysis")
          }
        >
          Run an analysis
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