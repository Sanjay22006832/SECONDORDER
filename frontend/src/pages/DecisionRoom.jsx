import { useEffect, useState } from "react";
import "./DecisionRoom2.css";

import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Sparkles,
    Activity,
    ShieldAlert,
    BrainCircuit,
    Database,
} from "lucide-react";

import { getAnalysisById } from "../services/api";

export default function DecisionRoom() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load analysis details from SQLite history endpoint
        async function loadAnalysis() {
            try {
                const data = await getAnalysisById(id);
                if (data.status === "success") {
                    setResult(data.analysis);
                }
            } catch (error) {
                console.error("Failed to load analysis:", error);
            } finally {
                setLoading(false);
            }
        }
        loadAnalysis();
    }, [id]);

    if (loading) {
        return <main className="product-main"><div className="page-content"><h2>Loading Decision...</h2></div></main>;
    }

    if (!result) {
        return <main className="product-main"><div className="page-content"><h2>Analysis not found</h2><button className="primary-button" onClick={() => navigate("/deployments")}>Back</button></div></main>;
    }

    const analysis = result.analysis || {};
    const context = result;
    const insights = analysis.insights || {};
    const reasoning = analysis.ai_reasoning || {};
    const decision = analysis.prediction || "UNKNOWN";
    const confidence = (Number(analysis.confidence || 0) * 100).toFixed(1);

    const rawPrimaryCause = insights.latency?.impact === "worsened" && insights.error_rate?.impact === "worsened"
        ? "The deployment most likely introduced a backend performance regression. Slower responses appear to be contributing to additional request failures and a degraded user experience."
        : insights.error_rate?.impact === "worsened"
        ? "The deployment most likely introduced a reliability regression. Increased request failures are likely disrupting the user journey after release."
        : insights.latency?.impact === "worsened"
        ? "The deployment most likely introduced a performance regression. Slower application responses may be degrading the experience for active users."
        : "No single technical root cause can be established from deployment metrics alone. Repository Intelligence is required for a code-level explanation.";

    return (
        <main className="product-main decision-workspace">
            <div className="page-content decision-workspace-content">
                <header className="decision-topbar">
                    <button className="secondary-button" onClick={() => navigate("/deployments")}>
                        <ArrowLeft size={16} /> Deployments
                    </button>
                    <span className="decision-topbar-status">Analysis complete</span>
                </header>

                {/* 1. DEPLOYMENT DECISION */}
                <section className="decision-header">
                    <div className="decision-header-left">
                        <span className="eyebrow">Deployment decision</span>
                        <div className="decision-heading-row">
                            <h1>{decision}</h1>
                        </div>
                        <p>{reasoning.summary || analysis.summary || "Deployment analysis completed."}</p>
                    </div>
                    <div className="decision-header-right">
                        <div className="decision-stat"><span>Confidence</span><strong>{confidence}%</strong></div>
                        <div className="decision-stat"><span>Risk level</span><strong>{analysis.risk_level || "UNKNOWN"}</strong></div>
                        <div className="decision-stat"><span>Data source</span><strong>{context.data_source || "Simulation"}</strong></div>
                        <div className="decision-stat"><span>Version transition</span><strong>{context.before_version || "Before"} → {context.after_version || "After"}</strong></div>
                    </div>
                </section>

                <div className="decision-stack">
                    {/* 2. SIGNAL EVIDENCE */}
                    <section className="signal-section">
                        <div className="section-header">
                            <div><span className="eyebrow">Signal evidence</span><h2>Deployment signals at a glance</h2></div>
                            <span className="section-note">Before → after comparison</span>
                        </div>
                        <div className="metric-grid">
                            <article className="metric-card">
                                <div className="metric-title"><Activity size={18} /><span>Clicks</span></div>
                                <div className="metric-values"><div><label>Before</label><h3>{Number(insights.clicks?.before || 0).toFixed(3)}</h3></div><div><label>After</label><h3>{Number(insights.clicks?.after || 0).toFixed(3)}</h3></div></div>
                                <div className="metric-footer"><span className="metric-change">{Number(insights.clicks?.percentage_change || 0).toFixed(2)}%</span><span className={`metric-status ${insights.clicks?.impact || "neutral"}`}>{insights.clicks?.impact || "Unknown"}</span></div>
                            </article>
                            <article className="metric-card">
                                <div className="metric-title"><Activity size={18} /><span>Conversion rate</span></div>
                                <div className="metric-values"><div><label>Before</label><h3>{Number(insights.conversion_rate?.before || 0).toFixed(4)}</h3></div><div><label>After</label><h3>{Number(insights.conversion_rate?.after || 0).toFixed(4)}</h3></div></div>
                                <div className="metric-footer"><span className="metric-change">{Number(insights.conversion_rate?.percentage_change || 0).toFixed(2)}%</span><span className={`metric-status ${insights.conversion_rate?.impact || "neutral"}`}>{insights.conversion_rate?.impact || "Unknown"}</span></div>
                            </article>
                            <article className="metric-card">
                                <div className="metric-title"><Database size={18} /><span>Latency</span></div>
                                <div className="metric-values"><div><label>Before</label><h3>{Number(insights.latency?.before || 0).toFixed(3)}</h3></div><div><label>After</label><h3>{Number(insights.latency?.after || 0).toFixed(3)}</h3></div></div>
                                <div className="metric-footer"><span className="metric-change">{Number(insights.latency?.percentage_change || 0).toFixed(2)}%</span><span className={`metric-status ${insights.latency?.impact || "neutral"}`}>{insights.latency?.impact || "Unknown"}</span></div>
                            </article>
                            <article className="metric-card">
                                <div className="metric-title"><ShieldAlert size={18} /><span>Error rate</span></div>
                                <div className="metric-values"><div><label>Before</label><h3>{Number(insights.error_rate?.before || 0).toFixed(4)}</h3></div><div><label>After</label><h3>{Number(insights.error_rate?.after || 0).toFixed(4)}</h3></div></div>
                                <div className="metric-footer"><span className="metric-change">{Number(insights.error_rate?.percentage_change || 0).toFixed(2)}%</span><span className={`metric-status ${insights.error_rate?.impact || "neutral"}`}>{insights.error_rate?.impact || "Unknown"}</span></div>
                            </article>
                        </div>
                    </section>

                    {/* 3. DEPLOYMENT ANALYSIS (Placed ABOVE Deployment Investigation) */}
                    <section className="engineering-section">
                        <div className="section-header">
                            <div>
                                <span className="eyebrow">ENGINEERING ASSESSMENT</span>
                                <h2>Deployment Analysis</h2>
                            </div>
                        </div>
                        <div className="engineering-grid">
                            <article className="engineering-card"><h3>Deployment Intent</h3><p>{reasoning.deployment_intent || "Unknown"}</p></article>
                            <article className="engineering-card"><h3>Components Affected</h3>{(reasoning.components || []).length > 0 ? (<ul>{reasoning.components.map(component => (<li key={component}>{component}</li>))}</ul>) : (<p>None detected.</p>)}</article>
                            <article className="engineering-card"><h3>Positive Impacts</h3>{(reasoning.positive_impacts || []).length > 0 ? (<ul>{reasoning.positive_impacts.map(item => (<li key={item}>{item}</li>))}</ul>) : (<p>No positive impacts detected.</p>)}</article>
                            <article className="engineering-card"><h3>Potential Risks</h3>{(reasoning.risks || []).length > 0 ? (<ul>{reasoning.risks.map(risk => (<li key={risk}>{risk}</li>))}</ul>) : (<p>No significant risks.</p>)}</article>
                        </div>
                    </section>

                    {/* 4. DEPLOYMENT INVESTIGATION */}
                    {/* 4. DEPLOYMENT INVESTIGATION (ROOT CAUSE ANALYSIS) */}
                    {(() => {
                        const metricsList = [
                            { key: "latency", label: "Latency", unit: "ms", before: Number(insights.latency?.before || 0), after: Number(insights.latency?.after || 0), pct: Number(insights.latency?.percentage_change || 0), impact: insights.latency?.impact || "neutral" },
                            { key: "error_rate", label: "Error rate", unit: "", before: Number(insights.error_rate?.before || 0), after: Number(insights.error_rate?.after || 0), pct: Number(insights.error_rate?.percentage_change || 0), impact: insights.error_rate?.impact || "neutral" },
                            { key: "conversion_rate", label: "Conversion rate", unit: "", before: Number(insights.conversion_rate?.before || 0), after: Number(insights.conversion_rate?.after || 0), pct: Number(insights.conversion_rate?.percentage_change || 0), impact: insights.conversion_rate?.impact || "neutral" },
                            { key: "clicks", label: "Clicks", unit: "", before: Number(insights.clicks?.before || 0), after: Number(insights.clicks?.after || 0), pct: Number(insights.clicks?.percentage_change || 0), impact: insights.clicks?.impact || "neutral" }
                        ];

                        const worsened = metricsList.filter(m => m.impact === "worsened");
                        const improved = metricsList.filter(m => m.impact === "improved");

                        const subtitleText = worsened.length >= 3
                            ? "Performance, reliability, and user outcomes degraded sharply post-release."
                            : worsened.length === 2 && improved.length === 0
                            ? "Performance and reliability regressions observed following deployment."
                            : worsened.length > 0 && improved.length > 0
                            ? "Mixed signal detected: metrics show conflicting performance and user outcome trends post-release."
                            : improved.length > 0
                            ? "The release improved operational and conversion metrics with no regressions detected."
                            : "Deployment signals remained stable post-release within normal baseline variance.";

                        const evidenceStrength = (worsened.length === 4 || improved.length === 4 || (worsened.length >= 3 && improved.length === 0))
                            ? { level: "HIGH", color: "#65d6b3", text: "Strong signal alignment across all 4 observed metrics." }
                            : (worsened.length > 0 && improved.length > 0)
                            ? { level: "MIXED", color: "#ffc107", text: "Conflicting signal directions detected between operational and conversion metrics." }
                            : { level: "MODERATE", color: "#64b5f6", text: "Consistent baseline evidence with moderate signal agreement." };

                        return (
                            <section className="ai-incident-report rca-redesign">
                                {/* 1. INVESTIGATION HEADER */}
                                <div className="rca-header">
                                    <div>
                                        <span className="eyebrow">DEPLOYMENT INVESTIGATION</span>
                                        <h2>Deployment Root Cause Analysis</h2>
                                        <p className="rca-subtitle">{subtitleText}</p>
                                    </div>
                                    <div className="rca-evidence-badge">
                                        <span className="rca-badge-label">EVIDENCE STRENGTH</span>
                                        <strong style={{ color: evidenceStrength.color }}>{evidenceStrength.level}</strong>
                                    </div>
                                </div>

                                {/* 2. WHAT CHANGED */}
                                <div className="rca-block">
                                    <div className="rca-block-title">
                                        <Activity size={16} />
                                        <span>WHAT CHANGED</span>
                                    </div>
                                    <div className="rca-changes-grid">
                                        {metricsList.map(m => {
                                            const isWorse = m.impact === "worsened";
                                            const isBetter = m.impact === "improved";
                                            const sign = m.pct > 0 ? "+" : "";
                                            const valBefore = m.key === "conversion_rate" || m.key === "error_rate" ? m.before.toFixed(4) : m.before.toFixed(1);
                                            const valAfter = m.key === "conversion_rate" || m.key === "error_rate" ? m.after.toFixed(4) : m.after.toFixed(1);

                                            return (
                                                <div key={m.key} className={`rca-change-card ${m.impact}`}>
                                                    <div className="rca-change-header">
                                                        <span className="rca-change-label">{m.label}</span>
                                                        <span className={`rca-status-pill ${m.impact}`}>
                                                            {isWorse ? `${sign}${m.pct.toFixed(1)}% WORSE` : isBetter ? `${sign}${m.pct.toFixed(1)}% BETTER` : "STABLE"}
                                                        </span>
                                                    </div>
                                                    <div className="rca-change-values">
                                                        <strong>{valBefore}{m.unit ? ` ${m.unit}` : ""}</strong>
                                                        <span className="rca-arrow">→</span>
                                                        <strong className="rca-after-val">{valAfter}{m.unit ? ` ${m.unit}` : ""}</strong>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. WHAT THE MODEL SAW */}
                                <div className="rca-block">
                                    <div className="rca-block-title">
                                        <BrainCircuit size={16} />
                                        <span>WHAT THE MODEL SAW</span>
                                    </div>
                                    <ul className="rca-model-list">
                                        <li>{worsened.length > 0 ? `${worsened.length} of 4 observed signals moved in a negative direction post-deployment.` : `All primary production metrics exhibited positive or stable operational trends post-release.`}</li>
                                        {worsened.length > 0 && (
                                            <li>The largest regression was observed in <strong>{worsened[0].label}</strong> ({worsened[0].pct > 0 ? "+" : ""}{worsened[0].pct.toFixed(1)}% change).</li>
                                        )}
                                        {insights.latency?.impact === "worsened" && insights.error_rate?.impact === "worsened" && (
                                            <li>Latency increased significantly while error rate spiked, indicating a backend latency or throughput bottleneck under load.</li>
                                        )}
                                        {insights.conversion_rate?.impact === "worsened" && (
                                            <li>User journey conversion dropped by {Math.abs(Number(insights.conversion_rate?.percentage_change || 0)).toFixed(1)}%, reflecting negative impact on active checkout/session completion.</li>
                                        )}
                                        {worsened.length >= 3 && (
                                            <li>The simultaneous regression across performance, reliability, and conversion matches high-risk deployment failure signatures evaluated by Random Forest.</li>
                                        )}
                                        {improved.length >= 3 && (
                                            <li>All primary operational metrics improved cleanly post-release, matching low-risk deployment patterns.</li>
                                        )}
                                    </ul>
                                </div>

                                {/* 4. WHY THIS DECISION */}
                                <div className="rca-block">
                                    <div className="rca-block-title">
                                        <ShieldAlert size={16} />
                                        <span>WHY THIS DECISION</span>
                                    </div>
                                    <p className="rca-decision-summary">
                                        {decision === "REVIEW REQUIRED"
                                            ? "REVIEW REQUIRED was recommended because the overall deployment signal is not strong enough to support an automatic approval or rollback. The observed behavior contains competing signals, so the safest action is to review the deployment before making a final decision."
                                            : decision === "ROLLBACK"
                                            ? "ROLLBACK was recommended because the overall deployment signal indicates unacceptable performance and reliability degradation across system boundaries. Immediate rollback is advised to safeguard system health and user experience."
                                            : decision === "RISKY CHANGE"
                                            ? "RISKY CHANGE was flagged because production signals indicate elevated technical risk with clear performance or reliability degradation requiring mitigation."
                                            : "SAFE TO DEPLOY was confirmed because the overall deployment evidence shows stable operational performance with no critical degradation patterns detected."
                                        }
                                    </p>
                                    <div className="rca-evidence-bullets">
                                        <span className="rca-bullets-label">DECISION CONTEXT</span>
                                        <ul>
                                            <li><strong>Signal consistency:</strong> {worsened.length > 0 && improved.length > 0 ? "Mixed" : "Consistent"}</li>
                                            <li><strong>Deployment impact:</strong> {worsened.length >= 3 || decision === "ROLLBACK" ? "High" : worsened.length > 0 ? "Moderate" : "Low"}</li>
                                            <li><strong>Decision confidence:</strong> {confidence}%</li>
                                            <li><strong>Recommended action:</strong> {decision === "ROLLBACK" ? "Rollback release" : decision === "REVIEW REQUIRED" ? "Engineering review" : decision === "RISKY CHANGE" ? "Mitigate or rollback" : "Proceed with deployment"}</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 5. ENGINEERING INTERPRETATION */}
                                <div className="rca-block">
                                    <div className="rca-block-title">
                                        <Sparkles size={16} />
                                        <span>ENGINEERING INTERPRETATION</span>
                                    </div>
                                    <p className="rca-interpretation-text">
                                        {decision === "REVIEW REQUIRED"
                                            ? "The deployment does not present a clear enough pattern to classify as either a clean improvement or a clear regression. The evidence suggests the change should be investigated before it is considered stable."
                                            : decision === "ROLLBACK"
                                            ? "The deployment presents a clear high-risk regression pattern across system telemetry. The evidence indicates significant runtime degradation following release, requiring immediate intervention."
                                            : decision === "RISKY CHANGE"
                                            ? "The deployment exhibits elevated risk signatures that threaten application stability. The observed telemetry indicates system degradation that warrants active engineering attention."
                                            : "The deployment exhibits healthy operational behavior across measured signals. System telemetry indicates smooth processing within expected baseline boundaries."
                                        }
                                    </p>
                                    <div className="rca-evidence-bullets">
                                        <span className="rca-bullets-label">WHAT TO CHECK</span>
                                        <ul>
                                            <li>Review the release scope and affected components.</li>
                                            <li>Compare the behavior against the previous stable version.</li>
                                            <li>Check whether the observed pattern persists across subsequent runs.</li>
                                            <li>Confirm whether the change affects a critical user or system path.</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* 6. INVESTIGATION CONFIDENCE */}
                                <div className="rca-footer-summary">
                                    <div className="rca-footer-left">
                                        <span>EVIDENCE AGREEMENT</span>
                                        <p>{evidenceStrength.text}</p>
                                    </div>
                                    <div className="rca-footer-right">
                                        <span>MODEL CONFIDENCE</span>
                                        <strong>{confidence}%</strong>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}
                </div>

                <footer className="decision-footer"><div><strong>SECONDORDER</strong><span>Decision Intelligence Platform</span></div><div className="footer-tags"><span>React</span><span>FastAPI</span><span>SQLite</span></div></footer>
            </div>
        </main>
    );
}
