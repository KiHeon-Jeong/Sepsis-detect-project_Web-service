# MIMIC Web-service Module (Frontend/Backend Integration)

## 1) 개요
본 구현 코드는 프로젝트 MIMIC 서비스 파트입니다.  
패혈증 및 사망 위험 예측 모델을 Flask API로 제공하고, React 기반 프론트엔드와 연동하여 사용자 입력값에 대한 결과를 제공합니다.

## 2) 파일 구성
1. `backend/app.py`  
   예측 API 서버 엔트리포인트
2. `backend/modeling_sepsis_최종.pkl`  
   패혈증 예측 모델
3. `backend/modeling_death_최종.pkl`  
   사망 예측 모델
4. `backend/requirements.txt`  
   백엔드 의존성
5. `src/`  
   프론트엔드(React/Vite) UI 및 API 연동 코드
6. `src/app/api/predict.ts`  
   `/predict` 호출 로직
7. `guidelines/`  
   서비스 운영/사용 가이드

## 3) 서비스 파이프라인 요약
- 프론트엔드에서 환자 변수 입력
- 백엔드 `/predict` API 호출
- 패혈증 예측 + 사망 예측 동시 수행
- 확률/피처 중요도 포함 결과 반환
- 결과 화면 시각화 및 안내 제공

## 4) 실행 메모
- 백엔드:
  ```bash
  cd backend
  pip install -r requirements.txt
  python app.py
  ```
  기본 주소: `http://127.0.0.1:5000`
- 프론트엔드:
  ```bash
  npm install
  npm run dev
  ```
- 연동 API: `http://127.0.0.1:5000/predict`

## 5) 수행 내용
- 모델 추론 API 구현 및 CORS 연동
- 수동/자동 입력 기반 예측 플로우 구현
- 결과(예측값/확률/중요 피처) 시각화 구성

## 6) 기술 스택
- Frontend: React, Vite
- Backend: Flask, Python
- ML Inference: Scikit-learn / LightGBM

## 7) 참고
- EDA 및 모델 실험 노트북은 `Sepsis-detect-project` 저장소에서 관리합니다.
