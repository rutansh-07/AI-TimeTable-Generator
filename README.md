# AI-Based Timetable Generator

## Project Purpose
The AI-Based Timetable Generator is designed to solve complex academic scheduling problems. Creating a university timetable manually is a tedious process prone to conflicts (e.g., double-booking a professor or a room). This project leverages Artificial Intelligence—specifically Constraint Programming—to automatically generate optimal, conflict-free schedules based on academic data (courses, faculty, rooms, students) and predefined rules.

## Current MVP Status
We are currently building the Minimum Viable Product (MVP). 
**As of right now, the core AI scheduling engine and its corresponding FastAPI backend are fully functional and tested.** The scheduler correctly processes academic data, enforces all critical rules, and optimizes the schedule for quality.

However, the user interface, database, and export features are **not yet implemented**.

## Technology Stack
Our finalized technology stack for the complete application is as follows:

- **Frontend**: Next.js + React + Tailwind CSS *(Planned)*
- **Backend**: Python + FastAPI *(Implemented)*
- **Database**: PostgreSQL via Supabase *(Planned)*
- **Scheduling Engine**: Python + Google OR-Tools CP-SAT *(Implemented)*
- **Data Processing**: Pandas *(Implemented)*
- **Export**: openpyxl or ReportLab *(Planned)*
- **Version Control**: Git + GitHub *(Active)*
- **Deployment**: Vercel (Frontend) + Render/Railway (Backend) + Supabase (Database) *(Planned)*

## Current Project Structure
```text
AI-TimeTable-Generator/
├── backend/                  # Python backend
│   ├── app/                  # FastAPI Application
│   │   ├── api/              # API Endpoints
│   │   ├── schemas/          # Pydantic Schemas (API validation)
│   │   └── scheduler/        # Core AI Engine (OR-Tools)
│   ├── requirements.txt      # Python dependencies
│   ├── run_scheduler.py      # Standalone CLI execution script
│   ├── test_api.py           # API testing script
│   └── README.md             # Backend-specific instructions
├── docs/                     # Documentation
│   └── backend-architecture.md
└── README.md                 # Project root documentation
```

## What has already been implemented
✅ **Core Scheduling Engine**: A highly modular Google OR-Tools CP-SAT engine capable of solving complex timetabling problems.
✅ **Hard Constraints**: 7 critical rules that the engine *must* follow (e.g., no room double-booking, respecting room capacities).
✅ **Soft Optimization**: An optimization layer that scores the schedule on quality (e.g., minimizing student gaps, honoring faculty preferences) without breaking hard constraints.
✅ **Independent Validator**: A script that mathematically verifies the output schedule to guarantee no rules were broken.
✅ **FastAPI Backend**: A robust REST API layer wrapping the scheduling engine with full OpenAPI (Swagger) documentation and Pydantic validation.

## What is still planned (Future Work)
❌ **Next.js Frontend**: The user interface for admins, faculty, and students to interact with the system.
❌ **Supabase Database**: Persistent storage for all academic data, user profiles, and generated schedules.
❌ **Authentication**: Secure login flows for different user roles.
❌ **Deployment**: Hosting the application live on Vercel and Railway/Render.
❌ **Exports**: Downloading the generated timetable as Excel or PDF.
❌ **Advanced Features**: Machine Learning clustering, RAG, and chatbots.
