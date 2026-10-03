const fs = require('fs');
let c = fs.readFileSync('src/features/clinical/components/reception-dashboard.tsx', 'utf8');

c = c.replace(/className=\{\"bg-white.*?\\\}/g, 'className={g-white dark:bg-slate-900 rounded-lg shadow border overflow-hidden flex flex-col }');

c = c.replace(/className=\{\"px-4.*?\\\}/g, 'className={px-4 py-3 border-b flex justify-between items-center }');

c = c.replace(/className=\{\"inline-flex.*?\\\}/g, 'className={inline-flex items-center px-2 py-0.5 rounded text-xs font-medium }');

c = c.replace(/className=\{\"p-1.5.*?\\\}/g, 'className={p-1.5 rounded-full transition-colors }');

c = c.replace(/className=\{\"w-3 h-3.*?\\\}/g, 'className={w-3 h-3 }');

// Also fix the links
c = c.replace(/href=\{\"\/patients\/\\\$\{inProgress.patient.id\}\"\}/g, 'href={/patients/}');
c = c.replace(/href=\{\"\/patients\/\\\$\{v.patient.id\}\"\}/g, 'href={/patients/}');

fs.writeFileSync('src/features/clinical/components/reception-dashboard.tsx', c);