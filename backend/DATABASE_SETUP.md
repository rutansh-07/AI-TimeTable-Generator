# Database Setup Guide

This guide explains how to set up the PostgreSQL database in Supabase and connect the FastAPI server to it.

## Prerequisites
- A Supabase account (free) and a created project.
- Python packages installed (run `pip install -r requirements.txt` inside the `backend` directory).

---

## Step 1: Deploy Database Schema
1. Go to your **Supabase Dashboard**.
2. Select your project.
3. Click on **SQL Editor** in the left sidebar.
4. Click **New Query**.
5. Copy the contents of [`backend/schema.sql`](file:///c:/Users/Rutansh/Desktop/sem5/SIH/AI-TimeTable-Generator/backend/schema.sql) and paste them into the SQL Editor.
6. Click **Run** to create the tables.

---

## Step 2: Seed Sample Data
To test the solver with database integration, run the seed script:
1. In the Supabase SQL Editor, click **New Query** again.
2. Copy the contents of [`backend/seed.sql`](file:///c:/Users/Rutansh/Desktop/sem5/SIH/AI-TimeTable-Generator/backend/seed.sql) and paste them.
3. Click **Run** to populate the tables with the standard test dataset.

---

## Step 3: Configure Environment Variables
1. In the `backend` directory, create a file named `.env` (you can copy `.env.example`).
2. Set the `DATABASE_URL` environment variable to your Supabase connection string.
   - Go to **Project Settings** -> **Database**.
   - Under **Connection string**, select **URI**.
   - Copy the URI and replace `[YOUR-PASSWORD]` with your database password.
   - Example:
     ```env
     DATABASE_URL=postgresql://postgres:my-secret-password@db.xyz.supabase.co:5432/postgres
     ```

---

## Step 4: Verify Connection
Run the verification script to test loading data, running the solver, and saving/retrieving the timetable:
```powershell
python backend/test_db_conn.py
```
If successful, you will see a validation success message in your terminal.

---

## Step 5: Test API Database Endpoints
Once the connection is verified, start the FastAPI server:
```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
You can now test the database-integrated API endpoints in the interactive Swagger UI at:
👉 `http://127.0.0.1:8000/docs`

### New Endpoints:
- `POST /api/timetable/generate-db`: Reads configuration data from Supabase, runs OR-Tools solver, saves the generated schedule to Supabase, and returns the result.
- `GET /api/timetable/active`: Fetches the currently active timetable from the database.
