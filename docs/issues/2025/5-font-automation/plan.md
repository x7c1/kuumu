# Font Management Modernization Plan

## Overview
Modernize font management for the three-js-layouter-example application by migrating from legacy JSON font files to Three.js TTFLoader approach to eliminate manual file generation and improve performance.

## Current Situation
- Large JSON font files (13.9MB) are manually placed at `frontend/apps/three-js-layouter-example/public/fonts/PlemolJP_Regular.json`
- Environment configuration references `./fonts/PlemolJP_Regular.json` via `VITE_KUUMU_FONT_PATH`
- Using legacy JSON format instead of modern TTF loading approach
- Manual process is error-prone and not suitable for CI/CD workflows

## Requirements
- Replace JSON font loading with TTFLoader approach
- Use TTF/OTF files directly without pre-conversion
- Maintain compatibility with existing environment configuration
- Reduce font file sizes from 13.9MB JSON to smaller TTF files (2-4MB)
- Ensure consistent font availability across different environments

## Technical Implementation Plan

### Phase 1: TTFLoader Implementation
- **Tool Selection**: Use Three.js TTFLoader with opentype.js for direct TTF loading
- **Source Font**: Download PlemolJP TTF files from external source (not in version control)
- **Code Migration**: Replace FontLoader with TTFLoader in application code
- **File Size Reduction**: TTF files are typically 2-4MB vs 13.9MB JSON (70-85% reduction)

### Phase 2: Build Pipeline Integration
- **Asset Pipeline**: Configure Vite to handle TTF files as assets
- **Font Sources**: Support npm packages like Fontsource or Google Fonts
- **Environment Support**: Ensure fonts work in both development and production builds
- **HTTP Compression**: Implement gzip compression for TTF files (additional 60-70% reduction)

### Phase 3: Development Experience
- **Simplified Setup**: No build scripts needed for font conversion
- **Documentation**: Update README with TTFLoader usage instructions
- **Error Handling**: Add validation for missing or corrupted TTF files

## Specific Implementation Details

### TTFLoader Usage
```javascript
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const ttfLoader = new TTFLoader();
const fontLoader = new FontLoader();

// Load TTF file directly
ttfLoader.load('./fonts/PlemolJP_Regular.ttf', (fontData) => {
  const font = fontLoader.parse(fontData);
  
  // Use with TextGeometry as before
  const textGeometry = new TextGeometry('Hello World', {
    font: font,
    size: 80,
    height: 5,
  });
});
```

### Environment Configuration Migration
```bash
# Current (.envrc.example and .envrc)
export VITE_KUUMU_FONT_PATH=./fonts/PlemolJP_Regular.json

# New approach (.envrc.example and .envrc)
export VITE_KUUMU_FONT_PATH=./fonts/PlemolJP_Regular.ttf
```

**Files to update:**
- `.envrc.example`: Update template for new developers
- Existing `.envrc`: Developers update their local files

### Directory Structure
```
scripts/
├── font-config.json         # Font configuration (single source of truth)
├── download-fonts.sh        # Font download script
└── install-ubuntu-deps.sh   # Existing system dependencies script (updated with jq)

frontend/apps/three-js-layouter-example/public/fonts/
├── PlemolJP_Regular.ttf     # Downloaded TTF file (already git-ignored)
└── PlemolJP_Regular.ttf.gz  # Compressed for HTTP delivery (git-ignored)
```

### Font Configuration (scripts/font-config.json)
```json
{
  "fonts": [
    {
      "name": "PlemolJP_Regular.ttf",
      "url": "https://github.com/yuru7/PlemolJP/releases/download/v3.0.0/PlemolJP_Regular.ttf"
    },
    {
      "name": "PlemolJP_Bold.ttf", 
      "url": "https://github.com/yuru7/PlemolJP/releases/download/v3.0.0/PlemolJP_Bold.ttf"
    }
  ]
}
```

### Shell Script (scripts/download-fonts.sh)
```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(dirname "$0")"
CONFIG_FILE="$SCRIPT_DIR/font-config.json"
FONT_DIR="frontend/apps/three-js-layouter-example/public/fonts"

# Check if VITE_KUUMU_FONT_PATH is set
if [ -z "$VITE_KUUMU_FONT_PATH" ]; then
  echo "Error: VITE_KUUMU_FONT_PATH environment variable is not set"
  exit 1
fi

# Extract font filename from path
FONT_NAME="$(basename "$VITE_KUUMU_FONT_PATH")"
echo "Target font: $FONT_NAME"
echo "Reading font configuration..."

# Find matching font in config by name
FONT_URL=$(jq -r --arg name "$FONT_NAME" '.fonts[] | select(.name == $name) | .url' "$CONFIG_FILE")

if [ -z "$FONT_URL" ]; then
  echo "Error: No font found with name '$FONT_NAME' in font-config.json"
  echo "Available fonts:"
  jq -r '.fonts[] | "  - \(.name)"' "$CONFIG_FILE"
  exit 1
fi

# Download the matching font
mkdir -p "$FONT_DIR"

echo "Downloading font: $FONT_NAME"
curl -L -o "$FONT_DIR/$FONT_NAME" "$FONT_URL"
echo "Font downloaded successfully: $FONT_NAME"
```

### Package.json Scripts (Root)
```json
{
  "scripts": {
    "fonts:download": "./scripts/download-fonts.sh",
    "fonts:compress": "gzip -k frontend/apps/three-js-layouter-example/public/fonts/*.ttf",
    "fonts:setup": "npm run fonts:download && npm run fonts:compress",
    "prebuild": "npm run fonts:setup"
  }
}
```


### System Dependencies (scripts/install-ubuntu-deps.sh)
The existing system dependencies script needs to be updated to include `jq`:

```bash
# Added to existing dependencies list:
jq
```

**Note:** `gzip` is pre-installed by default in Ubuntu, so no additional installation is required.

### GitHub Actions Workflow Update (.github/workflows/ci.yml)
The existing CI workflow needs the following additions:

**In the `test` job, after "Install system dependencies" step:**
```yaml
- name: Cache fonts
  uses: actions/cache@v4
  with:
    path: frontend/apps/three-js-layouter-example/public/fonts/
    key: ${{ runner.os }}-fonts-${{ hashFiles('scripts/font-config.json') }}
    restore-keys: |
      ${{ runner.os }}-fonts-

- name: Setup environment
  run: cp .envrc.example .envrc && direnv allow

- name: Setup fonts
  run: direnv exec . npm run fonts:setup
```

**In the `build-tauri` job, after "Install dependencies" step:**
```yaml
- name: Cache fonts (Ubuntu)
  if: matrix.os == 'ubuntu-latest'
  uses: actions/cache@v4
  with:
    path: frontend/apps/three-js-layouter-example/public/fonts/
    key: ${{ runner.os }}-fonts-${{ hashFiles('scripts/font-config.json') }}
    restore-keys: |
      ${{ runner.os }}-fonts-

- name: Setup environment (Ubuntu)
  if: matrix.os == 'ubuntu-latest'
  run: cp .envrc.example .envrc && direnv allow

- name: Setup fonts (Ubuntu)
  if: matrix.os == 'ubuntu-latest'  
  run: direnv exec . npm run fonts:setup
```

**Cache Strategy:**
- Cache key includes `font-config.json` hash - cache invalidates when fonts change
- Restore keys allow partial cache hits for faster builds
- Only downloads fonts when cache miss occurs

### README Documentation Update
The project README will need updates to reflect the new font management system:

**Sections to add/update:**
```markdown
## Font Management

### Setup
After cloning the repository, set up fonts:
```bash
npm run fonts:setup
```

### Font Configuration
Fonts are configured in `scripts/font-config.json`. To switch fonts:
1. Update `VITE_KUUMU_FONT_PATH` in `.envrc`
2. Run `direnv allow` to reload environment
3. Run `npm run fonts:setup` to download new font

### Available Fonts
- PlemolJP Regular: `./fonts/PlemolJP_Regular.ttf`
- PlemolJP Bold: `./fonts/PlemolJP_Bold.ttf`

### Adding New Fonts
1. Add font entry to `scripts/font-config.json`
2. Update `.envrc` to use new font path
3. Run font setup to download

### Development Notes
- Font files are git-ignored and downloaded automatically
- CI/CD caches fonts for faster builds
- Uses Three.js TTFLoader for modern font loading
```

**Migration notes for existing developers:**
- Remove manual JSON font file placement instructions
- Add font setup to development environment setup steps
- Update troubleshooting section for font-related issues

## Technical Considerations
- **File Size**: TTF (2-4MB) + gzip compression = 1-2MB final size vs 13.9MB JSON
- **Loading Performance**: No build-time conversion, runtime parsing by opentype.js
- **Maintenance**: Uses actively maintained Three.js and opentype.js libraries
- **Compatibility**: Works with modern Three.js versions, future-proof approach
- **Font Version**: Using PlemolJP v3.0.0 (latest) with IBM Plex Sans JP v1.003 integration

## Success Criteria
- Font files reduced from 13.9MB to 1-2MB (85-90% size reduction)
- No build scripts required for font conversion
- Code uses modern Three.js TTFLoader approach
- Environment configuration updated but maintains compatibility
- Documentation updated with new approach
- Developers can add new fonts without conversion steps

## Timeline Estimate
- TTFLoader code implementation: 2 points
- Environment and build configuration: 1 point
- HTTP compression setup: 1 point
- Testing across environments: 1 point
- Documentation and migration guide: 1 point
- Total: 6 points

## Implementation Steps
- Create font-config.json with available font definitions
- Create shell script for automated font downloading based on environment variables
- Update .envrc.example to reference TTF file instead of JSON
- Update GitHub Actions workflow to include font setup step with caching
- Replace FontLoader with TTFLoader in application code
- Update environment configuration for TTF files
- Configure Vite for TTF asset handling
- Implement HTTP compression for TTF files
- Update README with new font management instructions
- Create developer setup scripts and documentation
- Test across development, staging, production, and CI/CD environments
- Remove legacy JSON font files after successful migration

## Migration Path
1. **Parallel Implementation**: Add TTFLoader alongside existing FontLoader
2. **Gradual Migration**: Switch components one by one
3. **Testing Phase**: Verify identical rendering results
4. **Complete Migration**: Remove JSON fonts and FontLoader code
5. **Cleanup**: Update documentation and remove obsolete build scripts
