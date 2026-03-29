import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MdSearch, MdUploadFile, MdFolder, MdDescription, MdFilterList, MdGridView, MdViewList } from 'react-icons/md';
import { mockFolders } from '@/lib/mock-data';
import { useDataStore } from '@/lib/data-store';
import { TablePagination, usePagination } from '@/components/ui/table-pagination';
import { departments, documentTypes, securityLevels } from '@shared/schema';
import type { DocumentStatus, SecurityClassification, Department, DocumentType } from '@shared/schema';
import { Link } from 'wouter';

const statusColors: Record<DocumentStatus, string> = {
  draft: 'bg-slate-500 text-white',
  pending_review: 'bg-amber-500 text-white',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-red-600 text-white',
  archived: 'bg-blue-600 text-white',
  disposed: 'bg-gray-500 text-white',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function Documents() {
  const { documents, createDocument, currentUser } = useDataStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadType, setUploadType] = useState<DocumentType>('memo');
  const [uploadDept, setUploadDept] = useState<Department>('Ministry of Finance');
  const [uploadClassification, setUploadClassification] = useState<SecurityClassification>('internal');
  const [uploadTags, setUploadTags] = useState('');

  const handleUpload = () => {
    if (!uploadTitle) return;
    createDocument({
      title: uploadTitle,
      description: uploadDesc,
      type: uploadType,
      department: uploadDept,
      status: 'draft',
      securityClassification: uploadClassification,
      referenceNumber: `${uploadDept.split(' ')[0].toUpperCase().slice(0, 3)}/${uploadType.toUpperCase().slice(0, 3)}/${new Date().getFullYear()}/${String(documents.length + 1).padStart(3, '0')}`,
      fileSize: Math.floor(Math.random() * 5000000) + 500000,
      fileType: 'pdf',
      tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
      metadata: {},
      createdBy: currentUser?.fullName || 'Unknown',
      retentionDate: new Date(Date.now() + 5 * 365 * 86400000).toISOString().split('T')[0],
      parentFolderId: null,
    });
    setShowUpload(false);
    setUploadTitle(''); setUploadDesc(''); setUploadTags('');
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
      const matchDept = deptFilter === 'all' || doc.department === deptFilter;
      const matchType = typeFilter === 'all' || doc.type === typeFilter;
      return matchSearch && matchStatus && matchDept && matchType;
    });
  }, [documents, search, statusFilter, deptFilter, typeFilter]);

  const { page, pageSize, setPage, setPageSize, paginatedItems: paginatedDocs, total: totalDocs } = usePagination(filteredDocs, 10);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">Browse, search, and manage all documents</p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button><MdUploadFile className="h-4 w-4 mr-2" /> Upload Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Upload New Document</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input placeholder="Document title" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} /></div>
              <div><Label>Description</Label><Textarea placeholder="Brief description" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Document Type</Label>
                  <Select value={uploadType} onValueChange={(v: any) => setUploadType(v)}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{documentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={uploadDept} onValueChange={(v: any) => setUploadDept(v)}><SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Security Classification</Label>
                <Select value={uploadClassification} onValueChange={(v: any) => setUploadClassification(v)}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{securityLevels.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <MdUploadFile className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Click to select (simulated)</p>
                </div>
              </div>
              <div><Label>Tags</Label><Input placeholder="Comma-separated tags" value={uploadTags} onChange={e => setUploadTags(e.target.value)} /></div>
              <Button className="w-full" onClick={handleUpload} disabled={!uploadTitle}>Upload Document</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Folders — hidden on mobile */}
      <div className="hidden md:block">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Folders</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {mockFolders.slice(0, 5).map(folder => (
            <Card key={folder.id} className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center gap-2">
                  <MdFolder className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium truncate">{folder.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{folder.documentCount} documents</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, reference, or tag..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><MdFilterList className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center border rounded-md">
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode('list')}>
            <MdViewList className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode('grid')}>
            <MdGridView className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span className="text-xs sm:text-sm text-muted-foreground">{filteredDocs.length} documents</span>
        <TablePagination total={totalDocs} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-2">
          {paginatedDocs.map(doc => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="py-3 px-4 lg:py-4 lg:px-5">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MdDescription className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate max-w-[200px] lg:max-w-none">{doc.title}</p>
                        <Badge className={`text-[10px] ${statusColors[doc.status]}`}>{doc.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.referenceNumber}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        <span className="hidden lg:inline">{doc.department}</span>
                        <span className="hidden lg:inline">&middot;</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>&middot;</span>
                        <span>v{doc.version}</span>
                        <span className="hidden lg:inline">&middot;</span>
                        <span className="hidden lg:inline">{doc.createdBy}</span>
                        <span className="hidden lg:inline">&middot;</span>
                        <span className="hidden lg:inline">{new Date(doc.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedDocs.map(doc => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors h-full">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <MdDescription className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Badge className={`text-xs ${statusColors[doc.status]}`}>{doc.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{doc.referenceNumber}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {doc.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{doc.createdBy}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
