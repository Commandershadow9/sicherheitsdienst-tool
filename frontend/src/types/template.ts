/**
 * Site Template Types
 * Für vorkonfigurierte Sicherheitsszenarien
 */

export type BuildingType =
  | 'OFFICE'
  | 'INDUSTRIAL'
  | 'RETAIL'
  | 'EVENT'
  | 'CONSTRUCTION'
  | 'OTHER';

export const BuildingTypeLabels: Record<BuildingType, string> = {
  OFFICE: 'Bürogebäude',
  INDUSTRIAL: 'Industrie/Produktion',
  RETAIL: 'Einzelhandel',
  EVENT: 'Event-Location',
  CONSTRUCTION: 'Baustelle',
  OTHER: 'Sonstiges',
};

export interface SiteTemplate {
  id: string;
  name: string;
  description?: string;
  buildingType: BuildingType;
  hoursPerWeek: number;
  shiftModel: string;
  requiredStaff: number;
  requiredQualifications: string[];
  tasks: string[];
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  buildingType: BuildingType;
  hoursPerWeek: number;
  shiftModel: string;
  requiredStaff: number;
  requiredQualifications?: string[];
  tasks?: string[];
  basePrice: number;
}

export interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  isActive?: boolean;
}

export interface TemplatesResponse {
  templates: SiteTemplate[];
}
