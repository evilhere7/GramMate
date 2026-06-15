import requests
import fs

envContent = open('.env', 'r').read()
env = {}
for line in envContent.split('\n'):
    match = line.strip().split('=')
    if len(match) == 2:
        env[match[0].strip()] = match[1].strip().strip('"').strip("'")

url = f"{env['VITE_SUPABASE_URL']}/rest/v1/profiles"
headers = {
    "apikey": env['VITE_SUPABASE_ANON_KEY'],
    "Authorization": f"Bearer {env['VITE_SUPABASE_ANON_KEY']}"
}

print("Querying profiles table via REST API...")
res = requests.get(url, headers=headers)
print("Status:", res.status_code)
print("Response:", res.text[:500])
