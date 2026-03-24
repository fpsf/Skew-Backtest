#!/usr/bin/env python3
"""Helper: import the backtest module and write `df` and `df_cum` to `frontend/public`.

Run from the repository root:

    python export_to_frontend.py

This will import `Dispersion_Skew_Backtest.py` (which computes the DataFrames at module scope),
then save `df` and `df_cum` as CSV files into `frontend/public/`.
"""
from pathlib import Path
import sys

OUT_DIR = Path(__file__).parent / "frontend" / "public"


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Import here to allow the helper script to be lightweight until executed.
    try:
        import backend.Dispersion_Skew_Backtest as ds
    except Exception as e:
        print("Failed to import Dispersion_Skew_Backtest:", e, file=sys.stderr)
        return 2

    # Call main() to produce the DataFrames
    try:
        res = ds.main()
    except Exception as e:
        print("Error while running ds.main():", e, file=sys.stderr)
        return 3

    written = 0
    import pandas as pd

    # support either returning (df, df_cum) or a dict-like result
    if isinstance(res, tuple) and len(res) >= 2:
        outputs = {"df": res[0], "df_cum": res[1]}
    elif isinstance(res, dict):
        outputs = res
    else:
        print("Unexpected return from ds.main(); expected (df, df_cum) or dict.")
        return 4

    for name in ("df", "df_cum"):
        if name not in outputs:
            print(f"No '{name}' in results, skipping.")
            continue
        obj = outputs[name]
        if not isinstance(obj, pd.DataFrame):
            print(f"Found '{name}' but it is not a pandas.DataFrame (type={type(obj)}), skipping.")
            continue

        out_path = OUT_DIR / f"{name}.csv"
        try:
            obj.to_csv(out_path, index=True)
            print(f"Wrote {out_path}")
            written += 1
        except Exception as e:
            print(f"Failed to write {out_path}: {e}", file=sys.stderr)

    if written == 0:
        print("No files written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
