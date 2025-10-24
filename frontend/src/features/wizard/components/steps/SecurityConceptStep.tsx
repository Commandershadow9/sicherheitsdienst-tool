import { useState } from 'react';
import { WizardData } from '../../../../types/wizard';
import { SiteTemplate } from '../../../../types/template';
import { useTemplates } from '../../../templates/api';
import { Shield, Clock, Users, Award, CheckCircle, Plus, X, Loader2, Sparkles } from 'lucide-react';

interface SecurityConceptStepProps {
  data: WizardData;
  onUpdate: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SHIFT_MODELS = [
  { value: '24/7', label: '24/7 Dauerpräsenz' },
  { value: 'TAG', label: 'Tagesschicht (06:00-18:00)' },
  { value: 'NACHT', label: 'Nachtschicht (18:00-06:00)' },
  { value: '2-SCHICHT', label: '2-Schicht-System' },
  { value: '3-SCHICHT', label: '3-Schicht-System' },
  { value: 'FLEXIBEL', label: 'Flexibel nach Bedarf' },
];

export default function SecurityConceptStep({ data, onUpdate, onNext, onPrevious }: SecurityConceptStepProps) {
  const [mode, setMode] = useState<'template' | 'manual'>(
    data.securityConcept?.templateId ? 'template' : 'template'
  );

  const [manualData, setManualData] = useState({
    templateId: data.securityConcept?.templateId,
    templateName: data.securityConcept?.templateName,
    tasks: data.securityConcept?.tasks || [],
    shiftModel: data.securityConcept?.shiftModel || '',
    hoursPerWeek: data.securityConcept?.hoursPerWeek || 0,
    requiredStaff: data.securityConcept?.requiredStaff || 1,
    requiredQualifications: data.securityConcept?.requiredQualifications || [],
  });

  const [templateLoaded, setTemplateLoaded] = useState<string | null>(null);
  const [newTask, setNewTask] = useState('');
  const [newQualification, setNewQualification] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Templates laden (gefiltert nach buildingType aus Schritt 2)
  const { data: templatesData, isLoading } = useTemplates(data.buildingType);

  const handleSelectTemplate = (template: SiteTemplate) => {
    // Template-Daten in manuellen Modus laden für Anpassungen
    setManualData({
      templateId: template.id,
      templateName: template.name,
      tasks: [...template.tasks],
      shiftModel: template.shiftModel,
      hoursPerWeek: template.hoursPerWeek,
      requiredStaff: template.requiredStaff,
      requiredQualifications: [...template.requiredQualifications],
    });
    setTemplateLoaded(template.name);
    setMode('manual');

    // Scroll zum Formular
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      setManualData({
        ...manualData,
        tasks: [...manualData.tasks, newTask.trim()],
      });
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setManualData({
      ...manualData,
      tasks: manualData.tasks.filter((_, i) => i !== index),
    });
  };

  const handleAddQualification = () => {
    if (newQualification.trim()) {
      setManualData({
        ...manualData,
        requiredQualifications: [...manualData.requiredQualifications, newQualification.trim()],
      });
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (index: number) => {
    setManualData({
      ...manualData,
      requiredQualifications: manualData.requiredQualifications.filter((_, i) => i !== index),
    });
  };

  const validateManualInput = () => {
    const newErrors: Record<string, string> = {};

    if (manualData.tasks.length === 0) {
      newErrors.tasks = 'Mindestens eine Aufgabe ist erforderlich';
    }
    if (!manualData.shiftModel) {
      newErrors.shiftModel = 'Schichtmodell ist erforderlich';
    }
    if (manualData.hoursPerWeek <= 0) {
      newErrors.hoursPerWeek = 'Stunden pro Woche müssen größer als 0 sein';
    }
    if (manualData.requiredStaff <= 0) {
      newErrors.requiredStaff = 'Mindestens 1 Mitarbeiter erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleManualNext = () => {
    if (validateManualInput()) {
      onUpdate({
        securityConcept: {
          templateId: manualData.templateId,
          templateName: manualData.templateName,
          tasks: manualData.tasks,
          shiftModel: manualData.shiftModel,
          hoursPerWeek: manualData.hoursPerWeek,
          requiredStaff: manualData.requiredStaff,
          requiredQualifications: manualData.requiredQualifications,
        },
      });
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Sicherheitskonzept definieren
        </h2>
        <p className="text-gray-600 text-sm">
          Wählen Sie eine Vorlage oder konfigurieren Sie das Sicherheitskonzept manuell
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-3">
          <button
            onClick={() => setMode('template')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              mode === 'template'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Template verwenden
            </div>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              Manuell konfigurieren
            </div>
          </button>
        </div>
      </div>

      {/* Template Mode */}
      {mode === 'template' && (
        <div className="space-y-4">
          {isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
              <p className="text-gray-600">Lade Templates...</p>
            </div>
          )}

          {!isLoading && templatesData && templatesData.templates.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <p className="text-yellow-900 font-medium mb-2">
                Keine Templates für {data.buildingType} gefunden
              </p>
              <p className="text-yellow-700 text-sm mb-4">
                Für diesen Gebäudetyp sind noch keine Vorlagen verfügbar.
              </p>
              <button
                onClick={() => setMode('manual')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Zur manuellen Konfiguration
              </button>
            </div>
          )}

          {!isLoading && templatesData && templatesData.templates.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templatesData.templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-indigo-400 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    {/* Template Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {template.basePrice.toFixed(2)} €/h
                      </div>
                    </div>

                    {/* Template Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{template.hoursPerWeek}h/Woche</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span>{template.requiredStaff} MA</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Schichtmodell:</div>
                      <div className="px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-700 inline-block">
                        {template.shiftModel}
                      </div>
                    </div>

                    {/* Tasks */}
                    {template.tasks.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Aufgaben:</div>
                        <ul className="space-y-1">
                          {template.tasks.slice(0, 3).map((task, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                          {template.tasks.length > 3 && (
                            <li className="text-sm text-gray-500 ml-6">
                              + {template.tasks.length - 3} weitere
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Qualifications */}
                    {template.requiredQualifications.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Qualifikationen:</div>
                        <div className="flex flex-wrap gap-2">
                          {template.requiredQualifications.map((qual, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              {qual}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Select Button */}
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Dieses Template verwenden
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {/* Template Info */}
          {templateLoaded && (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 relative">
              <button
                onClick={() => {
                  setTemplateLoaded(null);
                  setManualData({
                    templateId: undefined,
                    templateName: undefined,
                    tasks: [],
                    shiftModel: '',
                    hoursPerWeek: 0,
                    requiredStaff: 1,
                    requiredQualifications: [],
                  });
                }}
                className="absolute top-4 right-4 p-2 text-green-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Template-Daten verwerfen"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800 mb-1">
                    Template geladen
                  </div>
                  <div className="font-semibold text-gray-900 text-lg mb-2">
                    {templateLoaded}
                  </div>
                  <p className="text-sm text-green-700">
                    💡 Die Werte aus dem Template wurden übernommen. Sie können diese jetzt nach Bedarf anpassen und erweitern.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              Aufgaben <span className="text-red-500">*</span>
            </div>

            {/* Task List */}
            {manualData.tasks.length > 0 && (
              <ul className="space-y-2 mb-4">
                {manualData.tasks.map((task, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 group"
                  >
                    <span className="text-gray-700">{task}</span>
                    <button
                      onClick={() => handleRemoveTask(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="z.B. Objektschutz, Empfangsdienst, Revierdienst..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
            {errors.tasks && <p className="text-red-500 text-sm mt-2">{errors.tasks}</p>}
          </div>

          {/* Shift Model & Hours */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shift Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Schichtmodell <span className="text-red-500">*</span>
                </label>
                <select
                  value={manualData.shiftModel}
                  onChange={(e) => setManualData({ ...manualData, shiftModel: e.target.value })}
                  className={`w-full px-4 py-2 border ${
                    errors.shiftModel ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                >
                  <option value="">Bitte wählen...</option>
                  {SHIFT_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
                {errors.shiftModel && <p className="text-red-500 text-sm mt-1">{errors.shiftModel}</p>}
              </div>

              {/* Hours per Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stunden pro Woche <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualData.hoursPerWeek}
                  onChange={(e) =>
                    setManualData({ ...manualData, hoursPerWeek: parseInt(e.target.value) || 0 })
                  }
                  className={`w-full px-4 py-2 border ${
                    errors.hoursPerWeek ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  placeholder="z.B. 168 für 24/7"
                />
                {errors.hoursPerWeek && <p className="text-red-500 text-sm mt-1">{errors.hoursPerWeek}</p>}
              </div>

              {/* Required Staff */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Benötigte Mitarbeiter <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualData.requiredStaff}
                  onChange={(e) =>
                    setManualData({ ...manualData, requiredStaff: parseInt(e.target.value) || 1 })
                  }
                  className={`w-full px-4 py-2 border ${
                    errors.requiredStaff ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  placeholder="z.B. 2"
                />
                {errors.requiredStaff && <p className="text-red-500 text-sm mt-1">{errors.requiredStaff}</p>}
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Erforderliche Qualifikationen (optional)
            </div>

            {/* Qualification List */}
            {manualData.requiredQualifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manualData.requiredQualifications.map((qual, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg flex items-center gap-2 group"
                  >
                    <Award className="w-3 h-3" />
                    {qual}
                    <button
                      onClick={() => handleRemoveQualification(idx)}
                      className="p-0.5 text-purple-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Qualification */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newQualification}
                onChange={(e) => setNewQualification(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddQualification()}
                placeholder="z.B. §34a, IHK-Geprüfte Schutz- und Sicherheitskraft..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddQualification}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onPrevious}
          className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          ← Zurück zu Schritt 2
        </button>
        {mode === 'manual' && (
          <button
            onClick={handleManualNext}
            className="px-6 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            Weiter zu Schritt 4
            <span className="text-sm opacity-75">→</span>
          </button>
        )}
        {mode === 'template' && (
          <div className="text-sm text-gray-500 px-4 py-2">
            Wählen Sie ein Template aus, um fortzufahren
          </div>
        )}
      </div>
    </div>
  );
}
