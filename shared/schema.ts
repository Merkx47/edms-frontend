import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== DATABASE TABLES ====================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("viewer"),
  department: text("department"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ==================== EDMS TYPES ====================

export type DocumentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived' | 'disposed';
export type SecurityClassification = 'unclassified' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
export type WorkflowStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'escalated';
export type AuditAction = 'upload' | 'view' | 'download' | 'edit' | 'approve' | 'reject' | 'archive' | 'dispose' | 'comment' | 'share' | 'classify' | 'workflow_start' | 'workflow_complete';
export type UserRole = 'admin' | 'director' | 'manager' | 'officer' | 'viewer';
export type DocumentType = 'memo' | 'letter' | 'report' | 'policy' | 'contract' | 'invoice' | 'circular' | 'minute' | 'gazette' | 'proposal' | 'correspondence' | 'budget_document';

// Nigerian Government Departments
export type Department =
  | 'Office of the Governor'
  | 'Ministry of Finance'
  | 'Ministry of Works & Infrastructure'
  | 'Ministry of Health'
  | 'Ministry of Education'
  | 'Ministry of Justice'
  | 'Ministry of Agriculture'
  | 'Ministry of Environment'
  | 'Ministry of Internal Affairs'
  | 'Ministry of Commerce & Industry'
  | 'Bureau of Public Procurement'
  | 'Auditor General Office'
  | 'Head of Service'
  | 'State Universal Basic Education Board'
  | 'Local Government Service Commission';

export const departments: Department[] = [
  'Office of the Governor',
  'Ministry of Finance',
  'Ministry of Works & Infrastructure',
  'Ministry of Health',
  'Ministry of Education',
  'Ministry of Justice',
  'Ministry of Agriculture',
  'Ministry of Environment',
  'Ministry of Internal Affairs',
  'Ministry of Commerce & Industry',
  'Bureau of Public Procurement',
  'Auditor General Office',
  'Head of Service',
  'State Universal Basic Education Board',
  'Local Government Service Commission',
];

export const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'memo', label: 'Memo' },
  { value: 'letter', label: 'Letter' },
  { value: 'report', label: 'Report' },
  { value: 'policy', label: 'Policy Document' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'circular', label: 'Circular' },
  { value: 'minute', label: 'Minute' },
  { value: 'gazette', label: 'Gazette' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'budget_document', label: 'Budget Document' },
];

export const securityLevels: { value: SecurityClassification; label: string; color: string }[] = [
  { value: 'unclassified', label: 'Unclassified', color: '#22c55e' },
  { value: 'internal', label: 'Internal', color: '#3b82f6' },
  { value: 'confidential', label: 'Confidential', color: '#f59e0b' },
  { value: 'restricted', label: 'Restricted', color: '#f97316' },
  { value: 'top_secret', label: 'Top Secret', color: '#ef4444' },
];

// Document
export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  department: Department;
  status: DocumentStatus;
  securityClassification: SecurityClassification;
  referenceNumber: string;
  version: number;
  fileSize: number;
  fileType: string;
  tags: string[];
  metadata: Record<string, string>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  retentionDate: string;
  parentFolderId: string | null;
  checkout: DocumentCheckout;
}

// Folder
export interface Folder {
  id: string;
  name: string;
  department: Department;
  parentId: string | null;
  documentCount: number;
  createdAt: string;
}

// Document Version
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  changedBy: string;
  changeDescription: string;
  fileSize: number;
  fileName: string;
  fileType: string;
  createdAt: string;
}

// Workflow
export interface Workflow {
  id: string;
  documentId: string;
  documentTitle: string;
  type: 'approval' | 'review' | 'sign_off';
  status: WorkflowStatus;
  initiatedBy: string;
  currentStep: number;
  totalSteps: number;
  steps: WorkflowStep[];
  slaDeadline: string;
  createdAt: string;
  completedAt: string | null;
}

export type StepAction = 'approve' | 'sign' | 'comment' | 'minute' | 'review' | 'append_document' | 'annotate' | 'endorse';

export const stepActions: { value: StepAction; label: string; description: string }[] = [
  { value: 'approve', label: 'Approve', description: 'Grant formal approval to proceed' },
  { value: 'sign', label: 'Sign', description: 'Affix digital signature to the document' },
  { value: 'comment', label: 'Comment', description: 'Add observations or remarks' },
  { value: 'minute', label: 'Minute', description: 'Record an official minute or directive' },
  { value: 'review', label: 'Review', description: 'Review and provide feedback' },
  { value: 'append_document', label: 'Append Document', description: 'Attach a supporting file' },
  { value: 'annotate', label: 'Annotate', description: 'Mark up or annotate the document' },
  { value: 'endorse', label: 'Endorse', description: 'Formally endorse or co-sign' },
];

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  assignee: string;
  role: string;
  department: Department;
  action: StepAction;
  instruction: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment: string | null;
  attachmentName: string | null;
  completedAt: string | null;
}

// Document with check-in/out
export type CheckoutStatus = 'available' | 'checked_out';

export interface DocumentCheckout {
  status: CheckoutStatus;
  checkedOutBy: string | null;
  checkedOutAt: string | null;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  documentId: string;
  documentTitle: string;
  action: AuditAction;
  userId: string;
  userName: string;
  department: Department;
  ipAddress: string;
  details: string;
  timestamp: string;
}

// Staff member
export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: Department;
  isActive: boolean;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'workflow' | 'document' | 'system' | 'deadline';
  isRead: boolean;
  timestamp: string;
  linkTo?: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalDocuments: number;
  pendingApprovals: number;
  documentsThisMonth: number;
  documentsLastMonth: number;
  activeWorkflows: number;
  overdueWorkflows: number;
  departmentBreakdown: { department: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
  recentActivity: AuditLogEntry[];
  monthlyTrend: { month: string; uploads: number; approvals: number }[];
}

// Report
export interface Report {
  id: string;
  name: string;
  type: 'document_volume' | 'workflow_status' | 'department_activity' | 'compliance' | 'user_activity' | 'retention';
  schedule: 'daily' | 'weekly' | 'monthly' | 'on_demand';
  lastRun: string;
  status: 'ready' | 'generating' | 'scheduled';
  format: 'pdf' | 'csv' | 'excel';
}
