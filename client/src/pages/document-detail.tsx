import { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { MdArrowBack, MdDownload, MdEdit, MdHistory, MdDescription, MdSecurity, MdLabel, MdLockOpen, MdLock, MdUploadFile, MdCloudUpload, MdInsertDriveFile, MdArchive, MdDelete, MdMoreVert } from 'react-icons/md';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useDataStore } from '@/lib/data-store';
import { securityLevels, departments, documentTypes, securityLevels as secLevels } from '@shared/schema';
import type { DocumentType, Department, SecurityClassification } from '@shared/schema';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
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

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { documents, versions, auditLog, checkoutDocument, checkinDocument, uploadNewVersion, editDocument, archiveDocument, disposeDocument, deleteDocument } = useDataStore();
  const doc = documents.find(d => d.id === id);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [checkinDesc, setCheckinDesc] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<DocumentType>('memo');
  const [editDept, setEditDept] = useState<Department>('Ministry of Finance');
  const [editClassification, setEditClassification] = useState<SecurityClassification>('internal');
  const [editTags, setEditTags] = useState('');

  const openEditDialog = () => {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditDesc(doc.description);
    setEditType(doc.type);
    setEditDept(doc.department);
    setEditClassification(doc.securityClassification);
    setEditTags(doc.tags.join(', '));
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!doc) return;
    editDocument(doc.id, {
      title: editTitle, description: editDesc, type: editType,
      department: editDept, securityClassification: editClassification,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditOpen(false);
  };

  const handleDelete = () => {
    if (!doc) return;
    deleteDocument(doc.id);
    setLocation('/documents');
  };

  if (!doc) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Document not found</p>
        <Link href="/documents"><Button variant="outline" className="mt-4">Back to Documents</Button></Link>
      </div>
    );
  }

  const docVersions = versions.filter(v => v.documentId === doc.id).sort((a, b) => b.version - a.version);
  const auditEntries = auditLog.filter(a => a.documentId === doc.id);
  const secLevel = securityLevels.find(s => s.value === doc.securityClassification);
  const isCheckedOut = doc.checkout.status === 'checked_out';

  const handleUploadVersion = () => {
    if (!uploadDesc || !uploadFileName) return;
    uploadNewVersion(doc.id, uploadDesc, uploadFileName, 'pdf', Math.floor(Math.random() * 5000000) + 1000000);
    setUploadOpen(false);
    setUploadDesc('');
    setUploadFileName('');
  };

  const handleCheckin = () => {
    if (!checkinDesc) return;
    checkinDocument(doc.id, checkinDesc, Math.floor(Math.random() * 5000000) + 1000000);
    setCheckinOpen(false);
    setCheckinDesc('');
  };

  const handleDownload = (fileName?: string) => {
    toast({ title: 'Download Started', description: `${fileName || doc.title} is being prepared for download.` });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="ghost" size="icon" className="rounded-full"><MdArrowBack className="h-5 w-5" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">{doc.referenceNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Checkout / Checkin */}
          {isCheckedOut ? (
            <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-lg">
                  <MdLockOpen className="h-4 w-4" /> Check In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Check In Document</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">Checking in will release your editing lock and save a new version.</p>
                  <div>
                    <Label>Change Description</Label>
                    <Textarea placeholder="What did you change?" value={checkinDesc} onChange={e => setCheckinDesc(e.target.value)} className="mt-1 rounded-lg" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancel</Button>
                  <Button onClick={handleCheckin} disabled={!checkinDesc} className="gap-2"><MdLockOpen className="h-4 w-4" /> Check In</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" className="gap-2 rounded-lg" onClick={() => checkoutDocument(doc.id)}>
              <MdLock className="h-4 w-4" /> Check Out
            </Button>
          )}

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-lg"><MdMoreVert className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={openEditDialog} className="gap-2"><MdEdit className="h-4 w-4" /> Edit Metadata</DropdownMenuItem>
              <DropdownMenuItem onClick={() => archiveDocument(doc.id)} className="gap-2"><MdArchive className="h-4 w-4" /> Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => disposeDocument(doc.id)} className="gap-2 text-amber-600"><MdDelete className="h-4 w-4" /> Flag for Disposal</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive"><MdDelete className="h-4 w-4" /> Delete Permanently</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Upload New Version */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-lg">
                <MdUploadFile className="h-4 w-4" /> New Version
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload New Version</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">Current version: <span className="font-semibold">v{doc.version}</span>. This will create <span className="font-semibold">v{doc.version + 1}</span>.</p>
                <div>
                  <Label>File</Label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setUploadFileName(`${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${doc.version + 1}.pdf`)}
                  >
                    <MdCloudUpload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    {uploadFileName ? (
                      <div className="flex items-center justify-center gap-2">
                        <MdInsertDriveFile className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{uploadFileName}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">Click to select file</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, XLSX up to 50MB</p>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Change Description</Label>
                  <Textarea placeholder="Describe what changed in this version..." value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="mt-1 rounded-lg" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUploadVersion} disabled={!uploadDesc || !uploadFileName} className="gap-2"><MdUploadFile className="h-4 w-4" /> Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button className="gap-2 rounded-lg" onClick={() => handleDownload()}>
            <MdDownload className="h-4 w-4" /> Download
          </Button>
        </div>
      </motion.div>

      {/* Checkout banner */}
      {isCheckedOut && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
        >
          <MdLock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Document Checked Out</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Locked by <span className="font-semibold">{doc.checkout.checkedOutBy}</span> since {doc.checkout.checkedOutAt ? new Date(doc.checkout.checkedOutAt).toLocaleString('en-NG') : 'now'}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="bg-muted/50 rounded-xl p-10 flex flex-col items-center justify-center min-h-[280px] border border-border/50">
                  <MdDescription className="h-14 w-14 text-muted-foreground/40 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Document Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">{doc.fileType.toUpperCase()} &middot; {formatFileSize(doc.fileSize)} &middot; Version {doc.version}</p>
                  <Button variant="outline" className="mt-4 rounded-lg gap-2" onClick={() => handleDownload()}>
                    <MdDownload className="h-4 w-4" /> Download to View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Tabs defaultValue="versions">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="versions">Versions ({docVersions.length})</TabsTrigger>
                <TabsTrigger value="audit">Audit ({auditEntries.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">{doc.description}</p>
                    {Object.keys(doc.metadata).length > 0 && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        {Object.entries(doc.metadata).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</p>
                            <p className="text-sm font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="versions" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {docVersions.map((v, i) => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors group"
                        >
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            v.version === doc.version ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className="text-xs font-bold">v{v.version}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">Version {v.version}</span>
                              {v.version === doc.version && <Badge className="text-[10px]">Current</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{v.changeDescription}</p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                              <span>{v.changedBy}</span>
                              <span>&middot;</span>
                              <span>{new Date(v.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span>&middot;</span>
                              <span>{formatFileSize(v.fileSize)}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-primary/70">
                              <MdInsertDriveFile className="h-3 w-3" />
                              <span className="truncate">{v.fileName}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg gap-1"
                            onClick={() => handleDownload(v.fileName)}>
                            <MdDownload className="h-3.5 w-3.5" /> Download
                          </Button>
                        </motion.div>
                      ))}
                      {docVersions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">No version history yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      {auditEntries.map((entry, i) => (
                        <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-3 p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{entry.details}</p>
                            <p className="text-xs text-muted-foreground mt-1">{entry.userName} &middot; {entry.department} &middot; IP: {entry.ipAddress}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge variant="outline" className="text-[10px]">{entry.action}</Badge>
                            <p className="text-[11px] text-muted-foreground mt-1">{new Date(entry.timestamp).toLocaleString('en-NG')}</p>
                          </div>
                        </motion.div>
                      ))}
                      {auditEntries.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No audit entries</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
              <CardContent>
                <Badge className={`${statusColors[doc.status]} text-sm`}>{doc.status.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MdSecurity className="h-4 w-4" /> Classification</CardTitle></CardHeader>
              <CardContent>
                <Badge style={{ backgroundColor: secLevel?.color + '20', color: secLevel?.color }} className="text-sm">{secLevel?.label}</Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Properties</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Type', doc.type.replace('_', ' ')],
                  ['Department', doc.department],
                  ['Created By', doc.createdBy],
                  ['Created', new Date(doc.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })],
                  ['Updated', new Date(doc.updatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })],
                  ['Version', `v${doc.version}`],
                  ['Size', formatFileSize(doc.fileSize)],
                  ['Format', doc.fileType.toUpperCase()],
                  ['Retention', new Date(doc.retentionDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })],
                  ['Lock', isCheckedOut ? `Checked out by ${doc.checkout.checkedOutBy}` : 'Available'],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium capitalize">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MdLabel className="h-4 w-4" /> Tags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {doc.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Document Metadata</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="rounded-lg" /></div>
            <div><Label>Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={editType} onValueChange={(v: any) => setEditType(v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>{documentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={editDept} onValueChange={(v: any) => setEditDept(v)}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Classification</Label>
              <Select value={editClassification} onValueChange={(v: any) => setEditClassification(v)}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>{secLevels.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tags</Label><Input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="Comma-separated" className="rounded-lg" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editTitle}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
