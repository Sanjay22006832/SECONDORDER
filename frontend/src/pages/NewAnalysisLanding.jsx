import { useNavigate } from "react-router-dom";
import { Activity, ArrowRight, FileUp, FlaskConical } from "lucide-react";

const investigationTypes = [
  { id: "demo", title: "Demo Simulation", description: "Generate deployment signals for demonstrations and safe testing.", action: "Start Demo", icon: FlaskConical, tone: "demo" },
  { id: "live-api", title: "Live API", description: "Connect real-time deployment signals for continuous analysis.", action: "Connect API", icon: Activity, tone: "api" },
  { id: "upload-dataset", title: "Upload Dataset", description: "Upload a before-and-after CSV dataset for a focused investigation.", action: "Upload CSV", icon: FileUp, tone: "csv" },
];

export default function NewAnalysisLanding() {
  const navigate = useNavigate();

  return (
    <main className="product-main">
      <div className="page-content investigation-type-page">
        <section className="investigation-type-hero">
          <span className="eyebrow">NEW INVESTIGATION</span>
          <h2>Choose Investigation Type</h2>
          <p>Select how SECONDORDER should collect evidence for this deployment decision.</p>
        </section>

        <section className="investigation-type-grid">
          {investigationTypes.map(({ id, title, description, action, icon: Icon, tone }) => (
            <button key={id} type="button" className={`investigation-type-card ${tone}`} onClick={() => navigate(`/new-analysis/${id}`)}>
              <div className="investigation-type-icon"><Icon size={28} /></div>
              <div><h3>{title}</h3><p>{description}</p></div>
              <span className="investigation-type-action">{action} <ArrowRight size={16} /></span>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
