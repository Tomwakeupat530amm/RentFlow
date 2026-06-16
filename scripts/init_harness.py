import os
import sqlite3
import re

def init_db():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(repo_root, "harness.db")
    schema_path = os.path.join(repo_root, "scripts", "schema", "001-init.sql")
    decisions_dir = os.path.join(repo_root, "docs", "decisions")

    print(f"Initializing Harness database at: {db_path}")

    # 1. Create database and run schema SQL
    if not os.path.exists(schema_path):
        print(f"Error: Schema file not found at {schema_path}")
        return

    with open(schema_path, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # SQLite connection
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # SQLite doesn't support multiple statements in execute() easily without executescript()
        cursor.executescript(schema_sql)
        conn.commit()
        print("Schema applied successfully. Database initialized.")
    except Exception as e:
        print(f"Error executing schema script: {e}")
        conn.close()
        return

    # 2. Seed decisions (brownfield import)
    if os.path.exists(decisions_dir):
        print(f"Scanning decisions from: {decisions_dir}")
        decision_files = [f for f in os.listdir(decisions_dir) if re.match(r"^\d{4}-.*\.md$", f)]
        
        imported_count = 0
        for filename in sorted(decision_files):
            file_path = os.path.join(decisions_dir, filename)
            decision_id = os.path.splitext(filename)[0]
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Parse Title (first line starting with #)
            title = decision_id
            lines = content.split("\n")
            for line in lines:
                if line.startswith("# "):
                    title = line[2:].strip()
                    break
            
            # Parse Status (content under ## Status)
            status = "accepted"
            status_header_found = False
            for line in lines:
                if line.strip().lower() == "## status":
                    status_header_found = True
                    continue
                if status_header_found and line.strip():
                    status_val = line.strip().lower()
                    if status_val in ["proposed", "accepted", "superseded", "rejected"]:
                        status = status_val
                    elif "superseded" in status_val:
                        status = "superseded"
                    break
            
            doc_path = f"docs/decisions/{filename}"
            notes = "Imported during python harness initialization."

            try:
                cursor.execute(
                    """
                    INSERT INTO decision (id, title, status, doc_path, notes)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      title=excluded.title,
                      status=excluded.status,
                      doc_path=excluded.doc_path,
                      notes=excluded.notes
                    """,
                    (decision_id, title, status, doc_path, notes)
                )
                imported_count += 1
            except Exception as e:
                print(f"Error importing decision {decision_id}: {e}")

        conn.commit()
        print(f"Successfully imported {imported_count} decisions into SQLite.")

    # 3. Print stats to verify
    try:
        cursor.execute("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
        version = cursor.fetchone()[0]
        print(f"Schema Version: {version}")

        cursor.execute("SELECT COUNT(*) FROM decision")
        decisions_count = cursor.fetchone()[0]
        print(f"Total Decisions Seeded: {decisions_count}")

        cursor.execute("SELECT id, title, status FROM decision")
        for row in cursor.fetchall():
            print(f"  - [{row[2].upper()}] {row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error querying verification stats: {e}")

    conn.close()
    print("Harness initialization complete.")

if __name__ == "__main__":
    init_db()
