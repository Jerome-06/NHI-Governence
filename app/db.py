import psycopg2
import psycopg2.extras

# Same connection settings as migrate_data.py
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


def get_identities():
    conn = get_connection()
   
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT account_id, type, agent, purpose, permissions FROM identities;")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    # Convert from RealDictRow objects into plain dicts
    return [dict(row) for row in rows]


def get_activities():
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("SELECT account_id, timestamp, action, resource FROM activities;")
    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [dict(row) for row in rows]


def insert_identities(identities_list):
    conn = get_connection()
    cur = conn.cursor()

    # Clear old data first - each scan represents the current state
    cur.execute("TRUNCATE TABLE identities CASCADE;")

    for acc in identities_list:
        cur.execute(
            """
            INSERT INTO identities
                (account_id, type, agent, purpose, permissions)
            VALUES (%s, %s, %s, %s, %s);
            """,
            (
                acc["account_id"],
                acc["type"],
                acc.get("agent"),
                acc.get("purpose"),
                psycopg2.extras.Json(acc.get("permissions", [])),
            ),
        )

    conn.commit()
    cur.close()
    conn.close()
    return len(identities_list)


def insert_activities(activities_list):
    conn = get_connection()
    cur = conn.cursor()

    # Clear old data first - each scan represents the current state
    cur.execute("TRUNCATE TABLE activities;")

    for event in activities_list:
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

    conn.commit()
    cur.close()
    conn.close()
    return len(activities_list)