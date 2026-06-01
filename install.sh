#!/usr/bin/env bash
set -euo pipefail

MOD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$HOME/.vscode/extensions/pablodelucca.pixel-agents-1.3.0"
WEBVIEW="$EXT_DIR/dist/webview"
ASSETS="$WEBVIEW/assets"
CONFIG="$HOME/.pixel-agents/config.json"

# ── Guard ────────────────────────────────────────────────────────────────────

if [[ ! -d "$EXT_DIR" ]]; then
  echo "ERROR: pixel-agents extension not found at $EXT_DIR" >&2
  echo "Install 'pablodelucca.pixel-agents' in VS Code first." >&2
  exit 1
fi

echo "Installing bathroom-break mod..."

# ── 1. Copy scripts ───────────────────────────────────────────────────────────

cp "$MOD_DIR/scripts/bathroom-break.js" "$ASSETS/bathroom-break.js"
cp "$MOD_DIR/scripts/toilet-sounds.js"  "$ASSETS/toilet-sounds.js"
echo "  ✓ Scripts copied"

# ── 2. Copy sounds ────────────────────────────────────────────────────────────

SOUND_DST="$ASSETS/furniture/TOILET/sounds"
mkdir -p "$SOUND_DST"
cp "$MOD_DIR/assets/furniture/TOILET/sounds/"*.mp3 "$SOUND_DST/"
echo "  ✓ Sounds copied"

# ── 3. Patch index.html ───────────────────────────────────────────────────────

HTML="$WEBVIEW/index.html"
MARKER='bathroom-break-mod'

if grep -q "$MARKER" "$HTML"; then
  echo "  ✓ index.html already patched"
else
  # Insert before </head> using Python for clean multi-line replacement
  python3 - "$HTML" << 'PYEOF'
import sys
path = sys.argv[1]
html = open(path).read()
inject = (
    '    <script type="module" crossorigin src="./assets/bathroom-break.js"></script>\n'
    '    <script type="module" crossorigin src="./assets/toilet-sounds.js"></script>\n'
    '    <!-- bathroom-break-mod -->\n'
)
html = html.replace('  </head>', inject + '  </head>', 1)
open(path, 'w').write(html)
PYEOF
  echo "  ✓ index.html patched"
fi

# ── 4. Patch index-BUrEakFE.js (expose engine as window.__pixelAgentsJr) ─────

APP_JS="$ASSETS/index-BUrEakFE.js"

# Fix old bad patch: window.__pixelAgentsJr was incorrectly inserted inside a var declaration.
# Detect by checking if it appears between Jr= and Yr= (comma-separated declarators).
if grep -q 'Jr={current:null},window.__pixelAgentsJr=Jr,' "$APP_JS"; then
  echo "  ⚠ Removing bad engine patch (was inside var declaration)..."
  node - "$APP_JS" << 'EOF'
const fs = require('fs');
const path = process.argv[2];
let js = fs.readFileSync(path, 'utf8');
js = js.replace(/Jr=\{current:null\},window\.__pixelAgentsJr=Jr,/g, 'Jr={current:null},');
fs.writeFileSync(path, js);
EOF
fi

# Apply correct patch: window.__pixelAgentsJr=Jr; as a separate statement after the var declaration.
if grep -q 'window.__pixelAgentsJr=Jr;' "$APP_JS"; then
  echo "  ✓ App JS already patched"
else
  node - "$APP_JS" << 'EOF'
const fs = require('fs');
const path = process.argv[2];
let js = fs.readFileSync(path, 'utf8');
// Jr={current:null} is inside a var declaration; inject exposure AFTER the semicolon that closes it.
const patched = js.replace(/(Jr=\{current:null\}[^;]*;)/, '$1window.__pixelAgentsJr=Jr;');
if (patched === js) {
  console.error("ERROR: Pattern 'Jr={current:null}' not found in app JS.");
  console.error("The extension may have updated. Check dist/webview/assets/ for a new index-*.js.");
  process.exit(1);
}
fs.writeFileSync(path, patched);
EOF
  if [ $? -ne 0 ]; then exit 1; fi
  if grep -q 'window.__pixelAgentsJr=Jr;' "$APP_JS"; then
    echo "  ✓ App JS patched (engine exposed as window.__pixelAgentsJr)"
  else
    echo "ERROR: App JS patch verification failed." >&2
    exit 1
  fi
fi

# ── 5. externalAssetDirectories ──────────────────────────────────────────────

mkdir -p "$(dirname "$CONFIG")"

if [[ ! -f "$CONFIG" ]]; then
  echo '{"externalAssetDirectories":[]}' > "$CONFIG"
fi

# Add mod dir to externalAssetDirectories if not already present
node - "$CONFIG" "$MOD_DIR" << 'EOF'
const fs = require('fs');
const [,, cfg, mod] = process.argv;
const data = JSON.parse(fs.readFileSync(cfg, 'utf8'));
if (!Array.isArray(data.externalAssetDirectories)) data.externalAssetDirectories = [];
if (!data.externalAssetDirectories.includes(mod)) {
  data.externalAssetDirectories.push(mod);
  fs.writeFileSync(cfg, JSON.stringify(data, null, 2));
  console.log('  ✓ Added to externalAssetDirectories');
} else {
  console.log('  ✓ externalAssetDirectories already contains mod');
}
EOF

# ── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo "Done. Reload the Pixel Agents panel in VS Code to activate."
echo "Note: re-run this script after updating the pixel-agents extension."
