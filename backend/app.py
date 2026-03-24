from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
import sqlite3
import traceback
import pandas as pd
import os

DB_PATH = Path(__file__).parent / "data.db"

app = Flask(__name__)
CORS(app)


def write_df_to_db(df: pd.DataFrame, table_name: str):
    # ensure index is a column named 'date'
    df_to_write = df.copy()
    df_to_write.index.name = 'date'
    df_to_write = df_to_write.reset_index()
    conn = sqlite3.connect(DB_PATH)
    try:
        df_to_write.to_sql(table_name, conn, if_exists='replace', index=False)
    finally:
        conn.close()


def read_table(table_name: str):
    if not DB_PATH.exists():
        return None
    conn = sqlite3.connect(DB_PATH)
    try:
        df = pd.read_sql_query(f"SELECT * FROM '{table_name}'", conn)
    except Exception:
        return None
    finally:
        conn.close()
    return df


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/data")
def get_data():
    which = request.args.get('which', 'df')
    table = 'pnl' if which == 'df' else 'pnl_cum'
    df = read_table(table)
    if df is None:
        return jsonify({"error": "no data"}), 404

    # return as columns + rows (index already a column 'date')
    return jsonify({
        "columns": list(df.columns),
        "rows": df.to_dict(orient='records')
    })


@app.route("/api/refresh", methods=["POST"])
def refresh():
    # optional params
    params = request.get_json(silent=True) or {}
    start = params.get('start', '2022-01-01')
    rv_window = int(params.get('rv_window', 42))
    vega_notional = float(params.get('vega_notional', 100000))

    try:
        import backend.Dispersion_Skew_Backtest as ds
    except Exception as e:
        return jsonify({"error": f"failed to import backtest: {e}"}), 500

    try:
        res = ds.main(start=start, rv_window=rv_window, vega_notional=vega_notional)
        if isinstance(res, tuple) and len(res) >= 2:
            df, df_cum = res[0], res[1]
        elif isinstance(res, dict):
            df = res.get('df')
            df_cum = res.get('df_cum')
        else:
            return jsonify({"error": "unexpected result from backtest"}), 500

        # write to sqlite
        write_df_to_db(df, 'pnl')
        write_df_to_db(df_cum, 'pnl_cum')

        return jsonify({"status": "ok", "rows": int(len(df))}), 200
    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({"error": str(e), "trace": tb}), 500


if __name__ == '__main__':
    # create DB dir if needed
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    # default to 5002 to avoid common port conflicts on macOS (e.g., AirPlay)
    port = int(os.environ.get('PORT', '5002'))
    app.run(host='0.0.0.0', port=port)
