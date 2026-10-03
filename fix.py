import re

with open('src/features/clinical/components/reception-dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = 'import { CancelVisitButton } from "./cancel-visit-button";\n' + content

pattern = r"<Link href=\{\/patients/\$\{q\.patient\.id\}\\} key=\{q\.id\} className=.block group.>\s*<div className=.p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all.>\s*<div className=.flex items-center gap-3.>\s*<span className=.text-xs font-bold text-slate-400 w-4.>(.*?)</span>\s*<div>\s*<p className=.font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600.>\s*\{q\.patient\.firstName\} \{q\.patient\.lastName\}\s*</p>\s*</div>\s*</div>\s*<ArrowRight className=.w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors. />\s*</div>\s*</Link>"

replacement = '''<div key={q.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between group hover:border-blue-300 hover:shadow-sm transition-all">
                          <Link href={/patients/} className="flex-1 flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-4">\\1</span>
                            <div>
                              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                                {q.patient.firstName} {q.patient.lastName}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2">
                            <CancelVisitButton visitId={q.id} />
                            <Link href={/patients/}>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </Link>
                          </div>
                        </div>'''

content = re.sub(pattern, replacement, content)

with open('src/features/clinical/components/reception-dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
