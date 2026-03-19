const fs = require('fs');
let content = fs.readFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Dashboard.tsx', 'utf8');
content = content.replace('{expenseData.map((entry, index) => (\\n                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />', '{expenseData.map((_, index) => (\\n                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />');
// Actually simple replace on first occurrence works.
content = content.replace('{expenseData.map((entry, index) => (\\n                    <Cell', '{expenseData.map((_, index) => (\\n                    <Cell');
fs.writeFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Dashboard.tsx', content);
