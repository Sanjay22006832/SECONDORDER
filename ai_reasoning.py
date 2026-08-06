import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()



# =====================================================
# GROQ CLIENT
# =====================================================

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


# =====================================================
# AI DEPLOYMENT REASONING
# =====================================================

def generate_ai_reasoning(
    change_description,
    metrics,
    prediction,
    confidence,
):
    """
    Uses Groq LLM to explain the Random Forest deployment decision.
    """

    print("\n====================================")
    print("🚀 ENTERED generate_ai_reasoning()")
    print("====================================")

    print(f"Description: {change_description}")
    print(f"Prediction : {prediction}")
    print(f"Confidence : {confidence:.2f}%")

    prompt = f"""
You are a Principal Site Reliability Engineer reviewing a production deployment.

You are assisting an AI Decision Intelligence platform called SECONDORDER.

IMPORTANT:

The deployment decision has ALREADY been made by a trained Random Forest model.

DO NOT change or question the prediction.

Your responsibility is ONLY to explain WHY the model most likely reached this decision.

====================================================

DEPLOYMENT DESCRIPTION

{change_description}

====================================================

METRIC CHANGES

{json.dumps(metrics, indent=2)}

====================================================

RANDOM FOREST DECISION

Prediction:
{prediction}

Confidence:
{confidence:.2f}%

====================================================

YOUR TASK

Analyze the deployment and infer:

1. Deployment intent
2. Components affected
3. Positive impacts
4. Potential risks
5. Engineering recommendation
(
• Return ONE concise paragraph.
• Maximum 60 words.
• Use 2–4 short sentences.
• Explain the most important action the engineering team should take.
• Avoid repeating the deployment summary.
• Do not use bullet points.
• Use simple, professional engineering language suitable for a deployment report.)
6. Executive summary

Guidelines

• If Redis is mentioned, mention Redis.
• If SQL is mentioned, mention Database.
• If Kubernetes is mentioned, mention Infrastructure.
• If APIs are mentioned, mention Backend Services.
• If frontend/UI changes are mentioned, mention Frontend.

When metrics conflict
(example:
latency ↓
clicks ↑
error rate ↑)

explain the trade-off.

Recommendations should sound like a senior DevOps engineer.

Never invent technologies that are not implied.

====================================================

Return ONLY valid JSON.

Schema:

{{
    "deployment_intent": "",

    "components": [],

    "positive_impacts": [],

    "risks": [],

    "recommendation": "",

    "summary": ""
}}
"""

    try:

        print("\n📤 Sending request to Groq...")

        response = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            temperature=0.2,

            messages=[
                {
                    "role": "system",
                    "content": """
You are a Principal Site Reliability Engineer.

You have over 15 years of experience reviewing production deployments.

Your expertise includes:

- Backend Systems
- Microservices
- Kubernetes
- Docker
- Distributed Systems
- SQL Databases
- Redis
- REST APIs
- Cloud Infrastructure
- DevOps
- Site Reliability Engineering

You explain deployment behaviour clearly and accurately.

Always return ONLY valid JSON.
"""
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        print("✅ Response received from Groq.")
        content = (
            response
            .choices[0]
            .message
            .content
            .strip()
        )

        print("\n========== RAW GROQ RESPONSE ==========")
        print(content)
        print("=======================================\n")

        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        parsed = json.loads(content)

        print("✅ JSON parsed successfully.")

        return parsed

    except Exception as error:

        print("\n====================================")
        print("❌ GROQ AI ERROR")
        print("====================================")
        print(type(error).__name__)
        print(error)
        print("====================================\n")

        return {

            "deployment_intent":
                "Unknown",

            "components":
                [],

            "positive_impacts":
                [],

            "risks":
                [],

            "recommendation":
                "AI reasoning could not be generated.",

            "summary":
                "SECONDORDER successfully completed the Random Forest analysis, but the AI explanation service was unavailable."
        }