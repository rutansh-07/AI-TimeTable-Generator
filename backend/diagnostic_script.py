import sys
import os

# Add backend to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.connection import get_db_cursor

def run_diagnostic():
    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                SELECT id, semester_id, is_active, created_at
                FROM schedules
                ORDER BY created_at DESC;
            """)
            rows = cursor.fetchall()
            
            print("--- SCHEDULES DIAGNOSTIC ---")
            for row in rows:
                print(f"ID: {row['id']}, Semester: {row['semester_id']}, Active: {row['is_active']}, Created: {row['created_at']}")
            print("----------------------------")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    run_diagnostic()
