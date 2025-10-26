import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { FormField } from '@/components/ui/form'
import { Plus, Trash2, Edit2, Save, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type RiskLevel = 1 | 2 | 3 | 4 | 5

type RiskScenario = {
  id: string
  name: string
  description: string
  probability: RiskLevel // Wahrscheinlichkeit
  impact: RiskLevel // Auswirkung
  score: number // probability × impact
  measures: string[] // Maßnahmen
}

type RiskAssessment = {
  scenarios: RiskScenario[]
  lastUpdated?: string
}

type RiskAssessmentEditorProps = {
  riskAssessment: RiskAssessment | null
  onSave: (assessment: RiskAssessment) => void
  onCancel?: () => void
}

const probabilityLabels = {
  1: 'Sehr unwahrscheinlich',
  2: 'Unwahrscheinlich',
  3: 'Möglich',
  4: 'Wahrscheinlich',
  5: 'Sehr wahrscheinlich',
}

const impactLabels = {
  1: 'Sehr gering',
  2: 'Gering',
  3: 'Mittel',
  4: 'Schwer',
  5: 'Sehr schwer',
}

const getRiskColor = (score: number): string => {
  if (score <= 6) return 'bg-green-100 text-green-800 border-green-300'
  if (score <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

const getRiskLabel = (score: number): string => {
  if (score <= 6) return 'Niedrig'
  if (score <= 14) return 'Mittel'
  return 'Hoch'
}

export default function RiskAssessmentEditor({
  riskAssessment,
  onSave,
  onCancel,
}: RiskAssessmentEditorProps) {
  const [editMode, setEditMode] = useState(!riskAssessment)
  const [scenarios, setScenarios] = useState<RiskScenario[]>(riskAssessment?.scenarios || [])
  const [addModal, setAddModal] = useState(false)
  const [editingScenario, setEditingScenario] = useState<RiskScenario | null>(null)
  const [newScenario, setNewScenario] = useState<Omit<RiskScenario, 'id' | 'score'>>({
    name: '',
    description: '',
    probability: 3,
    impact: 3,
    measures: [],
  })
  const [newMeasure, setNewMeasure] = useState('')

  const calculateScore = (probability: RiskLevel, impact: RiskLevel): number => {
    return probability * impact
  }

  const handleAddScenario = () => {
    if (!newScenario.name.trim()) return

    const scenario: RiskScenario = {
      id: Date.now().toString(),
      ...newScenario,
      score: calculateScore(newScenario.probability, newScenario.impact),
    }

    setScenarios([...scenarios, scenario])
    setNewScenario({
      name: '',
      description: '',
      probability: 3,
      impact: 3,
      measures: [],
    })
    setNewMeasure('')
    setAddModal(false)
  }

  const handleUpdateScenario = () => {
    if (!editingScenario) return

    const updatedScenario: RiskScenario = {
      ...editingScenario,
      score: calculateScore(editingScenario.probability, editingScenario.impact),
    }

    setScenarios(scenarios.map((s) => (s.id === editingScenario.id ? updatedScenario : s)))
    setEditingScenario(null)
  }

  const handleDeleteScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id))
  }

  const handleSave = () => {
    onSave({
      scenarios,
      lastUpdated: new Date().toISOString(),
    })
    setEditMode(false)
  }

  const handleCancel = () => {
    if (riskAssessment) {
      setScenarios(riskAssessment.scenarios)
      setEditMode(false)
    } else {
      onCancel?.()
    }
  }

  const addMeasureToNew = () => {
    if (!newMeasure.trim()) return
    setNewScenario({
      ...newScenario,
      measures: [...newScenario.measures, newMeasure],
    })
    setNewMeasure('')
  }

  const addMeasureToEditing = () => {
    if (!newMeasure.trim() || !editingScenario) return
    setEditingScenario({
      ...editingScenario,
      measures: [...editingScenario.measures, newMeasure],
    })
    setNewMeasure('')
  }

  const removeMeasureFromNew = (index: number) => {
    setNewScenario({
      ...newScenario,
      measures: newScenario.measures.filter((_, i) => i !== index),
    })
  }

  const removeMeasureFromEditing = (index: number) => {
    if (!editingScenario) return
    setEditingScenario({
      ...editingScenario,
      measures: editingScenario.measures.filter((_, i) => i !== index),
    })
  }

  if (!editMode && riskAssessment) {
    // View Mode
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={18} />
            Risikobeurteilung ({scenarios.length} Szenarien)
          </h4>
          <Button onClick={() => setEditMode(true)} variant="outline" size="sm" className="gap-2">
            <Edit2 size={14} />
            Bearbeiten
          </Button>
        </div>

        {/* Risk Matrix Visualization */}
        <RiskMatrix scenarios={scenarios} />

        {/* Scenarios List */}
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <AlertTriangle size={18} />
          Risikobeurteilung bearbeiten
        </h4>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" size="sm" className="gap-1">
            <X size={14} />
            Abbrechen
          </Button>
          <Button onClick={handleSave} size="sm" className="gap-1">
            <Save size={14} />
            Speichern
          </Button>
        </div>
      </div>

      {/* Add Scenario Button */}
      <Button onClick={() => setAddModal(true)} variant="outline" className="w-full gap-2">
        <Plus size={16} />
        Risiko-Szenario hinzufügen
      </Button>

      {/* Risk Matrix Visualization */}
      {scenarios.length > 0 && <RiskMatrix scenarios={scenarios} />}

      {/* Scenarios List */}
      <div className="space-y-2">
        {scenarios.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
            Keine Risiko-Szenarien definiert. Füge ein Szenario hinzu.
          </div>
        )}

        {scenarios.map((scenario) => (
          <EditableScenarioCard
            key={scenario.id}
            scenario={scenario}
            onEdit={() => {
              setEditingScenario(scenario)
              setNewMeasure('')
            }}
            onDelete={() => handleDeleteScenario(scenario.id)}
          />
        ))}
      </div>

      {/* Add Scenario Modal */}
      <Modal title="Risiko-Szenario hinzufügen" open={addModal} onClose={() => setAddModal(false)} size="lg">
        <div className="space-y-4">
          <FormField label="Szenario-Name *">
            <Input
              value={newScenario.name}
              onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
              placeholder="z.B. Einbruchsversuch"
            />
          </FormField>

          <FormField label="Beschreibung">
            <Textarea
              value={newScenario.description}
              onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
              placeholder="Detaillierte Beschreibung des Risikos..."
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Wahrscheinlichkeit *">
              <Select
                value={newScenario.probability.toString()}
                onChange={(e) =>
                  setNewScenario({ ...newScenario, probability: Number(e.target.value) as RiskLevel })
                }
              >
                {Object.entries(probabilityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {value} - {label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Auswirkung *">
              <Select
                value={newScenario.impact.toString()}
                onChange={(e) => setNewScenario({ ...newScenario, impact: Number(e.target.value) as RiskLevel })}
              >
                {Object.entries(impactLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {value} - {label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Risk Score Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm text-gray-600 mb-2">Risikoscore (automatisch berechnet)</p>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{calculateScore(newScenario.probability, newScenario.impact)}</div>
              <div
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium border',
                  getRiskColor(calculateScore(newScenario.probability, newScenario.impact))
                )}
              >
                {getRiskLabel(calculateScore(newScenario.probability, newScenario.impact))}
              </div>
            </div>
          </div>

          {/* Measures */}
          <FormField label="Maßnahmen zur Risikominimierung">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newMeasure}
                  onChange={(e) => setNewMeasure(e.target.value)}
                  placeholder="z.B. Videoüberwachung installieren"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addMeasureToNew()
                    }
                  }}
                />
                <Button onClick={addMeasureToNew} variant="outline" size="sm">
                  <Plus size={14} />
                </Button>
              </div>
              {newScenario.measures.length > 0 && (
                <div className="space-y-1">
                  {newScenario.measures.map((measure, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded px-3 py-2">
                      <span className="flex-1 text-sm">{measure}</span>
                      <Button
                        onClick={() => removeMeasureFromNew(idx)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button onClick={() => setAddModal(false)} variant="outline">
              Abbrechen
            </Button>
            <Button onClick={handleAddScenario} disabled={!newScenario.name.trim()}>
              Hinzufügen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Scenario Modal */}
      {editingScenario && (
        <Modal title="Risiko-Szenario bearbeiten" open={!!editingScenario} onClose={() => setEditingScenario(null)} size="lg">
          <div className="space-y-4">
            <FormField label="Szenario-Name *">
              <Input
                value={editingScenario.name}
                onChange={(e) => setEditingScenario({ ...editingScenario, name: e.target.value })}
              />
            </FormField>

            <FormField label="Beschreibung">
              <Textarea
                value={editingScenario.description}
                onChange={(e) => setEditingScenario({ ...editingScenario, description: e.target.value })}
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Wahrscheinlichkeit *">
                <Select
                  value={editingScenario.probability.toString()}
                  onChange={(e) =>
                    setEditingScenario({ ...editingScenario, probability: Number(e.target.value) as RiskLevel })
                  }
                >
                  {Object.entries(probabilityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {value} - {label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Auswirkung *">
                <Select
                  value={editingScenario.impact.toString()}
                  onChange={(e) =>
                    setEditingScenario({ ...editingScenario, impact: Number(e.target.value) as RiskLevel })
                  }
                >
                  {Object.entries(impactLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {value} - {label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Risk Score Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">Risikoscore</p>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">
                  {calculateScore(editingScenario.probability, editingScenario.impact)}
                </div>
                <div
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium border',
                    getRiskColor(calculateScore(editingScenario.probability, editingScenario.impact))
                  )}
                >
                  {getRiskLabel(calculateScore(editingScenario.probability, editingScenario.impact))}
                </div>
              </div>
            </div>

            {/* Measures */}
            <FormField label="Maßnahmen">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newMeasure}
                    onChange={(e) => setNewMeasure(e.target.value)}
                    placeholder="Neue Maßnahme hinzufügen"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addMeasureToEditing()
                      }
                    }}
                  />
                  <Button onClick={addMeasureToEditing} variant="outline" size="sm">
                    <Plus size={14} />
                  </Button>
                </div>
                {editingScenario.measures.length > 0 && (
                  <div className="space-y-1">
                    {editingScenario.measures.map((measure, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-blue-50 rounded px-3 py-2">
                        <span className="flex-1 text-sm">{measure}</span>
                        <Button
                          onClick={() => removeMeasureFromEditing(idx)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button onClick={() => setEditingScenario(null)} variant="outline">
                Abbrechen
              </Button>
              <Button onClick={handleUpdateScenario}>Speichern</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Helper Components
function ScenarioCard({ scenario }: { scenario: RiskScenario }) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className="font-semibold">{scenario.name}</h5>
          {scenario.description && <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>}
        </div>
        <div className={cn('px-3 py-1 rounded-full text-sm font-medium border ml-3', getRiskColor(scenario.score))}>
          Score: {scenario.score} ({getRiskLabel(scenario.score)})
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="text-sm">
          <span className="text-gray-600">Wahrscheinlichkeit:</span>
          <div className="font-medium mt-1">
            {scenario.probability}/5 - {probabilityLabels[scenario.probability]}
          </div>
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Auswirkung:</span>
          <div className="font-medium mt-1">
            {scenario.impact}/5 - {impactLabels[scenario.impact]}
          </div>
        </div>
      </div>

      {scenario.measures.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium text-gray-700 mb-2">Maßnahmen:</p>
          <ul className="space-y-1">
            {scenario.measures.map((measure, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{measure}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function EditableScenarioCard({
  scenario,
  onEdit,
  onDelete,
}: {
  scenario: RiskScenario
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-semibold">{scenario.name}</h5>
            <div className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', getRiskColor(scenario.score))}>
              {scenario.score}
            </div>
          </div>
          <p className="text-sm text-gray-600">
            W: {scenario.probability}/5 · A: {scenario.impact}/5 · {scenario.measures.length} Maßnahmen
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit2 size={14} />
          </Button>
          <Button onClick={onDelete} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

function RiskMatrix({ scenarios }: { scenarios: RiskScenario[] }) {
  const matrix: { [key: string]: number } = {}
  scenarios.forEach((s) => {
    const key = `${s.probability}-${s.impact}`
    matrix[key] = (matrix[key] || 0) + 1
  })

  return (
    <div className="bg-white rounded-lg p-4 border">
      <p className="text-sm font-medium mb-3">5×5 Risikomatrix</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 text-xs bg-gray-50 w-20">W \ A</th>
              {[1, 2, 3, 4, 5].map((impact) => (
                <th key={impact} className="border p-2 text-xs bg-gray-50">
                  {impact}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 4, 3, 2, 1].map((probability) => (
              <tr key={probability}>
                <td className="border p-2 text-xs bg-gray-50 font-medium text-center">{probability}</td>
                {[1, 2, 3, 4, 5].map((impact) => {
                  const score = probability * impact
                  const count = matrix[`${probability}-${impact}`] || 0
                  return (
                    <td
                      key={impact}
                      className={cn('border p-3 text-center', getRiskColor(score), 'transition-colors')}
                    >
                      <div className="text-xs font-semibold">{score}</div>
                      {count > 0 && <div className="text-xs mt-1">({count})</div>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-400"></div>
          <span>Niedrig (1-6)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-400"></div>
          <span>Mittel (7-14)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400"></div>
          <span>Hoch (15-25)</span>
        </div>
      </div>
    </div>
  )
}
