// Centralized API Base URL configuration
const ENV_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

const DEFAULT_API_BASE_URL = ENV_API_BASE_URL || "http://127.0.0.1:8000";

// Remove trailing slashes from URL strings
function normalizeUrl(url) {
  return url.replace(/\/+$/, "");
}

// Get effective API base URL from production environment or local Settings
function getApiBaseUrl() {
  const isProduction = import.meta.env.PROD;

  if (isProduction) {
    return normalizeUrl(DEFAULT_API_BASE_URL);
  }

  try {
    const settings = JSON.parse(
      localStorage.getItem("secondorder_settings") || "{}"
    );

    const savedUrl = settings.apiBaseUrl?.trim();
    if (savedUrl) {
      return normalizeUrl(savedUrl);
    }
  } catch {
    // Fall back to default URL
  }

  return normalizeUrl(DEFAULT_API_BASE_URL);
}

// Parse response JSON and extract structured error messages
async function readResponse(response, fallbackMessage) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // Non-JSON response payload
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || fallbackMessage
    );
  }

  return data;
}

// Normalize analysis context parameters
function normalizeContext(context = {}) {
  return {
    analysis_name: context.analysis_name?.trim() || "",
    before_version: context.before_version?.trim() || "",
    after_version: context.after_version?.trim() || "",
    change_description: context.change_description?.trim() || "",
  };
}

/*
==================================================
HEALTH CHECK
==================================================
*/

// Check backend API connectivity and status
export async function checkApiHealth() {
  const response = await fetch(`${getApiBaseUrl()}/health`);
  return readResponse(response, "Backend health check failed");
}

/*
==================================================
ANALYSIS ENGINE API
==================================================
*/

// Get current manual analysis result
export async function getAnalysis() {
  const response = await fetch(`${getApiBaseUrl()}/analyze`);
  return readResponse(response, "Could not load analysis");
}

// Execute demo simulation analysis
export async function runSimulation(context = {}) {
  const response = await fetch(`${getApiBaseUrl()}/run-simulation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeContext(context)),
  });

  return readResponse(response, "Simulation failed");
}

// Upload CSV file for deployment analysis
export async function uploadCSV(file, context = {}) {
  const formData = new FormData();
  formData.append("file", file);

  const normalizedContext = normalizeContext(context);
  formData.append("analysis_name", normalizedContext.analysis_name);
  formData.append("before_version", normalizedContext.before_version);
  formData.append("after_version", normalizedContext.after_version);
  formData.append("change_description", normalizedContext.change_description);

  const response = await fetch(`${getApiBaseUrl()}/upload-csv`, {
    method: "POST",
    body: formData,
  });

  return readResponse(response, "CSV upload and analysis failed");
}

/*
==================================================
LIVE API WORKFLOW
==================================================
*/

// Start a new Live API session with change details
export async function startLiveSession(context = {}) {
  const response = await fetch(`${getApiBaseUrl()}/live-session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeContext(context)),
  });

  return readResponse(response, "Could not start Live API session");
}

// Ingest an individual metric signal (4 metrics x 2 versions)
export async function ingestMetric(metric) {
  const response = await fetch(`${getApiBaseUrl()}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metric),
  });

  return readResponse(response, "Could not ingest metric signal");
}

// Fetch live session collection progress and status
export async function getLiveSessionStatus() {
  const response = await fetch(`${getApiBaseUrl()}/live-session/status`);
  return readResponse(response, "Could not load Live API session status");
}

// Fetch final Live API analysis result
export async function getLiveAnalysis() {
  const response = await fetch(`${getApiBaseUrl()}/live-session/analysis`);
  return readResponse(response, "Could not load Live API analysis");
}

// Stop current Live API session
export async function stopLiveSession() {
  const response = await fetch(`${getApiBaseUrl()}/live-session/stop`, {
    method: "POST",
  });

  return readResponse(response, "Could not stop Live API session");
}

/*
==================================================
DEPLOYMENTS & HISTORY API (SQLite-backed)
==================================================
*/

// Fetch all deployment records from history
export async function getHistory() {
  const response = await fetch(`${getApiBaseUrl()}/history`);
  return readResponse(response, "Could not load analysis history");
}

// Fetch a single deployment analysis by ID
export async function getAnalysisById(id) {
  const response = await fetch(`${getApiBaseUrl()}/history/${id}`);
  return readResponse(response, "Could not load analysis");
}

// Delete an individual deployment from history
export async function deleteAnalysis(id) {
  const response = await fetch(`${getApiBaseUrl()}/history/${id}`, {
    method: "DELETE",
  });

  return readResponse(response, "Could not delete analysis");
}

// Clear all deployments from history
export async function clearAllHistory() {
  const response = await fetch(`${getApiBaseUrl()}/history`, {
    method: "DELETE",
  });

  return readResponse(response, "Could not clear analysis history");
}

/*
==================================================
CONFIGURATION HELPERS
==================================================
*/

// Get configured API Base URL
export function getCurrentApiBaseUrl() {
  return getApiBaseUrl();
}