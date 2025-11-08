/**
 * Document Category Constants
 * Used across web and mobile apps
 */

export const DOCUMENT_CATEGORIES = {
  DIENSTANWEISUNG: 'DIENSTANWEISUNG',
  NOTFALLPLAN: 'NOTFALLPLAN',
  VERTRAG: 'VERTRAG',
  BRANDSCHUTZORDNUNG: 'BRANDSCHUTZORDNUNG',
  HAUSORDNUNG: 'HAUSORDNUNG',
  GRUNDRISS: 'GRUNDRISS',
  SONSTIGES: 'SONSTIGES',
} as const

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[keyof typeof DOCUMENT_CATEGORIES]

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  DIENSTANWEISUNG: 'Dienstanweisung',
  NOTFALLPLAN: 'Notfallplan',
  VERTRAG: 'Vertrag',
  BRANDSCHUTZORDNUNG: 'Brandschutzordnung',
  HAUSORDNUNG: 'Hausordnung',
  GRUNDRISS: 'Grundriss',
  SONSTIGES: 'Sonstiges',
}

export const DOCUMENT_CATEGORY_OPTIONS = Object.entries(DOCUMENT_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)

/**
 * Helper function to get document category label
 */
export function getDocumentCategoryLabel(category: string): string {
  return DOCUMENT_CATEGORY_LABELS[category as DocumentCategory] ?? category
}
