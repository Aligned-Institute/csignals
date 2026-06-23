"""
Monday Morning Market Intelligence Brief
Huntsman Corporation — Performance Products Division
Covers: Macro environment, feedstock signals, chemical sector, demand outlook
"""

import os
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

import requests
import yfinance as yf
import anthropic
from openai import OpenAI
from dotenv import load_dotenv

# Load config/.env from project root
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / "config" / ".env")

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FRED_KEY = os.getenv("FRED_API_KEY", "")


# ─────────────────────────────────────────────────────────────
# 1. MARKET DATA — yfinance (no API key required)
# ─────────────────────────────────────────────────────────────

MARKET_TICKERS = {
    "crude_oil_wti": "CL=F",
    "natural_gas": "NG=F",
    "sp500": "^GSPC",
    "materials_sector_xlb": "XLB",       # XLB tracks chemicals, metals, mining
    "usd_eur": "EURUSD=X",
    "usd_cny": "CNYUSD=X",
    "brent_crude": "BZ=F",
    "dow_jones": "^DJI",
}


def fetch_market_data() -> dict:
    results = {}
    for name, ticker in MARKET_TICKERS.items():
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="10d")
            if len(hist) < 2:
                continue
            current = float(hist["Close"].iloc[-1])
            prev_close = float(hist["Close"].iloc[-2])
            week_start = float(hist["Close"].iloc[0])
            high_52w = float(hist["High"].max())
            low_52w = float(hist["Low"].min())

            change_1d = ((current - prev_close) / prev_close) * 100
            change_5d = ((current - week_start) / week_start) * 100

            results[name] = {
                "price": round(current, 2),
                "change_1d_pct": round(change_1d, 2),
                "change_5d_pct": round(change_5d, 2),
                "10d_high": round(high_52w, 2),
                "10d_low": round(low_52w, 2),
                "ticker": ticker,
            }
        except Exception as e:
            results[name] = {"error": str(e), "ticker": ticker}
    return results


# ─────────────────────────────────────────────────────────────
# 2. MACRO DATA — FRED API (free key)
# ─────────────────────────────────────────────────────────────

FRED_SERIES = {
    "fed_funds_rate":       ("FEDFUNDS",         "Fed Funds Rate (%)"),
    "cpi_all_items":        ("CPIAUCSL",          "CPI All Items (index)"),
    "real_gdp_growth":      ("A191RL1Q225SBEA",   "Real GDP Growth Rate (%)"),
    "housing_starts":       ("HOUST",             "Housing Starts (000s units)"),
    "building_permits":     ("PERMIT",            "Building Permits (000s units)"),
    "ppi_chemicals":        ("PCU325325",         "PPI: Chemical Manufacturing"),
    "industrial_production": ("INDPRO",           "Industrial Production Index"),
    "construction_spending": ("TTLCONS",          "Total Construction Spending ($M)"),
}


def fetch_fred_series(series_id: str, limit: int = 3) -> list | None:
    if not FRED_KEY:
        return None
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": FRED_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        obs = r.json().get("observations", [])
        return [
            {"date": o["date"], "value": float(o["value"])}
            for o in obs
            if o["value"] != "."
        ]
    except Exception:
        return None


def fetch_macro_data() -> dict:
    macro = {}
    if not FRED_KEY:
        return macro
    for key, (series_id, label) in FRED_SERIES.items():
        obs = fetch_fred_series(series_id, limit=2)
        if obs:
            latest = obs[0]
            prev = obs[1] if len(obs) > 1 else None
            change = None
            if prev and prev["value"]:
                change = round(
                    ((latest["value"] - prev["value"]) / abs(prev["value"])) * 100, 2
                )
            macro[key] = {
                "label": label,
                "value": latest["value"],
                "date": latest["date"],
                "prev_value": prev["value"] if prev else None,
                "prev_date": prev["date"] if prev else None,
                "change_pct": change,
            }
    return macro


# ─────────────────────────────────────────────────────────────
# 3. INDUSTRY NEWS — RSS feeds (no key required)
# ─────────────────────────────────────────────────────────────

NEWS_FEEDS = [
    ("ICIS Chemical Business", "https://www.icis.com/explore/resources/news/feed/"),
    ("Oil Price News",          "https://oilprice.com/rss/main"),
    ("Chemical Week",           "https://chemweek.com/CW/Feed/RSS"),
    ("Reuters Commodities",     "https://feeds.reuters.com/reuters/businessNews"),
]

CHEMICAL_KEYWORDS = [
    "polyurethane", "MDI", "isocyanate", "propylene", "benzene",
    "chemical", "petrochemical", "feedstock", "specialty chemical",
    "polymer", "naphtha", "crude", "oil", "natural gas", "energy",
    "manufacturing", "industrial", "construction", "housing",
    "inflation", "interest rate", "GDP", "tariff", "supply chain",
]


def fetch_news() -> list:
    headlines = []
    for source, url in NEWS_FEEDS:
        try:
            r = requests.get(
                url, timeout=8,
                headers={"User-Agent": "Mozilla/5.0 (compatible; MarketBrief/1.0)"}
            )
            # Extract titles from RSS — handles both CDATA and plain
            titles = re.findall(r"<title><!\[CDATA\[(.*?)\]\]></title>", r.text)
            if not titles:
                titles = re.findall(r"<title>(.*?)</title>", r.text)
                titles = [t for t in titles[1:] if len(t.strip()) > 20]  # skip channel
            for title in titles[:8]:
                clean = re.sub(r"<[^>]+>", "", title).strip()
                if clean and len(clean) > 15:
                    headlines.append({"source": source, "headline": clean})
        except Exception:
            pass

    # Prioritize chemically relevant headlines
    relevant = [
        h for h in headlines
        if any(kw.lower() in h["headline"].lower() for kw in CHEMICAL_KEYWORDS)
    ]
    other = [h for h in headlines if h not in relevant]
    return (relevant + other)[:14]


# ─────────────────────────────────────────────────────────────
# 4. STATISTICAL SUMMARY — trend + anomaly flags
# ─────────────────────────────────────────────────────────────

def build_stat_flags(market: dict) -> list:
    """Flag notable moves: >2% 1-day or >5% 5-day."""
    flags = []
    thresholds = {"1d": 2.0, "5d": 5.0}
    labels = {
        "crude_oil_wti": "WTI Crude",
        "natural_gas": "Natural Gas",
        "materials_sector_xlb": "XLB Materials",
        "usd_eur": "EUR/USD",
        "sp500": "S&P 500",
    }
    for key, label in labels.items():
        d = market.get(key, {})
        if "price" not in d:
            continue
        d1 = d.get("change_1d_pct", 0)
        d5 = d.get("change_5d_pct", 0)
        if abs(d1) >= thresholds["1d"]:
            direction = "UP" if d1 > 0 else "DOWN"
            flags.append(f"ALERT: {label} {direction} {abs(d1):.1f}% in 1 day")
        if abs(d5) >= thresholds["5d"]:
            direction = "UP" if d5 > 0 else "DOWN"
            flags.append(f"WATCH: {label} {direction} {abs(d5):.1f}% over 5 days")
    return flags


# ─────────────────────────────────────────────────────────────
# 5. CLAUDE SYNTHESIS
# ─────────────────────────────────────────────────────────────

BRIEF_PROMPT = """\
You are a senior market intelligence analyst preparing a weekly brief for the \
Global Market Intelligence Lead at Huntsman Corporation's Performance Products division.

HUNTSMAN PERFORMANCE PRODUCTS CONTEXT:
- Manufactures MDI-based polyurethane systems (insulation, automotive seating, footwear soles)
- Also produces amines, maleic anhydride (fuels/lubricants/consumer chemicals)
- Key feedstock cost drivers: crude oil → naphtha → benzene → aniline → MDI
- Secondary: propylene oxide, natural gas (energy cost), USD strength (export pricing)
- Key end-markets: construction/insulation, automotive, energy efficiency, consumer durables
- Headquarters: The Woodlands, TX — global supply chain with Asia/Europe exposure

Your brief goes to regional sales leads, marketing directors, and the division SVP \
in a Monday morning alignment call. It must be concise, specific, and action-oriented.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA FOR THIS WEEK ({date}):

MARKET PRICES (live via CME/NYSE feeds):
{market}

MACRO INDICATORS (FRED — most recent available):
{macro}

ANOMALY FLAGS (statistical alerts):
{flags}

INDUSTRY NEWS:
{news}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate the brief in EXACTLY this format — no section titles outside this structure:

PERFORMANCE PRODUCTS — WEEKLY MARKET INTELLIGENCE BRIEF
Week of {date}
Prepared by: Market Intelligence  |  Confidential — Internal Distribution Only

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. MACRO ENVIRONMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4 bullet points — cover: Fed rate posture, inflation trend with specific CPI number if available, \
GDP/growth signal, housing/construction demand context. Use exact numbers. \
Translate each macro number into what it means for industrial chemical demand.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. FEEDSTOCK & COMMODITY SIGNALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4 bullet points — cover: WTI crude move + MDI feedstock chain implication, \
Brent/WTI spread context, natural gas move + energy cost implication for chemical plants, \
USD/EUR + USD/CNY move + export/import pricing impact. Use $ and % from the data. \
Every bullet must connect the price move to a specific Huntsman margin or cost implication.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CHEMICAL SECTOR PULSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3 bullet points — cover: XLB materials sector performance vs S&P 500, \
PPI chemicals trend if available, 2 most relevant industry headlines with source + implication]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. MARGIN & DEMAND OUTLOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEAR-TERM (2–4 weeks):
[2 sentences — feedstock cost direction and what it implies for Performance Products margins]

DEMAND SIGNAL:
[2 sentences — what housing starts, construction spending, and industrial production imply \
for polyurethane demand across construction, automotive, and energy end-markets]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. SALES TEAM TALKING POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. [Quotable market context a sales rep can use with a construction/insulation buyer]
2. [Quotable pricing context or urgency signal — tied to crude/feedstock move]
3. [One watch item for next week — specific risk or opportunity with a trigger to monitor]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA SOURCES: CME/NYSE via yfinance  |  FRED macro series  |  ICIS / Chemical Week / Reuters
NEXT BRIEF: {next_date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rules:
- Every number cited must come from the data provided. No invented figures.
- If FRED data is missing, infer macro context from market proxies (XLB, S&P, crude).
- Each bullet max 2 lines. Executives skim — no padding.
- Talking points must be quotable — a sales rep should be able to say them verbatim.
- Tone: confident, precise, no hedging. This is a briefing, not a research note.
"""


def synthesize_brief(market: dict, macro: dict, flags: list, news: list, date: str) -> str:
    next_date = (datetime.strptime(date, "%Y-%m-%d") + timedelta(days=7)).strftime("%Y-%m-%d")

    prompt = BRIEF_PROMPT.format(
        date=date,
        next_date=next_date,
        market=json.dumps(market, indent=2),
        macro=json.dumps(macro, indent=2) if macro else "FRED_API_KEY not configured — using market proxies only",
        flags="\n".join(flags) if flags else "No anomalies detected this week",
        news=json.dumps(news[:10], indent=2) if news else "No news feeds available",
    )

    # Check if local Ollama is running and has deepseek-r1
    has_local_deepseek = False
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=2)
        if r.status_code == 200:
            models = [m["name"] for m in r.json().get("models", [])]
            if any("deepseek-r1" in m for m in models):
                has_local_deepseek = True
    except Exception:
        pass

    if has_local_deepseek:
        print("  [Local AI] Generating brief using local deepseek-r1 model...")
        local_client = OpenAI(base_url="http://localhost:11434/v1", api_key="local")
        completion = local_client.chat.completions.create(
            model="deepseek-r1:8b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
        )
        raw_content = completion.choices[0].message.content
        
        # Log deepseek reasoning to console if present
        think_match = re.search(r"<think>(.*?)</think>", raw_content, re.DOTALL)
        if think_match:
            print("\n" + "=" * 25 + " DEEPSEEK REASONING " + "=" * 25)
            print(think_match.group(1).strip())
            print("=" * 70 + "\n")
            
        # Strip thinking tags from final markdown brief
        cleaned_content = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL).strip()
        return cleaned_content
    else:
        if not ANTHROPIC_KEY:
            sys.exit("ERROR: ANTHROPIC_API_KEY not set in config/.env and local deepseek-r1 not found in Ollama.")
            
        print("  [Cloud AI] Generating brief using Claude API...")
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text


# ─────────────────────────────────────────────────────────────
# 6. OUTPUT
# ─────────────────────────────────────────────────────────────

def save_brief(text: str, date: str) -> Path:
    output_dir = PROJECT_ROOT / "output"
    output_dir.mkdir(exist_ok=True)
    path = output_dir / f"brief_{date}.md"
    path.write_text(text)
    return path


def save_dashboard_data(market: dict, macro: dict, flags: list, date: str) -> Path:
    """Write dashboard-ready JSON to terminal/public/brief_data.json."""

    def feedstock_status(c1d: float) -> str:
        if c1d > 3: return 'danger'
        if c1d > 1.5: return 'warning'
        return 'ok'

    def demand_status(c1d: float, c5d: float) -> str:
        if c1d < -2 or c5d < -3: return 'danger'
        if c1d < -1: return 'warning'
        return 'ok'

    # Commodity cards
    commodities = []
    card_cfg = [
        ('crude_oil_wti',        'WTI Crude Oil',  'MDI feedstock input',  '/bbl',   '1d', 'feed'),
        ('natural_gas',          'Natural Gas',    'Plant energy cost',    '/MMBtu', '1d', 'feed'),
        ('materials_sector_xlb', 'XLB Materials',  'Sector benchmark',     '',       '1d', 'dem'),
        ('sp500',                'S&P 500',        'Demand environment',   '',       '5d', 'dem'),
        ('brent_crude',          'Brent Crude',    'Asia feedstock proxy', '/bbl',   '1d', 'feed'),
        ('usd_eur',              'EUR / USD',      'Export pricing FX',    '',       '1d', 'fx'),
    ]
    for key, label, sublabel, unit, period, kind in card_cfg:
        d = market.get(key, {})
        if 'price' not in d:
            continue
        p   = d['price']
        c1  = d.get('change_1d_pct', 0)
        c5  = d.get('change_5d_pct', 0)
        chg = c5 if period == '5d' else c1

        if kind == 'feed':  status = feedstock_status(c1)
        elif kind == 'dem': status = demand_status(c1, c5)
        else:               status = 'ok'

        if key in ('crude_oil_wti', 'brent_crude', 'natural_gas'):
            val = f'${p:.2f}'
        elif key == 'usd_eur':
            val = f'{p:.4f}'
        elif key == 'sp500':
            val = f'{p:,.0f}'
        else:
            val = f'${p:.2f}'

        notes = {
            'crude_oil_wti':        'Feedstock cost alert' if status != 'ok' else 'Feedstock stable',
            'natural_gas':          'Trending toward 10d high' if c1 > 1 else 'Plant energy stable',
            'materials_sector_xlb': 'Underperforming S&P' if c1 < -1 else 'In line with market',
            'sp500':                'Risk-off rotation' if c5 < -2 else 'Demand environment stable',
            'brent_crude':          'Supply/Hormuz risk' if c1 > 1.5 else 'Asia proxy stable',
            'usd_eur':              'Mild USD softness' if c1 > 0.2 else 'FX stable',
        }

        commodities.append({
            'label': label, 'sublabel': sublabel, 'value': val,
            'unit': unit, 'change': round(chg, 2), 'period': period,
            'status': status, 'note': notes.get(key, ''),
        })

    # Macro cards — 4 key FRED demand signals
    def macro_card(key, label, unit, period, fred_id, fmt_val, status_fn, note_fn):
        m = macro.get(key)
        if not m:
            return {'label': label, 'value': '—', 'unit': unit, 'change': 0,
                    'period': period, 'status': 'ok', 'note': 'Run brief to populate', 'fred': fred_id}
        v = m['value']
        c = m.get('change_pct') or 0
        return {'label': label, 'value': fmt_val(v), 'unit': unit, 'change': round(c, 2),
                'period': period, 'status': status_fn(v, c), 'note': note_fn(v, c), 'fred': fred_id}

    macro_cards = [
        macro_card('housing_starts',    'Housing Starts',  'units/mo', 'MoM', 'HOUST',
            lambda v: f'{v:,.0f}K',
            lambda v, c: 'warning' if c < 0 else 'ok',
            lambda v, c: 'Permits trend signals H2 recovery' if c < 0 else 'Construction demand stable'),
        macro_card('fed_funds_rate',    'Fed Funds Rate',  '',         'MoM', 'FEDFUNDS',
            lambda v: f'{v:.2f}%',
            lambda v, c: 'ok' if c <= 0 else 'warning',
            lambda v, c: 'Shallow easing — construction financing still tight' if v > 3 else 'Rates declining — construction tailwind building'),
        macro_card('real_gdp_growth',   'Real GDP Growth', 'annlzd',   'QoQ', 'A191RL1Q225SBEA',
            lambda v: f'+{v:.1f}%' if v >= 0 else f'{v:.1f}%',
            lambda v, c: 'ok' if v > 1 else ('warning' if v > 0 else 'danger'),
            lambda v, c: 'Rebounding — industrial demand floor forming' if v > 1 else 'Growth slow — monitor industrial volumes'),
        macro_card('ppi_chemicals',     'PPI Chemicals',   'index',    'MoM', 'PCU325325',
            lambda v: f'{v:.1f}',
            lambda v, c: 'danger' if c > 1.5 else ('warning' if c > 0.5 else 'ok'),
            lambda v, c: 'Price increase window open now' if c > 1.5 else f'Chemical PPI +{c:.1f}% MoM — costs rising'),
    ]

    # Anomaly banner
    has_anomaly = bool(flags)
    banner = ' · '.join(flags[:2]) if flags else ''
    if flags and any('crude' in f.lower() or 'WTI' in f for f in flags):
        banner += ' · MDI feedstock cost impact expected in 2–3 weeks'

    payload = {
        'generated_date': date,
        'has_anomaly': has_anomaly,
        'anomaly_banner': banner,
        'commodities': commodities,
        'macro': macro_cards,
    }

    public_dir = PROJECT_ROOT / 'terminal' / 'public'
    public_dir.mkdir(exist_ok=True)
    out_path = public_dir / 'brief_data.json'
    out_path.write_text(json.dumps(payload, indent=2))

    output_dir = PROJECT_ROOT / 'output'
    output_dir.mkdir(exist_ok=True)
    (output_dir / 'brief_data_latest.json').write_text(json.dumps(payload, indent=2))

    return out_path


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    today = datetime.now().strftime("%Y-%m-%d")

    print("\n  ╔══════════════════════════════════════════════════════╗")
    print("  ║  Huntsman Performance Products — Market Brief        ║")
    print(f"  ║  {today}                                         ║")
    print("  ╚══════════════════════════════════════════════════════╝\n")

    print("  [1/4] Fetching live commodity & equity prices...")
    market = fetch_market_data()
    loaded = sum(1 for v in market.values() if "price" in v)
    print(f"        ↳ {loaded}/{len(MARKET_TICKERS)} tickers loaded")

    print("  [2/4] Fetching FRED macro indicators...")
    macro = fetch_macro_data()
    if macro:
        print(f"        ↳ {len(macro)} series loaded: {', '.join(macro.keys())}")
    else:
        print("        ↳ FRED key not set — add FRED_API_KEY to config/.env for macro data")
        print("          (Get free key at https://fred.stlouisfed.org/docs/api/api_key.html)")

    print("  [3/4] Scanning chemical industry news...")
    news = fetch_news()
    print(f"        ↳ {len(news)} headlines ({sum(1 for h in news if any(k.lower() in h['headline'].lower() for k in ['chemical','MDI','polyurethane','crude','feedstock']))} industry-specific)")

    flags = build_stat_flags(market)
    if flags:
        print(f"        ↳ {len(flags)} anomaly flag(s): {flags[0]}")

    print("  [4/4] Synthesizing brief with Claude (claude-sonnet-4-6)...")
    brief = synthesize_brief(market, macro, flags, news, today)

    path = save_brief(brief, today)
    data_path = save_dashboard_data(market, macro, flags, today)

    print("\n" + "═" * 62)
    print(brief)
    print("═" * 62)
    print(f"\n  Brief  → {path}")
    print(f"  Dashboard data → {data_path}\n")


if __name__ == "__main__":
    main()
