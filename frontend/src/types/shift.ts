export type ShiftStatus = 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ShiftBase {
  id: string;
  siteId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  requiredEmployees: number;
  assignedEmployees?: number;
  requiredQualifications: string[];
  status: ShiftStatus;
  createdAt?: string;
  updatedAt?: string;
}
