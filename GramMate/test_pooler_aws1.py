import psycopg2
import sys

project_ref = "aqzhbeystmsifruxpprx"
host = "aws-1-us-east-1.pooler.supabase.com"
username = f"postgres.{project_ref}"
passwords = [
    "postgres",
    "grammate",
    "SuperAdmin!123",
    "grammate_dev_password",
    "evilmc777",
    "evilmc777@gmail.com"
]

print(f"Testing pooler on port 6543 for host {host}...", flush=True)

for password in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=username,
            password=password,
            host=host,
            port=6543,
            connect_timeout=5
        )
        print(f"✅ SUCCESS! Connected with password: {password}", flush=True)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("PG Version:", cur.fetchone(), flush=True)
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"  Failed with password {password}: {str(e).strip()}", flush=True)
print("Finished testing aws-1 pooler.", flush=True)
