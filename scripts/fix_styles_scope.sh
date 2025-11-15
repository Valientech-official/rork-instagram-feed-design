#!/bin/bash

# Script to move StyleSheet.create inside component functions
# This is necessary because styles now reference dynamic 'colors' variable

cd "$(dirname "$0")/.." || exit 1

echo "Moving StyleSheet.create blocks inside component functions..."

# For each file, we need to:
# 1. Find the last major block before styles (usually around line for "return (" or end of helpers)
# 2. Cut the styles section
# 3. Paste it inside the component, after colors declaration

FILES=(
  "app/settings/privacy.tsx"
  "app/settings/privacy-policy.tsx"
  "app/settings/terms.tsx"
  "app/settings/blocked.tsx"
  "app/settings/muted.tsx"
  "app/settings/help.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Create a backup
    cp "$file" "${file}.bak"

    # This is complex to do with sed/perl, so we'll use a Python script
    python3 << 'PYTHON_SCRIPT' "$file"
import sys
import re

filename = sys.argv[1]

with open(filename, 'r') as f:
    content = f.read()

# Find the styles block
styles_pattern = r'\n\nconst styles = StyleSheet\.create\(\{[\s\S]+?\}\);\n'
styles_match = re.search(styles_pattern, content)

if styles_match:
    styles_block = styles_match.group(0).strip()

    # Remove the styles block from its current position
    content_without_styles = content[:styles_match.start()] + content[styles_match.end():]

    # Find where to insert styles (after "const colors = Colors[theme];")
    insert_pattern = r'(const colors = Colors\[theme\];)'
    insert_match = re.search(insert_pattern, content_without_styles)

    if insert_match:
        # Insert styles after colors declaration
        insert_pos = insert_match.end()
        new_content = (
            content_without_styles[:insert_pos] +
            '\n\n  ' + styles_block.replace('\n', '\n  ') +
            content_without_styles[insert_pos:]
        )

        with open(filename, 'w') as f:
            f.write(new_content)
        print(f"  ✓ Moved styles inside component")
    else:
        print(f"  ✗ Could not find colors declaration")
else:
    print(f"  ✗ Could not find styles block")
PYTHON_SCRIPT

  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Done! Cleaning up backup files..."
rm -f app/settings/*.bak

echo "Complete!"
