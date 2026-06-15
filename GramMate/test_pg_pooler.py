import psycopg2
import sys

project_ref = "aqzhbeystmsifruxpprx"
regions = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-central-1", "ap-southeast-1"]
passwords = [
    "postgres",
    "grammate",
    "SuperAdmin!123",
    "grammate_dev_password",
    "evilmc777",
    "evilmc777@gmail.com"
]

print("Testing pooled database connections...")

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    username = f"postgres.{project_ref}"
    print(f"\nTrying region {region} (host: {host})...")
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
            print(f"✅ SUCCESS! Connected to {region} with password: {password}")
            
            # Test query
            cur = conn.cursor()
            cur.execute("SELECT version();")
            print("PG Version:", cur.fetchone())
            
            cur.close()
            conn.close()
            sys.exit(0)
        except Exception as e:
            # Print without emojis to avoid encoding errors in windows cmd
            print(f"  Failed with password {password}: {str(e).strip()}")
