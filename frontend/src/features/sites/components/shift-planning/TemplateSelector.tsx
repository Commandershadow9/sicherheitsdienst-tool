/**
 * TemplateSelector - Auswahl vordefinierter Schichtplanungs-Templates
 *
 * Ermöglicht schnelles Erstellen häufig verwendeter Schichtmodelle
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { Lightbulb, ChevronRight } from 'lucide-react'
import { SHIFT_RULE_TEMPLATES, getTemplatesByCategory, type ShiftRuleTemplate } from '../../types/shiftRuleTemplates'

type TemplateSelectorProps = {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ShiftRuleTemplate) => void
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<'standard' | '24-7' | 'special'>('standard')

  const categories = [
    { id: 'standard' as const, label: 'Standard', description: 'Klassische Schichtmodelle' },
    { id: '24-7' as const, label: '24/7 Betrieb', description: 'Durchgehende Besetzung' },
    { id: 'special' as const, label: 'Spezial', description: 'Besondere Einsätze' },
  ]

  const filteredTemplates = getTemplatesByCategory(selectedCategory)

  const handleSelectTemplate = (template: ShiftRuleTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schichtmodell-Vorlagen" size="lg">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Schnelleinstieg mit Vorlagen</p>
              <p>
                Wählen Sie eine Vorlage aus, um alle Regeln auf einmal zu erstellen. Sie können die
                Regeln anschließend individuell anpassen.
              </p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                selectedCategory === cat.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              )}
            >
              <div>
                <div className="font-semibold">{cat.label}</div>
                <div className="text-xs text-gray-500">{cat.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {template.rules.length} Regel{template.rules.length !== 1 ? 'n' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
                />
              </div>

              {/* Preview of rules */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 space-y-1">
                  {template.rules.slice(0, 2).map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{rule.name}:</span>
                      <span>
                        {rule.startTime} - {rule.endTime}
                      </span>
                    </div>
                  ))}
                  {template.rules.length > 2 && (
                    <div className="text-gray-400">+{template.rules.length - 2} weitere</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Keine Vorlagen in dieser Kategorie verfügbar
          </div>
        )}
      </div>
    </Modal>
  )
}
