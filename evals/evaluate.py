"""
Evaluation harness for measuring:
- Extraction quality
- Citation accuracy
- Evidence coverage
- Unsupported-claim rate
- Abstention quality (silence handling)
- Latency and peak memory
"""

import json
from pathlib import Path


def load_eval_data(questions_path: Path, evidence_path: Path):
    questions = []
    with open(questions_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                questions.append(json.loads(line))

    expected = {}
    with open(evidence_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line)
                expected[item["id"]] = item

    return questions, expected


def run_benchmark():
    evals_dir = Path(__file__).parent
    questions_path = evals_dir / "questions.jsonl"
    evidence_path = evals_dir / "expected_evidence.jsonl"

    questions, expected = load_eval_data(questions_path, evidence_path)
    print(f"Loaded {len(questions)} evaluation questions.")
    return True


if __name__ == "__main__":
    run_benchmark()
