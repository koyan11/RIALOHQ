const fs = require('fs');
const path = 'pages/staking.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace corrupted character sequences
const replacements = [
    [/â‰ˆ/g, '≈'],
    [/Îž/g, 'Ξ'],
    [/âœ…/g, '✅'],
    [/â”€â”€/g, '──'],
    [/\?\s/g, '─ '],
    [/\?\"\?/g, '▬▬']
];

replacements.forEach(([regex, replacement]) => {
    content = content.replace(regex, replacement);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Cleanup complete');
