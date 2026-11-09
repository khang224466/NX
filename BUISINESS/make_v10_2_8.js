const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'build_v10_2_7.js'), 'utf8');

// 1. Bump version to v10.2.8
code = code.replace(/v10\.2\.7/g, 'v10.2.8');

// 2. Lock isSubmitting during solveQuestion
const oldTry = `          try {
            var vAns = await solveQuestion(visionPrompt, shot.image);`;

const newTry = `          isSubmitting = true;
          try {
            var vAns = await solveQuestion(visionPrompt, shot.image);`;

code = code.replace(oldTry, newTry);

// 3. Make sure isSubmitting is cleared in finally if return early
code = code.replace(
  `            if (!vAns) {
              setStatus('idle');
              return;
            }`,
  `            if (!vAns) {
              isSubmitting = false;
              setStatus('idle');
              return;
            }`
);

// 4. Update minified filename
code = code.replace(/v10_2_7_minified\.js/g, 'v10_2_8_minified.js');

fs.writeFileSync(path.join(__dirname, 'build_v10_2_8.js'), code, 'utf8');
console.log('✓ Successfully generated build_v10_2_8.js');
