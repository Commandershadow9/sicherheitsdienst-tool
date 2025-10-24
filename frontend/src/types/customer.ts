/**
 * Customer Types
 * Für Kundenverwaltung im Wizard
 */

export interface CustomerContact {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface BillingAddress {
  street: string;
  city: string;
  postalCode: string;
  country?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  industry?: string;
  taxId?: string;
  primaryContact: CustomerContact;
  contacts: CustomerContact[];
  address: string;
  city: string;
  postalCode: string;
  country: string;
  billingAddress?: BillingAddress;
  paymentTerms: string;
  discount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sites?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  _count?: {
    sites: number;
  };
}

export interface CustomerSearchResult {
  id: string;
  companyName: string;
  industry?: string;
  primaryContact: CustomerContact;
  address: string;
  city: string;
  postalCode: string;
  _count: {
    sites: number;
  };
}

export interface CreateCustomerInput {
  companyName: string;
  industry?: string;
  taxId?: string;
  primaryContact: CustomerContact;
  contacts?: CustomerContact[];
  address: string;
  city: string;
  postalCode: string;
  country?: string;
  billingAddress?: BillingAddress;
  paymentTerms?: string;
  discount?: number;
  notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
  limit: number;
  offset: number;
}

export interface CustomerSearchResponse {
  customers: CustomerSearchResult[];
}
