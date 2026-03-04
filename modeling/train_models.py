import os
import pickle

import numpy as np
import pandas as pd
from lightgbm import LGBMClassifier

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_CSV = os.path.join(ROOT, "train_final.csv")
TEST_CSV = os.path.join(ROOT, "test_final.csv")
BACKEND_DIR = os.path.join(ROOT, "backend")

SEPSIS_MODEL_PATH = os.path.join(BACKEND_DIR, "modeling_sepsis_최종.pkl")
DEATH_MODEL_PATH = os.path.join(BACKEND_DIR, "modeling_death_최종.pkl")


def train_lightgbm(train_df, target, exclude_vars, params):
    feature_cols = [c for c in train_df.columns if c not in exclude_vars]
    X_train = train_df[feature_cols].copy()
    y_train = train_df[target].copy()

    model = LGBMClassifier(**params)
    model.fit(X_train, y_train)

    return {
        "model": model,
        "feature_columns": feature_cols,
        "target": target,
        "params": params
    }


def main():
    if not os.path.exists(TRAIN_CSV):
        raise FileNotFoundError(f"Missing training data: {TRAIN_CSV}")

    train_df = pd.read_csv(TRAIN_CSV)

    sepsis_params = {
        "n_estimators": 500,
        "learning_rate": 0.03,
        "importance_type": "gain",
        "class_weight": "balanced",
        "random_state": 42,
        "verbose": -1,
        "max_depth": 3,
        "num_leaves": 7,
        "min_child_samples": 50,
        "lambda_l1": 1.0
    }
    death_params = {
        "n_estimators": 500,
        "learning_rate": 0.03,
        "importance_type": "gain",
        "class_weight": "balanced",
        "random_state": 42,
        "verbose": -1,
        "max_depth": 5,
        "num_leaves": 15,
        "min_child_samples": 20,
        "lambda_l1": 0.1
    }

    sepsis_data = train_lightgbm(
        train_df=train_df,
        target="SEPSIS",
        exclude_vars=["SEPSIS", "SUBJECT_ID", "HADM_ID", "ADMITTIME", "HOSPITAL_EXPIRE_FLAG"],
        params=sepsis_params
    )
    death_data = train_lightgbm(
        train_df=train_df,
        target="HOSPITAL_EXPIRE_FLAG",
        exclude_vars=["HOSPITAL_EXPIRE_FLAG", "SUBJECT_ID", "HADM_ID", "ADMITTIME"],
        params=death_params
    )

    os.makedirs(BACKEND_DIR, exist_ok=True)
    with open(SEPSIS_MODEL_PATH, "wb") as f:
        pickle.dump(sepsis_data, f)
    with open(DEATH_MODEL_PATH, "wb") as f:
        pickle.dump(death_data, f)

    print(f"Saved sepsis model -> {SEPSIS_MODEL_PATH}")
    print(f"Saved death model  -> {DEATH_MODEL_PATH}")


if __name__ == "__main__":
    main()
