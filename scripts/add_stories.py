import os
import sqlite3

def add_stories():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(repo_root, "harness.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    stories = [
        ("US-001", "Premium OCR Integration", "normal", "docs/stories/premium-features/US-001-ocr-integration.md"),
        ("US-002", "PayOS VietQR Integration", "high_risk", "docs/stories/payments/US-002-payos-integration.md"),
        ("E03", "Homestay Module", "high_risk", "docs/stories/epics/E03-homestay-module/overview.md")
    ]

    for sid, title, lane, doc in stories:
        cursor.execute(
            """
            INSERT INTO story (id, title, risk_lane, contract_doc, notes)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title=excluded.title,
              risk_lane=excluded.risk_lane,
              contract_doc=excluded.contract_doc
            """,
            (sid, title, lane, doc, f"Imported via add_stories.py")
        )
    
    conn.commit()
    print("Successfully added 3 stories to harness.db.")
    conn.close()

if __name__ == "__main__":
    add_stories()
