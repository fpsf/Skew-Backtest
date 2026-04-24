import numpy as np
import pandas as pd
import yfinance as yf

from scipy.stats import norm

def black_scholes(forward, strike, time_to_expiry, volatility, option_type="call"):
    """Simple European Black‑Scholes (no discounting)."""
    if time_to_expiry <= 0:
        if option_type.lower().startswith("c"):
            return max(forward - strike, 0.0)
        return max(strike - forward, 0.0)
    vol_sqrt_t = volatility * np.sqrt(time_to_expiry)
    d1 = (np.log(forward / strike) + 0.5 * volatility**2 * time_to_expiry) / vol_sqrt_t
    d2 = d1 - vol_sqrt_t
    if option_type.lower().startswith("c"):
        return norm.cdf(d1) * forward - norm.cdf(d2) * strike
    else:
        return norm.cdf(-d2) * strike - norm.cdf(-d1) * forward

def implied_vol_proxy(rv, base=0.20, skew_slope=-0.25):
    """
    rv: realized vol
    base: long-term IV anchor
    skew_slope: controls downside skew
    """
    return base + 0.5 * rv

def strike_from_delta(S, T, sigma, delta=0.25, call=True):
    sign = 1 if call else -1
    d1 = sign * norm.ppf(delta)
    return S * np.exp(
        -sigma * np.sqrt(T) * d1 + 0.5 * sigma**2 * T
    )

def option_vega(S, K, T, sigma):
    d1 = (np.log(S / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

# P&L engine
def option_pnl_series(S, K, T, sigma_series, vega_notional):
    prices = []
    
    for sigma in sigma_series:
        price = black_scholes(
            forward=S,
            strike=K,
            time_to_expiry=T,
            volatility=sigma,
            option_type="call"
        )
        prices.append(price)
    
    prices = pd.Series(prices, index=sigma_series.index)
    pnl = prices.diff().fillna(0)

    vega = option_vega(S, K, T, sigma_series.iloc[0])
    scale = vega_notional / vega

    return pnl * scale

def main(start="2022-01-01", rv_window: int = 42, vega_notional: float = 100_000):
    """Run the backtest and return (df, df_cum).

    Parameters
    - start: start date for price history (passed to yfinance)
    - rv_window: window size for realized vol
    - vega_notional: scaling notional for option P&L
    """
    # Index + top 10 IBOV names (example tickers)
    INDEX = "^BVSP"

    SINGLES = [
        "PETR4.SA", "VALE3.SA", "ITUB4.SA", "BBDC4.SA", "ABEV3.SA",
        "BBAS3.SA", "WEGE3.SA", "RENT3.SA", "SUZB3.SA", "JBSS3.SA"
    ]

    tickers = [INDEX] + SINGLES

    prices = yf.download(
        tickers,
        start=start,
        auto_adjust=True
    )["Close"]

    prices = prices.dropna(axis=1, how="any")

    returns = np.log(prices / prices.shift(1))

    RV_WINDOW = rv_window

    realized_vol = returns.rolling(RV_WINDOW, min_periods=1).std() * np.sqrt(252)

    T = 2 / 12  # 2 months

    ibov_pnl = []
    single_pnl = []

    for date in realized_vol.index[RV_WINDOW:]:
        S = prices.loc[date, INDEX]
        sigma_today = implied_vol_proxy(realized_vol.loc[date, INDEX])
        K = strike_from_delta(S, T, sigma_today)

        # use sigma series starting at `date` so sigma_series.iloc[0] is not NaN
        sigma_series_slice = realized_vol[INDEX].loc[date:].dropna()
        if sigma_series_slice.empty:
            continue

        pnl = option_pnl_series(
            S,
            K,
            T,
            sigma_series_slice,
            vega_notional=vega_notional,
        )

        ibov_pnl.append(pnl)

    # concatenate and sum across columns (skipna=True);
    if ibov_pnl:
        ibov_pnl = pd.concat(ibov_pnl, axis=1).sum(axis=1)
    else:
        ibov_pnl = pd.Series(dtype=float)

    # Allocation across singles (vega-neutral?)
    iterator = [c for c in prices.columns if c != INDEX and c in realized_vol.columns]

    per_name_vega = -vega_notional / len(iterator) if iterator else 0.0

    single_series_list = []
    for name in iterator:
        S_mean = prices[name].mean()
        sigma_series = realized_vol[name].iloc[RV_WINDOW:].dropna()
        if sigma_series.empty:
            continue
        sigma_proxy = implied_vol_proxy(sigma_series.iloc[0])
        K = strike_from_delta(S_mean, T, sigma_proxy.mean() if np.ndim(sigma_proxy) > 0 else sigma_proxy)

        pnl = option_pnl_series(
            S_mean,
            K,
            T,
            sigma_series,
            vega_notional=per_name_vega,
        )
        single_series_list.append(pnl)

    if single_series_list:
        single_pnl = pd.concat(single_series_list, axis=1).sum(axis=1)
    else:
        single_pnl = pd.Series(dtype=float)

    # align and add
    total_pnl = ibov_pnl.add(single_pnl, fill_value=0)
    cum_pnl = total_pnl.cumsum()

    # new plotting cell: show legs and total (daily + cumulative)
    df = pd.concat(
        [
            ibov_pnl.rename("ibov_pnl") if isinstance(ibov_pnl, pd.Series) else pd.Series(dtype=float),
            single_pnl.rename("single_pnl") if isinstance(single_pnl, pd.Series) else pd.Series(dtype=float),
            total_pnl.rename("total_pnl") if isinstance(total_pnl, pd.Series) else pd.Series(dtype=float),
        ],
        axis=1,
    ).fillna(0)

    df_cum = pd.concat(
        [
            ibov_pnl.cumsum().rename("ibov_pnl_cum") if isinstance(ibov_pnl, pd.Series) else pd.Series(dtype=float),
            single_pnl.cumsum().rename("single_pnl_cum") if isinstance(single_pnl, pd.Series) else pd.Series(dtype=float),
            total_pnl.cumsum().rename("total_pnl_cum") if isinstance(total_pnl, pd.Series) else pd.Series(dtype=float),
        ],
        axis=1,
    ).fillna(0)

    return df, df_cum


if __name__ == "__main__":
    df, df_cum = main()
    # When running as a script, show a quick summary
    print("Computed DataFrames:")
    print("df: ", df.shape)
    print("df_cum: ", df_cum.shape)
