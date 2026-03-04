import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import mainImage from '@/assets/main.png';

export function StartScreen() {
  return (
    <div className="h-full w-full" style={{ padding: '28px' }}>
      <div
        className="relative w-full h-full overflow-hidden"
        style={{
          minHeight: '560px',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        <ImageWithFallback
          src={mainImage}
          alt="Emergency room"
          className="w-full h-full object-cover"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.6)'
          }}
        />
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px',
            color: '#111111',
            fontFamily: 'Cambria, \"Times New Roman\", Times, serif'
          }}
        >
          <div style={{ fontSize: '100px', fontWeight: 700, marginBottom: '5px', color: '#7A7A7A' }}>Emergency Room</div>
          <div style={{ fontSize: '100px', fontWeight: 700, marginBottom: '5px', color: '#7A7A7A' }}>
            Sepsis Prediction Model
          </div>
          <div style={{ fontSize: '140px', fontWeight: 500, marginBottom: '10px', color: '#111111' }}>
            No one will die to Sepsis
          </div>
        </div>
      </div>
    </div>
  );
}
