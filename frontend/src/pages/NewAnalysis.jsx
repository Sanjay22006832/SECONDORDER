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
  Radio,
  Circle,
  Copy,
  StopCircle,
} from "lucide-react";

import {
  runSimulation,
  uploadCSV,
  startLiveSession,
  getLiveSessionStatus,
  getLiveAnalysis,
  stopLiveSession,
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

function getSourceFromPath(pathname) {
  if (pathname.endsWith("/live-api")) return "api";
  if (pathname.endsWith("/upload-dataset")) return "csv";
  return "simulation";
}

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

  const [
    liveSessionActive,
    setLiveSessionActive,
  ] = useState(false);

  const [liveSession, setLiveSession] =
    useState(null);

  const [startingLive, setStartingLive] =
    useState(false);

  const [stoppingLive, setStoppingLive] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

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
      setSettings(
        getSavedSettings()
      );
    }

    window.addEventListener(
      "focus",
      refreshSettings
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshSettings
      );
    };
  }, []);

  useEffect(() => {
    if (
      source !== "api" ||
      !liveSessionActive
    ) {
      return;
    }

    const interval = setInterval(
      async () => {
        try {
          const response =
            await getLiveSessionStatus();

          const session =
            response.session || null;

          setLiveSession(session);
          setError("");

          if (
            session?.ready &&
            !analysisCompletedRef.current
          ) {
            analysisCompletedRef.current =
              true;

            await finishLiveAnalysis();
          }
        } catch (err) {
          setError(
            err.message ||
            "Could not update the Live API session."
          );
        }
      },
      pollingInterval
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    source,
    liveSessionActive,
    pollingInterval,
  ]);

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

  async function handleStartLiveSession() {
    if (!validateChangeDetails()) {
      return;
    }

    try {
      setStartingLive(true);
      setError("");
      setSuccessMessage("");

      setSettings(
        getSavedSettings()
      );

      analysisCompletedRef.current =
        false;

      const response =
        await startLiveSession(
          getAnalysisContext()
        );

      setLiveSession(
        response.session || null
      );

      setLiveSessionActive(true);
    } catch (err) {
      setError(
        err.message ||
        "Could not start the Live API session."
      );
    } finally {
      setStartingLive(false);
    }
  }

  async function handleStopLiveSession() {
    try {
      setStoppingLive(true);
      setError("");

      const response =
        await stopLiveSession();

      setLiveSession(
        response.session || null
      );

      setLiveSessionActive(false);

      analysisCompletedRef.current =
        false;
    } catch (err) {
      setError(
        err.message ||
        "Could not stop the Live API session."
      );
    } finally {
      setStoppingLive(false);
    }
  }

  async function finishLiveAnalysis() {
    try {
      setRunning(true);
      setError("");

      const result =
        await getLiveAnalysis();

      if (!result.ready) {
        analysisCompletedRef.current =
          false;

        return;
      }

      saveCompletedResult(
        result,
        "api"
      );

      try {
        await stopLiveSession();
      } catch {
        // Analysis is already complete.
      }

      setLiveSessionActive(false);
    } catch (err) {
      analysisCompletedRef.current =
        false;

      setError(
        err.message ||
        "Could not complete the Live API analysis."
      );
    } finally {
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
      if (!liveSessionActive) {
        await handleStartLiveSession();
      }

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

    const completeResult = {
      ...result,

      id: crypto.randomUUID(),

      created_at:
        new Date().toISOString(),

      context: {
        analysis_name:
          analysisName.trim(),

        before_version:
          beforeVersion.trim(),

        after_version:
          afterVersion.trim(),

        change_description:
          changeDescription.trim(),

        data_source: dataSource,

        file_name:
          dataSource === "csv"
            ? csvFile?.name
            : null,
      },
    };

    localStorage.setItem(
      "secondorder_result",
      JSON.stringify(
        completeResult
      )
    );

    if (
      currentSettings.autoSaveHistory
    ) {
      saveToHistory(
        completeResult
      );
    }

    if (
      currentSettings.autoOpenDecisionRoom
    ) {
      console.log("RESULT OBJECT:", result);
      console.log("RESULT OBJECT:", JSON.stringify(result, null, 2));
      console.log("analysis_id:", result?.analysis_id);

      navigate(`/decision-room/${result?.analysis_id}`);
      localStorage.setItem(
        "last_analysis_id",
        result.analysis_id
      );
      navigate(`/decision-room/${result.analysis_id}`);

      return;
    }

    const historyText =
      currentSettings.autoSaveHistory
        ? " It was saved to Decision History."
        : "";

    setSuccessMessage(
      `Analysis complete.${historyText} Open the Decision Room when you are ready.`
    );
  }

  function saveToHistory(
    completeResult
  ) {
    let existingHistory = [];

    try {
      existingHistory =
        JSON.parse(
          localStorage.getItem(
            "secondorder_history"
          ) || "[]"
        );

      if (
        !Array.isArray(
          existingHistory
        )
      ) {
        existingHistory = [];
      }
    } catch {
      existingHistory = [];
    }

    const updatedHistory = [
      completeResult,
      ...existingHistory,
    ];

    localStorage.setItem(
      "secondorder_history",
      JSON.stringify(
        updatedHistory
      )
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

                    {!liveSessionActive ? (
                      <div className="live-api-start-panel">
                        <div className="live-api-start-icon">
                          <Radio size={22} />
                        </div>

                        <strong>
                          Ready to receive
                          signals
                        </strong>

                        <p>
                          Complete the change
                          details, then start a
                          session. SECONDORDER
                          will clear old data and
                          listen for new API
                          metrics.
                        </p>

                        <button
                          type="button"
                          className="live-start-button"
                          onClick={
                            handleStartLiveSession
                          }
                          disabled={
                            startingLive
                          }
                        >
                          <Radio size={16} />

                          {startingLive
                            ? "Starting Session..."
                            : "Start Live Session"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="live-progress-card">
                          <div className="live-progress-top">
                            <div>
                              <span>
                                COLLECTION
                                PROGRESS
                              </span>

                              <strong>
                                {
                                  progressPercentage
                                }
                                %
                              </strong>
                            </div>

                            <div>
                              <span>
                                SIGNALS RECEIVED
                              </span>

                              <strong>
                                {
                                  signalsReceived
                                }
                              </strong>
                            </div>
                          </div>

                          <div className="live-progress-track">
                            <span
                              style={{
                                width: `${progressPercentage}%`,
                              }}
                            />
                          </div>

                          <p>
                            Waiting for before
                            and after data for
                            all four metrics.
                          </p>
                        </div>

                        <div className="live-metric-status-grid">
                          {liveMetrics.map(
                            (metric) => {
                              const status =
                                liveSession
                                  ?.metrics?.[
                                metric.key
                                ] || {};

                              return (
                                <div
                                  className="live-metric-status"
                                  key={
                                    metric.key
                                  }
                                >
                                  <div className="live-metric-name">
                                    <Activity
                                      size={14}
                                    />

                                    <strong>
                                      {
                                        metric.label
                                      }
                                    </strong>
                                  </div>

                                  <div className="live-version-status">
                                    <LiveRequirement
                                      label="Before"
                                      complete={
                                        status.before
                                      }
                                    />

                                    <LiveRequirement
                                      label="After"
                                      complete={
                                        status.after
                                      }
                                    />
                                  </div>

                                  <span className="live-sample-count">
                                    {status.samples ||
                                      0}{" "}
                                    samples
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <div className="live-session-footer">
                          <div>
                            <span className="live-pulse-dot" />

                            Polling for new
                            signals every{" "}
                            {pollingSeconds}{" "}
                            {pollingSeconds === 1
                              ? "second"
                              : "seconds"}
                          </div>

                          <button
                            type="button"
                            onClick={
                              handleStopLiveSession
                            }
                            disabled={
                              stoppingLive
                            }
                          >
                            <StopCircle
                              size={14}
                            />

                            {stoppingLive
                              ? "Stopping..."
                              : "Stop Session"}
                          </button>
                        </div>
                      </>
                    )}
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
                    {liveSessionActive
                      ? "Listening"
                      : "Not started"}
                  </strong>
                </div>

                <div className="plan-item">
                  <span>
                    Collection progress
                  </span>

                  <strong>
                    {progressPercentage}%
                  </strong>
                </div>

                <div className="plan-item">
                  <span>
                    Polling interval
                  </span>

                  <strong>
                    {pollingSeconds}s
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
                4 deployment signals
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
                  ? "Live collection"
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
                        `/decision-room/${localStorage.getItem("last_analysis_id")}`
                      )
                    : handleRunAnalysis
                }
                disabled={
                  running ||
                  startingLive ||
                  (
                    source === "api" &&
                    liveSessionActive
                  )
                }
              >
                {successMessage
                  ? "Open Decision Room"
                  : running
                    ? source === "csv"
                      ? "Uploading & Analyzing..."
                      : source === "api"
                        ? "Completing Live Analysis..."
                        : "Running ML Analysis..."
                    : source === "api"
                      ? liveSessionActive
                        ? "Listening for Signals..."
                        : "Analyze Deployment"
                      : "Analyze Deployment"}

                {!running &&
                  !(
                    source === "api" &&
                    liveSessionActive
                  ) && (
                    <ArrowRight
                      size={17}
                    />
                  )}
              </button>

              <p className="run-note">
                {source === "api"
                  ? liveSessionActive
                    ? settings.autoOpenDecisionRoom
                      ? "The Decision Room will open automatically when all required signals are received."
                      : "The completed result will remain here until you choose to open the Decision Room."
                    : `Start a session to begin receiving metrics through the ingestion API. Polling interval: ${pollingSeconds}s.`
                  : settings.autoSaveHistory
                    ? "Estimated runtime: under 30 seconds. Results are automatically saved to Decision History."
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
