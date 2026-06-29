const fs = require('fs');
const path = 'src/pages/HomePetOS.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Show context around line 634
for (let i = 632; i < Math.min(640, lines.length); i++) {
  const lineContent = JSON.stringify(lines[i].substring(0, 100));
  console.log(`L${i + 1}: ${lineContent}`);
}

// Find the duplicate block: look for the second occurrence of "纯 SVG 圆形暖光小夜灯"
let firstIdx = -1;
let secondIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('纯 SVG 圆形暖光小夜灯')) {
    if (firstIdx === -1) firstIdx = i;
    else { secondIdx = i; break; }
  }
}
console.log('\nFound markers at lines:', firstIdx + 1, 'and', secondIdx !== -1 ? secondIdx + 1 : 'none');

// The duplicate block starts at line 635 (0-indexed: 634)
if (secondIdx !== -1 || lines[634] && lines[634].includes('纯 SVG 圆形暖光小夜灯')) {
  console.log('Duplicate confirmed. Removing lines 635-796...');
  // Keep lines 0-633, drop lines 634-796 (the duplicate)
  const newLines = [...lines.slice(0, 634), '', ''];
  fs.writeFileSync(path, newLines.join('\n'), 'utf8');
  const newContent = fs.readFileSync(path, 'utf8');
  const newLines2 = newContent.split('\n');
  console.log('New total lines:', newLines2.length);
  console.log('Line 634:', JSON.stringify(newLines2[633]));
  console.log('Done!');
} else {
  console.log('Pattern not found as expected, checking more...');
  // Show what's actually around line 634
  for (let i = 630; i < Math.min(650, lines.length); i++) {
    if (lines[i].trim()) console.log(`L${i + 1}: ${lines[i].trim().substring(0, 80)}`);
  }
}
