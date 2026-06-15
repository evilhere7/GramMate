import psycopg2
import sys

project_ref = "aqzhbeystmsifruxpprx"
regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "eu-west-1", "eu-west-2", "eu-west-3",
    "eu-central-1", "eu-central-2", "eu-north-1",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2",
    "ap-northeast-1", "ap-northeast-2", "sa-east-1"
]

print("Testing all regions for pooler...")

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    username = f"postgres.{project_ref}"
    try:
        # Just test socket connection or connect with a dummy password
        # If the tenant exists, we will get "FATAL: password authentication failed"
        # If the tenant doesn't exist, we will get "FATAL: tenant/user not found"
        conn = psycopg2.connect(
            dbname="postgres",
            user=username,
            password="dummy-password-test",
            host=host,
            port=6543,
            connect_timeout=3
        )
    except psycopg2.OperationalError as e:
        msg = str(e).strip()
        if "tenant/user" in msg and "not found" in msg:
            # Tenant not found in this region
            pass
        elif "password authentication failed" in msg:
            print(f"🌟 FOUND REGION: {region} (Host: {host}) -> Tenant exists!")
        else:
            print(f"Region {region}: {msg[:100]}")
    except Exception as e:
        print(f"Region {region} error: {type(e).__name__}: {str(e)[:100]}")
