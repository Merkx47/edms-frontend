import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MdDescription, MdPendingActions, MdTrendingUp, MdWarning, MdUploadFile, MdApproval, MdVisibility, MdEdit, MdArrowForward, MdAccessTime } from 'react-icons/md';
import { generateDashboardKPIs, mockWorkflows } from '@/lib/mock-data';
import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import type { AuditAction } from '@shared/schema';

const DEPT_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#ea580c', '#4f46e5'];

const actionIcons: Partial<Record<AuditAction, React.FC<{ className?: string }>>> = {
  upload: MdUploadFile, view: MdVisibility, download: MdVisibility, edit: MdEdit,
  approve: MdApproval, reject: MdWarning, archive: MdDescription, dispose: MdDescription,
  comment: MdEdit, share: MdVisibility, classify: MdDescription,
  workflow_start: MdPendingActions, workflow_complete: MdApproval,
};

const actionColors: Partial<Record<AuditAction, string>> = {
  upload: 'bg-blue-500/10 text-blue-600', view: 'bg-gray-500/10 text-gray-500',
  approve: 'bg-emerald-500/10 text-emerald-600', edit: 'bg-amber-500/10 text-amber-600',
  workflow_start: 'bg-violet-500/10 text-violet-600', workflow_complete: 'bg-emerald-500/10 text-emerald-600',
  download: 'bg-indigo-500/10 text-indigo-600', share: 'bg-teal-500/10 text-teal-600',
};

function KPICard({ title, value, icon: Icon, iconBg, subtitle, delay }: {
  title: string; value: string | number; icon: React.FC<{ className?: string }>;
  iconBg: string; subtitle: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.2, type: 'spring' }}
                className="text-3xl font-bold mt-1 tracking-tight"
              >
                {value}
              </motion.p>
              <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
            </div>
            <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </Card>
    </motion.div>
  );
}

/** Inline spark bars — tiny horizontal bars for each month */
function MonthlySparkBars({ data }: { data: { month: string; uploads: number; approvals: number }[] }) {
  const max = Math.max(...data.map(d => Math.max(d.uploads, d.approvals)));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <motion.div
          key={d.month}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.06 }}
          className="grid grid-cols-[48px_1fr] gap-3 items-center"
        >
          <span className="text-xs font-medium text-muted-foreground text-right">{d.month}</span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-[10px] rounded-full bg-muted flex-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.uploads / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                />
              </div>
              <span className="text-xs font-semibold w-6 text-right">{d.uploads}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-[10px] rounded-full bg-muted flex-1 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.approvals / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.55 + i * 0.06, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                />
              </div>
              <span className="text-xs font-semibold w-6 text-right text-blue-600">{d.approvals}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Radial progress ring */
function RadialRing({ value, max, color, label, size = 80 }: { value: number; max: number; color: string; label: string; size?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[70px]">{label}</span>
    </div>
  );
}

/** Horizontal department bars with animated fill */
function DepartmentBars({ data }: { data: { department: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="space-y-3">
      {data.slice(0, 6).map((d, i) => (
        <motion.div
          key={d.department}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.07 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">{d.department}</span>
            <span className="text-xs font-bold" style={{ color: DEPT_COLORS[i] }}>{d.count}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.6 + i * 0.07, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: DEPT_COLORS[i] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const kpis = useMemo(() => generateDashboardKPIs(), []);
  const pendingWorkflows = mockWorkflows.filter(w => w.status === 'in_progress' || w.status === 'pending');

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back. Here's what's happening today.</p>
        </div>
        <Button onClick={() => setLocation('/documents')} className="gap-2 rounded-xl shadow-md shadow-primary/20">
          <MdUploadFile className="h-4 w-4" /> New Document
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Documents" value={kpis.totalDocuments} icon={MdDescription} iconBg="bg-blue-500/10 text-blue-600" subtitle={`+${kpis.documentsThisMonth} this month`} delay={0} />
        <KPICard title="Pending Approvals" value={kpis.pendingApprovals} icon={MdPendingActions} iconBg="bg-amber-500/10 text-amber-600" subtitle="Awaiting review" delay={0.08} />
        <KPICard title="Active Workflows" value={kpis.activeWorkflows} icon={MdTrendingUp} iconBg="bg-emerald-500/10 text-emerald-600" subtitle="In progress" delay={0.16} />
        <KPICard title="Overdue" value={kpis.overdueWorkflows} icon={MdWarning} iconBg="bg-red-500/10 text-red-600" subtitle="Past SLA deadline" delay={0.24} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Activity — Spark Bars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Monthly Activity</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-gradient-to-r from-primary to-emerald-400" /> Uploads</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" /> Approvals</span>
              </div>
            </CardHeader>
            <CardContent>
              <MonthlySparkBars data={kpis.monthlyTrend} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Radial Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 py-2">
                <RadialRing value={kpis.totalDocuments - kpis.pendingApprovals} max={kpis.totalDocuments} color="#16a34a" label="Approved" />
                <RadialRing value={kpis.pendingApprovals} max={kpis.totalDocuments} color="#d97706" label="Pending" />
                <RadialRing value={kpis.activeWorkflows} max={kpis.activeWorkflows + 2} color="#2563eb" label="Active Flows" />
                <RadialRing value={kpis.overdueWorkflows} max={kpis.activeWorkflows + 2} color="#dc2626" label="Overdue" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Breakdown — Horizontal Bars */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">By Department</CardTitle>
            </CardHeader>
            <CardContent>
              <DepartmentBars data={kpis.departmentBreakdown} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Link href="/audit"><Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">View all <MdArrowForward className="h-3 w-3" /></Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {kpis.recentActivity.slice(0, 6).map((entry, i) => {
                  const Icon = actionIcons[entry.action] || MdDescription;
                  const colorClass = actionColors[entry.action] || 'bg-gray-500/10 text-gray-500';
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      <div className={`h-9 w-9 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{entry.details}</p>
                        <p className="text-xs text-muted-foreground truncate">{entry.userName}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <MdAccessTime className="h-3 w-3" />
                        {new Date(entry.timestamp).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Workflows */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Pending Workflows</CardTitle>
              <Link href="/workflows"><Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">View all <MdArrowForward className="h-3 w-3" /></Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingWorkflows.map((wf, i) => {
                  const isOverdue = new Date(wf.slaDeadline) < new Date();
                  const progress = (wf.currentStep / wf.totalSteps) * 100;
                  return (
                    <motion.div
                      key={wf.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="p-3.5 rounded-xl border border-border hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
                      onClick={() => setLocation('/workflows')}
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{wf.documentTitle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {wf.type.replace('_', ' ')} &middot; Step {wf.currentStep}/{wf.totalSteps}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          {isOverdue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>}
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                          className={`h-full rounded-full ${isOverdue ? 'bg-destructive' : 'bg-primary'}`}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        SLA: {new Date(wf.slaDeadline).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
