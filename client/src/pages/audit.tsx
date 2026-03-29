import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MdSearch, MdUploadFile, MdVisibility, MdEdit, MdApproval, MdShare, MdArchive, MdDelete } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { departments } from '@shared/schema';
import type { AuditAction } from '@shared/schema';

const actionConfig: Record<AuditAction, { label: string; color: string }> = {
  upload: { label: 'Upload', color: 'bg-blue-600 text-white' },
  view: { label: 'View', color: 'bg-slate-500 text-white' },
  download: { label: 'Download', color: 'bg-indigo-600 text-white' },
  edit: { label: 'Edit', color: 'bg-amber-500 text-white' },
  approve: { label: 'Approve', color: 'bg-emerald-600 text-white' },
  reject: { label: 'Reject', color: 'bg-red-600 text-white' },
  archive: { label: 'Archive', color: 'bg-purple-600 text-white' },
  dispose: { label: 'Dispose', color: 'bg-gray-500 text-white' },
  comment: { label: 'Comment', color: 'bg-blue-600 text-white' },
  share: { label: 'Share', color: 'bg-teal-600 text-white' },
  classify: { label: 'Classify', color: 'bg-orange-500 text-white' },
  workflow_start: { label: 'Workflow Start', color: 'bg-violet-600 text-white' },
  workflow_complete: { label: 'Workflow Done', color: 'bg-emerald-600 text-white' },
};

export default function AuditTrail() {
  const { auditLog } = useDataStore();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return auditLog.filter(entry => {
      const matchSearch = !search ||
        entry.documentTitle.toLowerCase().includes(search.toLowerCase()) ||
        entry.userName.toLowerCase().includes(search.toLowerCase()) ||
        entry.details.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === 'all' || entry.action === actionFilter;
      const matchDept = deptFilter === 'all' || entry.department === deptFilter;
      return matchSearch && matchAction && matchDept;
    });
  }, [auditLog, search, actionFilter, deptFilter]);

  const { page, pageSize, setPage, setPageSize, paginatedItems, total } = usePagination(filtered, 10);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-6 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Immutable log of all document actions</p>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3 mt-4">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by document, user, or details..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-lg" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(actionConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[200px] h-9 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full border border-border rounded-xl bg-card overflow-hidden flex flex-col">
          <div className="flex-shrink-0 grid grid-cols-[80px_70px_1fr_90px] lg:grid-cols-[130px_80px_1fr_120px_150px_160px_100px] gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Timestamp</span>
            <span>Action</span>
            <span>Document</span>
            <span>User</span>
            <span className="hidden lg:block">Department</span>
            <span className="hidden lg:block">Details</span>
            <span className="hidden lg:block">IP</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {paginatedItems.map(entry => {
              const cfg = actionConfig[entry.action];
              return (
                <div key={entry.id} className="grid grid-cols-[80px_70px_1fr_90px] lg:grid-cols-[130px_80px_1fr_120px_150px_160px_100px] gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 border-b border-border/50 hover:bg-muted/20 transition-colors items-center">
                  <span className="text-[10px] lg:text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge className={`${cfg.color} text-[9px] lg:text-[10px] w-fit`}>{cfg.label}</Badge>
                  <span className="text-xs font-medium truncate">{entry.documentTitle}</span>
                  <span className="text-xs truncate">{entry.userName}</span>
                  <span className="text-[11px] text-muted-foreground truncate hidden lg:block">{entry.department}</span>
                  <span className="text-[11px] text-muted-foreground truncate hidden lg:block">{entry.details}</span>
                  <span className="text-[11px] text-muted-foreground font-mono hidden lg:block">{entry.ipAddress}</span>
                </div>
              );
            })}
            {paginatedItems.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No entries found</div>
            )}
          </div>

          <TablePagination total={total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      </div>
    </div>
  );
}
