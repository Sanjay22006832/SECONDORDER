import random
import requests

URL = "http://127.0.0.1:8000/ingest"

DAYS = 30

METRICS = [
    "clicks",
    "conversion_rate",
    "latency",
    "error_rate"
]

SCENARIOS = [
    "all_improve",
    "mixed",
    "no_change",
    "all_worse"
]


def create_baseline():
    return {
        "clicks": random.uniform(80, 120),
        "conversion_rate": random.uniform(0.02, 0.05),
        "latency": random.uniform(200, 300),
        "error_rate": random.uniform(0.01, 0.03)
    }


def generate_after_value(metric, before_value, scenario):

    if scenario == "all_improve":

        if metric == "clicks":
            return before_value * random.uniform(1.10, 1.30)

        if metric == "conversion_rate":
            return before_value * random.uniform(1.10, 1.30)

        if metric == "latency":
            return before_value * random.uniform(0.60, 0.85)

        if metric == "error_rate":
            return before_value * random.uniform(0.40, 0.80)


    elif scenario == "mixed":

        if metric == "clicks":
            return before_value * random.uniform(1.05, 1.20)

        if metric == "conversion_rate":
            return before_value * random.uniform(1.02, 1.15)

        if metric == "latency":
            return before_value * random.uniform(0.65, 0.90)

        if metric == "error_rate":
            return before_value * random.uniform(1.50, 3.00)


    elif scenario == "no_change":

        return before_value * random.uniform(0.97, 1.03)


    elif scenario == "all_worse":

        if metric == "clicks":
            return before_value * random.uniform(0.70, 0.90)

        if metric == "conversion_rate":
            return before_value * random.uniform(0.70, 0.90)

        if metric == "latency":
            return before_value * random.uniform(1.20, 1.60)

        if metric == "error_rate":
            return before_value * random.uniform(2.00, 4.00)


def run_simulation():

    scenario = random.choice(SCENARIOS)

    print(f"\n🚀 Running scenario: {scenario}")

    baseline = create_baseline()

    generated_data = []

    for day in range(1, DAYS + 1):

        for metric in METRICS:

            before_value = baseline[metric] * random.uniform(
                0.95,
                1.05
            )

            generated_data.append({
                "metric_name": metric,
                "value": round(before_value, 4),
                "version": "before"
            })


    for day in range(1, DAYS + 1):

        for metric in METRICS:

            after_value = generate_after_value(
                metric,
                baseline[metric],
                scenario
            )

            generated_data.append({
                "metric_name": metric,
                "value": round(after_value, 4),
                "version": "after"
            })


    return {
        "scenario": scenario,
        "data": generated_data
    }


if __name__ == "__main__":

    simulation = run_simulation()

    print(
        f"\nGenerated {len(simulation['data'])} signals"
    )

    for item in simulation["data"]:

        response = requests.post(
            URL,
            json=item
        )

        print(
            response.status_code,
            item
        )

    print("\n🎉 Demo simulation complete")