from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import HTMLResponse
from fastapi.responses import FileResponse
from fastapi import Request
from pydantic import BaseModel
import pandas as pd
from datetime import datetime
import os

# 🔥 Import analysis function
from analysis import analyze_data

app = FastAPI()

FILE_NAME = "ingested_data.csv"

# Define request structure
class Metric(BaseModel):
    metric_name: str
    value: float
    version: str  # "before" or "after"

# Create CSV if not exists
if not os.path.exists(FILE_NAME):
    open(FILE_NAME, "w").close()  


@app.post("/ingest")
def ingest_metric(metric: Metric, background_tasks: BackgroundTasks):
    timestamp = datetime.now().strftime("%H:%M:%S")

    new_data = pd.DataFrame([{
        "timestamp": timestamp,
        "metric_name": metric.metric_name,
        "value": metric.value,
        "version": metric.version
    }])

    # Save data
    new_data.to_csv(FILE_NAME, mode='a', header=False, index=False)

    # 🔥 Trigger analysis in background
    # background_tasks.add_task(analyze_data)
    # 🔥 RUN ANALYSIS + PRINT
    result = analyze_data()

    print("\n🚀 AUTO ANALYSIS AFTER INGEST")
    print(result)

    return {
        "status": "success",
        "analysis": result   # 🔥 SEND RESULT TO UI
    }


# Optional: Manual analyze endpoint (keep this for demo)
from analysis import analyze_data

@app.get("/analyze")
def analyze():
    result = analyze_data()

    print("\n📊 FINAL ANALYSIS RESULT (UI CALL)")
    print(result)

    return result

import os
from fastapi.responses import FileResponse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.get("/")
def dashboard():
    file_path = os.path.join(BASE_DIR, "templates", "index.html")

    print("Serving file from:", file_path)   # 👈 DEBUG LINE

    return FileResponse(file_path)