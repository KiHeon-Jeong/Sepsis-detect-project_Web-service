import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { PredictionResult } from '@/app/App';
import { predictAPI } from '@/app/api/predict';
import manualImage from '@/assets/provider-computer-entry-order.webp';

interface ManualImportScreenProps {
  onPredict: (result: PredictionResult) => void;
  onBackToLobby: () => void;
  initialData?: {
    subjectId: string;
    hadmId: string;
    age: string;
    gender: 'M' | 'F' | '';
    fields: Record<string, number>;
  } | null;
}

interface FieldData {
  [key: string]: number | string;
}

export function ManualImportScreen({ onPredict, onBackToLobby, initialData }: ManualImportScreenProps) {
  // Category toggles
  const [vitalSignsEnabled, setVitalSignsEnabled] = useState(false);
  const [labResultsEnabled, setLabResultsEnabled] = useState(false);

  // Patient basic info
  const [subjectId, setSubjectId] = useState('');
  const [hadmId, setHadmId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // Field data
  const [fieldData, setFieldData] = useState<FieldData>({});

  const handleFieldChange = (field: string, value: number) => {
    setFieldData((prev) => ({ ...prev, [field]: value }));
  };

  const incrementField = (field: string) => {
    const currentValue = (fieldData[field] as number) || 0;
    handleFieldChange(field, currentValue + 1);
  };

  const decrementField = (field: string) => {
    const currentValue = (fieldData[field] as number) || 0;
    handleFieldChange(field, Math.max(0, currentValue - 1));
  };

  const getFieldValue = (field: string) => fieldData[field] ?? '-';

  useEffect(() => {
    if (!initialData) return;
    setSubjectId(initialData.subjectId);
    setHadmId(initialData.hadmId);
    setAge(initialData.age);
    setGender(initialData.gender);
    setFieldData(initialData.fields);
    setVitalSignsEnabled(true);
    setLabResultsEnabled(true);
  }, [initialData]);

  // ============================================================
  // ? 이 부분이 최종 수정된 "실제 모델 연동" handlePredict입니다.
  // ============================================================
  const handlePredict = async () => {
    const sbpValue = getFieldValue('SBP');
    const dbpValue = getFieldValue('DBP');
    const bloodPressure =
      sbpValue === '-' && dbpValue === '-' ? '-' : `${sbpValue === '-' ? '-' : sbpValue}/${dbpValue === '-' ? '-' : dbpValue}`;

    const inputSummary = {
      subjectId,
      hadmId,
      age,
      gender,
      measurements: [
        { label: 'Heart Rate', value: getFieldValue('HEART_RATE'), unit: 'bpm' },
        { label: 'WBC', value: getFieldValue('WBC'), unit: 'K/μL' },
        { label: 'Temperature', value: getFieldValue('TEMP'), unit: '°C' },
        { label: 'Lactate', value: getFieldValue('LACTATE'), unit: 'mmol/L' },
        { label: 'Blood Pressure', value: bloodPressure, unit: 'mmHg' },
        { label: 'Respiratory Rate', value: getFieldValue('RESP_RATE'), unit: '/min' },
        { label: 'Creatinine', value: getFieldValue('CREATININE'), unit: 'mg/dL' },
        { label: 'Platelets', value: getFieldValue('PLATELET'), unit: 'K/μL' },
        { label: 'Sodium', value: getFieldValue('SODIUM'), unit: 'mEq/L' },
        { label: 'BUN', value: getFieldValue('BUN'), unit: 'mg/dL' }
      ]
    };

    // 1) 모든 입력값을 모델이 요구하는 순서대로 배열로 변환
    const allValues = [];

    // 환자 정보 먼저 포함
    allValues.push(
      Number(subjectId) || 0,
      Number(hadmId) || 0,
      Number(age) || 0,
      gender === 'M' ? 1 : gender === 'F' ? 0 : 0
    );

    // vital signs / blood tests / urine tests → 선택된 항목만 데이터 포함
    const orderedKeys = [
      'HEART_RATE',
      'SBP',
      'DBP',
      'MAP',
      'RESP_RATE',
      'TEMP',
      'SPO2',
      'WBC',
      'HB',
      'PLATELET',
      'CREATININE',
      'BUN',
      'SODIUM',
      'POTASSIUM',
      'CHLORIDE',
      'BICARBONATE',
      'GLUCOSE_LAB',
      'LACTATE',
      'CALCIUM',
      'BILIRUBIN',
      'ALBUMIN',
      'INR',
      'PT',
      'PTT',
      'ANION_GAP_APPROX',
      'BUN_CR_RATIO',
      'URINE_SPEC_GRAVITY'
    ];

    orderedKeys.forEach((key) => {
      const value = Number(fieldData[key]) || 0;
      allValues.push(value);
    });

    // 2) API 요청
    const response = await predictAPI(allValues);

    // 3) 응답을 PredictionResult 구조로 변환
    const riskValue = response.probability ?? response.prediction ?? 0;
    const deathValue = response.death_probability ?? response.deathPrediction ?? response.deathProbability ?? null;
    const result: PredictionResult = {
      sepsisRisk: Math.round(Number(riskValue) * 100),
      deathRisk: deathValue !== null && deathValue !== undefined ? Math.round(Number(deathValue) * 100) : undefined,
      featureImportance: response.feature_importance ?? response.featureImportance ?? [],
      inputSummary
    };

    // 4) 결과 전달 (App.tsx에서 라우팅 처리)
    onPredict(result);
  };
  // ============================================================

  const vitalSignsFields = [
    { name: 'HEART_RATE', label: 'Heart Rate', unit: 'bpm' },
    { name: 'SBP', label: 'Systolic BP', unit: 'mmHg' },
    { name: 'DBP', label: 'Diastolic BP', unit: 'mmHg' },
    { name: 'MAP', label: 'Mean Arterial Pressure', unit: 'mmHg' },
    { name: 'RESP_RATE', label: 'Respiratory Rate', unit: '/min' },
    { name: 'TEMP', label: 'Temperature', unit: '°C' },
    { name: 'SPO2', label: 'SpO2', unit: '%' }
  ];

  const bloodTestFields = [
    { name: 'WBC', label: 'White Blood Cell', unit: 'K/μL' },
    { name: 'HB', label: 'Hemoglobin', unit: 'g/dL' },
    { name: 'PLATELET', label: 'Platelet', unit: 'K/μL' },
    { name: 'CREATININE', label: 'Creatinine', unit: 'mg/dL' },
    { name: 'BUN', label: 'Blood Urea Nitrogen', unit: 'mg/dL' },
    { name: 'SODIUM', label: 'Sodium', unit: 'mEq/L' },
    { name: 'POTASSIUM', label: 'Potassium', unit: 'mEq/L' },
    { name: 'CHLORIDE', label: 'Chloride', unit: 'mEq/L' },
    { name: 'BICARBONATE', label: 'Bicarbonate', unit: 'mEq/L' },
    { name: 'GLUCOSE_LAB', label: 'Glucose', unit: 'mg/dL' },
    { name: 'LACTATE', label: 'Lactate', unit: 'mmol/L' },
    { name: 'CALCIUM', label: 'Calcium', unit: 'mg/dL' },
    { name: 'BILIRUBIN', label: 'Bilirubin', unit: 'mg/dL' },
    { name: 'ALBUMIN', label: 'Albumin', unit: 'g/dL' },
    { name: 'INR', label: 'INR', unit: '' },
    { name: 'PT', label: 'PT', unit: 'sec' },
    { name: 'PTT', label: 'PTT', unit: 'sec' },
    { name: 'ANION_GAP_APPROX', label: 'Anion Gap', unit: 'mEq/L' },
    { name: 'BUN_CR_RATIO', label: 'BUN/Cr Ratio', unit: '' }
  ];

  const urineTestFields = [{ name: 'URINE_SPEC_GRAVITY', label: 'Specific Gravity', unit: '' }];

  const renderField = (field: { name: string; label: string; unit: string }) => (
    <div
      key={field.name}
      className="flex items-center justify-between"
      style={{
        padding: '12px 16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid rgba(0, 0, 0, 0.06)'
      }}
    >
      <label style={{ fontSize: '18px', color: '#394508', fontWeight: 500, flex: 1 }}>
        {field.label}
        {field.unit && (
          <span style={{ color: '#7C8C36', fontSize: '14px', marginLeft: '6px' }}>
            ({field.unit})
          </span>
        )}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => decrementField(field.name)}
          className="transition-all hover:bg-gray-100"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAFBF7'
          }}
        >
          <ChevronDown size={16} color="#394508" />
        </button>

        <input
          type="number"
          value={fieldData[field.name] || ''}
          onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
          style={{
            width: '80px',
            height: '32px',
            textAlign: 'center',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#394508',
            backgroundColor: '#FAFBF7'
          }}
        />

        <button
          type="button"
          onClick={() => incrementField(field.name)}
          className="transition-all hover:bg-gray-100"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAFBF7'
          }}
        >
          <ChevronUp size={16} color="#394508" />
        </button>
      </div>
    </div>
  );

  const isFormValid = subjectId && hadmId && age && gender;

  return (
    <div className="relative flex flex-col h-full overflow-auto">
      <div
        className="overflow-hidden"
        style={{
          position: 'relative',
          width: '100%',
          height: '400px',
          borderRadius: '0px',
          boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
        }}
      >
        <ImageWithFallback
          src={manualImage}
          alt="Manual data entry"
          className="w-full h-full object-cover"
        />
        <div
          style={{
            position: 'absolute',
            left: '32px',
            bottom: '24px',
            color: '#FFFFFF',
            fontSize: '70px',
            fontWeight: 800,
            textShadow: '0 6px 16px rgba(0, 0, 0, 0.35)'
          }}
        >
          Manually Import Data
        </div>
      </div>

      <div
        className="flex flex-col gap-6"
        style={{ maxWidth: '2000px', width: '100%', margin: '28px 0 0 24px' }}
      >
        <p style={{ color: '#676767' }}>
          ※ 환자의 기본 정보와 의료 데이터를 직접 입력해주세요.
        </p>

        <div className="flex flex-wrap gap-6" style={{ alignItems: 'stretch' }}>
          <div className="flex flex-col gap-6" style={{ flex: '0 1 620px', minWidth: '420px' }}>
            <section
              style={{
                backgroundColor: '#FFFFFF',
                padding: '28px',
                borderRadius: '16px',
                boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
              }}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#394508', marginBottom: '16px' }}>
                환자 기본 정보
              </h3>

              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div>
                  <label style={{ fontSize: '16px', fontWeight: 700, color: '#394508' }}>SUBJECT_ID</label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    placeholder="환자 고유 ID"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '16px', fontWeight: 700, color: '#394508' }}>HADM_ID</label>
                  <input
                    type="text"
                    value={hadmId}
                    onChange={(e) => setHadmId(e.target.value)}
                    placeholder="입원 ID"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '16px', fontWeight: 700, color: '#394508' }}>AGE</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="나이"
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '16px', fontWeight: 700, color: '#394508' }}>GENDER</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      backgroundColor: '#FAFBF7'
                    }}
                  >
                    <option value="">성별 선택</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          <div style={{ flex: '1 1 720px', minWidth: '520px' }}>
            <section
              style={{
                backgroundColor: '#FFFFFF',
                padding: '28px',
                borderRadius: '16px',
                boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
              }}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#394508', marginBottom: '16px' }}>
                Measurements
              </h3>

              <section
                style={{
                  backgroundColor: '#F7F8F0',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  marginBottom: '20px'
                }}
              >
                <label className="flex items-center gap-3" style={{ fontWeight: 700, color: '#394508' }}>
                  <input
                    type="checkbox"
                    checked={vitalSignsEnabled}
                    onChange={() => setVitalSignsEnabled(!vitalSignsEnabled)}
                  />
                  활력 징후 (Vital Signs)
                </label>

                {vitalSignsEnabled && (
                  <div
                    className="grid gap-3"
                    style={{ marginTop: '16px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                  >
                    {vitalSignsFields.map(renderField)}
                  </div>
                )}
              </section>

              <section
                style={{
                  backgroundColor: '#F7F8F0',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.04)'
                }}
              >
                <label className="flex items-center gap-3" style={{ fontWeight: 700, color: '#394508' }}>
                  <input
                    type="checkbox"
                    checked={labResultsEnabled}
                    onChange={() => setLabResultsEnabled(!labResultsEnabled)}
                  />
                  Lab Results
                </label>

                {labResultsEnabled && (
                  <div
                    className="grid gap-3"
                    style={{ marginTop: '16px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                  >
                    {bloodTestFields.map(renderField)}
                    {urineTestFields.map(renderField)}
                  </div>
                )}
              </section>
            </section>
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={!isFormValid}
          className="transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#394508',
            color: '#FFFFFF',
            height: '52px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '18px',
            boxShadow: '0 2px 8px rgba(57, 69, 8, 0.12)',
            marginTop: '16px',
            marginBottom: '80px',
            width: '100%'
          }}
        >
          Predict
        </button>
      </div>

      <button
        onClick={onBackToLobby}
        className="fixed flex items-center gap-2 transition-all hover:opacity-80"
        style={{
          bottom: '32px',
          right: '32px',
          backgroundColor: '#FFFFFF',
          color: '#394508',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '14px',
          border: '1px solid rgba(57, 69, 8, 0.2)',
          boxShadow: '0 2px 12px rgba(57, 69, 8, 0.15)'
        }}
      >
        <ArrowLeft size={18} />
        Lobby로 돌아가기
      </button>
    </div>
  );
}
