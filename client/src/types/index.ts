export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organizationId: string;
  assignedTo: string | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Note {
  id: string;
  content: string;
  customerId: string;
  organizationId: string;
  createdById: string;
  createdBy?: User;
  createdAt: string;
}

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'note_added'
  | 'assigned';

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: ActivityAction;
  performedBy: string;
  performer?: User;
  organizationId: string;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
