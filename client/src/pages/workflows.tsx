import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MdAdd, MdFlag, MdSearch } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import type { WorkflowStatus } from '@shared/schema';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

function slaCountdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return { text: `${Math.ceil(Math.abs(diff) / 86400000)}d overdue`, urgent: true, overdue: true };
  const days = Math.ceil(diff / 86400000);
  return { text: `${days}d left`, urgent: days <= 2, overdue: false };
}

const statusTheme: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-slate-500', text: 'text-white', dot: 'bg-white/60' },
  in_progress: { bg: 'bg-blue-600', text: 'text-white', dot: 'bg-white/60' },
  approved: { bg: 'bg-emerald-600', text: 'text-white', dot: 'bg-white/60' },
  rejected: { bg: 'bg-red-600', text: 'text-white', dot: 'bg-white/60' },
  escalated: { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-white/60' },
};

export default function Workflows() {
  const [, setLocation] = useLocation();
  const { workflows } = useDataStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return workflows;
    const q = search.toLowerCase();
    return workflows.filter(wf =>
      wf.documentTitle.toLowerCase().includes(q) ||
      wf.initiatedBy.toLowerCase().includes(q) ||
      wf.type.toLowerCase().includes(q)
    );
  }, [workflows, search]);

  const { page, pageSize, setPage, setPageSize, paginatedItems, total } = usePagination(filtered, 10);

  const stats = useMemo(() => ({
    total: workflows.length,
    active: workflows.filter(w => w.status === 'in_progress' || w.status === 'pending').length,
    completed: workflows.filter(w => w.status === 'approved').length,
    overdue: workflows.filter(w => new Date(w.slaDeadline) < new Date() && w.status !== 'approved' && w.status !== 'rejected').length,
  }), [workflows]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-3">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track, create, and process document approvals</p>
          </div>
          <Button onClick={() => setLocation('/workflows/create')} className="gap-2 rounded-xl shadow-md shadow-primary/20">
            <MdAdd className="h-4 w-4" /> New Workflow
          </Button>
        </div>

        {/* Stats + Search row */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Active', value: stats.active, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Completed', value: stats.completed, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Overdue', value: stats.overdue, color: 'text-red-600 dark:text-red-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card border border-border">
              <span className={`text-sm lg:text-base font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] lg:text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
          <div className="flex-1 min-w-0" />
          <div className="relative w-full lg:w-[280px] mt-2 lg:mt-0">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search workflows..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          <div className="flex-shrink-0 grid grid-cols-[1fr_100px_80px] lg:grid-cols-[1fr_140px_100px_120px_100px_80px] gap-3 lg:gap-4 px-4 lg:px-5 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Document</span>
            <span className="hidden lg:block">Initiated by</span>
            <span className="hidden lg:block">Type</span>
            <span>Progress</span>
            <span className="hidden lg:block">SLA</span>
            <span>Status</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {paginatedItems.map((wf, i) => {
              const sla = slaCountdown(wf.slaDeadline);
              const theme = statusTheme[wf.status];
              const done = wf.steps.filter(s => s.status === 'approved').length;
              const progress = (done / wf.totalSteps) * 100;

              return (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setLocation(`/workflows/${wf.id}`)}
                  className="grid grid-cols-[1fr_100px_80px] lg:grid-cols-[1fr_140px_100px_120px_100px_80px] gap-3 lg:gap-4 px-4 lg:px-5 py-3 border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors items-center group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{wf.documentTitle}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{wf.documentId}</p>
                  </div>
                  <span className="text-xs text-muted-foreground truncate hidden lg:block">{wf.initiatedBy}</span>
                  <Badge variant="outline" className="text-[10px] capitalize w-fit hidden lg:inline-flex">{wf.type.replace('_', ' ')}</Badge>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-muted rounded-full flex-1 overflow-hidden">
                      <div className={`h-full rounded-full ${wf.status === 'rejected' ? 'bg-destructive' : wf.status === 'approved' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground w-8">{done}/{wf.totalSteps}</span>
                  </div>
                  <span className={`text-[11px] font-medium items-center gap-1 hidden lg:flex ${sla.overdue ? 'text-destructive' : sla.urgent ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    <MdFlag className="h-3 w-3" /> {sla.text}
                  </span>
                  <Badge className={`text-[10px] ${theme.bg} ${theme.text} w-fit`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} mr-1 inline-block`} />
                    {wf.status === 'in_progress' ? 'Active' : wf.status.replace('_', ' ')}
                  </Badge>
                </motion.div>
              );
            })}
            {paginatedItems.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No workflows found</div>
            )}
          </div>

          <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
