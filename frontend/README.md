# Skew Backtest Frontend

Simple React + Vite TypeScript app to upload and plot CSV exports of the two DataFrames created by `Dispersion_Skew_Backtest.py` (`df` and `df_cum`).

Quick start:

1. Open a terminal in `frontend` folder.
2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

4. In the browser, upload the CSV files you exported from Python (use `DataFrame.to_csv()` for `df` and `df_cum`). The first column should be the date/index; the remaining columns will be plotted as time series.

Notes:
- Uses `papaparse` to parse CSV and `react-plotly.js` for plotting.
- If you want, you can place `df.csv` and `df_cum.csv` in the project and drag them into the uploader.
- The frontend now talks to a Flask backend that serves PnL data from a local SQLite DB.
- Use the backend helper `export_to_frontend.py` or the API refresh endpoint to populate the DB.

Backend quick start (local Flask API)

1. Create a Python virtualenv and install backend dependencies:

```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Start the Flask server:

```bash
python app.py
```

3. In the frontend (new terminal), run the dev server and open the app:

```bash
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```

4. In the app, use "Refresh Data (run backtest)" to have the Flask server run the backtest and write to the SQLite DB, then click "Load Daily PnL" or "Load Cumulative PnL" to fetch and plot.
