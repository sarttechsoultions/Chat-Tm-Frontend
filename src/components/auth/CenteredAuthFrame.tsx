import React from "react";
import Image from "next/image";

export const authInputClass =
  "w-full h-[50px] px-4 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] placeholder-gray-400 focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F] transition-all bg-white";

export const authSelectClass =
  "flex-1 h-[50px] px-3 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] focus:outline-none focus:border-[#00696F] bg-white";

export const primaryButtonClass =
  "h-[50px] bg-[#00696F] text-white font-semibold rounded-[10px] hover:bg-[#005a5f] transition-colors disabled:opacity-70";

export function AuthLogo() {
  return (
    <div className="mb-6 relative w-[160px] h-[52px]">
      <Image src="/ChatTmLogo.png" alt="ChatTm Logo" fill className="object-contain" priority />
    </div>
  );
}

export function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="flex gap-4 mb-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const active = currentStep === step;
          return (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                active ? "bg-[#00696F] text-white" : "bg-[#E8EEF0] text-[#6B7280]"
              }`}
            >
              {step}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-500 font-medium">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}

export default function CenteredAuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      <div className="w-full max-w-[388px] flex flex-col items-center">{children}</div>
    </div>
  );
}
