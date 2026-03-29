import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MdDownload, MdPlayArrow, MdSchedule, MdBarChart, MdDescription, MdPeople, MdSecurity, MdPerson, MdArchive } from 'react-icons/md';
import { generateDashboardKPIs } from '@/lib/mock-data';
import { useDataStore } from '@/lib/data-store';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Report } from '@shared/schema';

const reportIcons: Record<Report['type'], React.FC<{ className?: string }>> = {
  document_volume: MdBarChart,
  workflow_status: MdSchedule,
  department_activity: MdPeople,
  compliance: MdSecurity,
  user_activity: MdPerson,
  retention: MdArchive,
};

const statusColors: Record<string, string> = {
  ready: 'bg-emerald-600 text-white',
  generating: 'bg-blue-600 text-white',
  scheduled: 'bg-slate-500 text-white',
};

const TYPE_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#ea580c'];

export default function Reports() {
  const { documents, reports, runReport, downloadReport } = useDataStore();
  const kpis = useMemo(() => generateDashboardKPIs(), []);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type: type.replace('_', ' '), count })).sort((a, b) => b.count - a.count);
  }, [documents]);

  const maxType = Math.max(...typeData.map(d => d.count));
  const maxMonth = Math.max(...kpis.monthlyTrend.map(d => Math.max(d.uploads, d.approvals)));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate and download compliance and activity reports</p>
      </motion.div>

      {/* Visual Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-gradient-to-r from-primary to-emerald-400" /> Uploads</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" /> Approvals</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kpis.monthlyTrend.map((d, i) => (
                  <motion.div key={d.month} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                    className="grid grid-cols-[40px_1fr] gap-3 items-center"
                  >
                    <span className="text-xs font-medium text-muted-foreground text-right">{d.month}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(d.uploads / maxMonth) * 100}%` }}
                            transition={{ duration: 0.7, delay: 0.3 + i * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                          />
                        </div>
                        <span className="text-[11px] font-semibold w-5 text-right">{d.uploads}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-muted flex-1 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(d.approvals / maxMonth) * 100}%` }}
                            transition={{ duration: 0.7, delay: 0.35 + i * 0.05 }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                          />
                        </div>
                        <span className="text-[11px] font-semibold w-5 text-right text-blue-600">{d.approvals}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Documents by Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Documents by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                {typeData.map((d, i) => (
                  <motion.div key={d.type} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground capitalize">{d.type}</span>
                      <span className="text-xs font-bold" style={{ color: TYPE_COLORS[i % TYPE_COLORS.length] }}>{d.count}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.count / maxType) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report, i) => {
            const Icon = reportIcons[report.type] || MdDescription;
            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}>
                <Card className="group hover:shadow-md hover:border-primary/20 transition-all duration-300">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge className={`text-xs ${statusColors[report.status]}`}>{report.status}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold">{report.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {report.schedule} &middot; {report.format.toUpperCase()} &middot; Last run: {new Date(report.lastRun).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => runReport(report.id)} disabled={report.status === 'generating'}>
                        <MdPlayArrow className="h-4 w-4 mr-1" /> {report.status === 'generating' ? 'Running...' : 'Run'}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => downloadReport(report.id)}>
                        <MdDownload className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
