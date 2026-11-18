#!/bin/sh
# Copies only the public site files into dist/, which is what gets deployed.
# internal/ (build sheet, unit economics) is deliberately excluded.
set -e
cd "$(dirname "$0")"
rm -rf dist
mkdir -p dist/assets dist/articles
cp index.html hatcheries.html kits.html company.html 404.html styles.css favicon.svg robots.txt sitemap.xml dist/
cp articles/*.html dist/articles/
cp assets/*.svg dist/assets/
echo "dist built: $(find dist -type f | wc -l) files"
