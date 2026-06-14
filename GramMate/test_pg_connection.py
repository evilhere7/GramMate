import psycopg2
import sys

host = "db.aqzhbeystmsifruxpprx.supabase.co" # Supabase db host is usually db.[ref].supabase.co or direct
passwords = [
    "postgres",
    "grammate",
    "SuperAdmin!123",
    "grammate_dev_password",
    "evilmc777",
    "evilmc777@gmail.com"
]

print("Testing direct database connection to host:", host)

for password in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=password,
            host=host,
            port=5432,
            connect_timeout=3
        )
        print(f"✅ SUCCESS! Connected with password: {password}")
        
        # Test executing a query
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("PG Version:", cur.fetchone())
        
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed with password {password}: {e}")

# Try direct hostname
host_direct = "aqzhbeystmsifruxpprx.supabase.co"
print("\nTesting direct hostname:", host_direct)
for password in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=password,
            host=host_direct,
            port=5432,
            connect_timeout=3
        )
        print(f"✅ SUCCESS! Connected to {host_direct} with password: {password}")
        
        # Test executing a query
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("PG Version:", cur.fetchone())
        
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Failed to {host_direct} with password {password}: {e}")
