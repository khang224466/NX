const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('build_v10_2_23.js', 'utf8');

// Replace all v10.2.23 with v10.2.24
content = content.replace(/v10\.2\.23/g, 'v10.2.24');
content = content.replace(/v10_2_23/g, 'v10_2_24');

// Add servicesCatalog.ts update in build()
const extraUpdates = `
  // 7. Cap nhat servicesCatalog.ts
  const catalogPath = path.join(webDir, 'src', 'data', 'servicesCatalog.ts');
  if (fs.existsSync(catalogPath)) {
    let cat = fs.readFileSync(catalogPath, 'utf8');
    cat = cat.replace(/v10\\.2\\.\\d+/g, 'v10.2.24');
    fs.writeFileSync(catalogPath, cat, 'utf8');
    console.log('✓ Updated servicesCatalog.ts to v10.2.24');
  }
`;

content = content.replace(
  "console.log(`✓ Updated public/keo_bookmark.html with inline v10.2.24`);\n  }",
  "console.log(`✓ Updated public/keo_bookmark.html with inline v10.2.24`);\n  }\n" + extraUpdates
);

fs.writeFileSync('build_v10_2_24.js', content, 'utf8');
console.log('Created build_v10_2_24.js successfully');
