import os
import joblib
import pandas as pd
from ai_reasoning import generate_ai_reasoning


# ==================================================
# PATHS
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(
    BASE_DIR,
    "ingested_data.csv"
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "secondorder_model.pkl"
)


# ==================================================
# LAZY MODEL LOADING
# ==================================================

_model_package_cache = None


def get_model_package():
    global _model_package_cache
    if _model_package_cache is None:
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(
                "secondorder_model.pkl was not found. "
                "Run: python train_model.py"
            )
        _model_package_cache = joblib.load(MODEL_FILE)
    return _model_package_cache


# ==================================================
# REQUIRED METRICS
# ==================================================

REQUIRED_METRICS = [
    "clicks",
    "conversion_rate",
    "latency",
    "error_rate"
]


# ==================================================
# EMPTY INSIGHTS
# ==================================================

def create_empty_insights():

    return {
        metric: {
            "before": 0,
            "after": 0,
            "change": 0,
            "percentage_change": 0,
            "impact": "waiting"
        }
        for metric in REQUIRED_METRICS
    }


# ==================================================
# ANALYSIS FUNCTION
# ==================================================

def analyze_data(
    change_description=""
):

    try:

        print(
            "\n🔥 Random Forest ML Analysis running..."
              )
        print("===================================")
        print("CHANGE DESCRIPTION:", change_description)
        print("===================================")
        # ==================================================
        # 1. CHECK DATA FILE
        # ==================================================

        if not os.path.exists(DATA_FILE):

            return waiting_result(
                create_empty_insights(),
                "No deployment data file was found."
            )


        if os.path.getsize(DATA_FILE) == 0:

            return waiting_result(
                create_empty_insights(),
                "Waiting for data to perform analysis."
            )


        # ==================================================
        # 2. LOAD DATA
        # ==================================================

        df = pd.read_csv(
            DATA_FILE,
            names=[
                "timestamp",
                "metric_name",
                "value",
                "version"
            ],
            header=None
        )


        # ==================================================
        # 3. CLEAN DATA
        # ==================================================

        df.columns = (
            df.columns
            .str.strip()
        )


        df["metric_name"] = (
            df["metric_name"]
            .astype(str)
            .str.strip()
            .str.lower()
        )


        df["version"] = (
            df["version"]
            .astype(str)
            .str.strip()
            .str.lower()
        )


        df["value"] = pd.to_numeric(
            df["value"],
            errors="coerce"
        )


        df = df.dropna(
            subset=[
                "metric_name",
                "value",
                "version"
            ]
        )


        print(
            f"📊 Valid rows loaded: {len(df)}"
        )


        # ==================================================
        # 4. CHECK EMPTY DATA
        # ==================================================

        if df.empty:

            return waiting_result(
                create_empty_insights(),
                "Waiting for data to perform analysis."
            )


        # ==================================================
        # 5. KEEP ONLY BEFORE / AFTER
        # ==================================================

        df = df[
            df["version"].isin(
                ["before", "after"]
            )
        ]


        if df.empty:

            return waiting_result(
                create_empty_insights(),
                "The version column must contain before and after values."
            )



        # ==================================================
        # 6. CHECK REQUIRED METRICS
        # ==================================================

        available_metrics = set(
            df["metric_name"].unique()
        )


        missing_metrics = [
            metric
            for metric in REQUIRED_METRICS
            if metric not in available_metrics
        ]


        if missing_metrics:

            return waiting_result(
                create_empty_insights(),
                "Missing metrics: "
                + ", ".join(missing_metrics)
            )


        # ==================================================
        # 7. VALIDATE BEFORE + AFTER FOR EVERY METRIC
        # ==================================================

        incomplete_metrics = []


        for metric in REQUIRED_METRICS:

            metric_versions = set(

                df[
                    df["metric_name"] == metric
                ]["version"].unique()

            )


            if not {
                "before",
                "after"
            }.issubset(metric_versions):

                incomplete_metrics.append(
                    metric
                )


        if incomplete_metrics:

            return waiting_result(
                create_empty_insights(),
                "These metrics require both before and after data: "
                + ", ".join(incomplete_metrics)
            )


        # ==================================================
        # 8. AGGREGATE BEFORE / AFTER
        # ==================================================

        pivot_df = df.pivot_table(
            index="version",
            columns="metric_name",
            values="value",
            aggfunc="mean"
        )


        print(
            "\n📊 Aggregated deployment data:"
        )

        print(pivot_df)


        # ==================================================
        # 9. VERIFY BEFORE + AFTER ROWS
        # ==================================================

        if (
            "before" not in pivot_df.index
            or
            "after" not in pivot_df.index
        ):

            return waiting_result(
                create_empty_insights(),
                "Both before and after deployment data are required."
            )


        # ==================================================
        # 10. CALCULATE METRIC CHANGES
        # ==================================================

        insights = {}

        percentage_changes = {}


        for metric in REQUIRED_METRICS:

            before_mean = float(
                pivot_df.loc[
                    "before",
                    metric
                ]
            )


            after_mean = float(
                pivot_df.loc[
                    "after",
                    metric
                ]
            )


            change = (
                after_mean
                - before_mean
            )


            if before_mean != 0:

                percentage_change = (

                    change
                    / abs(before_mean)

                ) * 100

            else:

                percentage_change = 0.0


            # ==============================================
            # DETERMINE IMPACT
            # ==============================================

            if metric in [
                "latency",
                "error_rate"
            ]:

                if change < 0:

                    impact = "improved"

                elif change > 0:

                    impact = "worsened"

                else:

                    impact = "unchanged"


            else:

                if change > 0:

                    impact = "improved"

                elif change < 0:

                    impact = "worsened"

                else:

                    impact = "unchanged"


            insights[metric] = {

                "before": round(
                    before_mean,
                    6
                ),

                "after": round(
                    after_mean,
                    6
                ),

                "change": round(
                    change,
                    6
                ),

                "percentage_change": round(
                    percentage_change,
                    2
                ),

                "impact": impact
            }


            percentage_changes[metric] = (
                percentage_change
            )


        # ==================================================
        # 11. CREATE RANDOM FOREST INPUT
        # ==================================================

        model_package = get_model_package()
        model = model_package["model"]
        model_features = model_package["features"]
        class_names = model_package["class_names"]

        feature_values = {

            "clicks_change":
                percentage_changes[
                    "clicks"
                ],

            "conversion_rate_change":
                percentage_changes[
                    "conversion_rate"
                ],

            "latency_change":
                percentage_changes[
                    "latency"
                ],

            "error_rate_change":
                percentage_changes[
                    "error_rate"
                ]
        }


        X_input = pd.DataFrame(

            [[
                feature_values[feature]
                for feature in model_features
            ]],

            columns=model_features
        )


        print(
            "\n🧠 Random Forest input:"
        )

        print(X_input)


        # ==================================================
        # 12. RANDOM FOREST PREDICTION
        # ==================================================

        predicted_class = int(
            model.predict(
                X_input
            )[0]
        )


        probabilities = (
            model.predict_proba(
                X_input
            )[0]
        )


        probability_classes = (
            model.classes_
        )


        probability_map = {

            int(class_id):
                float(probability)

            for class_id, probability
            in zip(
                probability_classes,
                probabilities
            )
        }


        confidence = (
            probability_map.get(
                predicted_class,
                0
            )
        )


        decision = (
            class_names[
                predicted_class
            ]
        )


        # ==================================================
        # 13. RISK LEVEL
        # ==================================================

        risk_map = {

            "SAFE TO DEPLOY":
                "LOW",

            "REVIEW REQUIRED":
                "MEDIUM",

            "RISKY CHANGE":
                "HIGH",

            "ROLLBACK":
                "CRITICAL"
        }


        risk_level = risk_map.get(
            decision,
            "UNKNOWN"
        )


        # ==================================================
        # 14. DECISION SCORE
        # ==================================================

        decision_score = (

            probability_map.get(
                0,
                0
            )

            +

            (
                probability_map.get(
                    1,
                    0
                )
                * 0.35
            )

            -

            (
                probability_map.get(
                    2,
                    0
                )
                * 0.60
            )

            -

            probability_map.get(
                3,
                0
            )
        )


        # ==================================================
        # 15. FEATURE CONTRIBUTION
        # ==================================================

        model_importance = (
            model.feature_importances_
        )


        explanation = {}


        feature_to_metric = {

            "clicks_change":
                "clicks",

            "conversion_rate_change":
                "conversion_rate",

            "latency_change":
                "latency",

            "error_rate_change":
                "error_rate"
        }


        for index, feature in enumerate(
            model_features
        ):

            metric_name = (
                feature_to_metric[
                    feature
                ]
            )


            value = (
                feature_values[
                    feature
                ]
            )


            if feature in [
                "latency_change",
                "error_rate_change"
            ]:

                value = -value


            contribution = (

                value
                * model_importance[
                    index
                ]

            )


            explanation[
                metric_name
            ] = round(
                contribution,
                4
            )


        # ==================================================
        # 16. REASONS
        # ==================================================

        click_change = percentage_changes["clicks"]
        conversion_change = percentage_changes["conversion_rate"]
        latency_change = percentage_changes["latency"]
        error_change = percentage_changes["error_rate"]

        critical_reasons = []
        warning_reasons = []

        if error_change > 100:
            critical_reasons.append(
                f"Error rate increased critically by {error_change:.1f}%"
            )
        elif error_change > 50:
            warning_reasons.append(
                f"Error rate increased significantly by {error_change:.1f}%"
            )

        if latency_change > 50:
            critical_reasons.append(
                f"Latency increased critically by {latency_change:.1f}%"
            )
        elif latency_change > 25:
            warning_reasons.append(
                f"Latency increased significantly by {latency_change:.1f}%"
            )

        if conversion_change < -40:
            warning_reasons.append(
                f"Conversion rate dropped by {abs(conversion_change):.1f}%"
            )

        if click_change < -40:
            warning_reasons.append(
                f"Clicks dropped by {abs(click_change):.1f}%"
            )

        # ==================================================
        # 16.5 DYNAMIC DECISION REASONING
        # ==================================================

        decision_reasoning = []

        def describe_change(metric_label, percentage_change, positive_is_good=True):
            magnitude = abs(percentage_change)

            if magnitude < 0.5:
                strength = "remained nearly unchanged"
            elif magnitude < 2:
                strength = "changed slightly"
            elif magnitude < 10:
                strength = "changed moderately"
            elif magnitude < 25:
                strength = "changed significantly"
            else:
                strength = "changed critically"

            if percentage_change > 0:
                direction = "increased"
            elif percentage_change < 0:
                direction = "decreased"
            else:
                direction = "did not change"

            if percentage_change == 0:
                effect = "neutral"
            elif positive_is_good:
                effect = "positive" if percentage_change > 0 else "negative"
            else:
                effect = "positive" if percentage_change < 0 else "negative"

            return (
                f"{metric_label} {strength}: it {direction} by "
                f"{magnitude:.1f}%, producing a {effect} signal."
            )

        decision_reasoning.append(
            describe_change("Clicks", click_change, True)
        )
        decision_reasoning.append(
            describe_change("Conversion rate", conversion_change, True)
        )
        decision_reasoning.append(
            describe_change("Latency", latency_change, False)
        )
        decision_reasoning.append(
            describe_change("Error rate", error_change, False)
        )

        if decision == "SAFE TO DEPLOY":
            decision_reasoning.append(
                "The combined signal pattern is predominantly positive, "
                "so the model considers the deployment safe."
            )

        elif decision == "REVIEW REQUIRED":
            max_change = max(
                abs(click_change),
                abs(conversion_change),
                abs(latency_change),
                abs(error_change)
            )

            if max_change < 5:
                decision_reasoning.append(
                    "The observed changes are small and do not provide "
                    "enough evidence for a confident deployment decision."
                )
            else:
                decision_reasoning.append(
                    "The signals are mixed or uncertain, so manual review "
                    "is recommended before making a deployment decision."
                )

        elif decision == "RISKY CHANGE":
            decision_reasoning.append(
                "Negative signals outweigh the detected benefits, "
                "indicating elevated deployment risk."
            )

        elif decision == "ROLLBACK":
            decision_reasoning.append(
                "Critical negative signals dominate the deployment pattern, "
                "so rollback is recommended."
            )


        # ==================================================
        # 17. INFER LIKELY CHANGES
        # ==================================================

        change_inference = []


        if latency_change < -10:

            change_inference.append(
                "Performance optimization applied"
            )


        if error_change > 20:

            change_inference.append(
                "Possible bug or reliability issue introduced"
            )


        if conversion_change > 10:

            change_inference.append(
                "UI/UX improvement or feature enhancement"
            )


        if click_change > 10:

            change_inference.append(
                "User engagement feature added"
            )


        if latency_change > 20:

            change_inference.append(
                "Possible backend performance regression"
            )


        if conversion_change < -20:

            change_inference.append(
                "Possible user experience regression"
            )


        if not change_inference:

            change_inference.append(
                "No major system change inferred"
            )


        change_inference = list(
            dict.fromkeys(
                change_inference
            )
        )


        # ==================================================
        # 18. SUMMARY
        # ==================================================

        summary_map = {

            "SAFE TO DEPLOY": (
                "The Random Forest model identified an "
                "overall positive deployment pattern. "
                "The change is considered safe to deploy."
            ),

            "REVIEW REQUIRED": (
                "The Random Forest model identified a "
                "mixed or uncertain deployment pattern. "
                "Manual review is recommended."
            ),

            "RISKY CHANGE": (
                "The Random Forest model identified a "
                "high-risk deployment pattern. Further "
                "investigation is recommended."
            ),

            "ROLLBACK": (
                "The Random Forest model identified a "
                "critical negative deployment pattern. "
                "Rollback is recommended."
            )
        }


        summary = summary_map.get(
            decision,
            "The deployment was analyzed."
        )


        # ==================================================
        # 19. CLASS PROBABILITIES
        # ==================================================

        class_probabilities = {}


        for class_id, probability in (
            probability_map.items()
        ):

            class_name = (
                class_names[
                    int(class_id)
                ]
            )


            class_probabilities[
                class_name
            ] = round(
                probability,
                4
            )


        # ==================================================
        # 20. MODEL INFORMATION
        # ==================================================

        model_info = {

            "name":
                model_package.get(
                    "model_name",
                    "Random Forest Classifier"
                ),

            "version":
                model_package.get(
                    "model_version",
                    "1.0.0"
                ),

            "training_samples":
                model_package.get(
                    "training_samples",
                    0
                ),

            "testing_samples":
                model_package.get(
                    "testing_samples",
                    0
                ),

            "test_accuracy":
                model_package.get(
                    "accuracy",
                    0
                ),

            "features":
                model_features,

            "feature_importance":
                model_package.get(
                    "feature_importance",
                    {}
                )
        }


        # ==================================================
        # 21. FINAL RESULT
        # ==================================================

        ai_reasoning = generate_ai_reasoning(
        change_description=change_description,
            metrics=insights,
            prediction=decision,
            confidence=confidence * 100
        )
        result = {

            "insights":
                insights,

            "prediction":
                decision,

            "confidence":
                round(
                    confidence,
                    4
                ),

            "decision_score":
                round(
                    decision_score,
                    4
                ),
                
            "ai_reasoning": ai_reasoning,
            
            "risk_level":
                risk_level,

            "feature_contribution":
                explanation,

            "decision_reasoning":
                decision_reasoning,

            "likely_changes":
                change_inference,

            "critical_reasons":
                critical_reasons,

            "warning_reasons":
                warning_reasons,

            "class_probabilities":
                class_probabilities,

            "model_info":
                model_info,

            "summary":
                summary
        }


        # ==================================================
        # 22. TERMINAL OUTPUT
        # ==================================================

        print(
            "\n"
            + "=" * 60
        )

        print(
            "🤖 SECONDORDER RANDOM FOREST RESULT"
        )

        print(
            "=" * 60
        )


        print(
            f"\n🧠 Decision: "
            f"{result['prediction']}"
        )


        print(
            f"📈 ML Confidence: "
            f"{result['confidence'] * 100:.1f}%"
        )


        print(
            f"⚠️ Risk Level: "
            f"{result['risk_level']}"
        )


        print(
            "\n🎯 Class Probabilities:"
        )


        for class_name, probability in (
            result[
                "class_probabilities"
            ].items()
        ):

            print(
                f"  - {class_name}: "
                f"{probability * 100:.1f}%"
            )


        print(
            "\n📊 ML Input Features:"
        )


        for feature, value in (
            feature_values.items()
        ):

            print(
                f"  - {feature}: "
                f"{value:.2f}%"
            )


        print(
            "\n📊 Metric Insights:"
        )


        for metric, data in (
            result[
                "insights"
            ].items()
        ):

            print(
                f"  - {metric}: "
                f"{data['impact']} | "
                f"{data['percentage_change']}%"
            )


        print(
            "\n"
            + "=" * 60
            + "\n"
        )


        return result


    except Exception as error:

        print(
            f"\n❌ Analysis Error: "
            f"{str(error)}"
        )


        return {

            "error":
                str(error),

            "prediction":
                "ANALYSIS ERROR",

            "confidence":
                0,

            "decision_score":
                0,

            "risk_level":
                "UNKNOWN",

            "insights":
                create_empty_insights(),

            "feature_contribution":
                {},

            "decision_reasoning":
                [],

            "likely_changes":
                [],

            "critical_reasons":
                [],

            "warning_reasons":
                [],

            "class_probabilities":
                {},

            "model_info":
                {},

            "summary":
                "An error occurred during analysis."
        }


# ==================================================
# WAITING RESULT
# ==================================================

def waiting_result(
    empty_insights,
    summary
):

    print(
        f"\n⏳ {summary}"
    )


    return {

        "prediction":
            "WAITING FOR DATA",

        "confidence":
            0,

        "decision_score":
            0,

        "risk_level":
            "UNKNOWN",

        "insights":
            empty_insights,

        "feature_contribution":
            {},

        "decision_reasoning":
            [],

        "likely_changes":
            [],

        "critical_reasons":
            [],

        "warning_reasons":
            [],

        "class_probabilities":
            {},

        "model_info": (
            {
                "name": get_model_package().get("model_name", "Random Forest Classifier"),
                "version": get_model_package().get("model_version", "1.0.0"),
            }
            if os.path.exists(MODEL_FILE)
            else {
                "name": "Random Forest Classifier",
                "version": "1.0.0",
            }
        ),

        "summary":
            summary
    }


# ==================================================
# RUN DIRECTLY
# ==================================================

if __name__ == "__main__":

    analyze_data()