const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('build_v10_2_24.js', 'utf8');

// Replace all v10.2.24 with v10.2.25
content = content.replace(/v10\.2\.24/g, 'v10.2.25');
content = content.replace(/v10_2_24/g, 'v10_2_25');

fs.writeFileSync('build_v10_2_25.js', content, 'utf8');
console.log('Created build_v10_2_25.js successfully');
