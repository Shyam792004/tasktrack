const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Remove `import React from 'react';` or `import React, { ... } from 'react';`
    if (content.match(/import\s+React\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*'react';/)) {
        content = content.replace(/import\s+React\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*'react';/g, "import { $1 } from 'react';");
        changed = true;
    }
    if (content.match(/import\s+React\s+from\s*'react';\n?/)) {
        content = content.replace(/import\s+React\s+from\s*'react';\n?/g, "");
        changed = true;
    }

    // Specific fixes
    if (filePath.endsWith('Analytics.tsx')) {
        content = content.replace(/minAngle=\{15\}/g, '');
        changed = true;
    }
    if (filePath.endsWith('Expenses.tsx')) {
        content = content.replace(/\(value: number\) => `\$\$\{value\.toFixed\(2\)\}`/g, "(value: any) => `$${Number(value).toFixed(2)}`");
        changed = true;
    }
    if (filePath.endsWith('Dashboard.tsx')) {
        content = content.replace(/\(entry, index\)/g, "(_, index)");
        changed = true;
    }
    if (filePath.endsWith('Goals.tsx')) {
        content = content.replace(/TrendingUp,\s*/g, '');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
}

function walkDirs(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDirs(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkDirs(dir);
console.log('Done!');
