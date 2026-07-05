const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Match fetch('/api/...') or fetch(`/api/...`)
            // Only replace those that don't already have a second argument
            let modified = false;
            
            // Regex to find: fetch('/api/something') or fetch(`/api/something`)
            // and replace with fetch('/api/something', { cache: 'no-store' })
            const regex = /fetch\(\s*(['"`]\/api\/[^'"`]+['"`])\s*\)/g;
            
            if (regex.test(content)) {
                content = content.replace(regex, "fetch($1, { cache: 'no-store' })");
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

const srcDir = path.join(__dirname, '../src');
processDirectory(srcDir);
console.log('Finished updating fetch calls.');
