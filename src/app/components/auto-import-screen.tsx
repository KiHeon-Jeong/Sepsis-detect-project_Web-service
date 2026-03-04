import { useState, useRef } from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import type { PredictionResult } from '@/app/App';
import ecgImage from '@/assets/ECG.webp';
import { predictAPI } from '@/app/api/predict';

interface AutoImportScreenProps {
  onPredict: (result: PredictionResult) => void;
  onBackToLobby: () => void;
}

export function AutoImportScreen({ onPredict, onBackToLobby }: AutoImportScreenProps) {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [csvRecord, setCsvRecord] = useState<Record<string, string> | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const labResultKeys = [
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
  const labSplitIndex = Math.ceil(labResultKeys.length / 2);
  const labColumns = [labResultKeys.slice(0, labSplitIndex), labResultKeys.slice(labSplitIndex)];
  
  // Patient basic info
  const [subjectId, setSubjectId] = useState('');
  const [hadmId, setHadmId] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const csvFieldKeys = [
    'SUBJECT_ID',
    'HADM_ID',
    'AGE',
    'AGE_AT_ADMISSION',
    'GENDER',
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

  const normalizeHeader = (header: string) =>
    header.trim().toUpperCase().replace(/\s+/g, '_');

  const parseCsv = (text: string) => {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && (char === ',' || char === '\n')) {
        row.push(current.trim());
        current = '';
        if (char === '\n') {
          rows.push(row);
          row = [];
        }
        continue;
      }
      if (char === '\r') continue;
      current += char;
    }
    if (current.length || row.length) {
      row.push(current.trim());
      rows.push(row);
    }
    return rows.filter((r) => r.some((cell) => cell.length > 0));
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type === 'text/csv') {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const rows = parseCsv(text);
          if (rows.length === 0) {
            setCsvPreview(null);
            setCsvRecord(null);
            setCsvError('CSV 데이터가 비어 있습니다.');
            return;
          }
          const headers = rows[0];
          const previewRows = rows.slice(1, 6);
          setCsvPreview({ headers, rows: previewRows });
          const firstRow = rows[1] || [];
          const record: Record<string, string> = {};
          headers.forEach((header, index) => {
            record[normalizeHeader(header)] = firstRow[index] ?? '';
          });
          const normalizedRecord: Record<string, string> = {};
          csvFieldKeys.forEach((key) => {
            normalizedRecord[key] = record[key] ?? '';
          });
          const genderValue = normalizedRecord.GENDER.trim();
          if (!normalizedRecord.AGE && normalizedRecord.AGE_AT_ADMISSION) {
            normalizedRecord.AGE = normalizedRecord.AGE_AT_ADMISSION;
          }
          setSubjectId(normalizedRecord.SUBJECT_ID || '');
          setHadmId(normalizedRecord.HADM_ID || '');
          setAge(normalizedRecord.AGE || '');
          setGender(genderValue === '1' ? 'M' : genderValue === '0' ? 'F' : '');
          setCsvRecord(normalizedRecord);
          setCsvError(null);
        } catch (error) {
          setCsvPreview(null);
          setCsvRecord(null);
          setCsvError('CSV 파싱에 실패했습니다.');
        }
      };
      reader.onerror = () => {
        setCsvPreview(null);
        setCsvRecord(null);
        setCsvError('CSV 파일을 읽을 수 없습니다.');
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handlePredict = async () => {
    if (!csvRecord) return;

    const genderValue = gender === 'M' ? 1 : gender === 'F' ? 0 : 0;
    const values = [
      Number(subjectId) || 0,
      Number(hadmId) || 0,
      Number(age) || 0,
      genderValue,
      ...orderedKeys.map((key) => Number(csvRecord[key]) || 0)
    ];
    const sbpValue = csvRecord?.SBP || '-';
    const dbpValue = csvRecord?.DBP || '-';

    const inputSummary = {
      subjectId,
      hadmId,
      age,
      gender,
      measurements: [
        { label: 'Heart Rate', value: csvRecord?.HEART_RATE || '-', unit: 'bpm' },
        { label: 'WBC', value: csvRecord?.WBC || '-', unit: 'K/uL' },
        { label: 'Temperature', value: csvRecord?.TEMP || '-', unit: 'C' },
        { label: 'Lactate', value: csvRecord?.LACTATE || '-', unit: 'mmol/L' },
        { label: 'Blood Pressure', value: `${sbpValue} / ${dbpValue}`, unit: 'mmHg' },
        { label: 'Respiratory Rate', value: csvRecord?.RESP_RATE || '-', unit: '/min' },
        { label: 'Creatinine', value: csvRecord?.CREATININE || '-', unit: 'mg/dL' },
        { label: 'Platelets', value: csvRecord?.PLATELET || '-', unit: 'K/uL' },
        { label: 'Sodium', value: csvRecord?.SODIUM || '-', unit: 'mEq/L' },
        { label: 'BUN', value: csvRecord?.BUN || '-', unit: 'mg/dL' }
      ]
    };
    
    const response = await predictAPI(values);
    const riskValue = response.probability ?? response.prediction ?? 0;
    const deathValue = response.death_probability ?? response.deathPrediction ?? response.deathProbability ?? null;
    const result: PredictionResult = {
      sepsisRisk: Math.round(Number(riskValue) * 100),
      deathRisk: deathValue !== null && deathValue !== undefined ? Math.round(Number(deathValue) * 100) : undefined,
      featureImportance: response.feature_importance ?? response.featureImportance ?? [],
      inputSummary
    };
    onPredict(result);
  };
  const isFormValid = subjectId && hadmId && age && gender && fileName && csvRecord;


  return (
    <div 
      className="relative flex flex-col h-full"
      style={{ padding: '0px' }}
    >
      {/* Header Image */}
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
          src={ecgImage}
          alt="Medical Data Analysis"
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
          Automatically Import Data
        </div>
      </div>

      <div
        className="flex flex-col gap-6"
        style={{ maxWidth: '2000px', width: '100%', margin: '28px 0 0 24px' }}
      >

        {/* Description */}
        <p style={{ color: '#676767' }}>
          ※ 환자 기본 정보를 입력하고 CSV 파일을 업로드하여 자동으로 데이터를 불러옵니다.
        </p>

        <div className="flex flex-wrap gap-6" style={{ alignItems: 'stretch' }}>
          <div className="flex flex-col gap-6" style={{ flex: '0 1 520px' }}>
            {/* CSV Upload Card */}
            <div 
              className="flex flex-col items-center gap-6"
              style={{
                backgroundColor: '#F6F7F0',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
              }}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#394508', alignSelf: 'flex-start' }}>
                CSV 파일 업로드
              </h3>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${isDragging ? '#394508' : '#C3E472'}`,
                  borderRadius: '16px',
                  height: '140px',
                  backgroundColor: isDragging ? '#EAF7D2' : 'transparent'
                }}
              >
                <Upload size={48} color="#899939" />
                <p style={{ color: '#899939', fontSize: '18px' }}>
                  여기에 CSV 파일을 끌어다 놓으세요
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* File Name Display */}
              {fileName && (
                <p style={{ color: '#898989', fontSize: '20px' }}>
                  📄 {fileName}
                </p>
              )}

              {/* Button */}
              <button
                onClick={fileName ? handlePredict : () => fileInputRef.current?.click()}
                disabled={!isFormValid}
                className="transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: fileName && isFormValid ? '#C3E472' : '#394508',
                  color: fileName && isFormValid ? '#394508' : '#FFFFFF',
                  padding: '14px 48px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '23px',
                  boxShadow: '0 2px 8px rgba(57, 69, 8, 0.12)',
                  marginTop: '8px'
                }}
              >
                {fileName ? 'Predict' : 'Import'}
              </button>
            </div>
{/* Patient Basic Information Card */}
            <div 
              style={{
                backgroundColor: '#FFFFFF',
                padding: '32px',
                borderRadius: '16px',
                boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
              }}
            >
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#394508', marginBottom: '20px' }}>
                • 환자 기본 정보
              </h3>
              
              {/* 2x2 Grid for patient info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '16px', color: '#394508', fontWeight: 700 }}>
                    SUBJECT_ID
                  </label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    placeholder="환자 고유 ID"
                    style={{
                      padding: '12px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '8px',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '16px', color: '#394508', fontWeight: 700 }}>
                    HADM_ID
                  </label>
                  <input
                    type="text"
                    value={hadmId}
                    onChange={(e) => setHadmId(e.target.value)}
                    placeholder="입원 ID"
                    style={{
                      padding: '12px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '8px',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '16px', color: '#394508', fontWeight: 700 }}>
                    AGE
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="나이"
                    style={{
                      padding: '12px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '8px',
                      backgroundColor: '#FAFBF7'
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: '16px', color: '#394508', fontWeight: 700 }}>
                    GENDER
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: '8px',
                      backgroundColor: '#FAFBF7',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">성별 선택</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* CSV Data Preview */}
          <div
            style={{
              flex: '0 0 auto',
              width: csvRecord ? 'fit-content' : '520px',
              maxWidth: '100%',
              backgroundColor: '#FFFFFF',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 2px 16px rgba(57, 69, 8, 0.08)'
            }}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#394508', marginBottom: '16px' }}>
              CSV 데이터 미리보기
            </h3>
            <div style={{ color: '#6F6F6F', fontSize: '16px', marginBottom: '12px' }}>
              {fileName ? `업로드된 파일: ${fileName}` : 'CSV 파일을 업로드하면 데이터가 표시됩니다.'}
            </div>
            <div
              style={{
                borderRadius: '12px',
                border: '1px solid #E3E9CF',
                padding: '16px',
                backgroundColor: '#FAFBF7',
                minHeight: '220px',
                maxWidth: '850px'
              }}
            >
              {csvError && <div style={{ color: '#B34D4D', fontSize: '13px' }}>{csvError}</div>}
              {!csvError && !csvRecord && (
                <div style={{ color: '#9AA07A', fontSize: '13px' }}>
                  CSV 파일을 업로드하면 데이터 요약이 표시됩니다.
                </div>
              )}
              {csvRecord && (
                <div
                  className="grid gap-12"
                  style={{ gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr) minmax(420px, 2.8fr)' }}
                >
                  <div className="flex flex-col gap-12">
                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E3E9CF',
                        padding: '16px 18px'
                      }}
                    >
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#394508', marginBottom: '8px' }}>
                        환자 기본 정보
                      </div>
                      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        {['SUBJECT_ID', 'HADM_ID', 'AGE', 'GENDER'].map((key) => (
                          <div key={key} style={{ fontSize: '16px' }}>
                            <div style={{ color: '#6F6F6F', fontWeight: 600 }}>{key}</div>
                            <div style={{ color: '#394508', fontWeight: 700 }}>
                              {csvRecord[key] || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E3E9CF',
                        padding: '16px 18px'
                      }}
                    >
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#394508', marginBottom: '8px' }}>
                        Vital Signs
                      </div>
                      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        {['HEART_RATE', 'SBP', 'DBP', 'MAP', 'RESP_RATE', 'TEMP', 'SPO2'].map((key) => (
                          <div key={key} style={{ fontSize: '16px' }}>
                            <div style={{ color: '#6F6F6F', fontWeight: 600 }}>{key}</div>
                            <div style={{ color: '#394508', fontWeight: 700 }}>
                              {csvRecord[key] || '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E3E9CF',
                      padding: '16px 18px',
                      minWidth: '500px'
                    }}
                  >
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#394508', marginBottom: '8px' }}>
                      Lab Results
                    </div>
                    <div className="grid gap-10" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                      {labColumns.map((column, columnIndex) => (
                        <div key={`lab-col-${columnIndex}`} className="flex flex-col gap-6">
                          {column.map((key) => (
                            <div key={key} style={{ fontSize: '16px' }}>
                              <div style={{ color: '#6F6F6F', fontWeight: 600 }}>{key}</div>
                              <div style={{ color: '#394508', fontWeight: 700 }}>
                                {csvRecord[key] || '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Lobby Button - Fixed Bottom Right */}
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
