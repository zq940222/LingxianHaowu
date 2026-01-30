import json
import urllib.request

import os
port = os.getenv('PORT', '8000')
url = f'http://127.0.0.1:{port}/api/v1/auth/login'
payload = {'code': 'abc', 'nickname': 'test', 'avatar': ''}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    print(resp.status)
    print(resp.read().decode('utf-8'))
