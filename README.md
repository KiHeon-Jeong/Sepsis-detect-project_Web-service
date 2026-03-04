# Sepsis-detect-project_Web-service

Frontend/backend integrated web service for sepsis and in-hospital death risk prediction.

## Repository Scope
- `src/`: React + Vite frontend
- `backend/app.py`: Flask inference API
- `backend/modeling_sepsis_최종.pkl`, `backend/modeling_death_최종.pkl`: trained model artifacts
- `modeling/`: additional modeling script assets
- `guidelines/`: project guideline documents

## Tech Stack
- Frontend: React, Vite
- Backend: Flask, scikit-learn, LightGBM

## Local Run
Open two terminals.

1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend runs on `http://127.0.0.1:5000`.

2) Frontend
```bash
npm install
npm run dev
```
Frontend calls `http://127.0.0.1:5000/predict`.

## API
- `POST /predict`
- Request body:
```json
{ "values": [ ... ] }
```
- Response includes:
  - `prediction`, `probability`
  - `death_prediction`, `death_probability`
  - `feature_importance`

## Notes
- Start backend first, then frontend.
- If model files are missing after clone, verify Git LFS setup and pull artifacts.
