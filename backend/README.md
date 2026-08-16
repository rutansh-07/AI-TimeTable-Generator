# Backend Documentation

This directory contains the core AI scheduling engine and the FastAPI server that exposes it.

## Python Requirements
Ensure you have Python installed on your system. The required libraries are:
- `ortools` (Google's optimization tools)
- `pandas` (Data processing)
- `fastapi` & `uvicorn` (Web server and API framework)
- `pydantic` (Data validation)

## Installation
Open your Windows PowerShell, navigate to the `backend` directory, and run:
```powershell
pip install -r requirements.txt
```

## How to Run the Standalone Scheduler
If you want to test the AI engine directly without starting the web server, you can run the standalone script. This will use the dummy dataset defined in `app/scheduler/data_generator.py`.
```powershell
python run_scheduler.py
```
This script will output the hard constraint validation status, the optimization metrics, and a pretty-printed timetable directly to your terminal.

## How to Start the FastAPI Server
To start the live web server, run:
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Once running, you can view the interactive **Swagger API Documentation** at:
👉 `http://127.0.0.1:8000/docs`

## Current API Endpoints

### 1. `GET /health`
Checks if the server is alive.

### 2. `POST /api/timetable/generate`
- **What it does**: Accepts a full JSON payload of academic scheduling data (courses, rooms, faculty, constraints). It passes this data to the OR-Tools engine, generates a new optimized timetable, and returns the timetable alongside validation results and quality metrics.

### 3. `POST /api/timetable/validate`
- **What it does**: Accepts academic scheduling data *plus* a generated schedule. It runs our independent validator algorithm to mathematically guarantee that the provided schedule does not break any hard constraints and returns the quality metrics.

### 4. `POST /api/timetable/reoptimize`
- **What it does**: Designed for when a constraint changes (e.g., a professor suddenly cannot teach on Tuesdays). It accepts the updated constraints in JSON format and runs the OR-Tools engine again to adapt and find a new optimal timetable.

## Important Note on Data
Currently, the scheduler and the API rely entirely on **in-memory sample data** or the data explicitly passed in the JSON request. 

We have **not yet connected to a database (Supabase)**. In the future, the Next.js frontend will pull data from Supabase, structure it into our API's expected JSON format, and send it to these endpoints to generate the schedule.
