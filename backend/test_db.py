import os
from dotenv import load_dotenv
load_dotenv('.env')

import sys
sys.path.insert(0, r'C:\Users\Reema\Desktop\AI-TimeTable-Generator\backend')
from app.db.connection import get_db_cursor

with get_db_cursor() as cur:
    cur.execute('''
        SELECT sc.assignment_id, sc.lab_batch_id, lb.batch_code 
        FROM scheduled_classes sc 
        JOIN schedules s ON sc.schedule_id = s.id 
        LEFT JOIN lab_batches lb ON sc.lab_batch_id = lb.id 
        WHERE s.is_active = TRUE 
        ORDER BY sc.assignment_id, lb.batch_code
    ''')
    rows = cur.fetchall()
    
    print(f"Total classes: {len(rows)}")
    
    examples_shown = 0
    for r in rows:
        # Show first theory class, first lab batch A, B, C, D
        aid = r['assignment_id']
        batch = r['batch_code']
        expanded = f"{aid}_{batch}" if batch else aid
        
        if batch and examples_shown < 15:
            print(f"LAB   : Base: {aid} + Batch: {batch} -> {expanded}")
            examples_shown += 1
        elif not batch and examples_shown < 1:
            print(f"THEORY: Base: {aid} -> {expanded}")
