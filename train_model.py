import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# ==================================================
# SETTINGS
# ==================================================

RANDOM_STATE = 42
TRAINING_SAMPLES = 12000

FEATURES = [
    "clicks_change",
    "conversion_rate_change",
    "latency_change",
    "error_rate_change",
]

CLASS_NAMES = {
    0: "SAFE TO DEPLOY",
    1: "REVIEW REQUIRED",
    2: "RISKY CHANGE",
    3: "ROLLBACK",
}


# ==================================================
# GENERATE ONE SIMULATED TRAINING EXAMPLE
# ==================================================

def generate_sample(label):
    """
    Generate one simulated deployment example.

    The model receives four percentage-change features:

    clicks_change
    conversion_rate_change
    latency_change
    error_rate_change
    """

    # ----------------------------------------------
    # CLASS 0: SAFE TO DEPLOY
    # ----------------------------------------------

    if label == 0:
        clicks = np.random.uniform(3, 30)
        conversion = np.random.uniform(2, 25)
        latency = np.random.uniform(-40, -5)
        error_rate = np.random.uniform(-50, -5)

    # ----------------------------------------------
    # CLASS 1: REVIEW REQUIRED
    # ----------------------------------------------

    elif label == 1:
        clicks = np.random.uniform(-8, 15)
        conversion = np.random.uniform(-6, 12)
        latency = np.random.uniform(-15, 15)
        error_rate = np.random.uniform(-15, 15)

    # ----------------------------------------------
    # CLASS 2: RISKY CHANGE
    # ----------------------------------------------

    elif label == 2:
        clicks = np.random.uniform(-25, 10)
        conversion = np.random.uniform(-20, 5)
        latency = np.random.uniform(5, 45)
        error_rate = np.random.uniform(5, 60)

    # ----------------------------------------------
    # CLASS 3: ROLLBACK
    # ----------------------------------------------

    else:
        clicks = np.random.uniform(-50, -10)
        conversion = np.random.uniform(-45, -10)
        latency = np.random.uniform(25, 100)
        error_rate = np.random.uniform(40, 180)

    # Add noise so examples are not perfectly identical
    noise = np.random.normal(0, 3, 4)

    return [
        clicks + noise[0],
        conversion + noise[1],
        latency + noise[2],
        error_rate + noise[3],
    ]


# ==================================================
# GENERATE TRAINING DATASET
# ==================================================

def generate_training_data():
    print("\nGenerating SECONDORDER training dataset...")

    np.random.seed(RANDOM_STATE)

    X = []
    y = []

    samples_per_class = TRAINING_SAMPLES // 4

    for label in range(4):
        for _ in range(samples_per_class):
            sample = generate_sample(label)

            X.append(sample)
            y.append(label)

    X = pd.DataFrame(
        X,
        columns=FEATURES,
    )

    y = np.array(y)

    print(f"Training examples generated: {len(X)}")

    print("\nClass distribution:")

    for label, name in CLASS_NAMES.items():
        count = int(np.sum(y == label))

        print(
            f"  {label} - {name}: {count}"
        )

    return X, y


# ==================================================
# TRAIN RANDOM FOREST
# ==================================================

def train_model():
    X, y = generate_training_data()

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=RANDOM_STATE,
            stratify=y,
        )
    )

    print("\nTraining Random Forest model...")

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # ----------------------------------------------
    # TEST MODEL
    # ----------------------------------------------

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print("\n" + "=" * 60)
    print("SECONDORDER MODEL TRAINING COMPLETE")
    print("=" * 60)

    print(
        f"\nModel: RandomForestClassifier"
    )

    print(
        f"Training samples: {len(X_train)}"
    )

    print(
        f"Testing samples: {len(X_test)}"
    )

    print(
        f"Test accuracy: {accuracy:.4f}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                CLASS_NAMES[i]
                for i in range(4)
            ],
        )
    )

    print("Confusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions,
        )
    )

    # ----------------------------------------------
    # FEATURE IMPORTANCE
    # ----------------------------------------------

    feature_importance = dict(
        zip(
            FEATURES,
            model.feature_importances_,
        )
    )

    print("\nFeature Importance:")

    for feature, importance in sorted(
        feature_importance.items(),
        key=lambda item: item[1],
        reverse=True,
    ):
        print(
            f"  {feature}: {importance:.4f}"
        )

    # ----------------------------------------------
    # SAVE EVERYTHING NEEDED BY ANALYSIS.PY
    # ----------------------------------------------

    model_package = {
        "model": model,

        "features": FEATURES,

        "class_names": CLASS_NAMES,

        "model_name": "Random Forest Classifier",

        "model_version": "1.0.0",

        "training_samples": len(X_train),

        "testing_samples": len(X_test),

        "accuracy": float(accuracy),

        "feature_importance":
            feature_importance,
    }

    joblib.dump(
        model_package,
        "secondorder_model.pkl",
    )

    print(
        "\nSaved trained model:"
    )

    print(
        "secondorder_model.pkl"
    )

    print("=" * 60)


# ==================================================
# RUN TRAINING
# ==================================================

if __name__ == "__main__":
    train_model()