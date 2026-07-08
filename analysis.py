import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

def analyze_data():
    try:
        print("🔥 ML Analysis running...")

        df = pd.read_csv(
            "ingested_data.csv",
            names=["timestamp", "metric_name", "value", "version"],
            header=None
        )

        # ✅ FIX COLUMN ISSUE
        df.columns = df.columns.str.strip()
        
        if df.empty or len(df) < 10:
            return {
                "prediction": "WAITING FOR DATA",
                "confidence": 0,
                "insights": {
                    "clicks": {"change": 0},
                    "conversion_rate": {"change": 0},
                    "latency": {"change": 0},
                    "error_rate": {"change": 0}
                },
                "likely_changes": []
            }

        # 🔄 Pivot data
        pivot_df = df.pivot_table(
            index=["version"],   # 🔥 ONLY VERSION
            columns="metric_name",
            values="value",
            aggfunc="mean"       # 🔥 AGGREGATE
        ).reset_index()

        before = pivot_df[pivot_df["version"] == "before"]
        after = pivot_df[pivot_df["version"] == "after"]
        
        if before.empty or after.empty:
            return {
                "prediction": "NO DATA",
                "confidence": 0,
                "insights": {
                    "clicks": {"change": 0},
                    "conversion_rate": {"change": 0},
                    "latency": {"change": 0},
                    "error_rate": {"change": 0}
                },
                "likely_changes": []
            }

        insights = {}

        metrics = ["clicks", "conversion_rate", "latency", "error_rate"]

        for metric in metrics:
            before_mean = before.get(metric, pd.Series([0])).mean()
            after_mean = after.get(metric, pd.Series([0])).mean()

            change = after_mean - before_mean

            insights[metric] = {
                "before": float(before_mean),
                "after": float(after_mean),
                "change": float(change)
            }

        # 📊 Create feature vector (delta)
        features = []
        for col in metrics:
            before_mean = before[col].mean()
            after_mean = after[col].mean()
            delta = after_mean - before_mean
            if np.isnan(delta):
                delta = 0
            features.append(delta)

        X_test = np.array(features).reshape(1, -1)

        # 🧠 SIMULATED TRAINING DATA
        np.random.seed(42)
        X_train = np.random.randn(200, 4)

        # Define rule-based labels
        y_train = []
        for row in X_train:
            score = 0
            if row[1] > 0: score += 2   # conversion_rate ↑ good
            if row[2] < 0: score += 2   # latency ↓ good
            if row[3] < 0: score += 2   # error_rate ↓ good
            y_train.append(1 if score >= 3 else 0)

        y_train = np.array(y_train)

        # ⚙️ Scaling
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # 🤖 Model
        model = LogisticRegression()
        model.fit(X_train_scaled, y_train)

        # 🔮 Prediction
        prediction = model.predict(X_test_scaled)[0]
        probability = model.predict_proba(X_test_scaled)[0][prediction]

        # 🔥 NEW CONFIDENCE FIX
        confidence = min(1.0, abs(sum(features)) / 100)

        # Use model probability if it's meaningful, otherwise fallback
        if probability > 0.1:
            confidence = float(probability)
        decision = "SAFE TO DEPLOY" if prediction == 1 else "RISKY CHANGE"

        # 🧠 Explainability
        importance = model.coef_[0]
        explanation = {}
        for i, metric in enumerate(metrics):
            explanation[metric] = round(importance[i] * features[i], 4)

        # ✅ Insights
        for i, metric in enumerate(metrics):
            change = features[i]

            if metric in ["latency", "error_rate"]:
                trend = "improved" if change < 0 else "worsened"
            else:
                trend = "improved" if change > 0 else "worsened"

            # ✅ ADD impact WITHOUT deleting previous data
            insights[metric]["impact"] = trend

        # 🔥 Change Inference
        change_inference = []

        for i, metric in enumerate(metrics):
            change = features[i]

            if metric == "latency" and change < 0:
                change_inference.append("Performance optimization applied")

            if metric == "error_rate" and change > 0:
                change_inference.append("Possible bug introduced")

            if metric == "conversion_rate" and change > 0:
                change_inference.append("UI/UX improvement or feature enhancement")

            if metric == "clicks" and change > 0:
                change_inference.append("User engagement feature added")

        change_inference = list(set(change_inference))

        # 📝 Summary
        summary = f"The system observed changes across metrics after deployment and classified this change as {decision}."

        # 🎯 Final result
        result = {
            "insights": insights,
            "prediction": decision,
            "confidence": round(float(confidence), 4),
            "feature_contribution": explanation,
            "likely_changes": change_inference,
            "summary": summary
        }

        # 🔥 CLEAN TERMINAL OUTPUT (ADDED)
        print("\n" + "="*50)
        print("📊 FINAL ANALYSIS RESULT")
        print("="*50)

        print(f"\n🧠 Decision: {result['prediction']}")
        print(f"📈 Confidence: {result['confidence']}")

        print("\n📊 Metric Insights:")
        for metric, data in result["insights"].items():
            print(f"  - {metric}: {data['impact']} (change: {data['change']})")

        print("\n⚡ Likely Changes Inferred:")
        if result["likely_changes"]:
            for change in result["likely_changes"]:
                print(f"  - {change}")
        else:
            print("  - No major change inferred")

        print("\n🔍 Feature Contribution:")
        for metric, value in result["feature_contribution"].items():
            print(f"  - {metric}: {value}")

        print("\n📝 Summary:")
        print(result["summary"])

        print("="*50 + "\n")

        return result

    except Exception as e:
        return {"error": str(e)}