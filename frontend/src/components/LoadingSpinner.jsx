import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Processing educational text..." }) {
  const steps = [
    "Preprocessing & cleaning document text...",
    "Segmenting sentences & computing TextRank graph scores...",
    "Extracting key concepts, technical terms & Named Entities...",
    "Formulating questions & generating domain distractors...",
    "Validating options uniqueness & semantic grounding..."
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="spinner-orbit">
          <div className="orbit-core">
            <Cpu className="spin-icon" size={32} />
          </div>
        </div>

        <h3 className="loading-title">NLP Engine In Progress</h3>
        <p className="loading-sub">{message}</p>

        <div className="steps-container">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={idx}
                className={`step-row ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="step-bullet">
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <span className="bullet-dot" />
                  )}
                </div>
                <span className="step-text">{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
