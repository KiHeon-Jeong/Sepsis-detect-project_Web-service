import { useState } from 'react';
import { Sidebar } from '@/app/components/sidebar';
import { StartScreen } from '@/app/components/start-screen';
import { AutoImportScreen } from '@/app/components/auto-import-screen';
import { ManualImportScreen } from '@/app/components/manual-import-screen';
import { ResultScreen } from '@/app/components/result-screen';

export type Screen = 'start' | 'auto-import' | 'manual-import' | 'result';

export interface PredictionResult {
  sepsisRisk: number;
  deathRisk?: number;
  featureImportance: {
    name: string;
    value: number;
  }[];
  inputSummary?: {
    subjectId: string;
    hadmId: string;
    age: string;
    gender: string;
    measurements: {
      label: string;
      value: number | string;
      unit?: string;
    }[];
  };
}

interface ManualSeedData {
  subjectId: string;
  hadmId: string;
  age: string;
  gender: 'M' | 'F' | '';
  fields: Record<string, number>;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [manualSeed, setManualSeed] = useState<ManualSeedData | null>(null);

  const handleAutoImport = () => {
    setCurrentScreen('auto-import');
  };

  const handleManualImport = () => {
    setManualSeed(null);
    setCurrentScreen('manual-import');
  };

  const handleDemoFill = () => {
    setManualSeed({
      subjectId: '19896110',
      hadmId: '24933120',
      age: '61',
      gender: 'M',
      fields: {
        WBC: 6.7,
        HB: 15.5,
        PLATELET: 212,
        CREATININE: 1,
        BUN: 15,
        SODIUM: 141,
        POTASSIUM: 3.7,
        CHLORIDE: 103,
        BICARBONATE: 217,
        GLUCOSE_LAB: 92,
        ANION_GAP_APPROX: 11,
        BUN_CR_RATIO: 12,
        LACTATE: 1.272651477,
        CALCIUM: 8.934270341,
        BILIRUBIN: 0.743513164,
        INR: 1.426319298,
        PT: 15.55785383,
        PTT: 36.40529336,
        URINE_SPEC_GRAVITY: 1.007,
        ALBUMIN: 4.000092269,
        HEART_RATE: 90,
        SBP: 120.5,
        DBP: 67,
        MAP: 80,
        RESP_RATE: 19,
        TEMP: 36,
        SPO2: 98
      }
    });
    setCurrentScreen('manual-import');
  };

  const handlePredict = (result: PredictionResult) => {
    setPredictionResult(result);
    setCurrentScreen('result');
  };

  const handleReset = () => {
    setCurrentScreen('start');
    setPredictionResult(null);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar - Fixed 400px */}
      <Sidebar 
        onAutoImport={handleAutoImport}
        onManualImport={handleManualImport}
        onDemoFill={handleDemoFill}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: '#FAFBF7' }}>
        {currentScreen === 'start' && <StartScreen />}
        {currentScreen === 'auto-import' && <AutoImportScreen onPredict={handlePredict} onBackToLobby={handleReset} />}
        {currentScreen === 'manual-import' && (
          <ManualImportScreen
            onPredict={handlePredict}
            onBackToLobby={handleReset}
            initialData={manualSeed}
          />
        )}
        {currentScreen === 'result' && predictionResult && (
          <ResultScreen result={predictionResult} onBackToLobby={handleReset} />
        )}
      </main>
    </div>
  );
}
