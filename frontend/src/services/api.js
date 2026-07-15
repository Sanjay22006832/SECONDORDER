const ENV_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim();

const DEFAULT_API_BASE_URL =
  ENV_API_BASE_URL ||
  "http://127.0.0.1:8000";

function normalizeUrl(url) {
  return url.replace(/\/+$/, "");
}

function getApiBaseUrl() {
  const isProduction =
    import.meta.env.PROD;

  if (isProduction) {
    return normalizeUrl(
      DEFAULT_API_BASE_URL
    );
  }

  try {
    const settings = JSON.parse(
      localStorage.getItem(
        "secondorder_settings"
      ) || "{}"
    );

    const savedUrl =
      settings.apiBaseUrl?.trim();

    if (savedUrl) {
      return normalizeUrl(savedUrl);
    }
  } catch {
    // Fall back to the environment URL.
  }

  return normalizeUrl(
    DEFAULT_API_BASE_URL
  );
}

async function readResponse(
  response,
  fallbackMessage
) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    // Response did not contain JSON.
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        fallbackMessage
    );
  }

  return data;
}

/*
==========================================
NORMALIZE ANALYSIS CONTEXT
==========================================
*/

function normalizeContext(context = {}) {
  return {
    analysis_name:
      context.analysis_name?.trim() || "",

    before_version:
      context.before_version?.trim() || "",

    after_version:
      context.after_version?.trim() || "",

    change_description:
      context.change_description?.trim() || "",
  };
}

/*
==========================================
GET CURRENT ANALYSIS
==========================================
*/

export async function getAnalysis() {
  const response = await fetch(
    `${getApiBaseUrl()}/analyze`
  );

  return readResponse(
    response,
    "Could not load analysis"
  );
}

/*
==========================================
RUN DEMO SIMULATION
==========================================
*/

export async function runSimulation(
  context = {}
) {
  const response = await fetch(
    `${getApiBaseUrl()}/run-simulation`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        normalizeContext(context)
      ),
    }
  );

  return readResponse(
    response,
    "Simulation failed"
  );
}

/*
==========================================
UPLOAD CSV
==========================================
*/

export async function uploadCSV(
  file,
  context = {}
) {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const normalizedContext =
    normalizeContext(context);

  formData.append(
    "change_description",
    normalizedContext.change_description
  );

  const response = await fetch(
    `${getApiBaseUrl()}/upload-csv`,
    {
      method: "POST",
      body: formData,
    }
  );

  return readResponse(
    response,
    "CSV upload and analysis failed"
  );
}

/*
==========================================
START LIVE API SESSION
==========================================
*/

export async function startLiveSession(
  context = {}
) {
  const response = await fetch(
    `${getApiBaseUrl()}/live-session/start`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        normalizeContext(context)
      ),
    }
  );

  return readResponse(
    response,
    "Could not start Live API session"
  );
}

/*
==========================================
GET LIVE SESSION STATUS
==========================================
*/

export async function getLiveSessionStatus() {
  const response = await fetch(
    `${getApiBaseUrl()}/live-session/status`
  );

  return readResponse(
    response,
    "Could not load Live API session status"
  );
}

/*
==========================================
GET LIVE ANALYSIS
==========================================
*/

export async function getLiveAnalysis() {
  const response = await fetch(
    `${getApiBaseUrl()}/live-session/analysis`
  );

  return readResponse(
    response,
    "Could not load Live API analysis"
  );
}

/*
==========================================
STOP LIVE API SESSION
==========================================
*/

export async function stopLiveSession() {
  const response = await fetch(
    `${getApiBaseUrl()}/live-session/stop`,
    {
      method: "POST",
    }
  );

  return readResponse(
    response,
    "Could not stop Live API session"
  );
}

/*
==========================================
GET CURRENT API BASE URL
==========================================
*/

export function getCurrentApiBaseUrl() {
  return getApiBaseUrl();
}