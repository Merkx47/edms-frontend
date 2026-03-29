import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MdArrowBack, MdArrowForward, MdAdd, MdClose, MdPerson, MdDescription, MdPlayArrow, MdCheckCircle, MdDragIndicator, MdSearch } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { mockStaff, mockDocuments } from '@/lib/mock-data';
import { departments, stepActions } from '@shared/schema';
import type { StepAction, Department, WorkflowStep } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';

interface StepDraft {
  assignee: string;
  role: string;
  department: Department;
  action: StepAction;
  instruction: string;
}

const emptyStep: StepDraft = { assignee: '', role: '', department: 'Ministry of Finance', action: 'approve', instruction: '' };

const WIZARD_STEPS = [
  { id: 'document', label: 'Select Document', number: 1 },
  { id: 'chain', label: 'Build Approval Chain', number: 2 },
  { id: 'review', label: 'Review & Submit', number: 3 },
];

// ─── Wizard Progress Bar ──────────────────────────────
function WizardProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-md">
      {WIZARD_STEPS.map((step, i) => {
        const isActive = i === current;
        const isDone = i < current;
        const isLast = i === WIZARD_STEPS.length - 1;
        return (
          <div key={step.id} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: isDone || isActive ? 'hsl(153, 55%, 32%)' : 'hsl(var(--muted))',
                  scale: isActive ? 1.1 : 1,
                }}
                className="h-6 w-6 rounded-full flex items-center justify-center"
              >
                {isDone ? (
                  <MdCheckCircle className="h-3.5 w-3.5 text-white" />
                ) : (
                  <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-muted-foreground'}`}>{step.number}</span>
                )}
              </motion.div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-3">
                <motion.div className="h-full rounded-full" animate={{ backgroundColor: isDone ? 'hsl(153, 55%, 32%)' : 'hsl(var(--border))' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Select Document ──────────────────────────
function Step1SelectDocument({ docId, setDocId, type, setType, slaDays, setSlaDays }: {
  docId: string; setDocId: (v: string) => void;
  type: string; setType: (v: any) => void;
  slaDays: string; setSlaDays: (v: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = mockDocuments.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.referenceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col px-6 min-h-0">
      {/* Config bar — pinned top */}
      <div className="flex-shrink-0 flex items-end gap-4 mb-4">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <div className="w-[160px]">
          <Label className="text-[10px] text-muted-foreground font-medium">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="sign_off">Sign-off</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[120px]">
          <Label className="text-[10px] text-muted-foreground font-medium">SLA (days)</Label>
          <Input type="number" value={slaDays} onChange={e => setSlaDays(e.target.value)} className="mt-1 h-10 rounded-xl" />
        </div>
      </div>

      {/* Table — fills remaining space */}
      <div className="flex-1 min-h-0 border border-border rounded-xl bg-card overflow-hidden flex flex-col">
        <div className="flex-shrink-0 grid grid-cols-[40px_1fr_180px_140px_100px] gap-3 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span></span>
          <span>Document</span>
          <span>Department</span>
          <span>Reference</span>
          <span>Status</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((doc) => {
            const isSelected = docId === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setDocId(doc.id)}
                className={`grid grid-cols-[40px_1fr_180px_140px_100px] gap-3 px-4 py-2.5 border-b border-border/50 cursor-pointer transition-colors items-center ${
                  isSelected ? 'bg-primary/[0.05]' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex justify-center">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                    {isSelected && <MdCheckCircle className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
                <p className={`text-sm truncate ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>{doc.title}</p>
                <p className="text-xs text-muted-foreground truncate">{doc.department}</p>
                <p className="text-xs text-muted-foreground font-mono">{doc.referenceNumber}</p>
                <Badge variant="outline" className="text-[10px] capitalize w-fit">{doc.status.replace('_', ' ')}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Build Chain ──────────────────────────────
function Step2BuildChain({ steps, setSteps }: { steps: StepDraft[]; setSteps: (s: StepDraft[]) => void }) {
  const addStep = () => setSteps([...steps, { ...emptyStep }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, field: keyof StepDraft, value: string) => {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  return (
    <div className="flex-1 flex px-6 gap-6 min-h-0">
      {/* Left — Step builder */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Build the approval chain</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Add people, assign actions, and write instructions for each step.</p>
          </div>
          <Button variant="outline" onClick={addStep} className="gap-1.5 rounded-xl h-9">
            <MdAdd className="h-4 w-4" /> Add Step
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
          <AnimatePresence>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b border-border">
                  <MdDragIndicator className="h-4 w-4 text-muted-foreground/50" />
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <span className="text-[11px] font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm font-semibold flex-1">Step {i + 1}</span>
                  {step.action && (
                    <Badge variant="secondary" className="text-[10px] capitalize">{step.action.replace('_', ' ')}</Badge>
                  )}
                  {steps.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeStep(i)}>
                      <MdClose className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Assignee</Label>
                      <Select value={step.assignee} onValueChange={v => updateStep(i, 'assignee', v)}>
                        <SelectTrigger className="mt-1 h-9 text-sm rounded-lg"><SelectValue placeholder="Select person" /></SelectTrigger>
                        <SelectContent>
                          {mockStaff.map(s => (
                            <SelectItem key={s.id} value={s.fullName}>
                              <span>{s.fullName}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">{s.department}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Role / Title</Label>
                      <Input className="mt-1 h-9 text-sm rounded-lg" placeholder="e.g. Director Review" value={step.role} onChange={e => updateStep(i, 'role', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Department</Label>
                      <Select value={step.department} onValueChange={v => updateStep(i, 'department', v)}>
                        <SelectTrigger className="mt-1 h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Action Required</Label>
                      <Select value={step.action} onValueChange={v => updateStep(i, 'action', v)}>
                        <SelectTrigger className="mt-1 h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {stepActions.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              <span className="font-medium">{a.label}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">— {a.description}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Instructions</Label>
                    <Textarea className="mt-1 min-h-[50px] text-sm rounded-lg resize-none" placeholder="What exactly should this person do?" value={step.instruction} onChange={e => updateStep(i, 'instruction', e.target.value)} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addStep} className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
            <MdAdd className="h-4 w-4" /> Add another step
          </button>
        </div>
      </div>

      {/* Right — Live preview */}
      <div className="w-[260px] flex-shrink-0">
        <Card className="sticky top-0">
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Live Preview</p>
            <div className="space-y-0">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const actionLabel = stepActions.find(a => a.value === step.action)?.label || step.action;
                const isComplete = step.assignee && step.role && step.instruction;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isComplete ? <MdCheckCircle className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {!isLast && <div className={`w-0.5 h-6 ${isComplete ? 'bg-primary/30' : 'bg-border'}`} />}
                    </div>
                    <div className="pb-2 flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{step.assignee || 'Unassigned'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{step.role || 'No role'} &middot; {actionLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────
function Step3Review({ docId, type, slaDays, steps }: {
  docId: string; type: string; slaDays: string; steps: StepDraft[];
}) {
  const selectedDoc = mockDocuments.find(d => d.id === docId);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold tracking-tight">Review & Submit</h2>
          <p className="text-sm text-muted-foreground mt-1">Confirm the workflow details before initiating.</p>
        </div>

        {/* Document card */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Document</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MdDescription className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{selectedDoc?.title}</p>
                <p className="text-xs text-muted-foreground">{selectedDoc?.referenceNumber} &middot; {selectedDoc?.department}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div><p className="text-[10px] text-muted-foreground">Type</p><p className="text-sm font-medium capitalize">{type.replace('_', ' ')}</p></div>
              <div><p className="text-[10px] text-muted-foreground">SLA</p><p className="text-sm font-medium">{slaDays} days</p></div>
              <div><p className="text-[10px] text-muted-foreground">Steps</p><p className="text-sm font-medium">{steps.length}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Chain review */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Approval Chain</p>
            <div className="space-y-0">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const actionLabel = stepActions.find(a => a.value === step.action)?.label || step.action;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <span className="text-xs font-bold">{i + 1}</span>
                      </div>
                      {!isLast && <div className="w-0.5 h-6 bg-primary/20" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{step.assignee}</p>
                        <Badge variant="outline" className="text-[9px] capitalize">{actionLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{step.role} &middot; {step.department}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">"{step.instruction}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function WorkflowCreate() {
  const [, setLocation] = useLocation();
  const { createWorkflow } = useDataStore();
  const [wizardStep, setWizardStep] = useState(0);

  const [docId, setDocId] = useState('');
  const [type, setType] = useState<'approval' | 'review' | 'sign_off'>('approval');
  const [slaDays, setSlaDays] = useState('7');
  const [steps, setSteps] = useState<StepDraft[]>([{ ...emptyStep }]);

  const selectedDoc = mockDocuments.find(d => d.id === docId);

  const canNext = (() => {
    if (wizardStep === 0) return !!docId;
    if (wizardStep === 1) return steps.every(s => s.assignee && s.role && s.instruction);
    return true;
  })();

  const handleSubmit = () => {
    if (!selectedDoc) return;
    const slaDate = new Date();
    slaDate.setDate(slaDate.getDate() + parseInt(slaDays));

    const wfSteps: WorkflowStep[] = steps.map((s, i) => ({
      id: `ws-${Date.now()}-${i}`,
      stepNumber: i + 1,
      assignee: s.assignee,
      role: s.role,
      department: s.department,
      action: s.action,
      instruction: s.instruction,
      status: 'pending',
      comment: null,
      attachmentName: null,
      completedAt: null,
    }));

    createWorkflow({
      documentId: selectedDoc.id,
      documentTitle: selectedDoc.title,
      type,
      status: 'in_progress',
      initiatedBy: 'Adebayo Ogunlesi',
      currentStep: 1,
      totalSteps: steps.length,
      steps: wfSteps,
      slaDeadline: slaDate.toISOString().split('T')[0],
    });

    setLocation('/workflows');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top bar — single compact row */}
      <div className="flex-shrink-0 px-6 py-2.5 border-b border-border bg-card/50 flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 flex-shrink-0"><MdArrowBack className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-sm font-bold tracking-tight flex-shrink-0">Create Workflow</h1>
        <div className="flex-1 flex justify-center">
          <WizardProgress current={wizardStep} />
        </div>
        <p className="text-[11px] text-muted-foreground flex-shrink-0">Step {wizardStep + 1}/{WIZARD_STEPS.length}</p>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={wizardStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {wizardStep === 0 && (
              <Step1SelectDocument docId={docId} setDocId={setDocId} type={type} setType={setType} slaDays={slaDays} setSlaDays={setSlaDays} />
            )}
            {wizardStep === 1 && (
              <Step2BuildChain steps={steps} setSteps={setSteps} />
            )}
            {wizardStep === 2 && (
              <Step3Review docId={docId} type={type} slaDays={slaDays} steps={steps} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav bar */}
      <div className="flex-shrink-0 px-6 py-2.5 border-t border-border bg-card/50 flex items-center justify-between">
        <Button
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => wizardStep === 0 ? setLocation('/workflows') : setWizardStep(wizardStep - 1)}
        >
          <MdArrowBack className="h-4 w-4" />
          {wizardStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        {wizardStep < WIZARD_STEPS.length - 1 ? (
          <Button className="rounded-xl gap-2 shadow-md shadow-primary/20" disabled={!canNext} onClick={() => setWizardStep(wizardStep + 1)}>
            Next <MdArrowForward className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="rounded-xl gap-2 shadow-md shadow-primary/20" onClick={handleSubmit}>
            <MdPlayArrow className="h-4 w-4" /> Initiate Workflow
          </Button>
        )}
      </div>
    </div>
  );
}
