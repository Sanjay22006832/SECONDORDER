from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
)

from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd
from datetime import datetime
import os
import io

from analysis import analyze_data
from simulator import run_simulation
from database import (
    initialize_database,
    save_analysis,
    get_history,
    delete_analysis,
    clear_history,
)

# ==================================================
# APP SETUP
# ==================================================

app = FastAPI(
    title="SECONDORDER API",
    description="Decision Intelligence Backend",
    version="1.0.0",
)
initialize_database()


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# FILE CONFIGURATION
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FILE_NAME = os.path.join(
    BASE_DIR,
    "ingested_data.csv",
)

REQUIRED_COLUMNS = {
    "timestamp",
    "metric_name",
    "value",
    "version",
}

REQUIRED_METRICS = {
    "clicks",
    "conversion_rate",
    "latency",
    "error_rate",
}

VALID_VERSIONS = {
    "before",
    "after",
}


if not os.path.exists(FILE_NAME):
    open(FILE_NAME, "w").close()


# ==================================================
# LIVE SESSION STATE
# ==================================================

live_session = {
    "active": False,
    "started_at": None,
    "signals_received": 0,
    "change_description": "",
}


# ==================================================
# REQUEST MODELS
# ==================================================


class Metric(BaseModel):
    metric_name: str
    value: float
    version: str


class AnalysisContext(BaseModel):
    analysis_name: str = ""
    before_version: str = ""
    after_version: str = ""
    change_description: str = ""


# ==================================================
# HELPER: READ CURRENT DATA
# ==================================================


def read_current_data():

    if not os.path.exists(FILE_NAME):
        return pd.DataFrame(
            columns=[
                "timestamp",
                "metric_name",
                "value",
                "version",
            ]
        )

    if os.path.getsize(FILE_NAME) == 0:
        return pd.DataFrame(
            columns=[
                "timestamp",
                "metric_name",
                "value",
                "version",
            ]
        )

    try:
        return pd.read_csv(
            FILE_NAME,
            names=[
                "timestamp",
                "metric_name",
                "value",
                "version",
            ],
            header=None,
        )

    except Exception:
        return pd.DataFrame(
            columns=[
                "timestamp",
                "metric_name",
                "value",
                "version",
            ]
        )


# ==================================================
# HELPER: LIVE SESSION PROGRESS
# ==================================================


def get_live_progress():

    df = read_current_data()

    progress = {}

    completed_pairs = 0

    total_pairs = len(REQUIRED_METRICS) * 2

    for metric in sorted(REQUIRED_METRICS):

        metric_rows = df[
            df["metric_name"].astype(str).str.strip().str.lower() == metric
        ]

        versions = set(
            metric_rows["version"].astype(str).str.strip().str.lower().tolist()
        )

        has_before = "before" in versions

        has_after = "after" in versions

        if has_before:
            completed_pairs += 1

        if has_after:
            completed_pairs += 1

        progress[metric] = {
            "before": has_before,
            "after": has_after,
            "samples": len(metric_rows),
        }

    ready = completed_pairs == total_pairs

    percentage = round(
        (completed_pairs / total_pairs) * 100,
        1,
    )

    return {
        "ready": ready,
        "completed_requirements": completed_pairs,
        "total_requirements": total_pairs,
        "progress_percentage": percentage,
        "metrics": progress,
    }


# ==================================================
# HEALTH CHECK
# ==================================================


@app.get("/health")
def health_check():

    return {
        "status": "online",
        "service": "SECONDORDER Analysis API",
        "live_session_active": live_session["active"],
    }


# ==================================================
# START LIVE API SESSION
# ==================================================


@app.post("/live-session/start")
def start_live_session(
    context: AnalysisContext,
):

    open(
        FILE_NAME,
        "w",
    ).close()

    live_session["active"] = True

    live_session["started_at"] = datetime.now().isoformat()

    live_session["signals_received"] = 0

    live_session["change_description"] = context.change_description.strip()

    print("\n" + "=" * 60)

    print("🟢 LIVE API SESSION STARTED")

    print("=" * 60)

    print("Waiting for external metrics...")

    if live_session["change_description"]:

        print("Change description: " + live_session["change_description"])

    return {
        "status": "success",
        "message": ("Live API session started."),
        "session": {
            **live_session,
            **get_live_progress(),
        },
    }


# ==================================================
# LIVE API SESSION STATUS
# ==================================================


@app.get("/live-session/status")
def live_session_status():

    progress = get_live_progress()

    return {
        "status": "success",
        "session": {
            **live_session,
            **progress,
        },
    }


# ==================================================
# STOP LIVE API SESSION
# ==================================================


@app.post("/live-session/stop")
def stop_live_session():

    live_session["active"] = False

    print("\n🔴 LIVE API SESSION STOPPED")

    return {
        "status": "success",
        "message": ("Live API session stopped."),
        "session": {
            **live_session,
            **get_live_progress(),
        },
    }


# ==================================================
# INGEST METRIC
# ==================================================


@app.post("/ingest")
def ingest_metric(
    metric: Metric,
):

    metric_name = metric.metric_name.strip().lower()

    version = metric.version.strip().lower()

    # ==============================================
    # VALIDATE METRIC
    # ==============================================

    if metric_name not in REQUIRED_METRICS:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid metric name. "
                "Use: clicks, "
                "conversion_rate, "
                "latency, or error_rate."
            ),
        )

    # ==============================================
    # VALIDATE VERSION
    # ==============================================

    if version not in VALID_VERSIONS:

        raise HTTPException(
            status_code=400,
            detail=("Version must be " "'before' or 'after'."),
        )

    # ==============================================
    # SAVE SIGNAL
    # ==============================================

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    new_data = pd.DataFrame(
        [
            {
                "timestamp": timestamp,
                "metric_name": metric_name,
                "value": metric.value,
                "version": version,
            }
        ]
    )

    new_data.to_csv(
        FILE_NAME,
        mode="a",
        header=False,
        index=False,
    )

    # ==============================================
    # UPDATE LIVE SESSION
    # ==============================================

    if live_session["active"]:

        live_session["signals_received"] += 1

    progress = get_live_progress()

    print("\n📡 LIVE SIGNAL RECEIVED")

    print(f"Metric: {metric_name}")

    print(f"Value: {metric.value}")

    print(f"Version: {version}")

    print("Progress: " f"{progress['progress_percentage']}%")

    # ==============================================
    # ANALYZE ONLY WHEN READY
    # ==============================================

    if progress["ready"]:

        result = analyze_data(change_description=(live_session["change_description"]))

        print("\n🧠 LIVE ANALYSIS READY")

        print("Decision: " f"{result.get('prediction')}")

        return {
            "status": "success",
            "message": ("Signal received. " "Analysis is ready."),
            "ready": True,
            "session": {
                **live_session,
                **progress,
            },
            "analysis": result,
        }

    return {
        "status": "success",
        "message": ("Signal received. " "Waiting for more data."),
        "ready": False,
        "session": {
            **live_session,
            **progress,
        },
        "analysis": None,
    }


# ==================================================
# GET LIVE ANALYSIS
# ==================================================


@app.get("/live-session/analysis")
def get_live_analysis():

    if not live_session["active"]:

        raise HTTPException(
            status_code=400,
            detail=("No live API session is active."),
        )

    progress = get_live_progress()

    if not progress["ready"]:

        return {
            "status": "waiting",
            "ready": False,
            "message": ("Waiting for all required " "before and after signals."),
            "session": {
                **live_session,
                **progress,
            },
            "analysis": None,
        }

    result = analyze_data(change_description=(live_session["change_description"]))
    print("💾 Saving analysis to SQLite...")
    analysis_id = save_analysis(
        {
            "analysis_name": "Live API Analysis",
            "before_version": "Before",
            "after_version": "After",
            "data_source": "api",
            "change_description": live_session["change_description"],
        },
        result,
    )
    print("✅ Analysis saved successfully.")

    return {
        "status": "success",
        "source": "api",
        "analysis_id": analysis_id,
        "ready": True,
        "signals_generated": live_session["signals_received"],
        "session": {
            **live_session,
            **progress,
        },
        "analysis": result,
    }


# ==================================================
# MANUAL ANALYSIS
# ==================================================


@app.get("/analyze")
def analyze():

    result = analyze_data()

    print("\n📊 ANALYSIS REQUESTED BY UI")

    return result


# ==================================================
# RUN DEMO SIMULATION
# ==================================================


@app.post("/run-simulation")
def run_demo_simulation(
    context: AnalysisContext,
):

    live_session["active"] = False

    print("\n🎲 STARTING NEW SIMULATION")

    simulation = run_simulation()

    scenario = simulation["scenario"]

    generated_data = simulation["data"]

    print(f"Scenario selected: {scenario}")

    rows = []

    for item in generated_data:

        rows.append(
            {
                "timestamp": (datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                "metric_name": (item["metric_name"]),
                "value": item["value"],
                "version": item["version"],
            }
        )

    simulation_df = pd.DataFrame(rows)

    simulation_df.to_csv(
        FILE_NAME,
        mode="w",
        header=False,
        index=False,
    )

    print(f"📊 {len(generated_data)} " "signals generated")

    result = analyze_data(change_description=(context.change_description))
    print("💾 Saving simulation to SQLite...")
    analysis_id = save_analysis(
        {
            "analysis_name": context.analysis_name,
            "before_version": context.before_version,
            "after_version": context.after_version,
            "data_source": "simulation",
            "change_description": context.change_description,
        },
        result,
    )
    print("✅ Simulation saved successfully.")

    return {
        "status": "success",
        "analysis_id": analysis_id,
        "scenario": scenario,
        "signals_generated": len(generated_data),
        "analysis": result,
    }


# ==================================================
# UPLOAD CSV
# ==================================================


@app.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    change_description: str = Form(""),
):

    live_session["active"] = False

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail=("No file was selected."),
        )

    if not (file.filename.lower().endswith(".csv")):

        raise HTTPException(
            status_code=400,
            detail=("Only CSV files are supported."),
        )

    try:

        contents = await file.read()

        if not contents:

            raise HTTPException(
                status_code=400,
                detail=("The uploaded CSV is empty."),
            )

        uploaded_df = pd.read_csv(io.BytesIO(contents))

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=("The CSV could not be read. " f"{str(error)}"),
        )

    # ==============================================
    # NORMALIZE COLUMNS
    # ==============================================

    uploaded_df.columns = [
        str(column).strip().lower() for column in uploaded_df.columns
    ]

    missing_columns = REQUIRED_COLUMNS - set(uploaded_df.columns)

    if missing_columns:

        raise HTTPException(
            status_code=400,
            detail=("Missing required columns: " + ", ".join(sorted(missing_columns))),
        )

    uploaded_df = uploaded_df[
        [
            "timestamp",
            "metric_name",
            "value",
            "version",
        ]
    ].copy()

    # ==============================================
    # NORMALIZE VALUES
    # ==============================================

    uploaded_df["metric_name"] = (
        uploaded_df["metric_name"].astype(str).str.strip().str.lower()
    )

    uploaded_df["version"] = uploaded_df["version"].astype(str).str.strip().str.lower()

    # ==============================================
    # VALIDATE VERSIONS
    # ==============================================

    invalid_versions = set(uploaded_df["version"].unique()) - VALID_VERSIONS

    if invalid_versions:

        raise HTTPException(
            status_code=400,
            detail=(
                "Version values must be "
                "'before' or 'after'. "
                "Invalid values: " + ", ".join(sorted(invalid_versions))
            ),
        )

    # ==============================================
    # VALIDATE METRICS
    # ==============================================

    uploaded_metrics = set(uploaded_df["metric_name"].unique())

    missing_metrics = REQUIRED_METRICS - uploaded_metrics

    if missing_metrics:

        raise HTTPException(
            status_code=400,
            detail=("Missing required metrics: " + ", ".join(sorted(missing_metrics))),
        )

    # ==============================================
    # VALIDATE BEFORE + AFTER
    # ==============================================

    for metric in REQUIRED_METRICS:

        metric_rows = uploaded_df[uploaded_df["metric_name"] == metric]

        metric_versions = set(metric_rows["version"].unique())

        if not VALID_VERSIONS.issubset(metric_versions):

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Metric '{metric}' " "must contain both " "before and after rows."
                ),
            )

    # ==============================================
    # VALIDATE NUMBERS
    # ==============================================

    try:

        uploaded_df["value"] = pd.to_numeric(
            uploaded_df["value"],
            errors="raise",
        )

    except Exception:

        raise HTTPException(
            status_code=400,
            detail=("The value column must " "contain numbers only."),
        )

    if uploaded_df.empty:

        raise HTTPException(
            status_code=400,
            detail=("The uploaded CSV has " "no data rows."),
        )

    # ==============================================
    # SAVE CSV
    # ==============================================

    uploaded_df.to_csv(
        FILE_NAME,
        mode="w",
        header=False,
        index=False,
    )

    print("\n📁 CSV UPLOAD RECEIVED")

    print(f"File: {file.filename}")

    print(f"Rows: {len(uploaded_df)}")

    result = analyze_data(change_description=change_description)

    analysis_id = save_analysis(
        {
            "analysis_name": file.filename.replace(".csv", ""),
            "before_version": "CSV Import",
            "after_version": "Analyzed",
            "data_source": "csv",
            "change_description": change_description,
        },
        result,
    )

    return {
        "status": "success",
        "source": "csv",
        "analysis_id": analysis_id,
        "filename": file.filename,
        "signals_generated": len(uploaded_df),
        "metrics_detected": sorted(uploaded_metrics),
        "analysis": result,
    }


# ==================================================


# GET ANALYSIS HISTORY
# ==================================================


@app.get("/history")
def history():

    return {
        "status": "success",
        "count": len(get_history()),
        "history": get_history(),
    }
    # ==================================================


# DELETE ANALYSIS
# ==================================================


@app.delete("/history/{record_id}")
def remove_analysis(record_id: int):

    delete_analysis(record_id)

    return {"status": "success", "message": "Analysis deleted successfully."}


# ==================================================
# CLEAR ALL HISTORY
# ==================================================


@app.delete("/history")
def clear_all_history():

    clear_history()

    return {"status": "success", "message": "All history deleted."}


# GET SINGLE ANALYSIS
# ==================================================


@app.get("/history/{record_id}")
def get_single_analysis(record_id: int):

    history = get_history()

    for item in history:

        if item["id"] == record_id:

            return {
                "status": "success",
                "analysis": item,
            }

    raise HTTPException(status_code=404, detail="Analysis not found.")


# ==================================================
# OLD HTML DASHBOARD
# ==================================================


@app.get("/")
def dashboard():

    file_path = os.path.join(
        BASE_DIR,
        "templates",
        "index.html",
    )

    return FileResponse(file_path)
