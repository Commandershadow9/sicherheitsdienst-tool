import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from '@/lib/utils';
import type {
  SiteTemplate,
  TemplatesResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
  BuildingType,
} from '../../types/template';

/**
 * GET /api/templates
 * Liste aller aktiven Vorlagen
 */
export const useTemplates = (buildingType?: BuildingType) => {
  return useQuery<TemplatesResponse>({
    queryKey: ['templates', buildingType],
    queryFn: async () => {
      const queryParams = buildingType ? `?buildingType=${buildingType}` : '';
      const response = await api.get(`/templates${queryParams}`);
      return response.data;
    },
  });
};

/**
 * GET /api/templates/:id
 * Einzelne Vorlage abrufen
 */
export const useTemplate = (id: string | undefined) => {
  return useQuery<SiteTemplate>({
    queryKey: ['templates', id],
    queryFn: async () => {
      const response = await api.get(`/templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * POST /api/templates
 * Neue Vorlage erstellen
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SiteTemplate, Error, CreateTemplateInput>({
    mutationFn: async (data) => {
      const response = await api.post('/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Vorlage erfolgreich erstellt');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Erstellen der Vorlage';
      toast.error(message);
    },
  });
};

/**
 * PUT /api/templates/:id
 * Vorlage aktualisieren
 */
export const useUpdateTemplate = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<SiteTemplate, Error, UpdateTemplateInput>({
    mutationFn: async (data) => {
      const response = await api.put(`/templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', id] });
      toast.success('Vorlage erfolgreich aktualisiert');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Aktualisieren der Vorlage';
      toast.error(message);
    },
  });
};

/**
 * DELETE /api/templates/:id
 * Vorlage löschen oder deaktivieren
 */
export const useDeleteTemplate = (permanent = false) => {
  const queryClient = useQueryClient();

  return useMutation<void | SiteTemplate, Error, string>({
    mutationFn: async (id) => {
      const queryParam = permanent ? '?permanent=true' : '';
      const response = await api.delete(`/templates/${id}${queryParam}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      const message = permanent ? 'Vorlage erfolgreich gelöscht' : 'Vorlage deaktiviert';
      toast.success(message);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Fehler beim Löschen der Vorlage';
      toast.error(message);
    },
  });
};
