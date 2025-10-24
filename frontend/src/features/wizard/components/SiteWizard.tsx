import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardData, WizardStep, WIZARD_STEPS } from '../../../types/wizard';
import { validateWizardStep } from '../hooks/useWizardValidation';
import { Check, X, AlertCircle, Save } from 'lucide-react';
import CustomerStep from './steps/CustomerStep';
import ObjectStep from './steps/ObjectStep';
import SecurityConceptStep from './steps/SecurityConceptStep';
import StaffStep from './steps/StaffStep';
import ControlPointsStep from './steps/ControlPointsStep';
import CalculationStep from './steps/CalculationStep';
import DocumentsStep from './steps/DocumentsStep';
import SummaryStep from './steps/SummaryStep';

const WIZARD_STORAGE_KEY = 'siteWizardData';
const WIZARD_STEP_KEY = 'siteWizardStep';

export default function SiteWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Load saved wizard data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(WIZARD_STORAGE_KEY);
      const savedStep = localStorage.getItem(WIZARD_STEP_KEY);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setWizardData(parsedData);
      }

      if (savedStep) {
        const step = parseInt(savedStep, 10) as WizardStep;
        if (step >= 1 && step <= 8) {
          setCurrentStep(step);
        }
      }
    } catch (error) {
      console.error('Failed to load wizard data from localStorage:', error);
    }
  }, []);

  // Save wizard data to localStorage whenever it changes
  useEffect(() => {
    try {
      if (Object.keys(wizardData).length > 0) {
        localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardData));
      }
    } catch (error) {
      console.error('Failed to save wizard data to localStorage:', error);
    }
  }, [wizardData]);

  // Save current step to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WIZARD_STEP_KEY, currentStep.toString());
    } catch (error) {
      console.error('Failed to save wizard step to localStorage:', error);
    }
  }, [currentStep]);

  const clearWizardStorage = () => {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
    localStorage.removeItem(WIZARD_STEP_KEY);
  };

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    // Validate current step before moving forward
    const validation = validateWizardStep(currentStep, wizardData);

    if (!validation.isValid) {
      // Show validation warnings
      const warnings = Object.values(validation.errors);
      setValidationWarnings(warnings);
      return; // Don't proceed
    }

    setValidationWarnings([]);
    if (currentStep < 8) {
      setCurrentStep((currentStep + 1) as WizardStep);
    }
  };

  // Clear warnings when step changes
  useEffect(() => {
    setValidationWarnings([]);
  }, [currentStep]);

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  };

  const handleCancel = () => {
    if (confirm('Möchten Sie den Wizard wirklich abbrechen? Alle Daten gehen verloren.')) {
      clearWizardStorage();
      navigate('/sites');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onCancel={handleCancel}
          />
        );
      case 2:
        return (
          <ObjectStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 3:
        return (
          <SecurityConceptStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 4:
        return (
          <StaffStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 5:
        return (
          <ControlPointsStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 6:
        return (
          <CalculationStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 7:
        return (
          <DocumentsStep
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 8:
        return (
          <SummaryStep
            data={wizardData}
            onPrevious={goToPreviousStep}
            onComplete={clearWizardStorage}
          />
        );
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Schritt {currentStep}</p>
            <p className="text-sm text-gray-500 mt-2">Wird später implementiert</p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={goToPreviousStep}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Zurück
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Neues Objekt anlegen</h1>
              <div className="flex items-center gap-2 mt-1">
                <Save className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">
                  Fortschritt wird automatisch gespeichert
                </span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Abbrechen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">
            Schritt {currentStep} von {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200
                      ${
                        step.number < currentStep
                          ? 'bg-green-500 text-white'
                          : step.number === currentStep
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div
                      className={`
                        text-xs font-medium
                        ${step.number === currentStep ? 'text-indigo-600' : 'text-gray-500'}
                      `}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < WIZARD_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      style={{
                        width: step.number < currentStep ? '100%' : '0%',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-red-900 mb-2">Bitte beheben Sie folgende Probleme:</div>
                <ul className="space-y-1">
                  {validationWarnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {renderStep()}

        {/* Debug Info (nur Development) */}
        {import.meta.env.DEV && (
          <div className="mt-6 bg-gray-800 text-white rounded-lg p-4 text-xs font-mono">
            <div className="font-bold mb-2">Wizard State (Debug):</div>
            <pre>{JSON.stringify(wizardData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
