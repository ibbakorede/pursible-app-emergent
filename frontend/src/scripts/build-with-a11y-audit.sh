#!/bin/bash

# Build script with integrated accessibility audit
# Usage: npm run build:with-audit or bash scripts/build-with-a11y-audit.sh

echo "════════════════════════════════════════════════════════════════════"
echo "  Building Finance Transfer Platform with Accessibility Audit"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Generate accessibility audit report
echo "📋 Generating WCAG 2.1 AA accessibility audit report..."
node scripts/a11y-audit-generator.js
if [ $? -ne 0 ]; then
    echo "❌ Accessibility audit generation failed"
    exit 1
fi
echo "✓ Accessibility audit completed"
echo ""

# Step 2: Run standard build
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✓ Build completed"
echo ""

# Step 3: Summary
echo "════════════════════════════════════════════════════════════════════"
echo "✓ Build with accessibility audit completed successfully"
echo ""
echo "📄 Generated files:"
echo "  • ACCESSIBILITY_AUDIT_REPORT.md - Formal audit report (for Play Store)"
echo "  • accessibility-audit-report.json - Machine-readable audit data"
echo "  • dist/ - Built application"
echo ""
echo "🚀 Ready for Play Store submission"
echo "════════════════════════════════════════════════════════════════════"