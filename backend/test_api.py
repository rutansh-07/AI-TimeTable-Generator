import sys
import os
import requests
import time

# Add the backend directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.scheduler.data_generator import generate_test_data

def get_json_data():
    timeslots, rooms, faculty, courses, sections, assignments = generate_test_data()
    
    import dataclasses
    def to_dict(obj):
        if hasattr(obj, '__dataclass_fields__'):
            result = {}
            for field in dataclasses.fields(obj):
                value = getattr(obj, field.name)
                # Convert sets to lists
                if isinstance(value, set):
                    value = list(value)
                result[field.name] = value
            return result
        return obj

    return {
        "timeslots": [to_dict(t) for t in timeslots],
        "rooms": [to_dict(r) for r in rooms],
        "faculty": [to_dict(f) for f in faculty],
        "courses": [to_dict(c) for c in courses],
        "sections": [to_dict(s) for s in sections],
        "assignments": [to_dict(a) for a in assignments]
    }

def run_tests():
    base_url = "http://127.0.0.1:8000"
    
    print("--- 1. Testing /health ---")
    resp = requests.get(f"{base_url}/health")
    print(resp.status_code, resp.json())
    
    print("\n--- 2. Testing /api/timetable/generate ---")
    data = get_json_data()
    resp = requests.post(f"{base_url}/api/timetable/generate", json=data)
    print(f"Status Code: {resp.status_code}")
    res_json = resp.json()
    print(f"Response Status: {res_json.get('status')}")
    print(f"Metrics: {res_json.get('metrics')}")
    
    schedule = res_json.get("schedule")
    
    print("\n--- 3. Testing /api/timetable/validate ---")
    val_data = get_json_data()
    val_data["schedule"] = schedule
    resp = requests.post(f"{base_url}/api/timetable/validate", json=val_data)
    print(f"Status Code: {resp.status_code}")
    val_res = resp.json()
    print(f"Validation Status: VALID = {val_res.get('is_valid')}")
    print(f"Validation Errors: {val_res.get('errors')}")

    print("\n--- 4. Testing /api/timetable/reoptimize ---")
    # Change constraint: Dr. Jones is NOT available on Monday at 9:00 (id=0)
    reopt_data = get_json_data()
    for f in reopt_data["faculty"]:
        if f["name"] == "Dr. Jones":
            f["available_timeslots"] = [t for t in f["available_timeslots"] if t != 0]
            f["preferred_timeslots"] = [t for t in f["preferred_timeslots"] if t != 0]

    resp = requests.post(f"{base_url}/api/timetable/reoptimize", json=reopt_data)
    print(f"Status Code: {resp.status_code}")
    reopt_res = resp.json()
    print(f"Response Status: {reopt_res.get('status')}")
    print(f"Metrics: {reopt_res.get('metrics')}")
    
    print("\n--- 5. Checking Dr. Jones assignment ---")
    dr_jones_id = next(f["id"] for f in reopt_data["faculty"] if f["name"] == "Dr. Jones")
    dr_jones_assignments = [a["id"] for a in reopt_data["assignments"] if a["faculty_id"] == dr_jones_id]
    
    new_schedule = reopt_res.get("schedule")
    for sc in new_schedule:
        if sc["assignment_id"] in dr_jones_assignments:
            print(f"Dr. Jones assigned to timeslot_id: {sc['timeslot_id']}")

if __name__ == "__main__":
    run_tests()
