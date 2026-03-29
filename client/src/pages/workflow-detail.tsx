import { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MdArrowBack, MdCheckCircle, MdCancel, MdPending, MdPerson, MdAccessTime, MdFlag, MdAttachFile, MdDescription, MdDraw, MdEdit, MdRateReview, MdThumbUp, MdPostAdd, MdStickyNote2 } from 'react-icons/md';
import { useDataStore } from '@/lib/data-store';
import { stepActions } from '@shared/schema';
import type { WorkflowStatus, WorkflowStep, StepAction } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

const actionIcons: Record<StepAction, React.FC<{ className?: string }>> = {
  approve: MdThumbUp, sign: MdDraw, comment: MdEdit, minute: MdStickyNote2,
  review: MdRateReview, append_document: MdAttachFile, annotate: MdPostAdd, endorse: MdCheckCircle,
};

const statusTheme: Record<WorkflowStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: 'bg-slate-500', text: 'text-white', dot: 'bg-white/60' },
  in_progress: { bg: 'bg-blue-600', text: 'text-white', dot: 'bg-white/60' },
  approved: { bg: 'bg-emerald-600', text: 'text-white', dot: 'bg-white/60' },
  rejected: { bg: 'bg-red-600', text: 'text-white', dot: 'bg-white/60' },
  escalated: { bg: 'bg-amber-500', text: 'text-white', dot: 'bg-white/60' },
};

function slaCountdown(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return { text: `${Math.ceil(Math.abs(diff) / 86400000)}d overdue`, overdue: true, urgent: true };
  const days = Math.ceil(diff / 86400000);
  return { text: `${days}d left`, overdue: false, urgent: days <= 2 };
}

// ─── Horizontal Stepper ───────────────────────────────
function HorizontalStepper({ steps, activeIndex, onSelect }: { steps: WorkflowStep[]; activeIndex: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = step.status === 'approved';
        const isRejected = step.status === 'rejected';
        const isLast = i === steps.length - 1;
        const ActionIcon = actionIcons[step.action] || MdThumbUp;

        return (
          <div key={step.id} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <button onClick={() => onSelect(i)} className="flex flex-col items-center group relative">
              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  boxShadow: isActive ? '0 0 0 4px hsl(153 55% 32% / 0.15)' : '0 0 0 0px transparent',
                }}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isDone ? 'bg-emerald-500 text-white' :
                  isRejected ? 'bg-red-500 text-white' :
                  isActive ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {isDone ? <MdCheckCircle className="h-5 w-5" /> :
                 isRejected ? <MdCancel className="h-5 w-5" /> :
                 <ActionIcon className="h-4 w-4" />}
              </motion.div>
              <span className={`text-[10px] mt-2 font-medium text-center max-w-[80px] leading-tight ${
                isActive ? 'text-primary' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
              }`}>
                {step.role}
              </span>
              <span className="text-[9px] text-muted-foreground text-center max-w-[80px] truncate">{step.assignee.split(' ')[0]}</span>
            </button>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-28px] rounded-full transition-colors ${
                isDone ? 'bg-emerald-500' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step Detail Panel ────────────────────────────────
function StepPanel({ step, workflowId, workflowStatus }: { step: WorkflowStep; workflowId: string; workflowStatus: WorkflowStatus }) {
  const { approveStep, rejectStep } = useDataStore();
  const [comment, setComment] = useState('');
  const [attachName, setAttachName] = useState('');
  const [showReject, setShowReject] = useState(false);

  const ActionIcon = actionIcons[step.action] || MdThumbUp;
  const actionLabel = stepActions.find(a => a.value === step.action)?.label || step.action;
  const actionDesc = stepActions.find(a => a.value === step.action)?.description || '';
  const isPending = step.status === 'pending';
  const isDone = step.status === 'approved';
  const isRejected = step.status === 'rejected';

  const handleComplete = () => {
    approveStep(workflowId, step.id, comment, attachName || undefined);
    setComment('');
    setAttachName('');
  };

  const handleReject = () => {
    rejectStep(workflowId, step.id, comment);
    setComment('');
    setShowReject(false);
  };

  const placeholderMap: Partial<Record<StepAction, string>> = {
    minute: 'Record your minute or directive here...',
    comment: 'Add your observations or remarks...',
    review: 'Provide your review feedback...',
    sign: 'Add a note alongside your signature (optional)...',
    approve: 'Add approval comment (optional)...',
    endorse: 'Add endorsement note (optional)...',
    append_document: 'Describe the document you are attaching...',
    annotate: 'Describe your annotations...',
  };

  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col"
    >
      <Card className="flex-1 flex flex-col">
        <CardContent className="pt-6 flex-1 flex flex-col">
          {/* Step header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                isDone ? 'bg-emerald-500/10 text-emerald-600' :
                isRejected ? 'bg-red-500/10 text-red-600' :
                'bg-primary/10 text-primary'
              }`}>
                <ActionIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{step.role}</h3>
                <p className="text-xs text-muted-foreground">{actionLabel} — {actionDesc}</p>
              </div>
            </div>
            <Badge className={`${
              isDone ? 'bg-emerald-600 text-white' :
              isRejected ? 'bg-red-600 text-white' :
              'bg-slate-500 text-white'
            }`}>
              {step.status}
            </Badge>
          </div>

          {/* Assignee + department */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MdPerson className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{step.assignee}</p>
                <p className="text-[11px] text-muted-foreground">{step.department}</p>
              </div>
            </div>
            {step.completedAt && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <MdAccessTime className="h-3.5 w-3.5" />
                {new Date(step.completedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {/* Instruction */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50 mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Instructions</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{step.instruction}</p>
          </div>

          {/* Completed response */}
          {step.comment && (
            <div className="p-4 rounded-xl bg-primary/[0.03] border border-primary/10 mb-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Response</p>
              <p className="text-sm italic text-foreground/70 leading-relaxed">"{step.comment}"</p>
            </div>
          )}
          {step.attachmentName && (
            <div className="flex items-center gap-2 text-sm text-primary mb-5">
              <MdAttachFile className="h-4 w-4" />
              <span className="font-medium">{step.attachmentName}</span>
            </div>
          )}

          {/* Action area — fills remaining space, pushed to bottom */}
          {isPending && workflowStatus !== 'rejected' && (
            <div className="mt-auto pt-5 border-t border-border space-y-4">
              <Textarea
                placeholder={placeholderMap[step.action] || 'Add a comment...'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[80px] rounded-xl resize-none"
              />

              {step.action === 'append_document' && (
                <div>
                  <label className="text-xs text-muted-foreground font-medium">Attachment Name</label>
                  <Input placeholder="e.g. Supporting_Report.pdf" value={attachName} onChange={e => setAttachName(e.target.value)} className="mt-1 rounded-xl" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button className="rounded-xl gap-2 flex-1 h-11 shadow-md shadow-primary/20" onClick={handleComplete}>
                  <ActionIcon className="h-4 w-4" /> {actionLabel}
                </Button>
                {!showReject ? (
                  <Button variant="outline" className="rounded-xl gap-2 h-11 text-destructive hover:text-destructive" onClick={() => setShowReject(true)}>
                    <MdCancel className="h-4 w-4" /> Reject
                  </Button>
                ) : (
                  <Button variant="destructive" className="rounded-xl gap-2 h-11" onClick={handleReject}>
                    <MdCancel className="h-4 w-4" /> Confirm Reject
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Done / rejected state */}
          {isDone && (
            <div className="mt-auto pt-5 border-t border-border">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <MdCheckCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">Step completed</span>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="mt-auto pt-5 border-t border-border">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <MdCancel className="h-5 w-5" />
                <span className="text-sm font-semibold">Step rejected</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { workflows } = useDataStore();
  const wf = workflows.find(w => w.id === id);

  // Find the first pending step, or last step if all done
  const firstPendingIdx = wf?.steps.findIndex(s => s.status === 'pending') ?? -1;
  const [activeStep, setActiveStep] = useState(firstPendingIdx >= 0 ? firstPendingIdx : (wf ? wf.steps.length - 1 : 0));

  if (!wf) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Workflow not found</p>
          <Button variant="outline" onClick={() => setLocation('/workflows')}>Back to Workflows</Button>
        </div>
      </div>
    );
  }

  const sla = slaCountdown(wf.slaDeadline);
  const theme = statusTheme[wf.status];
  const currentStep = wf.steps[activeStep];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar — pinned */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/workflows">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 flex-shrink-0"><MdArrowBack className="h-4 w-4" /></Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight truncate">{wf.documentTitle}</h1>
                <Badge className={`${theme.bg} ${theme.text} flex-shrink-0`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.dot} mr-1 inline-block`} />
                  {wf.status === 'in_progress' ? 'Active' : wf.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span>{wf.type.replace('_', ' ')} &middot; by {wf.initiatedBy}</span>
                <span className="flex items-center gap-1"><MdAccessTime className="h-3 w-3" /> {new Date(wf.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className={`flex items-center gap-1 font-medium ${sla.overdue ? 'text-destructive' : sla.urgent ? 'text-amber-600' : ''}`}>
                  <MdFlag className="h-3 w-3" /> {sla.text}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setLocation(`/documents/${wf.documentId}`)}>
            <MdDescription className="h-4 w-4" /> View Document
          </Button>
        </div>
      </div>

      {/* Horizontal stepper — pinned */}
      <div className="flex-shrink-0 px-10 py-5 border-b border-border bg-background">
        <HorizontalStepper steps={wf.steps} activeIndex={activeStep} onSelect={setActiveStep} />
      </div>

      {/* Step detail — fills remaining viewport */}
      <div className="flex-1 min-h-0 p-6 flex">
        <AnimatePresence mode="wait">
          {currentStep && <StepPanel key={currentStep.id} step={currentStep} workflowId={wf.id} workflowStatus={wf.status} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
