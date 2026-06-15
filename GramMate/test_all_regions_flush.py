import psycopg2
import sys
import socket

project_ref = "aqzhbeystmsifruxpprx"
regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "eu-west-1", "eu-west-2", "eu-west-3",
    "eu-central-1", "eu-central-2", "eu-north-1",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2",
    "ap-northeast-1", "ap-northeast-2", "sa-east-1"
]

print("Testing all regions for pooler (flushed)...", flush=True)

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    username = f"postgres.{project_ref}"
    print(f"Checking {region} ({host})...", flush=True)
    
    # First check DNS resolution
    try:
        ip = socket.gethostbyname(host)
        print(f"  Resolved DNS to IP: {ip}", flush=True)
    except socket.gaierror:
        print(f"  DNS Resolution failed", flush=True)
        continue

    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=username,
            password="dummy-password-test",
            host=host,
            port=6543,
            connect_timeout=3
        )
        conn.close()
    except psycopg2.OperationalError as e:
        msg = str(e).strip()
        # Clean msg to avoid windows console print issues
        msg_clean = msg.replace("\n", " ").replace("\r", "")
        if "tenant/user" in msg_clean and "not found" in msg_clean:
            print(f"  Tenant not found in this region", flush=True)
        elif "password authentication failed" in msg_clean:
            print(f"  🌟 FOUND REGION: {region} (Host: {host}) -> Tenant exists!", flush=True)
        else:
            print(f"  Error: {msg_clean[:120]}", flush=True)
    except Exception as e:
        print(f"  Exception: {type(e).__name__}: {str(e)[:120]}", flush=True)
print("Finished testing all regions.", flush=True)
