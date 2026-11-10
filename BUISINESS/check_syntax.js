const fs = require('fs');
const vm = require('vm');
const code = fs.readFileSync('v10_2_15_minified.js', 'utf8');
console.log('Length:', code.length);
try {
  new vm.Script('(' + code + ')("")');
  console.log('Syntax VALID!');
} catch (e) {
  console.error('Syntax ERROR:', e);
}
