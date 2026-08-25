from pathlib import Path
import json

SECURE_VERSION = 'v600-20260824-primary-exercises'

secure_path = Path('assets/js/nexora-secure-v522.js')
api_path = Path('api/content-key.js')
manifest_path = Path('protected/manifest.json')
version_path = Path('version.json')

secure = secure_path.read_text(encoding='utf-8')
api = api_path.read_text(encoding='utf-8')
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))

manifest_version = str(manifest.get('version') or '')
if manifest_version != SECURE_VERSION:
    raise SystemExit(f'Unexpected protected manifest version: {manifest_version!r}')

old_secure = "var VERSION='v523-20260813-1';"
new_secure = f"var VERSION='{SECURE_VERSION}';"
if new_secure not in secure:
    if old_secure not in secure:
        raise SystemExit('Secure content VERSION constant not found')
    secure = secure.replace(old_secure, new_secure, 1)

old_api = 'const CONTENT_VERSION = "v523-20260813-1";'
new_api = f'const CONTENT_VERSION = "{SECURE_VERSION}";'
if new_api not in api:
    if old_api not in api:
        raise SystemExit('API CONTENT_VERSION constant not found')
    api = api.replace(old_api, new_api, 1)

# Guard: all three secure-content version identifiers must be aligned.
if new_secure not in secure or new_api not in api or manifest.get('version') != SECURE_VERSION:
    raise SystemExit('Secure content version alignment failed')

secure_path.write_text(secure, encoding='utf-8')
api_path.write_text(api, encoding='utf-8')
version_path.write_text(json.dumps({
    'version': 'V616',
    'message': 'Nexora V616 : acces aux autres cycles retabli. Le moteur securise, l API de cle et le manifeste des cours utilisent maintenant exactement la meme version de contenu protegee.',
    'critical': False
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('V616 secure cycles aligned:', SECURE_VERSION)
