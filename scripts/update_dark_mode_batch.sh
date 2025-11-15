#!/bin/bash

# Script to update remaining settings files for dark mode support
# Files: privacy.tsx, privacy-policy.tsx, terms.tsx, blocked.tsx, muted.tsx, help.tsx

cd "$(dirname "$0")/.." || exit 1

echo "Updating settings files for dark mode support..."

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

    # Add useThemeStore import if not present
    if ! grep -q "useThemeStore" "$file"; then
      # Find the line with useSafeAreaInsets and add the import after it
      perl -i -pe 's/(import.*useSafeAreaInsets.*;\n)/\1import { useThemeStore } from \x27\@\/store\/themeStore\x27;\n/' "$file"
    fi

    # Add theme and colors variables at the start of the component
    # This will be added after useRouter() and insets declarations
    if ! grep -q "const { theme } = useThemeStore();" "$file"; then
      perl -i -pe 's/(const insets = useSafeAreaInsets\(\);)$/\1\n  const { theme } = useThemeStore();\n  const colors = Colors[theme];/' "$file"
    fi

    # Replace all Colors.light. references with colors.
    perl -i -pe 's/Colors\.light\.(text|background|border|primary|secondary|icon|secondaryText|cardBackground|primaryLight|error|warning)/colors.\1/g' "$file"

    echo "  ✓ Updated $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Done!"
