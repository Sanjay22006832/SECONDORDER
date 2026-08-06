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

const API = "http://127.0.0.1:8000";

export default function DecisionRoom() {
    const navigate = useNavigate();
    const { id } = useParams();
    console.log("DecisionRoom mounted");
    console.log("DecisionRoom ID:", id);

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalysis() {
            try {
                const response = await fetch(`${API}/history/${id}`);
                const data = await response.json();
                console.log("GET /history response:", data);
                if (data.status === "success") {
                    setResult(data.analysis);
                }
            } catch (error) {
                console.error(error);
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
        return <main className="product-main"><div className="page-content"><h2>Analysis not found</h2><button className="primary-button" onClick={() => navigate("/history")}>Back</button></div></main>;
    }


    const analysis = result.analysis || {};
    const context = result;
    const insights = analysis.insights || {};
    const reasoning = analysis.ai_reasoning || {};
    const decision = analysis.prediction || "UNKNOWN";
    const confidence = (Number(analysis.confidence || 0) * 100).toFixed(1);
    const probabilities = analysis.class_probabilities || {};

    return (
        <main className="product-main decision-workspace">
            <div className="page-content decision-workspace-content">
                <header className="decision-topbar">
                    <button className="secondary-button" onClick={() => navigate("/history")}>
                        <ArrowLeft size={16} /> Decision History
                    </button>
                    <span className="decision-topbar-status">Analysis complete</span>
                </header>

                <section className="decision-header">
                    <div className="decision-header-left">
                        <span className="eyebrow">Deployment decision</span>
                        <div className="decision-heading-row">
                            <h1>{decision}</h1>
                            <span className="decision-live-indicator"><span /> AI reviewed</span>
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

                <div className="decision2-dashboard">
                    <div className="dashboard-left">
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

                        <section className="ai-incident-report">
                            <div className="incident-report-header">
                                <div>
                                    <span className="eyebrow">AI incident report</span>
                                    <h2>AI Deployment Investigation</h2>
                                </div>
                                <div className="incident-severity">
                                    <span>Incident severity</span>
                                    <strong>{analysis.risk_level || "UNKNOWN"}</strong>
                                </div>
                            </div>

                            <div className="incident-status">
                                <Sparkles size={18} />
                                <div>
                                    <span>Deployment status</span>
                                    <p>{decision === "ROLLBACK" || decision === "RISKY CHANGE" ? "The deployment completed successfully, but the AI detected production regressions immediately after release." : decision === "REVIEW REQUIRED" ? "The deployment completed successfully, but the AI detected a mixed production signal that needs engineering review." : "The deployment completed successfully, with no material production regressions detected by the AI."}</p>
                                </div>
                            </div>

                            <div className="incident-report-grid">
                                <article className="incident-primary-cause">
                                    <span className="incident-label">Primary root cause</span>
                                    <p>{insights.latency?.impact === "worsened" && insights.error_rate?.impact === "worsened" ? "AI inference: the deployment most likely introduced a backend performance regression. Slower responses appear to be contributing to additional request failures and a degraded user experience." : insights.error_rate?.impact === "worsened" ? "AI inference: the deployment most likely introduced a reliability regression. Increased request failures are likely disrupting the user journey after release." : insights.latency?.impact === "worsened" ? "AI inference: the deployment most likely introduced a performance regression. Slower application responses may be degrading the experience for active users." : "AI inference: no single technical root cause can be established from deployment metrics alone. Repository Intelligence is required for a code-level explanation."}</p>
                                </article>

                                <article className="incident-confidence">
                                    <span className="incident-label">AI confidence</span>
                                    <strong>{confidence}%</strong>
                                    <span>Random Forest decision confidence</span>
                                </article>

                                <article className="incident-panel incident-findings">
                                    <span className="incident-label">Observed behaviour</span>
                                    <ul>
                                        <li>{insights.clicks?.impact === "worsened" ? "User engagement dropped after deployment." : insights.clicks?.impact === "improved" ? "User engagement improved after deployment." : "User engagement remained broadly stable after deployment."}</li>
                                        <li>{insights.conversion_rate?.impact === "worsened" ? "The user journey is converting less effectively after release." : insights.conversion_rate?.impact === "improved" ? "The user journey is converting more effectively after release." : "Conversion behaviour remained broadly stable after deployment."}</li>
                                        <li>{insights.latency?.impact === "worsened" ? "API response time increased significantly after deployment." : insights.latency?.impact === "improved" ? "Application response time improved after deployment." : "Application response time remained broadly stable after deployment."}</li>
                                        <li>{insights.error_rate?.impact === "worsened" ? "The application is experiencing a higher failure rate after deployment." : insights.error_rate?.impact === "improved" ? "The application is experiencing fewer request failures after deployment." : "Application reliability remained broadly stable after deployment."}</li>
                                    </ul>
                                </article>

                                <article className="incident-panel incident-actions">
                                    <span className="incident-label">Immediate actions</span>
                                    <div className="action-priority"><strong>Immediate</strong><ol><li>{reasoning.recommendation || "No immediate action is available."}</li></ol></div>
                                    <div className="action-priority"><strong>Investigation</strong><p>Commit history is unavailable for this deployment. Additional repository context is required.</p></div>
                                    <div className="action-priority"><strong>Validation</strong><p>Validation guidance cannot be generated without repository and release metadata.</p></div>
                                </article>

                                <article className="incident-panel incident-causes">
                                    <span className="incident-label">Possible technical causes</span>
                                    {(analysis.likely_changes || []).length > 0 ? (
                                        <div className="incident-badges">{analysis.likely_changes.map((cause, index) => <span key={`${cause}-${index}`}>{cause}</span>)}</div>
                                    ) : <p>Repository intelligence unavailable. Repository data was not included in this analysis.</p>}
                                </article>

                                <article className="incident-panel incident-business-impact">
                                    <span className="incident-label">Expected user impact</span>
                                    <ul>
                                        {insights.latency?.impact === "worsened" && <li>Users may experience slower application responses.</li>}
                                        {insights.error_rate?.impact === "worsened" && <li>Users may encounter more failed requests.</li>}
                                        {insights.conversion_rate?.impact === "worsened" && <li>Customer conversions may be reduced.</li>}
                                        {insights.clicks?.impact === "worsened" && <li>User engagement may decline.</li>}
                                        {!["worsened"].includes(insights.latency?.impact) && !["worsened"].includes(insights.error_rate?.impact) && !["worsened"].includes(insights.conversion_rate?.impact) && !["worsened"].includes(insights.clicks?.impact) && <li>No material user-impact regression was detected in the available deployment signals.</li>}
                                    </ul>
                                </article>
                            </div>

                            <div className="incident-expected-outcome">
                                <BrainCircuit size={18} />
                                <div><span className="incident-label">Recovery expectation</span><p>Recovery estimate unavailable until additional deployment intelligence becomes available.</p></div>
                            </div>
                        </section>

                    </div>

                    <aside className="dashboard-right">
                        <section className="sidebar-card"><span className="eyebrow">Random Forest model</span><h2>Outcome confidence</h2><div className="prediction-list">{Object.entries(probabilities).map(([label, probability]) => { const value = Number(probability) * 100; const winner = label === decision; return <div key={label} className="prediction-row"><div className="prediction-header"><span>{label}</span><strong>{value.toFixed(1)}%</strong></div><div className="prediction-track"><div className={`prediction-fill ${winner ? "winner" : ""}`} style={{ width: `${value}%` }} /></div></div>; })}</div></section>
                    </aside>
                </div>

                <section className="engineering-section">
                    <div className="section-header">
                        <div>
                            <span className="eyebrow">ENGINEERING ASSESSMENT</span>
                            <h2>AI Deployment Analysis</h2>
                        </div>
                    </div>
                    <div className="engineering-grid">
                        <article className="engineering-card"><h3>Deployment Intent</h3><p>{reasoning.deployment_intent || "Unknown"}</p></article>
                        <article className="engineering-card"><h3>Components Affected</h3>{(reasoning.components || []).length > 0 ? (<ul>{reasoning.components.map(component => (<li key={component}>{component}</li>))}</ul>) : (<p>None detected.</p>)}</article>
                        <article className="engineering-card"><h3>Positive Impacts</h3>{(reasoning.positive_impacts || []).length > 0 ? (<ul>{reasoning.positive_impacts.map(item => (<li key={item}>{item}</li>))}</ul>) : (<p>No positive impacts detected.</p>)}</article>
                        <article className="engineering-card"><h3>Potential Risks</h3>{(reasoning.risks || []).length > 0 ? (<ul>{reasoning.risks.map(risk => (<li key={risk}>{risk}</li>))}</ul>) : (<p>No significant risks.</p>)}</article>
                    </div>
                </section>

                <footer className="decision-footer"><div><strong>SECONDORDER</strong><span>Decision Intelligence Platform</span></div><div className="footer-tags"><span>React</span><span>FastAPI</span><span>SQLite</span><span>Random Forest</span><span>Groq AI</span></div></footer>
            </div>
        </main>
    );
}
