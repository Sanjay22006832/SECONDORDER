import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Activity,
  FileUp,
  FlaskConical,
  ArrowRight,
  Check,
  FileText,
  X,
  Copy,
  Radio,
} from "lucide-react";

import {
  runSimulation,
  uploadCSV,
  startLiveSession,
  ingestMetric,
  getLiveAnalysis,
  getCurrentApiBaseUrl,
} from "../services/api";

const DEFAULT_SETTINGS = {
  pollingInterval: 2000,
  autoOpenDecisionRoom: true,
  autoSaveHistory: true,
};

const sources = [
  {
    id: "simulation",
    icon: FlaskConical,
    title: "Demo Simulation",
    description:
      "Generate simulated before-and-after deployment signals.",
  },
  {
    id: "api",
    icon: Activity,
    title: "Live API",
    description:
      "Analyze metrics continuously received by the ingestion API.",
  },
  {
    id: "csv",
    icon: FileUp,
    title: "Upload CSV",
    description:
      "Analyze an existing before-and-after metrics dataset.",
  },
];

const liveMetrics = [
  {
    key: "clicks",
    label: "Clicks",
  },
  {
    key: "conversion_rate",
    label: "Conversion Rate",
  },
  {
    key: "latency",
    label: "Latency",
  },
  {
    key: "error_rate",
    label: "Error Rate",
  },
];

// Infer active data source from route URL
function getSourceFromPath(pathname) {
  if (pathname.endsWith("/live-api")) return "api";
  if (pathname.endsWith("/upload-dataset")) return "csv";
  return "simulation";
}

// Load persisted Settings from localStorage
function getSavedSettings() {
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem(
        "secondorder_settings"
      ) || "{}"
    );

    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function NewAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();

  const [source, setSource] =
    useState(() => getSourceFromPath(location.pathname));

  const [analysisName, setAnalysisName] =
    useState("");

  const [beforeVersion, setBeforeVersion] =
    useState("");

  const [afterVersion, setAfterVersion] =
    useState("");

  const [
    changeDescription,
    setChangeDescription,
  ] = useState("");

  const [csvFile, setCsvFile] =
    useState(null);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [copied, setCopied] =
    useState(false);

  const [liveConsoleMode, setLiveConsoleMode] =
    useState("guided");

  const [liveGuidedForm, setLiveGuidedForm] =
    useState({
      before: {
        clicks: "1000",
        conversion_rate: "0.05",
        latency: "250",
        error_rate: "0.02",
      },
      after: {
        clicks: "1150",
        conversion_rate: "0.058",
        latency: "220",
        error_rate: "0.015",
      },
    });

  const [liveJsonInput, setLiveJsonInput] =
    useState(
      JSON.stringify(
        [
          { metric_name: "clicks", value: 1000, version: "before" },
          { metric_name: "conversion_rate", value: 0.05, version: "before" },
          { metric_name: "latency", value: 250, version: "before" },
          { metric_name: "error_rate", value: 0.02, version: "before" },
          { metric_name: "clicks", value: 1150, version: "after" },
          { metric_name: "conversion_rate", value: 0.058, version: "after" },
          { metric_name: "latency", value: 220, version: "after" },
          { metric_name: "error_rate", value: 0.015, version: "after" },
        ],
        null,
        2
      )
    );

  const [liveSubmitting, setLiveSubmitting] =
    useState(false);

  const [liveSubmitProgress, setLiveSubmitProgress] =
    useState("");

  const [liveSignalsSent, setLiveSignalsSent] =
    useState(0);

  const [liveConsoleError, setLiveConsoleError] =
    useState("");

  const [lastAnalysisId, setLastAnalysisId] =
    useState(null);

  const [liveSessionActive, setLiveSessionActive] =
    useState(false);

  const [liveSession, setLiveSession] =
    useState(null);

  const [settings, setSettings] =
    useState(getSavedSettings);

  const analysisCompletedRef =
    useRef(false);

  const selectedSource =
    sources.find(
      (item) => item.id === source
    );

  const apiBaseUrl =
    getCurrentApiBaseUrl();

  const ingestEndpoint =
    `${apiBaseUrl}/ingest`;

  const pollingInterval =
    Number(settings.pollingInterval) ||
    2000;

  useEffect(() => {
    setSource(getSourceFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    function refreshSettings() {
      setSettings(getSavedSettings());
    }

    window.addEventListener("focus", refreshSettings);
    return () => {
      window.removeEventListener("focus", refreshSettings);
    };
  }, []);

  function getValidationErrors() {
    const errors = {};

    const cleanName =
      analysisName.trim();

    const cleanBefore =
      beforeVersion.trim();

    const cleanAfter =
      afterVersion.trim();

    const cleanDescription =
      changeDescription.trim();

    if (!cleanName) {
      errors.analysisName =
        "Enter an analysis name.";
    } else if (cleanName.length < 5) {
      errors.analysisName =
        "Use at least 5 characters.";
    }

    if (!cleanBefore) {
      errors.beforeVersion =
        "Enter the before version.";
    } else if (cleanBefore.length < 2) {
      errors.beforeVersion =
        "Use at least 2 characters.";
    }

    if (!cleanAfter) {
      errors.afterVersion =
        "Enter the after version.";
    } else if (cleanAfter.length < 2) {
      errors.afterVersion =
        "Use at least 2 characters.";
    } else if (
      cleanBefore &&
      cleanBefore.toLowerCase() ===
      cleanAfter.toLowerCase()
    ) {
      errors.afterVersion =
        "After version must differ from before version.";
    }

    if (!cleanDescription) {
      errors.changeDescription =
        "Describe what changed.";
    } else if (
      cleanDescription.length < 15
    ) {
      errors.changeDescription =
        "Describe the change in at least 15 characters.";
    }

    return errors;
  }

  function validateChangeDetails() {
    const errors =
      getValidationErrors();

    setFieldErrors(errors);

    if (
      Object.keys(errors).length > 0
    ) {
      setError(
        "Review the highlighted fields before running the analysis."
      );

      return false;
    }

    setError("");

    return true;
  }

  function updateField(
    fieldName,
    value,
    setter
  ) {
    setter(value);

    setSuccessMessage("");

    if (fieldErrors[fieldName]) {
      setFieldErrors((current) => {
        const updated = {
          ...current,
        };

        delete updated[fieldName];

        return updated;
      });
    }

    if (error) {
      setError("");
    }
  }

  function handleSourceChange(sourceId) {
    setSource(sourceId);
    setError("");
    setSuccessMessage("");

    if (sourceId !== "csv") {
      setCsvFile(null);
    }
  }

  function handleFileChange(event) {
    const file =
      event.target.files?.[0];

    setError("");
    setSuccessMessage("");

    if (!file) {
      setCsvFile(null);
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setCsvFile(null);

      setError(
        "Select a valid CSV file."
      );

      event.target.value = "";

      return;
    }

    setCsvFile(file);
  }

  function removeCSV() {
    setCsvFile(null);
    setError("");
    setSuccessMessage("");
  }

  function getAnalysisContext() {
    return {
      analysis_name:
        analysisName.trim(),

      before_version:
        beforeVersion.trim(),

      after_version:
        afterVersion.trim(),

      change_description:
        changeDescription.trim(),
    };
  }



  function handleLiveGuidedChange(version, key, value) {
    setLiveGuidedForm((prev) => ({
      ...prev,
      [version]: {
        ...prev[version],
        [key]: value,
      },
    }));
  }

  async function handleRunLiveAnalysis(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLiveConsoleError("");
    setError("");

    let signals = [];
    if (liveConsoleMode === "guided") {
      for (const ver of ["before", "after"]) {
        for (const m of liveMetrics) {
          const val = liveGuidedForm[ver][m.key];
          if (
            val === "" ||
            val === null ||
            val === undefined ||
            isNaN(Number(val))
          ) {
            const capVer =
              ver.charAt(0).toUpperCase() + ver.slice(1);
            setLiveConsoleError(
              `Enter a valid numeric value for ${capVer} → ${m.label}.`
            );
            return;
          }
        }
      }

      for (const m of liveMetrics) {
        signals.push({
          metric_name: m.key,
          value: Number(liveGuidedForm.before[m.key]),
          version: "before",
        });
        signals.push({
          metric_name: m.key,
          value: Number(liveGuidedForm.after[m.key]),
          version: "after",
        });
      }
    } else {
      let parsed;
      try {
        parsed = JSON.parse(liveJsonInput);
      } catch (err) {
        setLiveConsoleError(
          `Invalid JSON syntax: ${err.message}`
        );
        return;
      }

      if (!Array.isArray(parsed)) {
        setLiveConsoleError(
          "JSON payload must be an array of 8 metric signal objects."
        );
        return;
      }

      if (parsed.length < 8) {
        setLiveConsoleError(
          `The backend requires all 8 metric signals (4 metrics x 2 versions). You provided ${parsed.length} signals.`
        );
        return;
      }

      signals = parsed;
    }

    try {
      setLiveSubmitting(true);
      setRunning(true);
      setLiveSignalsSent(0);
      setLiveSubmitProgress("Starting Live API Session...");

      // Start live session using change context
      await startLiveSession(getAnalysisContext());
      setLiveSessionActive(true);

      // Ingest signals sequentially
      for (let i = 0; i < signals.length; i++) {
        setLiveSubmitProgress(
          `Sending signal ${i + 1} of ${signals.length}...`
        );
        setLiveSignalsSent(i + 1);

        const res = await ingestMetric(signals[i]);
        if (res.status !== "success") {
          throw new Error(
            res.error ||
            res.detail ||
            `Failed to ingest signal ${i + 1}`
          );
        }
      }

      setLiveSubmitProgress("Analyzing deployment signals...");
      const result = await getLiveAnalysis();

      if (result.status === "success" && result.analysis_id) {
        setLiveSubmitProgress("Analysis complete! Navigating to Decision Room...");
        navigate(`/decision-room/${result.analysis_id}`);
      } else if (result.analysis_id) {
        navigate(`/decision-room/${result.analysis_id}`);
      } else {
        throw new Error(
          result.message ||
          "Live API analysis failed or was not ready."
        );
      }
    } catch (err) {
      console.error("Live API execution error:", err);
      setLiveConsoleError(
        err.message ||
        "Could not complete Live API analysis."
      );
      setLiveSubmitting(false);
      setRunning(false);
    }
  }

  async function copyEndpoint() {
    try {
      await navigator.clipboard.writeText(
        ingestEndpoint
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError(
        "Could not copy the endpoint."
      );
    }
  }

  async function handleRunAnalysis() {
    if (!validateChangeDetails()) {
      return;
    }

    setSettings(
      getSavedSettings()
    );

    if (source === "api") {
      await handleRunLiveAnalysis();
      return;
    }

    if (
      source === "csv" &&
      !csvFile
    ) {
      setError(
        "Select a CSV file before running the analysis."
      );

      return;
    }

    try {
      setRunning(true);
      setError("");
      setSuccessMessage("");

      let result;

      const analysisContext =
        getAnalysisContext();

      if (source === "csv") {
        result =
          await uploadCSV(
            csvFile,
            analysisContext
          );
      } else {
        console.log("BEFORE runSimulation");
        result =
          await runSimulation(
            analysisContext
          );
        console.log("AFTER runSimulation");
        console.log(result);
        console.log("FULL RESULT:", result);
        console.log("analysis_id =", result.analysis_id);
        console.log("API BASE:", getCurrentApiBaseUrl());
        console.log(JSON.stringify(result, null, 2));
      }


      saveCompletedResult(
        result,
        source
      );
    } catch (err) {
      setError(
        err.message ||
        "The analysis could not be completed."
      );
    } finally {
      setRunning(false);
    }
  }

  function saveCompletedResult(
    result,
    dataSource
  ) {
    const currentSettings =
      getSavedSettings();

    setLastAnalysisId(result.analysis_id);

    if (
      currentSettings.autoOpenDecisionRoom
    ) {
      navigate(`/decision-room/${result.analysis_id}`);

      return;
    }

    const historyText =
      currentSettings.autoSaveHistory
        ? " It was saved to Deployments history."
        : "";

    setSuccessMessage(
      `Analysis complete.${historyText} Open the Decision Room when you are ready.`
    );
  }

  const progressPercentage =
    Number(
      liveSession?.progress_percentage ||
      0
    );

  const signalsReceived =
    Number(
      liveSession?.signals_received || 0
    );

  const pollingSeconds =
    pollingInterval / 1000;

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / New Analysis
        </span>

        <span className="analysis-draft">
          {liveSessionActive
            ? "Live session active"
            : "Draft analysis"}
        </span>
      </header>

      <div className="page-content analysis-page">
        <section className="analysis-heading">
          <span className="eyebrow">
            NEW ANALYSIS
          </span>

          <h2>
            {source === "api" ? "Connect live deployment intelligence." : source === "csv" ? "Investigate a deployment dataset." : "Run a deployment simulation."}
          </h2>

          <p>
            Configure this investigation, then let SECONDORDER generate an
            AI decision report for your engineering team.
          </p>
        </section>

        <div className="analysis-layout">
          <section className="analysis-form">
            <div className="form-section">
              <div className="form-section-number">
                01
              </div>

              <div className="form-section-content">
                <h3>{selectedSource?.title}</h3>

                <p>
                  {selectedSource?.description}
                </p>

                <button type="button" className="change-investigation-type" onClick={() => navigate("/new-analysis")}>Change investigation type</button>

                {source === "api" && (
                  <div className="live-api-section">
                    <div className="live-api-heading">
                      <div>
                        <span className="eyebrow">
                          LIVE API SESSION
                        </span>

                        <h3>
                          Receive deployment
                          signals
                        </h3>
                      </div>

                      <div
                        className={`live-api-status ${liveSessionActive
                          ? "active"
                          : ""
                          }`}
                      >
                        <span />

                        {liveSessionActive
                          ? "Listening"
                          : "Not started"}
                      </div>
                    </div>

                    <div className="live-endpoint-card">
                      <div>
                        <span>
                          INGEST ENDPOINT
                        </span>

                        <code>
                          POST{" "}
                          {ingestEndpoint}
                        </code>
                      </div>

                      <button
                        type="button"
                        onClick={copyEndpoint}
                      >
                        <Copy size={14} />

                        {copied
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>

                    <div className="live-api-credential">
                      <span>API KEY</span>
                      <strong>No API key is required by the current ingestion endpoint.</strong>
                    </div>

                    {!liveSessionActive && !liveSubmitting ? (
                      <div className="new-analysis-live-console">
                        <div className="live-console-header">
                          <div className="console-tabs">
                            <button
                              type="button"
                              className={`console-tab ${liveConsoleMode === "guided" ? "active" : ""}`}
                              onClick={() => setLiveConsoleMode("guided")}
                              disabled={liveSubmitting}
                            >
                              Guided Form
                            </button>
                            <button
                              type="button"
                              className={`console-tab ${liveConsoleMode === "json" ? "active" : ""}`}
                              onClick={() => setLiveConsoleMode("json")}
                              disabled={liveSubmitting}
                            >
                              Advanced JSON
                            </button>
                          </div>
                        </div>

                        {liveConsoleError && (
                          <div className="live-api-error-banner">
                            <span>{liveConsoleError}</span>
                          </div>
                        )}

                        {liveConsoleMode === "guided" ? (
                          <div className="live-guided-container">
                            <div className="guided-columns-grid">
                              {/* BEFORE COLUMN */}
                              <div className="guided-version-column">
                                <div className="version-header before">
                                  <span className="version-tag">BEFORE</span>
                                  <h4>Pre-Deployment Baseline</h4>
                                </div>
                                <div className="guided-fields-list">
                                  {liveMetrics.map((m) => (
                                    <div key={m.key} className="guided-field-item">
                                      <label>{m.label}</label>
                                      <input
                                        type="number"
                                        step="any"
                                        value={liveGuidedForm.before[m.key]}
                                        onChange={(e) =>
                                          handleLiveGuidedChange("before", m.key, e.target.value)
                                        }
                                        placeholder="0.0"
                                        disabled={liveSubmitting}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* AFTER COLUMN */}
                              <div className="guided-version-column">
                                <div className="version-header after">
                                  <span className="version-tag">AFTER</span>
                                  <h4>Post-Deployment Observed</h4>
                                </div>
                                <div className="guided-fields-list">
                                  {liveMetrics.map((m) => (
                                    <div key={m.key} className="guided-field-item">
                                      <label>{m.label}</label>
                                      <input
                                        type="number"
                                        step="any"
                                        value={liveGuidedForm.after[m.key]}
                                        onChange={(e) =>
                                          handleLiveGuidedChange("after", m.key, e.target.value)
                                        }
                                        placeholder="0.0"
                                        disabled={liveSubmitting}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="live-json-container">
                            <div className="json-editor-header">
                              <span>JSON Array (8 Metric Signals)</span>
                            </div>
                            <textarea
                              className="json-textarea"
                              rows={10}
                              value={liveJsonInput}
                              onChange={(e) => setLiveJsonInput(e.target.value)}
                              disabled={liveSubmitting}
                            />
                          </div>
                        )}

                        <div className="live-console-footer">
                          <p className="live-console-hint">
                            Submitting generates all 8 metric signals and evaluates decision intelligence.
                          </p>
                          <button
                            type="button"
                            className="live-start-button"
                            onClick={handleRunLiveAnalysis}
                            disabled={liveSubmitting}
                          >
                            <Radio size={16} />
                            {liveSubmitting ? "Running Ingestion..." : "Run Live Analysis"}
                          </button>
                        </div>
                      </div>
                    ) : liveSubmitting ? (
                      <div className="live-progress-card">
                        <div className="live-progress-top">
                          <div>
                            <span>INGESTION IN PROGRESS</span>
                            <strong>{liveSubmitProgress}</strong>
                          </div>
                          <div>
                            <span>SIGNALS SENT</span>
                            <strong>{liveSignalsSent} / 8</strong>
                          </div>
                        </div>
                        <div className="live-progress-track">
                          <span
                            style={{
                              width: `${Math.round((liveSignalsSent / 8) * 100)}%`,
                            }}
                          />
                        </div>
                        <p>Transmitting signals and calculating decision score...</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {source === "csv" && (
                  <div className="csv-upload-section">
                    <div className="csv-upload-heading">
                      <div>
                        <span className="eyebrow">
                          CSV DATASET
                        </span>

                        <h3>
                          Upload deployment
                          signals
                        </h3>
                      </div>

                      <span className="csv-format-badge">
                        .CSV
                      </span>
                    </div>

                    {!csvFile ? (
                      <label className="csv-dropzone">
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={
                            handleFileChange
                          }
                        />

                        <div className="csv-dropzone-icon">
                          <FileUp size={22} />
                        </div>

                        <strong>
                          Choose a CSV file
                        </strong>

                        <p>
                          Required columns:
                          timestamp,
                          metric_name, value,
                          version
                        </p>

                        <span>
                          Browse file
                        </span>
                      </label>
                    ) : (
                      <div className="csv-selected-file">
                        <div className="csv-file-icon">
                          <FileText
                            size={20}
                          />
                        </div>

                        <div className="csv-file-details">
                          <strong>
                            {csvFile.name}
                          </strong>

                          <span>
                            {formatFileSize(
                              csvFile.size
                            )}
                          </span>
                        </div>

                        <div className="csv-file-ready">
                          <Check size={13} />
                          Ready
                        </div>

                        <button
                          type="button"
                          className="csv-remove-button"
                          onClick={removeCSV}
                          aria-label="Remove CSV file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    <div className="csv-requirements">
                      <span>
                        Required metrics
                      </span>

                      <div>
                        <strong>
                          clicks
                        </strong>

                        <strong>
                          conversion_rate
                        </strong>

                        <strong>
                          latency
                        </strong>

                        <strong>
                          error_rate
                        </strong>
                      </div>

                      <p>
                        Every metric must
                        contain both{" "}
                        <b>before</b> and{" "}
                        <b>after</b> rows.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-number">
                02
              </div>

              <div className="form-section-content">
                <h3>
                  Deployment Context
                </h3>

                <p>
                  Give the AI enough context to interpret the deployment and
                  preserve a useful decision record.
                </p>

                <div className="field-grid">
                  <label
                    className={`field full-field ${fieldErrors.analysisName
                      ? "field-invalid"
                      : ""
                      }`}
                  >
                    <span>
                      Deployment name
                    </span>

                    <input
                      type="text"
                      value={analysisName}
                      onChange={(event) =>
                        updateField(
                          "analysisName",
                          event.target.value,
                          setAnalysisName
                        )
                      }
                      placeholder="e.g. Checkout API Optimization"
                      aria-invalid={Boolean(
                        fieldErrors.analysisName
                      )}
                    />

                    {fieldErrors.analysisName && (
                      <small className="field-error">
                        {
                          fieldErrors.analysisName
                        }
                      </small>
                    )}
                  </label>

                  <label
                    className={`field ${fieldErrors.beforeVersion
                      ? "field-invalid"
                      : ""
                      }`}
                  >
                    <span>
                      Before version
                    </span>

                    <input
                      type="text"
                      value={beforeVersion}
                      onChange={(event) =>
                        updateField(
                          "beforeVersion",
                          event.target.value,
                          setBeforeVersion
                        )
                      }
                      placeholder="e.g. v2.4.1"
                      aria-invalid={Boolean(
                        fieldErrors.beforeVersion
                      )}
                    />

                    {fieldErrors.beforeVersion && (
                      <small className="field-error">
                        {
                          fieldErrors.beforeVersion
                        }
                      </small>
                    )}
                  </label>

                  <label
                    className={`field ${fieldErrors.afterVersion
                      ? "field-invalid"
                      : ""
                      }`}
                  >
                    <span>
                      After version
                    </span>

                    <input
                      type="text"
                      value={afterVersion}
                      onChange={(event) =>
                        updateField(
                          "afterVersion",
                          event.target.value,
                          setAfterVersion
                        )
                      }
                      placeholder="e.g. v2.5.0"
                      aria-invalid={Boolean(
                        fieldErrors.afterVersion
                      )}
                    />

                    {fieldErrors.afterVersion && (
                      <small className="field-error">
                        {
                          fieldErrors.afterVersion
                        }
                      </small>
                    )}
                  </label>

                  <label
                    className={`field full-field ${fieldErrors.changeDescription
                      ? "field-invalid"
                      : ""
                      }`}
                  >
                    <span>
                      Deployment summary
                    </span>

                    <textarea
                      rows="4"
                      value={
                        changeDescription
                      }
                      onChange={(event) =>
                        updateField(
                          "changeDescription",
                          event.target.value,
                          setChangeDescription
                        )
                      }
                      placeholder="e.g. Added Redis cache, optimized SQL queries, and updated API gateway routing."
                      aria-invalid={Boolean(
                        fieldErrors.changeDescription
                      )}
                    />

                    <div className="field-footer">
                      {fieldErrors.changeDescription ? (
                        <small className="field-error">
                          {
                            fieldErrors.changeDescription
                          }
                        </small>
                      ) : (
                        <span />
                      )}

                      <small
                        className={`field-character-count ${changeDescription.trim()
                          .length >= 15
                          ? "complete"
                          : ""
                          }`}
                      >
                        {
                          changeDescription.trim()
                            .length
                        }
                        /15 minimum
                      </small>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <aside className="analysis-summary-card">
            <div>
              <span className="eyebrow">
                03 · ANALYSIS PLAN
              </span>

              <h3>
                {analysisName.trim() ||
                  "Ready to investigate"}
              </h3>
            </div>

            <div className="plan-item">
              <span>
                Data source
              </span>

              <strong>
                {selectedSource?.title}
              </strong>
            </div>

            {source === "csv" && (
              <div className="plan-item">
                <span>
                  Dataset
                </span>

                <strong>
                  {csvFile
                    ? csvFile.name
                    : "No file selected"}
                </strong>
              </div>
            )}

            {source === "api" && (
              <>
                <div className="plan-item">
                  <span>
                    Session status
                  </span>

                  <strong>
                    {liveSubmitting
                      ? "Ingesting signals..."
                      : "Ready"}
                  </strong>
                </div>

                <div className="plan-item">
                  <span>
                    Collection progress
                  </span>

                  <strong>
                    {Math.round((liveSignalsSent / 8) * 100)}%
                  </strong>
                </div>

                <div className="plan-item">
                  <span>
                    Signals analyzed
                  </span>

                  <strong>
                    {liveSignalsSent} / 8 signals
                  </strong>
                </div>
              </>
            )}

            <div className="plan-item">
              <span>
                Version comparison
              </span>

              <strong>
                {beforeVersion ||
                  "Before"}
                {" → "}
                {afterVersion ||
                  "After"}
              </strong>
            </div>

            <div className="plan-item">
              <span>
                Signals analyzed
              </span>

              <strong>
                8 metric signals
              </strong>
            </div>

            <div className="plan-signals">
              <span>Clicks</span>
              <span>Conversion</span>
              <span>Latency</span>
              <span>Error rate</span>
            </div>

            <div className="plan-item">
              <span>
                Model
              </span>

              <strong>
                Random Forest
              </strong>
            </div>

            <div className="plan-item">
              <span>
                Estimated runtime
              </span>

              <strong>
                {source === "api"
                  ? "Instant ingestion"
                  : "Under 30 seconds"}
              </strong>
            </div>

            <div className="generated-report-plan">
              <span>
                GENERATED REPORT
              </span>

              <ul>
                <li><Check size={13} /> Executive Summary</li>
                <li><Check size={13} /> Deployment Decision</li>
                <li><Check size={13} /> Signal Evidence</li>
                <li><Check size={13} /> AI Investigation</li>
                <li><Check size={13} /> Engineering Assessment</li>
                <li><Check size={13} /> Recommendation</li>
              </ul>
            </div>

            {error && (
              <div className="analysis-run-error">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="settings-message">
                <Check size={15} />
                {successMessage}
              </div>
            )}

            <div className="launch-investigation">
              <span className="eyebrow">
                04 · LAUNCH INVESTIGATION
              </span>

              <button
                type="button"
                className="run-analysis-button"
                onClick={
                  successMessage
                    ? () =>
                      navigate(
                        `/decision-room/${lastAnalysisId}`
                      )
                    : handleRunAnalysis
                }
                disabled={
                  running ||
                  liveSubmitting
                }
              >
                {successMessage
                  ? "Open Decision Room"
                  : running || liveSubmitting
                    ? source === "csv"
                      ? "Uploading & Analyzing..."
                      : source === "api"
                        ? "Transmitting Signals..."
                        : "Running ML Analysis..."
                    : source === "api"
                      ? "Run Live Analysis"
                      : "Analyze Deployment"}

                {!running && !liveSubmitting && (
                  <ArrowRight
                    size={17}
                  />
                )}
              </button>

              <p className="run-note">
                {source === "api"
                  ? "Submit Before & After deployment signals directly to calculate decision intelligence."
                  : settings.autoSaveHistory
                    ? "Estimated runtime: under 30 seconds. Results are automatically saved to Deployments history."
                    : "Estimated runtime: under 30 seconds. Automatic history saving is disabled."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function LiveRequirement({
  label,
  complete,
}) {
  return (
    <span
      className={`live-requirement ${complete ? "complete" : ""
        }`}
    >
      {complete ? (
        <Check size={11} />
      ) : (
        <Circle size={9} />
      )}

      {label}
    </span>
  );
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}
