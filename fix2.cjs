const fs = require('fs');
let contentAnalytics = fs.readFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Analytics.tsx', 'utf8');
contentAnalytics = contentAnalytics.replace('clockWise', '');
fs.writeFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Analytics.tsx', contentAnalytics);

let contentDashboard = fs.readFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Dashboard.tsx', 'utf8');
contentDashboard = contentDashboard.replace(/\(_, index\)/g, '(entry, index)');
fs.writeFileSync('e:\\myproject\\TaskTrack\\src\\pages\\Dashboard.tsx', contentDashboard);
console.log('Fixed');
