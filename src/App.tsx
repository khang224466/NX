import React, { useState, useEffect } from 'react';
import { UNIROOTPlatform } from './components/UNIROOTPlatform';
import { AICareerCopilot } from './components/AICareerCopilot';
import { DataIntegrityModal } from './components/DataIntegrityModal';
import { CompileIntroPreloader } from './components/CompileIntroPreloader';
import { getStoredApiKey, getStoredGroqKey, checkServerAIStatus } from './services/geminiService';
import { UserJourneyProvider } from './context/UserJourneyContext';
import { ThemeProvider } from './context/ThemeContext';
import { SmoothScroll } from './components/SmoothScroll';
import { ContourTerrainCanvas } from './components/ContourTerrainCanvas';
import { RealtimeBrowserTestRunner } from './components/RealtimeBrowserTestRunner';

export default function App() {
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [aiCopilotQuery, setAiCopilotQuery] = useState('');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [forceShowIntro, setForceShowIntro] = useState(false);

  useEffect(() => {
    const key = getStoredApiKey() || getStoredGroqKey();
    if (key) {
      setHasApiKey(true);
    } else {
      checkServerAIStatus().then(st => setHasApiKey(st.hasServerKey));
    }
  }, [isAICopilotOpen]);

  const handleOpenAIConsult = (query?: string) => {
    setAiCopilotQuery(query || '');
    setIsAICopilotOpen(true);
  };

  return (
    <ThemeProvider>
      <UserJourneyProvider>
        <SmoothScroll>
          <div className="min-h-screen bg-[#07080B] text-[#EAEAE3] flex flex-col relative selection:bg-[#C6F135] selection:text-[#0C0D0E]">
            {/* Hardware-accelerated GPU Backdrop Layer (Pier Gorelli Dot & Linear Grid) - Live HMR Active */}
            <div className="blueprint-fixed-backdrop" aria-hidden="true" />

            {/* Authentic Pier Gorelli Topographic Contour Elevation Canvas (Full Page Fixed Background) */}
            <ContourTerrainCanvas isFullPage={true} />

            {/* Pier Gorelli Compile Intro Preloader */}
            <CompileIntroPreloader 
              forceShow={forceShowIntro} 
              onComplete={() => setForceShowIntro(false)} 
            />

            {/* Primary Platform Engine: UNIROOT (Technical Blueprint Design) */}
            <div className="relative z-10 flex-1 flex flex-col">
              <UNIROOTPlatform 
                onOpenAIChat={handleOpenAIConsult}
                onOpenDataModal={() => setIsDataModalOpen(true)}
                onTriggerIntro={() => setForceShowIntro(true)}
                onOpenTestRunner={() => setIsTestRunnerOpen(true)}
              />
            </div>

            {/* Global AI Copilot Modal */}
            <AICareerCopilot
              isOpen={isAICopilotOpen}
              onClose={() => setIsAICopilotOpen(false)}
              initialQuery={aiCopilotQuery}
            />

            {/* Data Integrity Principles Modal */}
            <DataIntegrityModal
              isOpen={isDataModalOpen}
              onClose={() => setIsDataModalOpen(false)}
            />

            {/* Continuous Real-Time In-Browser Test Runner */}
            <RealtimeBrowserTestRunner 
              isOpen={isTestRunnerOpen}
              onOpenChange={setIsTestRunnerOpen}
            />
          </div>
        </SmoothScroll>
      </UserJourneyProvider>
    </ThemeProvider>
  );
}
