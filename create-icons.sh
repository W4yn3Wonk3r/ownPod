#!/bin/bash
# Simple script to create placeholder icons using ImageMagick
# If ImageMagick is not available, you can create these manually or use online tools

sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    # Create a simple colored square as placeholder
    # You can replace these with actual podcast-themed icons later
    convert -size ${size}x${size} xc:#e94560 \
            -gravity center \
            -pointsize $((size/3)) \
            -fill white \
            -font Arial-Bold \
            -annotate +0+0 "OP" \
            icons/icon-${size}.png 2>/dev/null || echo "ImageMagick not available - please create icon-${size}.png manually"
done

echo "Icon generation complete (if ImageMagick is installed)"
echo "Otherwise, please create PNG icons manually in the icons/ folder"
