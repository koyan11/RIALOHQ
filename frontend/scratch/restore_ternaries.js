const fs = require('fs');
const path = 'pages/staking.tsx';
let content = fs.readFileSync(path, 'utf8');

// Restore ternaries: replace the dash back to question mark
// We look for patterns like "condition ─ value : value" or just " ─ "
// I will replace " ─ " with " ? "
content = content.replace(/ ─ /g, ' ? ');

// Clean up comments if they were affected (lines starting with //)
// Actually, let's just use " | " as the divider in comments to avoid further issues
const lines = content.split('\n');
const fixedLines = lines.map(line => {
    if (line.trim().startsWith('//')) {
        return line.replace(/ \? /g, ' | ');
    }
    return line;
});

fs.writeFileSync(path, fixedLines.join('\n'), 'utf8');
console.log('Ternaries restored');
