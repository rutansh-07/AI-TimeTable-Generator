# Backend Architecture

This document explains the architecture of the AI-Based Timetable Generator backend in a beginner-friendly way.

## The Data Flow
When a user (or the frontend) wants to generate a schedule, the data flows through our backend in a strict, secure sequence:

```text
Client / Frontend (Sends JSON data)
       ↓
FastAPI (Receives the HTTP request)
       ↓
Pydantic Request Schemas (Validates the JSON matches our exact formats)
       ↓
Internal Scheduler Models (Converts validated JSON into simple Python classes)
       ↓
OR-Tools CP-SAT Engine (The brain that calculates the schedule)
       ↓
7 Hard Constraints (Strict rules the engine MUST follow)
       ↓
Soft Optimization Objectives (Preferences to make a "good" schedule "great")
       ↓
Optimized Schedule (The raw result from the solver)
       ↓
Independent Validator (Double-checks the engine didn't cheat or break rules)
       ↓
API Response (Returns the schedule, validation, and metrics to the frontend)
```

## The Constraints
Constraint Programming works by defining variables (e.g., "When is Physics?") and applying rules to them. We use two types of rules:

### 7 Implemented Hard Constraints
Hard constraints are absolute. If a schedule breaks even one of these, it is completely invalid. The solver will declare the problem "Infeasible" rather than break these rules.

1. **Faculty clash prevention**: A professor cannot teach two classes at the same time.
2. **Room clash prevention**: A room cannot host two classes at the same time.
3. **Section/student clash prevention**: A student section cannot attend two classes at the same time.
4. **Room capacity**: The room assigned must have enough seats for all students in the section.
5. **Faculty availability**: A professor can only be scheduled during timeslots they are explicitly available.
6. **Lab requirement**: If a course requires a lab, it must be scheduled in a room marked as a lab.
7. **Required weekly course periods**: If Calculus requires 3 classes a week, exactly 3 classes must be scheduled.

### 4 Implemented Soft Objectives
Soft objectives are preferences. The engine uses these to score different valid schedules and pick the best one.

1. **Section free-gap minimization**: Groups classes together so students don't have awkward multi-hour gaps in the middle of their day.
2. **Faculty workload balancing**: Spreads a professor's classes evenly across the week rather than putting all their classes on a single day.
3. **Room capacity utilization**: Avoids putting small 20-person sections in massive 120-person lecture halls if a smaller room is available.
4. **Faculty preferred timeslots**: Tries to schedule professors during their "preferred" times, even if they are technically "available" all day.

### The Golden Rule of Architecture
**Hard constraints must always be satisfied.** 
Soft objectives ONLY influence which valid timetable is preferred. The engine will happily ignore a professor's preferred timeslot or put a small class in a giant room if it is the only mathematical way to satisfy the hard constraints.

## Current Test & Verification Status
Based strictly on the existing code and extensive testing, our backend is in the following state:

- ✅ **Standalone scheduler works**: `run_scheduler.py` executes flawlessly.
- ✅ **7/7 hard constraints validated**: The independent validator confirms 0 violations in test datasets.
- ✅ **Optimization metrics calculated**: The system successfully scores schedules and minimizes penalties.
- ✅ **FastAPI health endpoint tested**: Returns `200 OK`.
- ✅ **Generate endpoint tested**: Successfully accepts JSON and returns an optimal schedule.
- ✅ **Validate endpoint tested**: Successfully digests schedule data and validates it.
- ✅ **Reoptimize endpoint tested**: Successfully adapts to modified constraints (e.g., removing a professor's availability).
- ✅ **Infeasible schedules handled**: The API gracefully returns an `INFEASIBLE` status if the constraints are mathematically impossible.
- ✅ **Swagger testing performed**: The interactive OpenAPI docs accurately reflect our payloads and respond correctly.
