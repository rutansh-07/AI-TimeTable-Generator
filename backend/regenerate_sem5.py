import os, sys
sys.path.insert(0, os.getcwd())
import asyncio
from app.api.endpoints import generate_semester_timetable

async def main():
    print("Generating SEM5...")
    result = await generate_semester_timetable("SEM5", "Compact SEM5 Timetable")
    print(f"Status: {result.status}")
    print(f"Scheduled Classes: {len(result.schedule)}")
    if result.metrics:
        print(f"Quality Score: {result.metrics.quality_score}")
        print(f"Total Penalty: {result.metrics.total_penalty}")
    else:
        print("No metrics")

if __name__ == '__main__':
    asyncio.run(main())
