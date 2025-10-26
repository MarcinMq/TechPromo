import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

const KrokiFormularza: React.FC<FormStepperProps> = ({ steps, currentStep, completedSteps }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = currentStep === stepNumber;
          const isAccessible = stepNumber <= Math.max(currentStep, ...completedSteps);

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-300 border-2
                    ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white ring-4 ring-blue-200'
                        : isAccessible
                        ? 'bg-white border-blue-300 text-blue-600 hover:border-blue-500'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                
                {/* Step Info */}
                <div className="mt-2 text-center max-w-20 sm:max-w-24">
                  <div
                    className={`
                      text-xs sm:text-sm font-medium
                      ${
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-green-600'
                          : isAccessible
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mt-[-20px]">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${
                        completedSteps.includes(stepNumber + 1) || 
                        (isCompleted && currentStep > stepNumber)
                          ? 'bg-green-500'
                          : currentStep > stepNumber
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default KrokiFormularza;