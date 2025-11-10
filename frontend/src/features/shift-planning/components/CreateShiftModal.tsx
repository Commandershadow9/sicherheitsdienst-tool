/**
 * CreateShiftModal - Manuelle Schichterstellung
 * Für Sonderschichten, ungeplante Einsätze, flexible Anpassungen
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form';
import { toast } from 'sonner';
import { Calendar, Clock, Users, Tag, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName?: string;
  initialDate?: Date;
}

type ShiftType = 'REGULAR' | 'NIGHT' | 'WEEKEND' | 'HOLIDAY' | 'EMERGENCY' | 'SPECIAL';

interface CreateShiftFormData {
  title: string;
  description: string;
  startTime: string; // ISO datetime-local string
  endTime: string; // ISO datetime-local string
  requiredEmployees: number;
  requiredQualifications: string[];
  shiftType: ShiftType;
  location?: string;
}

export default function CreateShiftModal({
  isOpen,
  onClose,
  siteId,
  siteName,
  initialDate,
}: CreateShiftModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<CreateShiftFormData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    requiredEmployees: 1,
    requiredQualifications: [],
    shiftType: 'REGULAR',
    location: '',
  });

  const [qualificationInput, setQualificationInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize with initialDate wenn vorhanden
  useEffect(() => {
    if (initialDate && isOpen) {
      const dateStr = format(initialDate, 'yyyy-MM-dd');
      setFormData((prev) => ({
        ...prev,
        startTime: `${dateStr}T08:00`,
        endTime: `${dateStr}T16:00`,
      }));
    }
  }, [initialDate, isOpen]);

  // Reset beim Öffnen/Schließen
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        requiredEmployees: 1,
        requiredQualifications: [],
        shiftType: 'REGULAR',
        location: '',
      });
      setQualificationInput('');
      setErrors({});
    }
  }, [isOpen]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateShiftFormData) => {
      const response = await api.post('/shifts', {
        siteId,
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        requiredEmployees: data.requiredEmployees,
        requiredQualifications: data.requiredQualifications,
        status: 'PLANNED',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shifts', siteId] });
      toast.success('Schicht erfolgreich erstellt');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Fehler beim Erstellen der Schicht');
    },
  });

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Startzeit ist erforderlich';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Endzeit ist erforderlich';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        newErrors.endTime = 'Endzeit muss nach Startzeit liegen';
      }
    }

    if (formData.requiredEmployees < 1) {
      newErrors.requiredEmployees = 'Mindestens 1 Mitarbeiter erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      createMutation.mutate(formData);
    }
  };

  // Add Qualification
  const addQualification = () => {
    const qual = qualificationInput.trim();
    if (qual && !formData.requiredQualifications.includes(qual)) {
      setFormData((prev) => ({
        ...prev,
        requiredQualifications: [...prev.requiredQualifications, qual],
      }));
      setQualificationInput('');
    }
  };

  // Remove Qualification
  const removeQualification = (qual: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredQualifications: prev.requiredQualifications.filter((q) => q !== qual),
    }));
  };

  const shiftTypes: Array<{ value: ShiftType; label: string; color: string }> = [
    { value: 'REGULAR', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'NIGHT', label: 'Nachtschicht', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'WEEKEND', label: 'Wochenende', color: 'bg-orange-100 text-orange-800' },
    { value: 'HOLIDAY', label: 'Feiertag', color: 'bg-red-100 text-red-800' },
    { value: 'EMERGENCY', label: 'Notfall', color: 'bg-red-200 text-red-900' },
    { value: 'SPECIAL', label: 'Sonderschicht', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Neue Schicht erstellen${siteName ? ` - ${siteName}` : ''}`}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Titel */}
        <FormField label="Titel *">
          <Input
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="z.B. Nachtwache, Event-Security, Sonderschicht"
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </FormField>

        {/* Beschreibung */}
        <FormField label="Beschreibung">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Zusätzliche Informationen zur Schicht..."
            rows={3}
          />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </FormField>

        {/* Datum & Zeit */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Startzeit *">
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
            />
            {errors.startTime && <p className="text-xs text-red-600 mt-1">{errors.startTime}</p>}
          </FormField>

          <FormField label="Endzeit *">
            <Input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
            />
            {errors.endTime && <p className="text-xs text-red-600 mt-1">{errors.endTime}</p>}
          </FormField>
        </div>

        {/* Schichttyp */}
        <FormField label="Schichttyp">
          <div className="flex flex-wrap gap-2">
            {shiftTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, shiftType: type.value }))}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  formData.shiftType === type.value
                    ? `${type.color} ring-2 ring-offset-2 ring-blue-500`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </FormField>

        {/* Erforderliche Mitarbeiter */}
        <FormField label="Erforderliche Mitarbeiter *">
          <Input
            type="number"
            min={1}
            value={formData.requiredEmployees}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, requiredEmployees: parseInt(e.target.value) || 1 }))
            }
          />
          {errors.requiredEmployees && <p className="text-xs text-red-600 mt-1">{errors.requiredEmployees}</p>}
        </FormField>

        {/* Qualifikationen */}
        <FormField label="Erforderliche Qualifikationen">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addQualification();
                  }
                }}
                placeholder="z.B. Erste Hilfe, Waffenschein..."
              />
              <Button type="button" variant="outline" onClick={addQualification}>
                Hinzufügen
              </Button>
            </div>

            {formData.requiredQualifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.requiredQualifications.map((qual, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {qual}
                    <button
                      type="button"
                      onClick={() => removeQualification(qual)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Standort (optional) */}
        <FormField label="Standort (optional)">
          <Input
            value={formData.location || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="z.B. Haupteingang, Parkhaus, etc."
          />
        </FormField>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Erstelle...' : 'Schicht erstellen'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
