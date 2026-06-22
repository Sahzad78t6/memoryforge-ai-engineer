import requests
import sys
import time

BASE = 'http://localhost:8000'


def register_and_login():
    # Use a timestamped email to avoid collisions
    ts = int(time.time())
    email = f'test.user+{ts}@example.com'
    pwd = 'Password123!'
    name = 'Test User'
    role = 'USER'

    reg = requests.post(f'{BASE}/auth/register', json={'name': name, 'email': email, 'password': pwd, 'role': role})
    print('REGISTER ->', reg.status_code)
    try:
        print(reg.json())
    except Exception:
        print(reg.text)

    login = requests.post(f'{BASE}/auth/login', json={'email': email, 'password': pwd})
    print('LOGIN ->', login.status_code)
    token = None
    try:
        body = login.json()
        token = body.get('access_token')
        print('Token acquired:', bool(token))
    except Exception:
        print(login.text)
    return token


def upload_file(path, endpoint, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    # project upload expects a list of files under the 'files' field
    if endpoint == '/upload/project':
        with open(path, 'rb') as f:
            files = [('files', (path, f))]
            r = requests.post(f'{BASE}{endpoint}', files=files, headers=headers)
    else:
        with open(path, 'rb') as f:
            files = {'file': (path, f)}
            r = requests.post(f'{BASE}{endpoint}', files=files, headers=headers)
        print('POST', endpoint, '->', r.status_code)
        try:
            print(r.json())
        except Exception:
            print(r.text)


if __name__ == '__main__':
    img = sys.argv[1] if len(sys.argv) > 1 else '../frontend/public/favicon.svg'
    doc = sys.argv[2] if len(sys.argv) > 2 else '../README.md'

    token = register_and_login()
    if not token:
        print('No token obtained; aborting upload tests.')
        sys.exit(1)

    print('Uploading image test...')
    upload_file(img, '/upload/image', token=token)

    print('\nUploading document test...')
    upload_file(doc, '/upload/file', token=token)

    print('\nUploading project test (single file)...')
    upload_file(doc, '/upload/project', token=token)
