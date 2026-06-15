import psycopg2
import sys

ipv6_addr = "2600:1f18:16e0:2801:872b:b88f:45e8:84ea"
port = 5432
passwords = [
    "postgres",
    "grammate",
    "SuperAdmin!123",
    "grammate_dev_password",
    "evilmc777",
    "evilmc777@gmail.com"
]

print(f"Testing direct IPv6 database connection to [{ipv6_addr}]:{port}...", flush=True)

for password in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=password,
            host=ipv6_addr,
            port=port,
            connect_timeout=5
        )
        print(f"✅ SUCCESS! Connected to [{ipv6_addr}] with password: {password}", flush=True)
        
        # Test query
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("PG Version:", cur.fetchone(), flush=True)
        
        cur.close()
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"  Failed with password {password}: {str(e).strip()}", flush=True)

print("Direct IPv6 connection failed.", flush=True)
