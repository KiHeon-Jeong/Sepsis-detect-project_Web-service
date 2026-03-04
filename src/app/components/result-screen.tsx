import { useEffect, useState } from 'react';
import type { PredictionResult } from '@/app/App';

interface ResultScreenProps {
  result: PredictionResult;
  onBackToLobby: () => void;
}

export function ResultScreen({ result, onBackToLobby }: ResultScreenProps) {
  const risk = Math.max(0, Math.min(100, Number(result.sepsisRisk) || 0));
  const riskLabel = risk >= 70 ? 'High Risk' : risk >= 30 ? 'Medium Risk' : 'Low Risk';
  const riskColor = risk >= 70 ? '#E5483B' : risk >= 30 ? '#F2A100' : '#7C8C36';
  const riskBg = risk >= 70 ? '#FDECEC' : risk >= 30 ? '#FFF6E6' : '#EFF4DF';
  const gaugeAngle = (risk / 100) * 180 - 90;
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [displayRisk, setDisplayRisk] = useState(0);
  const deathRisk = Math.max(0, Math.min(100, Number(result.deathRisk ?? 0)));

  useEffect(() => {
    const id = window.setTimeout(() => setNeedleAngle(gaugeAngle), 120);
    return () => window.clearTimeout(id);
  }, [gaugeAngle]);

  useEffect(() => {
    let raf = 0;
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(from + (risk - from) * progress);
      setDisplayRisk(value);
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [risk]);

  const displayFeatureName = (name: string) =>
    name
      .replaceAll('_measured', '')
      .replaceAll('AGE AT ADMISSION', 'AGE')
      .replaceAll('AGE_AT_ADMISSION', 'AGE')
      .replaceAll('_', ' ')
      .trim();
  const topFeatures = result.featureImportance.slice(0, 10);
  const paddedFeatures =
    topFeatures.length < 10
      ? [
          ...topFeatures,
          ...Array.from({ length: 10 - topFeatures.length }, (_, index) => ({
            name: `Feature ${topFeatures.length + index + 1}`,
            value: 0
          }))
        ]
      : topFeatures;
  const maxFeature = Math.max(...paddedFeatures.map((f) => Number(f.value) || 0), 1);
  const [barReady, setBarReady] = useState(false);
  const summary = result.inputSummary;
  const summaryRows = [
    { label: 'SUBJECT_ID', value: summary?.subjectId ?? '-' },
    { label: 'HADM_ID', value: summary?.hadmId ?? '-' },
    { label: 'AGE', value: summary?.age ?? '-' },
    { label: 'GENDER', value: summary?.gender ?? '-' }
  ];
  const summaryMeasurements = (summary?.measurements ?? []).map((item) => ({
    label: item.label,
    value: item.value,
    unit: item.unit
  }));

  useEffect(() => {
    const id = window.setTimeout(() => setBarReady(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="h-full overflow-auto" style={{ padding: '48px' }}>
      <div style={{ maxWidth: '1500px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(57, 69, 8, 0.08)',
            padding: '42px'
          }}
        >
          <div className="flex flex-wrap gap-8" style={{ alignItems: 'stretch' }}>
            <div
              className="flex flex-col gap-8"
              style={{ flex: '0 1 380px', minWidth: '300px', minHeight: '640px' }}
            >
              <div
                style={{
                  borderRadius: '18px',
                  padding: '24px',
                  backgroundColor: '#F6F7F1',
                  border: '1px solid #E3E9CF',
                  flex: 1
                }}
              >
                <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#394508' }}>• 예측 결과</h2>
                <div style={{ fontSize: '104px', fontWeight: 800, color: '#394508', lineHeight: 1, marginTop: '8px' }}>
                  {displayRisk}%
                </div>
                <div style={{ fontSize: '18px', color: '#6F6F6F', marginTop: '8px' }}>Sepsis Risk</div>
                <div
                  style={{
                    marginTop: '14px',
                    padding: '6px 18px',
                    borderRadius: '999px',
                    backgroundColor: riskBg,
                    color: riskColor,
                    border: `1px solid ${riskColor}`,
                    fontWeight: 700,
                    fontSize: '16px',
                    display: 'inline-flex'
                  }}
                >
                  {riskLabel}
                </div>
              </div>

              <div
                style={{
                  borderRadius: '18px',
                  padding: '24px',
                  backgroundColor: '#F6F7F1',
                  border: '1px solid #E3E9CF',
                  flex: 1
                }}
              >
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#394508', marginBottom: '8px' }}>
                  • Sepsis Risk Gauge
                </div>
                <div style={{ fontSize: '18px', color: '#6F6F6F', marginBottom: '8px' }}>
                  Sepsis 발생 확률입니다.
                </div>
                <div
                  style={{
                    position: 'relative',
                    width: '280px',
                    height: '160px',
                    overflow: 'hidden',
                    margin: '30px auto 12px'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '0',
                      width: '280px',
                      height: '280px',
                      borderRadius: '50%',
                      background:
                        'conic-gradient(from 180deg, #7FB13B 0deg, #7FB13B 100deg, #F2A100 150deg, #E5483B 180deg, #E5483B 360deg)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '16px',
                      width: '248px',
                      height: '248px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '0',
                      width: '4px',
                      height: '88px',
                      backgroundColor: '#2F2F2F',
                      borderRadius: '2px',
                      transform: `translateX(-50%) rotate(${needleAngle}deg)`,
                      transformOrigin: 'bottom center',
                      transition: 'transform 900ms ease-out'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: '-2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#2F2F2F',
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>
                <div
                  className="flex justify-between"
                  style={{ marginTop: '8px', fontSize: '13px', width: '289px' }}
                >
                  <span style={{ color: '#7FB13B', fontWeight: 700 }}>GOOD</span>
                  <span style={{ color: '#E5483B', fontWeight: 700 }}>RISK</span>
                </div>
              </div>
            </div>

            <div
              style={{
                flex: '0 1 340px',
                minWidth: '300px',
                minHeight: '640px',
                borderRadius: '18px',
                padding: '24px',
                backgroundColor: '#F6F7F1',
                border: '1px solid #E3E9CF'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#394508', marginBottom: '16px' }}>
                Input Summary
              </h3>

              <div style={{ borderTop: '1px solid #E3E9CF', paddingTop: '12px', marginBottom: '18px' }}>
                {summaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                    style={{ padding: '6px 0', fontSize: '16px' }}
                  >
                    <span style={{ color: '#6F6F6F', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: '#394508', fontWeight: 700 }}>{row.value || '-'}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #E3E9CF', paddingTop: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#394508', marginBottom: '8px' }}>
                  Measurements
                </div>
                <div className="flex flex-col gap-6" style={{ fontSize: '16px' }}>
                  {summaryMeasurements.length === 0 && (
                    <div style={{ color: '#6F6F6F' }}>No measurement data.</div>
                  )}
                  {summaryMeasurements.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex items-center justify-between">
                      <span style={{ color: '#6F6F6F', fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: '#394508', fontWeight: 700 }}>
                        {item.value || item.value === 0 ? item.value : '-'}
                        {item.unit ? ` ${item.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                flex: '1 1 560px',
                minWidth: '480px',
                minHeight: '640px',
                borderRadius: '18px',
                padding: '24px',
                backgroundColor: '#F6F7F1',
                border: '1px solid #E3E9CF'
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#394508', marginBottom: '16px' }}>
                Top 10 Feature Importance
              </h3>

              <div className="flex flex-col gap-10">
                {paddedFeatures.map((f, index) => (
                  <div key={index} className="flex items-center gap-10">
                    <div style={{ width: '180px', fontSize: '18px', fontWeight: 700, color: '#394508' }}>
                      {displayFeatureName(String(f.name))}
                    </div>
                    <div className="flex items-center gap-6" style={{ flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            height: '18px',
                            borderRadius: '8px',
                            backgroundColor: '#7C8C36',
                            width: barReady
                              ? `${Math.max(10, (Number(f.value) / maxFeature) * 100)}%`
                              : '0%',
                            transition: 'width 900ms ease-out'
                          }}
                        />
                      </div>
                      <div
                        style={{
                          minWidth: '62px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#7C8C36',
                          fontSize: '14px'
                        }}
                      >
                        {Number(f.value).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              backgroundColor: '#F6F7F1',
              borderRadius: '14px',
              padding: '16px 18px',
              border: '1px solid #E3E9CF'
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: '#394508', fontSize: '16px' }}>사망 위험도</span>
              <span style={{ fontWeight: 700, color: '#394508', fontSize: '16px' }}>{deathRisk}%</span>
            </div>
            <div
              style={{
                height: '16px',
                borderRadius: '999px',
                backgroundColor: '#EAF1CF',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${deathRisk}%`,
                  background: 'linear-gradient(90deg, #7FB13B 0%, #F2A100 55%, #E5483B 100%)',
                  transition: 'width 900ms ease-out'
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '28px',
              backgroundColor: '#EAF7C8',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#394508',
              fontSize: '14px'
            }}
          >
            <strong style={{ marginRight: '8px' }}>주의사항</strong>
            이 결과는 예측값에 기반합니다. 전문의 해석이 필요합니다.
          </div>

          <div className="flex justify-end" style={{ marginTop: '24px' }}>
            <div
              style={{
                backgroundColor: '#F6F7F1',
                borderRadius: '14px',
                padding: '10px',
                border: '1px solid #E3E9CF'
              }}
            >
              <button
                onClick={onBackToLobby}
                className="transition-all hover:opacity-90"
                style={{
                  width: '220px',
                  height: '52px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#BFE07C',
                  fontWeight: 700,
                  color: '#394508',
                  fontSize: '18px'
                }}
              >
                다시 입력하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
