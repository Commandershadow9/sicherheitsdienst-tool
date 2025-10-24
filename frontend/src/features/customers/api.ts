import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/utils';
import type {
  Customer,
  CustomersResponse,
  CustomerSearchResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../../types/customer';

/**
 * GET /api/customers
 * Liste aller Kunden mit Pagination
 */
export const useCustomers = (params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery<CustomersResponse>({
    queryKey: ['customers', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const response = await api.get(`/customers?${queryParams.toString()}`);
      return response.data;
    },
  });
};

/**
 * GET /api/customers/:id
 * Einzelnen Kunden abrufen
 */
export const useCustomer = (id: string | undefined) => {
  return useQuery<Customer>({
    queryKey: ['customers', id],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * GET /api/customers/search?q=...
 * Fuzzy Search für Wizard
 */
export const useCustomerSearch = (query: string) => {
  return useQuery<CustomerSearchResponse>({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const response = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: query.length >= 2,
    staleTime: 30000, // 30 seconds
  });
};

/**
 * POST /api/customers
 * Neuen Kunden anlegen
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, CreateCustomerInput>({
    mutationFn: async (data) => {
      const response = await api.post('/customers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde erfolgreich angelegt');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Anlegen des Kunden';
      toast.error(message);
    },
  });
};

/**
 * PUT /api/customers/:id
 * Kunden aktualisieren
 */
export const useUpdateCustomer = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, UpdateCustomerInput>({
    mutationFn: async (data) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      toast.success('Kunde erfolgreich aktualisiert');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Aktualisieren des Kunden';
      toast.error(message);
    },
  });
};

/**
 * DELETE /api/customers/:id
 * Kunden löschen
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde erfolgreich gelöscht');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Löschen des Kunden';
      toast.error(message);
    },
  });
};
