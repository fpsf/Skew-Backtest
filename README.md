### This project implements a reproducible dispersion‑skew backtest, through a React frontend: it builds index and single‑stock option legs using a Black–Scholes pricing proxy and an implied‑vol mapping derived from realized volatility, then computes daily and cumulative P&L. Below is the backtest routine that the Flask API calls.

This project is set up to work in two modes:

- Local mode: React frontend + Flask backend for live refreshes.
- GitHub Pages mode: static frontend that reads exported CSV data from `frontend/public/`.

GitHub Pages cannot run Flask or any Python server code, so the backend is handled by exporting its results ahead of time.

## Delivery model

The repository now uses a split CI/CD design:

- `Continuous Integration`
  Verifies the frontend build, Python backend imports, and CodeQL analysis on pull requests and non-main pushes for fast feedback.

- `Deliver GitHub Pages`
  Regenerates static data inside the workflow, rebuilds the site from a clean environment, creates a provenance attestation, and only then deploys to GitHub Pages.

This keeps delivery artifact-based and avoids scheduled workflows pushing generated files straight into `main`.

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses the backend API at `http://localhost:5002` by default in development.

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python3 backend/app.py
```

## Export static data for GitHub Pages

Run:

```bash
python3 public/export_to_frontend.py
```

This generates:

<div>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>Ticker</th>
      <th>ABEV3.SA</th>
      <th>BBAS3.SA</th>
      <th>BBDC4.SA</th>
      <th>ITUB4.SA</th>
      <th>PETR4.SA</th>
      <th>RENT3.SA</th>
      <th>SUZB3.SA</th>
      <th>VALE3.SA</th>
      <th>WEGE3.SA</th>
      <th>^BVSP</th>
    </tr>
    <tr>
      <th>Date</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>2022-01-03</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>2022-01-04</th>
      <td>-0.001305</td>
      <td>0.001040</td>
      <td>0.006535</td>
      <td>0.027964</td>
      <td>0.003774</td>
      <td>0.005682</td>
      <td>0.021581</td>
      <td>-0.011865</td>
      <td>-0.005009</td>
      <td>-0.003934</td>
    </tr>
    <tr>
      <th>2022-01-05</th>
      <td>-0.019790</td>
      <td>-0.016778</td>
      <td>-0.007095</td>
      <td>-0.019170</td>
      <td>-0.039467</td>
      <td>-0.029344</td>
      <td>-0.011397</td>
      <td>0.009426</td>
      <td>-0.054172</td>
      <td>-0.024527</td>
    </tr>
    <tr>
      <th>2022-01-06</th>
      <td>-0.016119</td>
      <td>0.008074</td>
      <td>0.014142</td>
      <td>0.020073</td>
      <td>-0.000713</td>
      <td>0.003816</td>
      <td>-0.008005</td>
      <td>0.019977</td>
      <td>-0.000331</td>
      <td>0.005480</td>
    </tr>
    <tr>
      <th>2022-01-07</th>
      <td>-0.016383</td>
      <td>0.001048</td>
      <td>0.014439</td>
      <td>0.021891</td>
      <td>0.004624</td>
      <td>-0.008454</td>
      <td>-0.006720</td>
      <td>0.056571</td>
      <td>-0.025513</td>
      <td>0.011338</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>2026-03-18</th>
      <td>-0.018818</td>
      <td>-0.011045</td>
      <td>-0.011740</td>
      <td>-0.010119</td>
      <td>0.013279</td>
      <td>-0.011496</td>
      <td>-0.010410</td>
      <td>-0.023449</td>
      <td>-0.000866</td>
      <td>-0.004277</td>
    </tr>
    <tr>
      <th>2026-03-19</th>
      <td>0.002033</td>
      <td>0.004263</td>
      <td>0.000537</td>
      <td>0.007071</td>
      <td>-0.004692</td>
      <td>0.007003</td>
      <td>-0.027780</td>
      <td>-0.006504</td>
      <td>0.009272</td>
      <td>0.003506</td>
    </tr>
    <tr>
      <th>2026-03-20</th>
      <td>-0.020521</td>
      <td>-0.010261</td>
      <td>-0.016771</td>
      <td>-0.016260</td>
      <td>-0.024014</td>
      <td>-0.027618</td>
      <td>-0.018559</td>
      <td>-0.014194</td>
      <td>-0.013614</td>
      <td>-0.022734</td>
    </tr>
    <tr>
      <th>2026-03-23</th>
      <td>0.013045</td>
      <td>0.029221</td>
      <td>0.035900</td>
      <td>0.029173</td>
      <td>0.007852</td>
      <td>0.084926</td>
      <td>0.028293</td>
      <td>0.025354</td>
      <td>0.029862</td>
      <td>0.031905</td>
    </tr>
    <tr>
      <th>2026-03-24</th>
      <td>0.002725</td>
      <td>-0.013023</td>
      <td>-0.003163</td>
      <td>-0.005626</td>
      <td>0.026583</td>
      <td>-0.012837</td>
      <td>-0.008756</td>
      <td>0.007841</td>
      <td>0.004224</td>
      <td>0.003167</td>
    </tr>
  </tbody>
</table>
<p>1055 rows × 10 columns</p>
</div>


### 5. Set RV Window


```python
RV_WINDOW = 42

realized_vol = returns.rolling(RV_WINDOW, min_periods=1).std() * np.sqrt(252)

realized_vol
```


<div>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>Ticker</th>
      <th>ABEV3.SA</th>
      <th>BBAS3.SA</th>
      <th>BBDC4.SA</th>
      <th>ITUB4.SA</th>
      <th>PETR4.SA</th>
      <th>RENT3.SA</th>
      <th>SUZB3.SA</th>
      <th>VALE3.SA</th>
      <th>WEGE3.SA</th>
      <th>^BVSP</th>
    </tr>
    <tr>
      <th>Date</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>2022-01-03</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>2022-01-04</th>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>2022-01-05</th>
      <td>0.207484</td>
      <td>0.200009</td>
      <td>0.153002</td>
      <td>0.529078</td>
      <td>0.485385</td>
      <td>0.393170</td>
      <td>0.370175</td>
      <td>0.238987</td>
      <td>0.551850</td>
      <td>0.231158</td>
    </tr>
    <tr>
      <th>2022-01-06</th>
      <td>0.155344</td>
      <td>0.203354</td>
      <td>0.170810</td>
      <td>0.400754</td>
      <td>0.377437</td>
      <td>0.312817</td>
      <td>0.287967</td>
      <td>0.257481</td>
      <td>0.473479</td>
      <td>0.243618</td>
    </tr>
    <tr>
      <th>2022-01-07</th>
      <td>0.130709</td>
      <td>0.168483</td>
      <td>0.160124</td>
      <td>0.341396</td>
      <td>0.335660</td>
      <td>0.255831</td>
      <td>0.242440</td>
      <td>0.454199</td>
      <td>0.389210</td>
      <td>0.249608</td>
    </tr>
    <tr>
      <th>...</th>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
      <td>...</td>
    </tr>
    <tr>
      <th>2026-03-18</th>
      <td>0.236608</td>
      <td>0.339620</td>
      <td>0.299125</td>
      <td>0.313069</td>
      <td>0.264355</td>
      <td>0.400913</td>
      <td>0.379191</td>
      <td>0.346207</td>
      <td>0.311733</td>
      <td>0.223757</td>
    </tr>
    <tr>
      <th>2026-03-19</th>
      <td>0.236492</td>
      <td>0.339252</td>
      <td>0.299125</td>
      <td>0.312414</td>
      <td>0.266556</td>
      <td>0.392910</td>
      <td>0.383717</td>
      <td>0.346507</td>
      <td>0.312514</td>
      <td>0.223171</td>
    </tr>
    <tr>
      <th>2026-03-20</th>
      <td>0.242333</td>
      <td>0.340461</td>
      <td>0.301835</td>
      <td>0.315431</td>
      <td>0.278369</td>
      <td>0.399579</td>
      <td>0.386094</td>
      <td>0.348005</td>
      <td>0.314286</td>
      <td>0.231319</td>
    </tr>
    <tr>
      <th>2026-03-23</th>
      <td>0.244163</td>
      <td>0.346221</td>
      <td>0.312895</td>
      <td>0.322177</td>
      <td>0.278131</td>
      <td>0.448789</td>
      <td>0.391872</td>
      <td>0.350568</td>
      <td>0.322612</td>
      <td>0.242434</td>
    </tr>
    <tr>
      <th>2026-03-24</th>
      <td>0.240923</td>
      <td>0.335982</td>
      <td>0.303452</td>
      <td>0.305688</td>
      <td>0.274105</td>
      <td>0.437878</td>
      <td>0.390288</td>
      <td>0.342851</td>
      <td>0.317020</td>
      <td>0.229967</td>
    </tr>
  </tbody>
</table>
<p>1055 rows × 10 columns</p>
</div>

## GitHub Actions

This repo includes these automation workflows:

- `.github/workflows/ci.yml`
  Fast verification for frontend, backend, and CodeQL on pull requests and non-main pushes.

- `.github/workflows/delivery-pages.yml`
  Rebuilds data and the static site from a clean runner, attests the output, and deploys the promoted Pages artifact.

- `.github/dependabot.yml`
  Keeps GitHub Actions, npm, and Python dependencies moving through reviewable update PRs.

## If you want a live backend in production

Deploy the Flask app separately on a platform like Render, Railway, or Fly.io, then point the frontend to it with `VITE_API_BASE`. GitHub Pages itself can only host the static frontend.
