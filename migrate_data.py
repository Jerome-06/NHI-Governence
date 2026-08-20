"""
migrate_data.py

Reads directory.json and activity.json, then inserts the data into
PostgreSQL (identities + activities tables).

Before inserting anything, this script first PRINTS the real columns
of the 'identities' table from the database itself. That way, if our
guess about the column names is wrong, you'll see it immediately in
the output instead of getting a confusing error.
"""

import json
import psycopg2

# -----------------------------------------------------------------
# 1. DATABASE CONNECTION SETTINGS  <-- EDIT THESE to match your setup
# -----------------------------------------------------------------
DB_NAME = "nhi_governance"
DB_USER = "postgres"          
DB_PASSWORD = "Jerome@9597" 
DB_HOST = "localhost"
DB_PORT = "5432"


def get_connection():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )


def load_json(file_path):
    with open(file_path, "r") as f:
        return json.load(f)


def print_table_columns(cur, table_name):
    cur.execute(
        """
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = %s
        ORDER BY ordinal_position;
        """,
        (table_name,),
    )
    rows = cur.fetchall()
    print(f"\n--- Columns currently in '{table_name}' table ---")
    if not rows:
        print(f"  (!) No table called '{table_name}' was found.")
    for col_name, data_type in rows:
        print(f"  {col_name:25s} {data_type}")
    print("---------------------------------------------\n")
    return [row[0] for row in rows]


def migrate_identities(cur, directory_data):
    # directory_data is a plain list of identity dicts, e.g.:
    # [ {"account_id": ..., "type": ..., "agent": ..., "purpose": ..., "permissions": [...]}, ... ]
    accounts = directory_data

    for acc in accounts:
        cur.execute(
            """
            INSERT INTO identities
                (account_id, type, agent, purpose, permissions)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (account_id) DO UPDATE SET
                type = EXCLUDED.type,
                agent = EXCLUDED.agent,
                purpose = EXCLUDED.purpose,
                permissions = EXCLUDED.permissions;
            """,
            (
                acc["account_id"],
                acc["type"],
                acc.get("agent"),
                acc.get("purpose"),
                json.dumps(acc.get("permissions", [])),
            ),
        )
    print(f"Inserted/updated {len(accounts)} identities.")


def migrate_activities(cur, activity_data):
    # activity_data is a plain list of activity dicts, e.g.:
    # [ {"account_id": ..., "timestamp": ..., "action": ..., "resource": ...}, ... ]
    events = activity_data

    for event in events:
        cur.execute(
            """
            INSERT INTO activities
                (account_id, timestamp, action, resource)
            VALUES (%s, %s, %s, %s);
            """,
            (
                event["account_id"],
                event["timestamp"],
                event["action"],
                event["resource"],
            ),
        )
    print(f"Inserted {len(events)} activities.")


def main():
    directory_data = load_json("data/directory.json")
    activity_data = load_json("data/activity.json")

    conn = get_connection()
    cur = conn.cursor()

    # Step A: show what columns really exist, so mismatches are obvious
    identity_cols = print_table_columns(cur, "identities")
    print_table_columns(cur, "activities")

    expected_cols = {
        "account_id",
        "type",
        "agent",
        "purpose",
        "permissions",
    }
    if not expected_cols.issubset(set(identity_cols)):
        print("!! The 'identities' table does not match what this script expects.")
        print("!! Expected columns:", expected_cols)
        print("!! Found columns:   ", set(identity_cols))
        print("!! Fix the table (or tell Claude the real column names) before continuing.")
        cur.close()
        conn.close()
        return

    # Step B: actually migrate the data
    migrate_identities(cur, directory_data)
    migrate_activities(cur, activity_data)

    conn.commit()
    cur.close()
    conn.close()
    print("\n✅ Migration finished successfully.")


if __name__ == "__main__":
    main()