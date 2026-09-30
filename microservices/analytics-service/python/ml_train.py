"""
Sellio — ML training entry point called by analytics-service (Java).

  python python/ml_train.py --task recommend --in input.json --out output.json
  python python/ml_train.py --task segment   --in input.json --out output.json

Input/output are JSON files so the Java side never has to parse stdout.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from recommender import model as recommender  # noqa: E402
from segmentation import model as segmentation  # noqa: E402


def run_recommend(payload: dict) -> dict:
    result = recommender.train(
        payload.get("products", []),
        payload.get("interactions", []),
        payload.get("baskets", []),
    )
    result.pop("_sim", None)
    result.pop("_ids", None)
    return result


def run_segment(payload: dict) -> dict:
    return segmentation.train(payload.get("events", []))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--task", choices=["recommend", "segment"], required=True)
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", dest="output", required=True)
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as handle:
        payload = json.load(handle)
    result = run_recommend(payload) if args.task == "recommend" else run_segment(payload)
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
