from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import pickle
import pandas as pd

app = Flask(__name__)
CORS(app)

# ===========================
# 1) 모델 불러오기
# ===========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEPSIS_MODEL_PATH = os.path.join(BASE_DIR, "modeling_sepsis_최종.pkl")
DEATH_MODEL_PATH = os.path.join(BASE_DIR, "modeling_death_최종.pkl")

with open(SEPSIS_MODEL_PATH, "rb") as f:
    sepsis_model_data = pickle.load(f)

with open(DEATH_MODEL_PATH, "rb") as f:
    death_model_data = pickle.load(f)

sepsis_model = sepsis_model_data.get("model", sepsis_model_data) if isinstance(sepsis_model_data, dict) else sepsis_model_data
sepsis_feature_columns = sepsis_model_data.get("feature_columns") if isinstance(sepsis_model_data, dict) else None

death_model = death_model_data.get("model", death_model_data) if isinstance(death_model_data, dict) else death_model_data
death_feature_columns = death_model_data.get("feature_columns") if isinstance(death_model_data, dict) else None

ordered_keys = [
    "HEART_RATE", "SBP", "DBP", "MAP", "RESP_RATE", "TEMP", "SPO2",
    "WBC", "HB", "PLATELET", "CREATININE", "BUN", "SODIUM", "POTASSIUM", "CHLORIDE",
    "BICARBONATE", "GLUCOSE_LAB", "LACTATE", "CALCIUM", "BILIRUBIN", "ALBUMIN",
    "INR", "PT", "PTT", "ANION_GAP_APPROX", "BUN_CR_RATIO",
    "URINE_SPEC_GRAVITY"
]

measured_keys = [
    "HEART_RATE",
    "SBP",
    "DBP",
    "MAP",
    "RESP_RATE",
    "TEMP",
    "SPO2"
]


def build_feature_vector(values, feature_columns):
    if not feature_columns:
        raise ValueError("Model metadata missing feature_columns.")

    if len(values) == len(feature_columns):
        return pd.DataFrame([values], columns=feature_columns, dtype=float)

    if len(values) != 31:
        raise ValueError("Expected 31 or 45 features.")

    subject_id, hadm_id, age, gender = values[:4]
    feature_map = {col: 0.0 for col in feature_columns}

    feature_map["AGE_AT_ADMISSION"] = float(age) if age is not None else 0.0
    try:
        gender_value = int(float(gender))
    except (TypeError, ValueError):
        gender_value = 0
    if "GENDER" in feature_map:
        feature_map["GENDER"] = float(gender_value)
    elif "GENDER_1" in feature_map:
        feature_map["GENDER_1"] = 1.0 if gender_value == 1 else 0.0

    for key, value in zip(ordered_keys, values[4:]):
        if key in feature_map:
            feature_map[key] = float(value) if value is not None else 0.0

    for key in measured_keys:
        for suffix in ("_measured", "_measured_1"):
            flag_key = f"{key}{suffix}"
            if flag_key in feature_map:
                feature_map[flag_key] = 1.0 if feature_map.get(key, 0) not in (0, 0.0) else 0.0

    vector = [feature_map[col] for col in feature_columns]
    return pd.DataFrame([vector], columns=feature_columns, dtype=float)

def get_feature_importance_top5(model, feature_columns, top_k=10):
    if not feature_columns or not hasattr(model, "feature_importances_"):
        return []

    importances = list(model.feature_importances_)
    if len(importances) != len(feature_columns):
        return []

    total = sum(importances) or 1.0
    pairs = sorted(zip(feature_columns, importances), key=lambda x: x[1], reverse=True)
    top_features = []
    for name, value in pairs[:top_k]:
        top_features.append({
            "name": name,
            "value": round((value / total) * 100, 2)
        })
    return top_features


# ===========================
# 2) 예측 API 만들기
# ===========================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        values = build_feature_vector(data["values"], sepsis_feature_columns)
        death_values = build_feature_vector(data["values"], death_feature_columns)

        prediction = sepsis_model.predict(values)

        # 확률 예측 (지원될 경우)
        try:
            proba = sepsis_model.predict_proba(values)[0][1]
        except:
            proba = None

        if "SEPSIS" in (death_feature_columns or []):
            death_values.loc[0, "SEPSIS"] = float(prediction[0])
        death_prediction = death_model.predict(death_values)
        try:
            death_proba = death_model.predict_proba(death_values)[0][1]
        except:
            death_proba = None

        return jsonify({
            "prediction": float(prediction[0]),
            "probability": float(proba) if proba is not None else None,
            "feature_importance": get_feature_importance_top5(sepsis_model, sepsis_feature_columns, top_k=10),
            "death_prediction": float(death_prediction[0]),
            "death_probability": float(death_proba) if death_proba is not None else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ===========================
# 홈 테스트용
# ===========================
@app.route("/", methods=["GET"])
def home():
    return "Model API running!"


# ===========================
# 서버 실행
# ===========================
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
