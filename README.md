# Sepsis-detect-project_Web-service

패혈증 및 원내 사망 위험 예측 웹서비스 저장소입니다.
프론트엔드(React/Vite)와 백엔드(Flask) 연동을 포함합니다.

## 저장소 범위
- `src/`: React + Vite 프론트엔드
- `backend/app.py`: Flask 추론 API
- `backend/modeling_sepsis_최종.pkl`, `backend/modeling_death_최종.pkl`: 학습 모델
- `modeling/`: 보조 모델링 스크립트
- `guidelines/`: 가이드 문서

## 기술 스택
- 프론트엔드: React, Vite
- 백엔드: Flask, scikit-learn, LightGBM

## 로컬 실행
터미널 2개를 사용합니다.

1) 백엔드 실행
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
백엔드 주소: `http://127.0.0.1:5000`

2) 프론트엔드 실행
```bash
npm install
npm run dev
```
프론트엔드가 `http://127.0.0.1:5000/predict`를 호출합니다.

## API
- `POST /predict`
- 요청 본문
```json
{ "values": [ ... ] }
```
- 응답 필드
  - `prediction`, `probability`
  - `death_prediction`, `death_probability`
  - `feature_importance`

## 참고
- 백엔드를 먼저 실행한 뒤 프론트엔드를 실행하세요.
- 모델 파일이 없으면 Git LFS 설정 후 `git lfs pull`을 수행하세요.
