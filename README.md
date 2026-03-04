# Sepsis-detect-project_Web-service

패혈증 및 사망 위험 예측 웹서비스 저장소입니다.

## 개요
프론트엔드(React/Vite)와 백엔드(Flask)를 연동하여 예측 API 기반 서비스를 제공합니다.

## 디렉터리
- `src/`: 프론트엔드 UI/로직
- `backend/`: 예측 API 서버 및 모델 파일
- `guidelines/`: 서비스 가이드 문서
- `modeling/`: 보조 모델링 스크립트

## 실행 방법
1. 백엔드
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

2. 프론트엔드
```bash
npm install
npm run dev
```

연동 API: `http://127.0.0.1:5000/predict`

## 비고
백엔드 먼저 실행 후 프론트엔드를 실행하세요.
