import socket
import sys

host = "db.aqzhbeystmsifruxpprx.supabase.co"
port = 5432

print(f"Testing direct socket connection to {host}:{port}...", flush=True)

try:
    # Get addr info (both IPv4 and IPv6)
    addr_info = socket.getaddrinfo(host, port)
    print("Resolved addresses:", addr_info, flush=True)
    
    # Try to connect to each resolved address
    for family, socktype, proto, canonname, sockaddr in addr_info:
        ip = sockaddr[0]
        print(f"Connecting to {ip}...", flush=True)
        try:
            s = socket.socket(family, socktype, proto)
            s.settimeout(5)
            s.connect(sockaddr)
            print(f"✅ SUCCESS! Connected to {ip}", flush=True)
            s.close()
            sys.exit(0)
        except Exception as e:
            print(f"  Failed to connect to {ip}: {e}", flush=True)
except Exception as e:
    print(f"Error during address resolution/connection: {e}", flush=True)

print("Direct connection failed.", flush=True)
