import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BrainCircuit,
  Check,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const [loaded, setLoaded] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main
      className={`so-landing ${
        loaded ? "is-loaded" : ""
      }`}
    >
      <div className="so-landing-noise" />

      <div className="so-landing-glow so-glow-one" />
      <div className="so-landing-glow so-glow-two" />

      <header className="so-landing-nav">
        <button
          type="button"
          className="so-landing-brand"
          onClick={() => navigate("/")}
        >
          <span className="so-landing-brand-mark">
            SO
          </span>

          <span className="so-landing-brand-text">
            <strong>SECONDORDER</strong>

            <small>
              Decision Intelligence
            </small>
          </span>
        </button>

        <div className="so-landing-nav-center">
  <span
    role="button"
    tabIndex={0}
    onClick={() => navigate("/platform")}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        navigate("/platform");
      }
    }}
  >
    Platform
  </span>

  <span
    role="button"
    tabIndex={0}
    onClick={() => navigate("/intelligence")}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        navigate("/intelligence");
      }
    }}
  >
    Intelligence
  </span>

  <span
    role="button"
    tabIndex={0}
    onClick={() => navigate("/decisions")}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        navigate("/decisions");
      }
    }}
  >
    Decisions
  </span>
</div>

        <button
          type="button"
          className="so-nav-enter"
          onClick={() =>
            navigate("/command-center")
          }
        >
          Enter Platform
          <ArrowRight size={15} />
        </button>
      </header>

      <section className="so-hero">
        <div className="so-hero-copy">
          <div className="so-hero-kicker">
            <Sparkles size={14} />

            DECISION INTELLIGENCE FOR
            SYSTEM CHANGES
          </div>

          <h1>
            See beyond
            <span>the first result.</span>
          </h1>

          <p>
            A system change can improve one
            metric while quietly damaging
            another. SECONDORDER analyzes the
            full before-and-after pattern and
            helps you decide what to do next.
          </p>

          <div className="so-hero-actions">
            <button
              type="button"
              className="so-primary-cta"
              onClick={() =>
                navigate("/command-center")
              }
            >
              Start SECONDORDER
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              className="so-secondary-cta"
              onClick={() =>
                navigate("/new-analysis")
              }
            >
              Run an analysis
            </button>
          </div>

          <div className="so-hero-proof">
            <div>
              <strong>4</strong>
              <span>
                signals analyzed together
              </span>
            </div>

            <div>
              <strong>3</strong>
              <span>
                deployment actions
              </span>
            </div>

            <div>
              <strong>1</strong>
              <span>
                evidence-backed decision
              </span>
            </div>
          </div>
        </div>

        <div className="so-hero-visual">
          <div className="so-visual-orbit so-orbit-one" />
          <div className="so-visual-orbit so-orbit-two" />

          <div className="so-visual-label">
            <span />
            LIVE DECISION INTELLIGENCE
          </div>

          <article className="so-decision-card so-card-review">
            <div className="so-card-top">
              <span className="so-card-icon">
                <BrainCircuit size={18} />
              </span>

              <span className="so-card-label">
                ML DEPLOYMENT DECISION
              </span>

              <span className="so-live-dot" />
            </div>

            <div className="so-card-body">
              <span className="so-small-label">
                CURRENT OUTCOME
              </span>

              <h2>REVIEW REQUIRED</h2>

              <p>
                Positive performance gains were
                detected, but reliability risk
                increased after deployment.
              </p>
            </div>

            <div className="so-card-metrics">
              <Metric
                label="Conversion"
                value="+8.6%"
                state="good"
              />

              <Metric
                label="Latency"
                value="-21.2%"
                state="good"
              />

              <Metric
                label="Error rate"
                value="+135.4%"
                state="bad"
              />
            </div>

            <div className="so-confidence">
              <div>
                <span>MODEL CONFIDENCE</span>
                <strong>87.4%</strong>
              </div>

              <div className="so-confidence-track">
                <span />
              </div>
            </div>
          </article>

          <article className="so-floating-card so-floating-safe">
            <span className="so-floating-icon safe">
              <Check size={15} />
            </span>

            <div>
              <small>OUTCOME</small>
              <strong>SAFE TO DEPLOY</strong>
            </div>

            <span className="so-floating-value">
              94%
            </span>
          </article>

          <article className="so-floating-card so-floating-rollback">
            <span className="so-floating-icon rollback">
              <RotateCcw size={15} />
            </span>

            <div>
              <small>RISK DETECTED</small>
              <strong>ROLLBACK</strong>
            </div>

            <ShieldAlert size={16} />
          </article>

          <div className="so-floating-signal so-signal-one">
            <span>LATENCY</span>
            <strong>-21.2%</strong>
          </div>

          <div className="so-floating-signal so-signal-two">
            <span>ERROR RATE</span>
            <strong>+135.4%</strong>
          </div>
        </div>
      </section>

      <footer className="so-landing-footer">
        <span>Analyze the change.</span>
        <span>Understand the consequence.</span>

        <strong>
          Decide what happens next.
        </strong>
      </footer>
    </main>
  );
}

function Metric({
  label,
  value,
  state,
}) {
  return (
    <div className="so-metric">
      <span>{label}</span>

      <strong className={state}>
        {value}
      </strong>
    </div>
  );
}