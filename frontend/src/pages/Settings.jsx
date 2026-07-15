import { useEffect, useState } from "react";
import {
  Check,
  Database,
  RotateCcw,
  Save,
  Server,
  Settings as SettingsIcon,
  Trash2,
} from "lucide-react";

const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://127.0.0.1:8000",
  pollingInterval: 2000,
  autoOpenDecisionRoom: true,
  autoSaveHistory: true,
};

export default function Settings() {
  const [settings, setSettings] = useState(
    DEFAULT_SETTINGS
  );

  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const storedSettings = JSON.parse(
        localStorage.getItem(
          "secondorder_settings"
        ) || "null"
      );

      if (storedSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...storedSettings,
        });
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  function updateSetting(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));

    setSaved(false);
    setMessage("");
  }

  function saveSettings() {
    localStorage.setItem(
      "secondorder_settings",
      JSON.stringify(settings)
    );

    setSaved(true);
    setMessage(
      "Workspace preferences saved successfully."
    );

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "secondorder_settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setMessage(
      "Settings restored to defaults."
    );

    setSaved(false);
  }

  function clearHistory() {
    const confirmed = window.confirm(
      "Clear all saved Decision History? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "secondorder_history"
    );

    setMessage(
      "Decision History has been cleared."
    );
  }

  function resetAllData() {
    const confirmed = window.confirm(
      "Reset all SECONDORDER local data? This removes analysis results, history, and saved settings."
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(
      "secondorder_result"
    );

    localStorage.removeItem(
      "secondorder_history"
    );

    localStorage.removeItem(
      "secondorder_settings"
    );

    setSettings(DEFAULT_SETTINGS);

    setMessage(
      "All SECONDORDER local data has been reset."
    );

    setSaved(false);
  }

  return (
    <main className="product-main">
      <header className="topbar">
        <span className="breadcrumb">
          Workspace / Settings
        </span>

        <span className="analysis-draft">
          Local workspace
        </span>
      </header>

      <div className="page-content settings-page">
        <section className="settings-heading">
          <div>
            <span className="eyebrow">
              SETTINGS
            </span>

            <h2>
              Configure your workspace.
            </h2>

            <p>
              Manage API connectivity, live analysis
              behavior, saved decisions, and local
              SECONDORDER preferences.
            </p>
          </div>

          <button
            className="settings-save-button"
            onClick={saveSettings}
          >
            {saved ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}

            {saved
              ? "Saved"
              : "Save Changes"}
          </button>
        </section>

        {message && (
          <div className="settings-message">
            <Check size={15} />
            {message}
          </div>
        )}

        <section className="settings-layout">
          <div className="settings-main-column">
            <SettingsSection
              icon={Server}
              eyebrow="API CONNECTION"
              title="Backend configuration"
              description="Configure how the frontend connects to the SECONDORDER FastAPI service."
            >
              <label className="settings-field">
                <span>API Base URL</span>

                <input
                  type="text"
                  value={settings.apiBaseUrl}
                  onChange={(event) =>
                    updateSetting(
                      "apiBaseUrl",
                      event.target.value
                    )
                  }
                />

                <p>
                  Used as the base address for
                  SECONDORDER backend requests.
                </p>
              </label>
            </SettingsSection>

            <SettingsSection
              icon={SettingsIcon}
              eyebrow="LIVE ANALYSIS"
              title="Session behavior"
              description="Control how the Live API workflow behaves while receiving deployment signals."
            >
              <label className="settings-field">
                <span>
                  Polling interval
                </span>

                <select
                  value={
                    settings.pollingInterval
                  }
                  onChange={(event) =>
                    updateSetting(
                      "pollingInterval",
                      Number(
                        event.target.value
                      )
                    )
                  }
                >
                  <option value={1000}>
                    Every 1 second
                  </option>

                  <option value={2000}>
                    Every 2 seconds
                  </option>

                  <option value={5000}>
                    Every 5 seconds
                  </option>

                  <option value={10000}>
                    Every 10 seconds
                  </option>
                </select>

                <p>
                  Controls how often the frontend checks
                  for newly received Live API signals.
                </p>
              </label>

              <SettingsToggle
                title="Auto-open Decision Room"
                description="Open the final decision automatically when Live API collection reaches 100%."
                checked={
                  settings.autoOpenDecisionRoom
                }
                onChange={(value) =>
                  updateSetting(
                    "autoOpenDecisionRoom",
                    value
                  )
                }
              />

              <SettingsToggle
                title="Auto-save Decision History"
                description="Save completed analyses to Decision History automatically."
                checked={
                  settings.autoSaveHistory
                }
                onChange={(value) =>
                  updateSetting(
                    "autoSaveHistory",
                    value
                  )
                }
              />
            </SettingsSection>
          </div>

          <aside className="settings-side-column">
            <article className="settings-summary-card">
              <div className="settings-summary-icon">
                <Database size={20} />
              </div>

              <span className="eyebrow">
                LOCAL STORAGE
              </span>

              <h3>Workspace data</h3>

              <p>
                SECONDORDER currently stores analysis
                context, results, history, and preferences
                in this browser.
              </p>

              <div className="settings-storage-row">
                <span>Saved analyses</span>

                <strong>
                  {getHistoryCount()}
                </strong>
              </div>

              <div className="settings-storage-row">
                <span>Storage mode</span>

                <strong>Browser local</strong>
              </div>
            </article>

            <article className="settings-danger-card">
              <span className="eyebrow">
                DATA MANAGEMENT
              </span>

              <h3>Workspace controls</h3>

              <button
                className="settings-reset-button"
                onClick={resetSettings}
              >
                <RotateCcw size={15} />
                Restore default settings
              </button>

              <button
                className="settings-danger-button"
                onClick={clearHistory}
              >
                <Trash2 size={15} />
                Clear Decision History
              </button>

              <button
                className="settings-danger-button strong"
                onClick={resetAllData}
              >
                <Trash2 size={15} />
                Reset all local data
              </button>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SettingsSection({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <article className="settings-section">
      <div className="settings-section-heading">
        <div className="settings-section-icon">
          <Icon size={19} />
        </div>

        <div>
          <span className="eyebrow">
            {eyebrow}
          </span>

          <h3>{title}</h3>

          <p>{description}</p>
        </div>
      </div>

      <div className="settings-section-content">
        {children}
      </div>
    </article>
  );
}

function SettingsToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="settings-toggle-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        className={`settings-toggle ${
          checked ? "active" : ""
        }`}
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}

function getHistoryCount() {
  try {
    const history = JSON.parse(
      localStorage.getItem(
        "secondorder_history"
      ) || "[]"
    );

    return Array.isArray(history)
      ? history.length
      : 0;
  } catch {
    return 0;
  }
}