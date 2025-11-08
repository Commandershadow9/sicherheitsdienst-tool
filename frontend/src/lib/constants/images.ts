/**
 * Image Category Constants
 * Used across web and mobile apps
 */

export const IMAGE_CATEGORIES = {
  ALLGEMEIN: 'ALLGEMEIN',
  AUSSEN: 'AUSSEN',
  INNEN: 'INNEN',
  ZUGANG: 'ZUGANG',
  NOTAUSGANG: 'NOTAUSGANG',
  SONSTIGES: 'SONSTIGES',
} as const

export type ImageCategory = typeof IMAGE_CATEGORIES[keyof typeof IMAGE_CATEGORIES]

export const IMAGE_CATEGORY_LABELS: Record<ImageCategory, string> = {
  ALLGEMEIN: 'Allgemein',
  AUSSEN: 'Außenbereich',
  INNEN: 'Innenbereich',
  ZUGANG: 'Zugang',
  NOTAUSGANG: 'Notausgang',
  SONSTIGES: 'Sonstiges',
}

export const IMAGE_CATEGORY_OPTIONS = Object.entries(IMAGE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
)

/**
 * Helper function to get image category label
 */
export function getImageCategoryLabel(category: string): string {
  return IMAGE_CATEGORY_LABELS[category as ImageCategory] ?? category
}
