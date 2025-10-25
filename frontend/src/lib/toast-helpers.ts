import { toast } from 'sonner';

/**
 * Toast Helper Functions
 * Provides contextual, informative toast notifications
 */

// ============================================================================
// Success Toasts
// ============================================================================

export const toastSuccess = {
  /**
   * User assigned to shift
   */
  shiftAssignment: (userName: string, shiftTitle: string) => {
    toast.success(`✅ Zuweisung erfolgreich`, {
      description: `${userName} wurde zu "${shiftTitle}" zugewiesen`,
      duration: 4000,
    });
  },

  /**
   * Bulk shift assignment
   */
  bulkShiftAssignment: (userName: string, count: number) => {
    toast.success(`✅ ${count} Schicht${count !== 1 ? 'en' : ''} zugewiesen`, {
      description: `${userName} wurde zu ${count} Schicht${count !== 1 ? 'en' : ''} zugewiesen`,
      duration: 5000,
    });
  },

  /**
   * Clearance training completed
   */
  clearanceCompleted: (userName: string, siteName: string) => {
    toast.success(`✅ Einarbeitung abgeschlossen`, {
      description: `${userName} ist nun für "${siteName}" eingearbeitet`,
      duration: 4000,
    });
  },

  /**
   * Clearance revoked
   */
  clearanceRevoked: (userName: string, siteName: string) => {
    toast.success(`🚫 Einarbeitung widerrufen`, {
      description: `${userName} hat keine Berechtigung mehr für "${siteName}"`,
      duration: 4000,
    });
  },

  /**
   * New clearance created
   */
  clearanceCreated: (userName: string, siteName: string) => {
    toast.success(`✅ Einarbeitung gestartet`, {
      description: `${userName} ist nun in Einarbeitung für "${siteName}"`,
      duration: 4000,
    });
  },

  /**
   * Assignment created
   */
  assignmentCreated: (userName: string, siteName: string, role: string) => {
    const roleLabels: Record<string, string> = {
      OBJEKTLEITER: 'Objektleiter',
      SCHICHTLEITER: 'Schichtleiter',
      MITARBEITER: 'Mitarbeiter',
    };
    toast.success(`✅ Zuweisung erstellt`, {
      description: `${userName} wurde als ${roleLabels[role] || role} zu "${siteName}" zugewiesen`,
      duration: 4000,
    });
  },

  /**
   * Assignment removed
   */
  assignmentRemoved: (userName: string, siteName: string) => {
    toast.success(`✅ Zuweisung entfernt`, {
      description: `${userName} ist nicht mehr "${siteName}" zugewiesen`,
      duration: 4000,
    });
  },

  /**
   * Shifts generated
   */
  shiftsGenerated: (count: number, siteName: string, template: string) => {
    toast.success(`✅ ${count} Schicht${count !== 1 ? 'en' : ''} generiert`, {
      description: `${count} Schicht${count !== 1 ? 'en' : ''} für "${siteName}" (${template}) erstellt`,
      duration: 5000,
    });
  },

  /**
   * Document uploaded
   */
  documentUploaded: (title: string, category: string) => {
    toast.success(`📄 Dokument hochgeladen`, {
      description: `"${title}" (${category}) wurde erfolgreich gespeichert`,
      duration: 4000,
    });
  },

  /**
   * Document deleted
   */
  documentDeleted: (title: string) => {
    toast.success(`🗑️ Dokument gelöscht`, {
      description: `"${title}" wurde entfernt`,
      duration: 3000,
    });
  },

  /**
   * Image uploaded
   */
  imageUploaded: (category: string) => {
    toast.success(`🖼️ Bild hochgeladen`, {
      description: `Bild (${category}) wurde erfolgreich gespeichert`,
      duration: 3000,
    });
  },

  /**
   * Image deleted
   */
  imageDeleted: () => {
    toast.success(`🗑️ Bild gelöscht`, {
      description: `Das Bild wurde entfernt`,
      duration: 3000,
    });
  },

  /**
   * Site deleted
   */
  siteDeleted: (siteName: string) => {
    toast.success(`🗑️ Objekt gelöscht`, {
      description: `"${siteName}" wurde erfolgreich gelöscht`,
      duration: 4000,
    });
  },

  /**
   * Incident created
   */
  incidentCreated: (title: string, severity: string) => {
    const severityLabels: Record<string, string> = {
      CRITICAL: 'Kritisch',
      HIGH: 'Hoch',
      MEDIUM: 'Mittel',
      LOW: 'Niedrig',
    };
    toast.success(`📋 Vorfall gemeldet`, {
      description: `"${title}" (${severityLabels[severity] || severity}) wurde erfasst`,
      duration: 4000,
    });
  },

  /**
   * Incident resolved
   */
  incidentResolved: (title: string) => {
    toast.success(`✅ Vorfall gelöst`, {
      description: `"${title}" wurde als gelöst markiert`,
      duration: 4000,
    });
  },

  /**
   * Generic success
   */
  generic: (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  },
};

// ============================================================================
// Error Toasts
// ============================================================================

export const toastError = {
  /**
   * Assignment failed - user already assigned
   */
  alreadyAssigned: (userName: string, siteName: string) => {
    toast.error(`❌ Bereits zugewiesen`, {
      description: `${userName} ist bereits "${siteName}" zugewiesen`,
      duration: 4000,
    });
  },

  /**
   * Assignment failed - missing qualifications
   */
  missingQualifications: (userName: string, missing: string[]) => {
    toast.error(`❌ Fehlende Qualifikationen`, {
      description: `${userName} fehlen: ${missing.join(', ')}`,
      duration: 5000,
    });
  },

  /**
   * Assignment failed - no clearance
   */
  noClearance: (userName: string, siteName: string) => {
    toast.error(`❌ Keine Einarbeitung`, {
      description: `${userName} ist nicht für "${siteName}" eingearbeitet`,
      duration: 4000,
      action: {
        label: 'Einarbeitung starten',
        onClick: () => {
          // Could trigger clearance modal
        },
      },
    });
  },

  /**
   * Network error
   */
  network: () => {
    toast.error(`🌐 Netzwerkfehler`, {
      description: 'Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut',
      duration: 5000,
    });
  },

  /**
   * Unauthorized
   */
  unauthorized: () => {
    toast.error(`🔒 Keine Berechtigung`, {
      description: 'Sie haben keine Berechtigung für diese Aktion',
      duration: 4000,
    });
  },

  /**
   * Validation error
   */
  validation: (field: string, message: string) => {
    toast.error(`❌ Validierungsfehler`, {
      description: `${field}: ${message}`,
      duration: 4000,
    });
  },

  /**
   * Upload failed
   */
  uploadFailed: (filename: string, reason?: string) => {
    toast.error(`📁 Upload fehlgeschlagen`, {
      description: reason ? `"${filename}": ${reason}` : `"${filename}" konnte nicht hochgeladen werden`,
      duration: 5000,
    });
  },

  /**
   * Generic error
   */
  generic: (message: string, description?: string) => {
    toast.error(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * API Error with suggestions
   */
  api: (errorMessage: string, suggestion?: string) => {
    toast.error(`❌ Fehler`, {
      description: suggestion ? `${errorMessage}\n💡 ${suggestion}` : errorMessage,
      duration: 5000,
    });
  },
};

// ============================================================================
// Info Toasts
// ============================================================================

export const toastInfo = {
  /**
   * Loading / Processing
   */
  loading: (message: string) => {
    return toast.loading(message, {
      duration: Infinity, // Manual dismiss
    });
  },

  /**
   * Dismiss loading toast
   */
  dismiss: (toastId: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Info message
   */
  generic: (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Warning message
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  },
};

// ============================================================================
// Promise Toasts (for async operations)
// ============================================================================

export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(promise, {
    loading: messages.loading,
    success: (data) => {
      return typeof messages.success === 'function' ? messages.success(data) : messages.success;
    },
    error: (error) => {
      return typeof messages.error === 'function' ? messages.error(error) : messages.error;
    },
  });
};
