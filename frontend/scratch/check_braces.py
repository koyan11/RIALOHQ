with open('pages/staking.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    opens = content.count('{')
    closes = content.count('}')
    print(f"Total Opens: {opens}, Total Closes: {closes}")
    
    # Track nesting
    nesting = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if char == '{': nesting += 1
            if char == '}': nesting -= 1
        if i == 533: # Around the error
            print(f"Nesting at line {i+1}: {nesting}")
