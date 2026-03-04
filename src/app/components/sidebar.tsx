interface SidebarProps {
  onAutoImport: () => void;
  onManualImport: () => void;
  onDemoFill: () => void;
}

export function Sidebar({ onAutoImport, onManualImport, onDemoFill }: SidebarProps) {
  return (
    <aside 
      className="flex flex-col h-full"
      style={{ 
        width: '560px',
        backgroundColor: '#394508',
        padding: '52px 44px',
        gap: '36px'
      }}
    >
      {/* App Title */}
      <div className="flex flex-col gap-2">
        <h1 
          className="text-white"
          style={{ 
            fontSize: '40px', 
            fontWeight: 700,
            lineHeight: '1.3'
          }}
        >
          Emergency Room<br />
          Sepsis Prediction Model
        </h1>
        
        {/* Subtitle */}
        <p 
          style={{ 
            color: '#C3E472',
            fontSize: '28px',
            fontWeight: 500
          }}
        >
          No one will die to Sepsis
        </p>
      </div>

      {/* Guide Text */}
      <p 
        style={{ 
          color: '#EAF7D2',
          fontSize: '21px',
          lineHeight: '1.7'
        }}
      >
        <br />• 환자 데이터를 입력하고 예측을 시작하세요.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onAutoImport}
          className="transition-all hover:opacity-90"
          style={{
            backgroundColor: '#C3E472',
            color: '#394508',
            height: '70px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '23px'
          }}
        >
          Automatically Import Data
        </button>

        <button
          onClick={onManualImport}
          className="transition-all hover:opacity-90"
          style={{
            backgroundColor: '#EAF7D2',
            color: '#394508',
            height: '70px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '23px'
          }}
        >
          Manually Import Data
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <button
        type="button"
        onClick={onDemoFill}
        className="text-center transition-all hover:opacity-80"
        style={{
          color: '#7C8C36',
          fontSize: '12px'
        }}
      >
        ⓒ 2026 ER Sepsis Predict Model by "이기조"
      </button>
    </aside>
  );
}
