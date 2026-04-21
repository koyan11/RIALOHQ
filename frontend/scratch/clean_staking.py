import re

path = r'c:\Users\User\Downloads\RIALO HQ\frontend\pages\staking.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace corrupted characters
rep = {
    'â‰ˆ': '≈',
    'Îž': 'Ξ',
    'â”€â”€': '──',
    'âœ…': '✅',
}

for k, v in rep.items():
    content = content.replace(k, v)

# Fix corrupted block comments "?" or "?"?
content = content.replace('// "?"? ', '// ▬▬ ')
content = content.replace(' "?"? ', ' ▬▬ ')
content = content.replace(' ?" ', ' ─ ')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
