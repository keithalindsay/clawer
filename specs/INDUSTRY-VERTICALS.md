# Clawer Industry Verticals Specification

> **Version:** 1.0  
> **Created:** 2026-02-07  
> **Status:** Draft  
> **Template Reference:** [virattt/ai-hedge-fund](https://github.com/virattt/ai-hedge-fund) (45.7k ⭐)

---

## Table of Contents

1. [Vertical Strategy Overview](#1-vertical-strategy-overview)
2. [Vertical Template Architecture](#2-vertical-template-architecture)
3. [Finance Vertical (Template Reference)](#3-finance-vertical-template-reference)
4. [Law Vertical](#4-law-vertical)
5. [Accounting/Tax Vertical](#5-accountingtax-vertical)
6. [Healthcare Operations Vertical](#6-healthcare-operations-vertical)
7. [Real Estate Vertical](#7-real-estate-vertical)
8. [Marketing/Sales Vertical](#8-marketingsales-vertical)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Vertical Success Metrics](#10-vertical-success-metrics)
11. [Partner/White-Label Strategy](#11-partnerwhite-label-strategy)

---

## 1. Vertical Strategy Overview

### Why Verticals Win

**Specialization > Generalization**

| Factor | General AI Assistant | Industry Vertical |
|--------|---------------------|-------------------|
| Time to value | Days/weeks of setup | Minutes (pre-configured) |
| Domain accuracy | Good enough | Expert-level |
| Workflow fit | Generic | Industry-native |
| Compliance | DIY | Built-in |
| Switching cost | Low | High (sticky) |
| Willingness to pay | $20-50/mo | $150-400/mo |

**The ai-hedge-fund insight:** Users don't want a blank canvas. They want Warren Buffett analyzing their portfolio *right now*. The personality + pre-configuration + domain data combo creates instant, defensible value.

**Vertical economics:**
- 3-4x revenue per user vs base tier
- Higher retention (90%+ vs 80%)
- Lower support costs (purpose-built)
- Natural expansion within vertical (upsells)
- Network effects within industry (referrals)

### Pricing Strategy

```
Base Tier:           $49/month   - General OpenClaw, no specialization
Vertical Premium:    $149-399/mo - Industry-specific package
Enterprise Custom:   $999+/mo    - Custom vertical development
White-Label:         20% rev share - Partner-managed verticals
```

**Pricing principles:**
1. Price on value delivered, not features counted
2. Compliance-heavy verticals (healthcare, law) command premiums
3. Free tier with limited vertical access drives conversion
4. Annual discounts (20%) improve cash flow

### Build vs Partner vs White-Label Decision Framework

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERTICAL DECISION TREE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Does Clawer have domain expertise?                             │
│       │                                                          │
│       ├── YES ──► Market size > $10M ARR?                       │
│       │              │                                           │
│       │              ├── YES ──► BUILD IN-HOUSE                 │
│       │              │           (Finance, Marketing)           │
│       │              │                                           │
│       │              └── NO ───► PARTNER                        │
│       │                          (Niche verticals)              │
│       │                                                          │
│       └── NO ──► Compliance complexity high?                    │
│                     │                                            │
│                     ├── YES ──► WHITE-LABEL to expert           │
│                     │           (Healthcare, Legal)             │
│                     │                                            │
│                     └── NO ───► PARTNER with % rev share        │
│                                 (Real Estate, specific trades)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Decision factors:**
- **Build:** Core competency, large market, strategic moat
- **Partner:** Domain expertise gap, medium market, shared risk
- **White-label:** Compliance risk, specialized distribution, volume play

---

## 2. Vertical Template Architecture

Every vertical follows this standardized structure:

```
vertical-name/
├── agents/
│   ├── specialized/           # 3-5 domain experts with personalities
│   │   ├── expert-1.yaml
│   │   ├── expert-2.yaml
│   │   └── PERSONALITY.md     # Agent personality guidelines
│   ├── analysis/              # Domain-specific analysis agents
│   │   ├── analyzer-1.yaml
│   │   └── analyzer-2.yaml
│   └── coordination/          # Decision-making, risk, execution
│       ├── manager.yaml
│       └── coordinator.yaml
│
├── skills/                    # Pre-installed OpenClaw skills
│   ├── skill-1/
│   ├── skill-2/
│   └── manifest.yaml          # Skill bundle definition
│
├── data-sources/              # Pre-integrated APIs and databases
│   ├── source-1.yaml
│   ├── source-2.yaml
│   └── credentials.template   # Required API keys
│
├── dashboard/                 # Industry-specific UI components
│   ├── widgets/
│   │   ├── widget-1.tsx
│   │   └── widget-2.tsx
│   ├── pages/
│   │   └── vertical-home.tsx
│   └── manifest.yaml
│
├── compliance/                # Industry regulations
│   ├── requirements.md
│   ├── audit-log.yaml
│   └── data-handling.yaml
│
├── SOUL.md                    # Vertical-specific personality
├── README.md                  # Setup and usage
├── config.yaml                # Vertical configuration
└── docker-compose.yaml        # Container orchestration
```

### Agent Definition Schema

```yaml
# agents/specialized/expert-1.yaml
name: "Warren Buffett"
type: specialized
personality:
  archetype: "Value Investor"
  traits:
    - patient
    - contrarian
    - long-term focused
  communication_style: "folksy wisdom with sharp insight"
  famous_quotes:
    - "Be fearful when others are greedy"
    - "Price is what you pay, value is what you get"
  decision_framework: |
    1. Does the business have a durable competitive advantage?
    2. Is management honest and competent?
    3. Is the price significantly below intrinsic value?
    4. Can I understand the business?

capabilities:
  - intrinsic_value_analysis
  - moat_assessment
  - management_evaluation
  - margin_of_safety_calculation

system_prompt: |
  You are Warren Buffett, the Oracle of Omaha. You've been investing 
  successfully for over 70 years. You focus on businesses, not stock 
  prices. You're patient, disciplined, and think in decades, not quarters.
  
  When analyzing investments:
  - Look for companies with durable competitive advantages ("moats")
  - Prefer simple businesses you can understand
  - Focus on return on equity and owner earnings
  - Demand a margin of safety in price
  - Ignore market noise and short-term volatility

tools:
  - financial_statements
  - intrinsic_value_calculator
  - moat_analyzer
```

### Coordination Agent Schema

```yaml
# agents/coordination/portfolio-manager.yaml
name: "Portfolio Manager"
type: coordination
role: final_decision_maker

inputs:
  - agent: "Warren Buffett"
    weight: 0.25
  - agent: "Cathie Wood"
    weight: 0.20
  - agent: "Michael Burry"
    weight: 0.25
  - agent: "Ray Dalio"
    weight: 0.15
  - agent: "Risk Manager"
    weight: 0.15

decision_rules:
  - name: "Consensus Required"
    description: "Need 3/4 specialized agents to agree for action"
    threshold: 0.75
    
  - name: "Risk Veto"
    description: "Risk Manager can veto any position"
    agent: "Risk Manager"
    action: veto
    
  - name: "Position Sizing"
    description: "Size based on conviction level"
    rules:
      high_conviction: 0.10  # 10% of portfolio
      medium_conviction: 0.05
      low_conviction: 0.02

output_format:
  decision: buy|sell|hold
  ticker: string
  allocation_pct: number
  reasoning: string
  dissenting_opinions: list
```

### Skills Bundle Schema

```yaml
# skills/manifest.yaml
name: "finance-vertical-skills"
version: "1.0.0"
vertical: finance

skills:
  - name: stock-screener
    path: ./stock-screener
    description: "Screen stocks by fundamental and technical criteria"
    required_apis:
      - financial-datasets
      
  - name: dcf-calculator
    path: ./dcf-calculator
    description: "Discounted cash flow valuation model"
    
  - name: earnings-analyzer
    path: ./earnings-analyzer
    description: "Parse and analyze earnings calls and reports"
    required_apis:
      - sec-edgar
      
  - name: backtest-runner
    path: ./backtest-runner
    description: "Backtest trading strategies"
    
  - name: portfolio-tracker
    path: ./portfolio-tracker
    description: "Track positions, P&L, and performance"

dependencies:
  python: ">=3.10"
  packages:
    - pandas
    - numpy
    - yfinance
    - openbb
```

---

## 3. Finance Vertical (Template Reference)

> **Model:** virattt/ai-hedge-fund  
> **Price:** $199/month  
> **Target:** Retail investors, RIAs, family offices  

### Vertical SOUL.md

```markdown
# Finance Vertical SOUL

You are a sophisticated investment analysis platform powered by multiple 
AI agents, each embodying the investment philosophy of legendary investors.

## Core Mission
Provide institutional-quality investment analysis to individual investors 
and small advisory firms.

## Personality
- Analytical and data-driven
- Balanced between multiple investment philosophies
- Educational—explain reasoning, not just conclusions
- Humble about uncertainty and risks

## Key Principles
1. Never provide specific buy/sell recommendations without disclaimers
2. Always show the reasoning, not just the conclusion
3. Present dissenting opinions alongside consensus
4. Emphasize risk management over return maximization
5. Encourage long-term thinking over short-term trading

## Disclaimers (Always Include)
- "This is not financial advice"
- "Past performance does not guarantee future results"
- "Consult a licensed financial advisor before making decisions"
```

### Specialized Agents

#### Warren Buffett Agent

| Attribute | Value |
|-----------|-------|
| **Philosophy** | Value Investing |
| **Time Horizon** | 10+ years |
| **Focus Areas** | Moats, ROE, owner earnings, management quality |
| **Famous For** | Berkshire Hathaway, avoiding tech (initially) |

**System Prompt:**
```
You are Warren Buffett, chairman of Berkshire Hathaway. Your investment 
philosophy centers on:

1. CIRCLE OF COMPETENCE: Only invest in businesses you understand
2. ECONOMIC MOAT: Look for durable competitive advantages
3. MARGIN OF SAFETY: Buy at prices significantly below intrinsic value
4. LONG-TERM: Think like an owner, not a trader
5. QUALITY MANAGEMENT: Invest in honest, capable leaders

When analyzing a stock:
- Calculate owner earnings (net income + depreciation - capex)
- Assess return on equity (prefer >15% consistently)
- Evaluate debt levels (prefer low debt)
- Consider the business in 10 years
- Ignore short-term price movements

Communication style: Folksy Midwestern wisdom, Omaha metaphors, 
self-deprecating humor, clear explanations of complex concepts.

Key phrases you use:
- "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price"
- "Our favorite holding period is forever"
- "Be fearful when others are greedy, and greedy when others are fearful"
```

**Tools:**
- `intrinsic_value_calculator` - DCF and owner earnings methods
- `moat_analyzer` - Competitive advantage assessment
- `management_evaluator` - Insider ownership, compensation, track record
- `financial_statement_analyzer` - Balance sheet, income statement, cash flow

#### Cathie Wood Agent

| Attribute | Value |
|-----------|-------|
| **Philosophy** | Disruptive Innovation |
| **Time Horizon** | 5-7 years |
| **Focus Areas** | AI, robotics, genomics, fintech, energy storage |
| **Famous For** | ARK Invest, Tesla calls, high conviction bets |

**System Prompt:**
```
You are Cathie Wood, founder of ARK Invest. Your investment philosophy 
centers on disruptive innovation:

1. INNOVATION PLATFORMS: AI, robotics, energy storage, genomics, blockchain
2. WRIGHT'S LAW: Costs decline predictably with cumulative production
3. S-CURVES: Identify technologies approaching exponential adoption
4. HIGH CONVICTION: Concentrate in highest-conviction ideas
5. LONG-TERM: 5-7 year investment horizon minimum

When analyzing a company:
- Is it a platform for innovation or just a product?
- What's the addressable market in 5 years?
- Is management executing on innovation roadmap?
- Are costs declining on a learning curve?
- Could this 10x in 5 years?

Communication style: Optimistic, forward-looking, technically detailed,
references to research and data, conviction in the face of short-term volatility.

Key phrases you use:
- "We believe..."
- "Our research suggests..."
- "The market is not appreciating the convergence of..."
- "Short-term volatility creates long-term opportunity"
```

**Tools:**
- `tam_calculator` - Total addressable market sizing
- `wrights_law_analyzer` - Cost curve projections
- `innovation_tracker` - Patent filings, R&D spend, product launches
- `disruption_scorer` - Framework for assessing disruption potential

#### Michael Burry Agent

| Attribute | Value |
|-----------|-------|
| **Philosophy** | Deep Value / Contrarian |
| **Time Horizon** | 2-5 years |
| **Focus Areas** | Hidden assets, misunderstood situations, shorts |
| **Famous For** | "The Big Short", water investments, contrarian calls |

**System Prompt:**
```
You are Michael Burry, founder of Scion Asset Management. Your investment
philosophy centers on deep, independent research:

1. DO YOUR OWN RESEARCH: Never trust consensus; verify everything
2. FIND WHAT OTHERS MISS: Look where no one else is looking
3. CONTRARIAN: Be willing to be alone and wrong for extended periods
4. DEEP VALUE: Find assets trading below liquidation value
5. SHORTS: Identify bubbles and frauds

When analyzing a situation:
- What does everyone believe that's wrong?
- What are the hidden assets on the balance sheet?
- What would a liquidation yield?
- Is management incentivized correctly?
- What's the downside if I'm wrong?

Communication style: Terse, data-heavy, sometimes cryptic, 
references to historical parallels, skeptical of narratives.

Key phrases you use:
- "The data shows..."
- "Nobody is looking at..."
- "This reminds me of..."
- *tweets cryptic warnings*
```

**Tools:**
- `hidden_asset_finder` - Balance sheet deep dives
- `short_interest_analyzer` - Crowded trades, squeeze potential
- `fraud_detector` - Accounting red flags, Beneish M-Score
- `liquidation_value_calculator` - Asset-based valuation

#### Ray Dalio Agent

| Attribute | Value |
|-----------|-------|
| **Philosophy** | Macro / All-Weather |
| **Time Horizon** | Full cycle (7-10 years) |
| **Focus Areas** | Economic cycles, debt, global macro, risk parity |
| **Famous For** | Bridgewater, Principles, debt cycle framework |

**System Prompt:**
```
You are Ray Dalio, founder of Bridgewater Associates. Your investment
philosophy centers on understanding economic machines:

1. ECONOMIC MACHINE: Economies follow predictable cycles
2. DEBT CYCLES: Short-term (5-8 yr) and long-term (75-100 yr)
3. RISK PARITY: Balance risk across asset classes
4. PRINCIPLES: Make decisions based on tested principles
5. RADICAL TRANSPARENCY: Acknowledge what you don't know

When analyzing the macro environment:
- Where are we in the short-term debt cycle?
- Where are we in the long-term debt cycle?
- What are central banks doing and why?
- What are the implications for different asset classes?
- How should portfolios be positioned?

Communication style: Principled, systematic, educational,
historical analogies, humble about uncertainty.

Key phrases you use:
- "I want to understand..."
- "The economic machine works like..."
- "History shows that..."
- "The principle here is..."
```

**Tools:**
- `debt_cycle_analyzer` - Debt levels, deleveraging indicators
- `macro_dashboard` - Fed policy, rates, inflation, employment
- `risk_parity_calculator` - Asset allocation optimization
- `historical_analog_finder` - Similar historical periods

### Analysis Agents

#### Valuation Agent

**Purpose:** Calculate intrinsic value using multiple methodologies

**Methods:**
1. **DCF (Discounted Cash Flow)**
   - Project free cash flows 5-10 years
   - Terminal value calculation
   - Discount at WACC
   
2. **Comparable Company Analysis**
   - P/E, EV/EBITDA, P/S multiples
   - Peer group selection
   - Relative valuation
   
3. **Dividend Discount Model**
   - For dividend-paying stocks
   - Gordon Growth Model
   - Multi-stage DDM
   
4. **Asset-Based Valuation**
   - Book value analysis
   - Liquidation value
   - Sum-of-parts

**Output Schema:**
```yaml
valuation_output:
  ticker: string
  current_price: number
  intrinsic_value:
    dcf:
      value: number
      assumptions:
        growth_rate: number
        discount_rate: number
        terminal_multiple: number
    comparables:
      value: number
      peer_group: list
      multiple_used: string
    dividend_discount:
      value: number
      assumptions:
        dividend_growth: number
        required_return: number
  fair_value_range:
    low: number
    mid: number
    high: number
  margin_of_safety: percentage
  recommendation: undervalued|fairly_valued|overvalued
```

#### Fundamentals Agent

**Purpose:** Analyze financial statements and key ratios

**Analysis Areas:**

1. **Profitability**
   - Gross margin, operating margin, net margin
   - ROE, ROA, ROIC
   - Trend analysis (5-year)

2. **Liquidity**
   - Current ratio, quick ratio
   - Cash conversion cycle
   - Working capital trends

3. **Solvency**
   - Debt/equity, debt/EBITDA
   - Interest coverage
   - Debt maturity schedule

4. **Efficiency**
   - Asset turnover
   - Inventory turnover
   - Receivables turnover

5. **Quality of Earnings**
   - Accruals ratio
   - Cash flow vs net income
   - One-time items

**Output Schema:**
```yaml
fundamentals_output:
  ticker: string
  overall_grade: A|B|C|D|F
  profitability:
    grade: string
    metrics:
      gross_margin: {value: number, trend: up|down|flat}
      operating_margin: {value: number, trend: up|down|flat}
      roe: {value: number, vs_industry: above|below|inline}
  liquidity:
    grade: string
    concerns: list
  solvency:
    grade: string
    debt_levels: healthy|moderate|concerning|dangerous
  efficiency:
    grade: string
    metrics: object
  earnings_quality:
    grade: string
    red_flags: list
  summary: string
```

#### Technicals Agent

**Purpose:** Chart analysis and technical indicators

**Indicators Analyzed:**

1. **Trend**
   - Moving averages (20, 50, 200 SMA/EMA)
   - ADX (trend strength)
   - Trendlines

2. **Momentum**
   - RSI (overbought/oversold)
   - MACD (trend changes)
   - Stochastic

3. **Volume**
   - Volume trends
   - OBV (on-balance volume)
   - Volume profile

4. **Volatility**
   - Bollinger Bands
   - ATR (average true range)
   - Historical volatility

5. **Patterns**
   - Chart patterns (head & shoulders, cups, flags)
   - Candlestick patterns
   - Support/resistance levels

**Output Schema:**
```yaml
technicals_output:
  ticker: string
  timeframe: daily|weekly|monthly
  overall_signal: bullish|bearish|neutral
  trend:
    direction: up|down|sideways
    strength: strong|moderate|weak
    above_moving_averages: [20, 50, 200]
  momentum:
    rsi: {value: number, signal: overbought|oversold|neutral}
    macd: {signal: bullish|bearish, histogram_trend: up|down}
  volume:
    trend: increasing|decreasing|flat
    unusual_activity: boolean
  key_levels:
    support: [number]
    resistance: [number]
  patterns_detected: list
  trade_setup:
    entry: number
    stop_loss: number
    target: number
    risk_reward: number
```

#### Sentiment Agent

**Purpose:** Analyze news, social media, and market sentiment

**Data Sources:**
1. News articles (financial news APIs)
2. Social media (Twitter/X, Reddit, StockTwits)
3. Earnings call transcripts
4. Analyst ratings and price targets
5. Insider trading activity
6. Options flow (put/call ratio)

**Analysis Methods:**
1. **NLP Sentiment Scoring**
   - Article-level sentiment
   - Entity-level sentiment (CEO, product, etc.)
   - Trend over time

2. **Social Buzz Tracking**
   - Mention volume
   - Sentiment shift
   - Influencer activity

3. **Earnings Call Analysis**
   - Management tone
   - Q&A sentiment
   - Guidance language

**Output Schema:**
```yaml
sentiment_output:
  ticker: string
  overall_sentiment: bullish|bearish|neutral
  sentiment_score: number  # -1 to +1
  news:
    article_count_24h: number
    average_sentiment: number
    key_themes: list
    notable_articles: list
  social:
    mention_volume: number
    volume_change: percentage
    sentiment: number
    trending: boolean
  analysts:
    buy_ratings: number
    hold_ratings: number
    sell_ratings: number
    average_price_target: number
    recent_changes: list
  insiders:
    net_buying_90d: boolean
    notable_transactions: list
  options:
    put_call_ratio: number
    unusual_activity: list
  earnings_call:
    management_tone: positive|negative|neutral
    key_quotes: list
```

#### Macro Agent

**Purpose:** Analyze economic environment and policy

**Indicators Tracked:**

1. **Federal Reserve**
   - Fed funds rate and projections
   - Balance sheet (QE/QT)
   - Fed speak analysis
   - Dot plot

2. **Economic Data**
   - GDP growth
   - Unemployment
   - Inflation (CPI, PCE)
   - PMI/ISM

3. **Market Indicators**
   - Yield curve (2s10s, 3m10y)
   - Credit spreads
   - VIX
   - Dollar index

4. **Global Factors**
   - China economic data
   - Europe (ECB policy)
   - Geopolitical risks

**Output Schema:**
```yaml
macro_output:
  assessment_date: date
  economic_regime: expansion|late_cycle|recession|recovery
  risk_level: low|moderate|elevated|high
  fed:
    current_rate: number
    expected_direction: hiking|cutting|holding
    next_meeting: date
    probability_of_cut: percentage
  economic_data:
    gdp_growth: number
    unemployment: number
    inflation: number
    leading_indicators: improving|deteriorating|stable
  market_indicators:
    yield_curve: normal|flat|inverted
    credit_spreads: tight|normal|wide
    vix: low|normal|elevated|fear
  asset_class_implications:
    equities: positive|negative|neutral
    bonds: positive|negative|neutral
    commodities: positive|negative|neutral
    cash: positive|negative|neutral
  risks:
    - description: string
      probability: low|medium|high
      impact: low|medium|high
```

### Coordination Agents

#### Risk Manager

**Purpose:** Position sizing, stop losses, portfolio risk

**Responsibilities:**
1. **Position Sizing**
   - Kelly Criterion (fractional)
   - Volatility-based sizing
   - Maximum position limits

2. **Stop Loss Rules**
   - Technical stops
   - Volatility-based stops
   - Time-based exits

3. **Portfolio Risk**
   - Sector concentration limits
   - Factor exposure
   - Correlation analysis
   - VaR/CVaR

4. **Veto Power**
   - Can veto any trade that violates risk rules
   - Alerts on concentration
   - Drawdown management

**Risk Rules:**
```yaml
risk_rules:
  position_sizing:
    max_single_position: 0.10  # 10% max
    volatility_adjustment: true  # Size inversely to volatility
    kelly_fraction: 0.25  # Quarter Kelly
    
  stop_losses:
    default_stop: 0.15  # 15% below entry
    atr_based: true  # 2x ATR stop
    trailing_stop: 0.20  # 20% trailing
    
  portfolio_limits:
    max_sector_exposure: 0.30  # 30% per sector
    max_correlation: 0.70  # Avoid highly correlated positions
    cash_minimum: 0.10  # Always 10% cash
    
  drawdown_rules:
    reduce_at: 0.10  # Reduce exposure at 10% drawdown
    stop_at: 0.20  # Stop trading at 20% drawdown
```

#### Portfolio Manager

**Purpose:** Final decision-making and execution

**Responsibilities:**
1. **Aggregate Signals**
   - Weight inputs from all agents
   - Resolve conflicts
   - Make final call

2. **Execution**
   - Order type selection
   - Timing considerations
   - Transaction cost awareness

3. **Rebalancing**
   - Periodic rebalancing
   - Drift tolerance
   - Tax-loss harvesting opportunities

4. **Reporting**
   - Performance attribution
   - Holding explanations
   - Risk reports

**Decision Framework:**
```yaml
decision_framework:
  signal_aggregation:
    specialized_agents:
      warren_buffett: 0.25
      cathie_wood: 0.20
      michael_burry: 0.25
      ray_dalio: 0.15
    analysis_agents:
      valuation: 0.20
      fundamentals: 0.20
      technicals: 0.10
      sentiment: 0.10
      macro: 0.10
    coordination:
      risk_manager: veto_power
      
  decision_thresholds:
    strong_buy: 0.80  # 80%+ conviction
    buy: 0.65
    hold: 0.40-0.65
    sell: 0.30
    strong_sell: 0.20
    
  conflict_resolution:
    # If Buffett and Burry agree, weight increases
    value_alignment_bonus: 0.10
    # Risk manager veto overrides all
    risk_veto: absolute
```

### Data Sources

#### Financial Datasets API

**Provider:** [financialdatasets.ai](https://financialdatasets.ai/)

```yaml
financial_datasets:
  free_tier:
    stocks: [AAPL, GOOGL, MSFT, NVDA, TSLA]
    data_types:
      - income_statements
      - balance_sheets
      - cash_flow_statements
      - prices
      - key_metrics
      
  paid_tier:  # $50/month
    stocks: all_us_stocks
    additional:
      - institutional_ownership
      - insider_trades
      - earnings_estimates
      
  integration:
    type: rest_api
    auth: api_key
    rate_limit: 100/minute
```

#### SEC EDGAR

**Provider:** SEC (Free)

```yaml
sec_edgar:
  data_types:
    - 10-K (annual reports)
    - 10-Q (quarterly reports)
    - 8-K (material events)
    - DEF 14A (proxy statements)
    - 13-F (institutional holdings)
    - Form 4 (insider trades)
    
  integration:
    type: rest_api
    base_url: https://www.sec.gov/cgi-bin/browse-edgar
    rate_limit: 10/second (be nice)
    
  parsing:
    method: custom_parser
    output: structured_json
```

#### FRED (Federal Reserve Economic Data)

**Provider:** St. Louis Fed (Free)

```yaml
fred:
  key_series:
    - GDP: gross domestic product
    - UNRATE: unemployment rate
    - CPIAUCSL: CPI inflation
    - FEDFUNDS: federal funds rate
    - T10Y2Y: 10Y-2Y spread
    - BAMLH0A0HYM2: high yield spread
    - VIXCLS: VIX
    
  integration:
    type: rest_api
    auth: api_key (free)
    python_package: fredapi
```

#### News APIs

```yaml
news_sources:
  primary:
    - provider: polygon.io
      data: market_news
      cost: included_in_subscription
      
    - provider: newsapi.org
      data: general_news
      cost: free_tier_limited
      
  earnings:
    - provider: alpha_vantage
      data: earnings_calendar
      
    - provider: financialmodelingprep
      data: earnings_transcripts
```

### Skills Bundle

#### Stock Screener

```yaml
skill: stock-screener
description: Screen stocks by fundamental and technical criteria

filters:
  fundamentals:
    - market_cap: {min: number, max: number}
    - pe_ratio: {min: number, max: number}
    - debt_equity: {max: number}
    - roe: {min: number}
    - revenue_growth: {min: number}
    
  technicals:
    - above_sma_50: boolean
    - above_sma_200: boolean
    - rsi: {min: number, max: number}
    - volume_avg: {min: number}
    
  presets:
    - name: "Buffett Screen"
      filters:
        roe: {min: 15}
        debt_equity: {max: 0.5}
        pe_ratio: {max: 20}
        
    - name: "Growth Screen"
      filters:
        revenue_growth: {min: 20}
        market_cap: {min: 1000000000}
        
output:
  - ticker
  - company_name
  - sector
  - matched_criteria
  - score
```

#### DCF Calculator

```yaml
skill: dcf-calculator
description: Discounted cash flow valuation

inputs:
  ticker: string
  growth_assumptions:
    years_1_5: percentage
    years_6_10: percentage
    terminal_growth: percentage
  discount_rate: percentage  # or auto-calculate WACC
  
calculations:
  1. Fetch current financials
  2. Project free cash flows
  3. Calculate terminal value
  4. Discount to present
  5. Subtract debt, add cash
  6. Divide by shares outstanding
  
output:
  intrinsic_value_per_share: number
  current_price: number
  margin_of_safety: percentage
  sensitivity_table: matrix
  assumptions_used: object
```

#### Earnings Analyzer

```yaml
skill: earnings-analyzer
description: Parse and analyze earnings reports and calls

inputs:
  ticker: string
  quarter: string  # "Q4 2024"
  
analysis:
  - revenue_vs_estimate
  - eps_vs_estimate
  - guidance_change
  - management_tone
  - key_topics
  - analyst_questions
  
output:
  beat_or_miss: beat|miss|inline
  surprise_magnitude: percentage
  guidance: raised|lowered|maintained
  sentiment_score: number
  key_takeaways: list
  red_flags: list
  transcript_summary: string
```

#### Backtest Runner

```yaml
skill: backtest-runner
description: Backtest trading strategies

inputs:
  strategy:
    type: custom|preset
    rules:
      entry: string  # e.g., "RSI < 30 AND above SMA200"
      exit: string   # e.g., "RSI > 70 OR stop_loss_15%"
      position_size: percentage
      
  universe: list[ticker]
  timeframe:
    start: date
    end: date
  initial_capital: number
  
output:
  performance:
    total_return: percentage
    cagr: percentage
    sharpe_ratio: number
    max_drawdown: percentage
    win_rate: percentage
    
  comparison:
    vs_spy: percentage
    vs_qqq: percentage
    
  trades:
    total: number
    winners: number
    losers: number
    average_win: percentage
    average_loss: percentage
    
  equity_curve: timeseries
  monthly_returns: table
```

#### Portfolio Tracker

```yaml
skill: portfolio-tracker
description: Track positions, P&L, and performance

features:
  - Position entry with cost basis
  - Real-time P&L
  - Performance vs benchmarks
  - Dividend tracking
  - Tax lot management
  
views:
  - Holdings summary
  - Performance chart
  - Sector allocation
  - Risk metrics
  - Transaction history
  
alerts:
  - Price alerts
  - Stop loss triggers
  - Rebalancing reminders
  - Earnings dates
```

### Dashboard Widgets

```yaml
widgets:
  - name: portfolio-overview
    type: summary-card
    metrics:
      - total_value
      - daily_change
      - total_return
      
  - name: agent-signals
    type: multi-agent-display
    shows:
      - each_agent_recommendation
      - confidence_level
      - reasoning_summary
      
  - name: market-dashboard
    type: data-grid
    data:
      - major_indices
      - sector_performance
      - economic_calendar
      
  - name: watchlist
    type: table
    features:
      - real_time_prices
      - agent_ratings
      - alerts
      
  - name: analysis-feed
    type: timeline
    content:
      - agent_analyses
      - news_summaries
      - trade_signals
```

### Compliance

```yaml
compliance:
  disclaimers:
    - "Not financial advice"
    - "Past performance..."
    - "Consult licensed advisor"
    
  data_handling:
    - No personal financial data stored
    - Positions optional to share
    - API keys encrypted at rest
    
  audit_trail:
    - All recommendations logged
    - Agent reasoning preserved
    - User actions tracked
    
  regulations:
    - Not a registered investment advisor
    - Educational/informational only
    - User responsible for own decisions
```

---

## 4. Law Vertical

> **Price:** $299/month  
> **Target:** Solo practitioners, small firms, legal departments  
> **Compliance:** Attorney-client privilege, data residency  

### Vertical SOUL.md

```markdown
# Law Vertical SOUL

You are a sophisticated legal analysis platform. You assist lawyers and 
legal professionals with research, document review, and practice management.

## Core Mission
Enhance legal practice efficiency while maintaining the highest standards 
of accuracy, confidentiality, and professional responsibility.

## Key Principles
1. NEVER provide legal advice to end clients—only assist attorneys
2. Always cite sources and acknowledge limitations
3. Privilege and confidentiality are sacred
4. When in doubt, recommend consulting specialist counsel
5. Accuracy > speed

## Disclaimers
- "This analysis is for attorney use only"
- "Not a substitute for professional legal judgment"
- "Verify all citations before relying on them"
```

### Specialized Agents

#### Contract Counsel Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Contract drafting and review |
| **Experience Level** | 15+ years transactional practice |
| **Focus Areas** | Commercial contracts, M&A, licensing |

**Capabilities:**
- Contract review and markup
- Clause extraction and analysis
- Risk identification
- Standard clause library
- Negotiation strategy

**System Prompt:**
```
You are an experienced transactional attorney with 15+ years drafting and 
negotiating commercial contracts. You've worked at AmLaw 100 firms and 
in-house at Fortune 500 companies.

When reviewing contracts:
1. Identify all material terms and conditions
2. Flag unusual or risky provisions
3. Compare against market standards
4. Suggest specific redlines with explanations
5. Prioritize issues by risk level

Communication style: Precise, business-aware, practical. Explain legal 
concepts in terms business people understand. Always provide specific 
language, not just general guidance.
```

#### Litigation Strategist Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Case analysis and strategy |
| **Experience Level** | Former federal prosecutor, civil litigator |
| **Focus Areas** | Case assessment, motion practice, trial prep |

**Capabilities:**
- Case strength assessment
- Precedent analysis
- Motion drafting assistance
- Discovery strategy
- Settlement evaluation

**System Prompt:**
```
You are a seasoned litigator with experience as a federal prosecutor and 
civil litigation partner. You've tried dozens of cases to verdict.

When analyzing a case:
1. Identify the key legal issues and claims
2. Assess the strength of each claim/defense (1-10)
3. Find analogous precedents and distinguish them
4. Identify discovery needs and strategy
5. Evaluate settlement value vs trial risk

Communication style: Strategic, analytical, candid about weaknesses. 
Think like opposing counsel to stress-test theories.
```

#### Compliance Officer Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Regulatory compliance |
| **Experience Level** | Former regulator and in-house counsel |
| **Focus Areas** | SEC, HIPAA, GDPR, employment law, industry-specific |

**Capabilities:**
- Regulatory requirement tracking
- Compliance gap analysis
- Policy drafting
- Deadline monitoring
- Risk assessment

#### Legal Researcher Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Case law and statutory research |
| **Experience Level** | Former law clerk, research attorney |
| **Focus Areas** | Federal and state case law, statutes, regulations |

**Capabilities:**
- Case law research
- Statutory analysis
- Regulatory history
- Secondary source synthesis
- Shepardizing/citation checking

### Analysis Agents

#### Contract Risk Analyzer

**Purpose:** Automatically extract and score contract risks

**Analysis:**
1. **Clause Extraction**
   - Indemnification
   - Limitation of liability
   - Termination rights
   - IP assignment
   - Non-compete
   - Governing law

2. **Risk Scoring**
   - Red flags (highly unusual)
   - Yellow flags (negotiate)
   - Green (market standard)

3. **Benchmark Comparison**
   - vs industry standards
   - vs client's typical terms
   - vs counterparty leverage

**Output Schema:**
```yaml
contract_risk_output:
  overall_risk: low|medium|high|critical
  deal_breakers: list
  key_terms:
    - clause_type: string
      location: string
      risk_level: red|yellow|green
      summary: string
      recommendation: string
      suggested_redline: string
  missing_provisions: list
  unusual_terms: list
  negotiation_priority: ordered_list
```

#### Case Precedent Finder

**Purpose:** Find relevant case law and analyze applicability

**Search Strategies:**
1. **Key fact matching** - Similar fact patterns
2. **Legal issue matching** - Same legal questions
3. **Jurisdiction filtering** - Binding vs persuasive
4. **Recency weighting** - Prefer recent decisions
5. **Outcome filtering** - Favorable vs unfavorable

**Output Schema:**
```yaml
precedent_output:
  query: string
  jurisdiction: string
  cases_found: number
  top_cases:
    - citation: string
      case_name: string
      court: string
      date: date
      relevance_score: number
      key_holding: string
      key_facts: string
      favorable: boolean
      distinguishing_factors: list
  persuasive_cases: list
  adverse_authority: list
  recommended_citations: list
```

#### Regulatory Tracker

**Purpose:** Monitor regulatory changes and compliance deadlines

**Tracks:**
- New regulations (federal, state)
- Proposed rules
- Comment periods
- Enforcement actions
- Guidance documents

#### Document Summarizer

**Purpose:** Summarize legal documents efficiently

**Documents:**
- Briefs and motions
- Depositions
- Discovery responses
- Contracts
- Regulations

### Coordination Agents

#### Matter Manager

**Purpose:** Coordinate legal matters/cases

**Functions:**
- Matter intake and setup
- Task assignment
- Deadline tracking
- Document management
- Status reporting
- Budget monitoring

#### Billing Tracker

**Purpose:** Time and billing management

**Functions:**
- Time entry assistance
- Narrative generation
- Invoice preparation
- Budget vs actual
- Client reporting

### Data Sources

```yaml
data_sources:
  case_law:
    - provider: courtlistener
      type: api
      cost: free
      coverage: federal_and_state
      
    - provider: case_text_free
      type: scraping
      coverage: limited
      
  regulations:
    - provider: regulations.gov
      type: api
      cost: free
      data: federal_regulations
      
    - provider: ecfr.io
      type: api
      cost: free
      data: code_of_federal_regulations
      
  sec_filings:
    - provider: sec_edgar
      type: api
      cost: free
      data: corporate_filings
      
  state_courts:
    - varies by jurisdiction
    - many free PACER alternatives
```

### Skills Bundle

```yaml
skills:
  - name: contract-analyzer
    description: Upload and analyze contracts
    features:
      - clause_extraction
      - risk_scoring
      - redline_suggestions
      
  - name: case-research
    description: Legal research across jurisdictions
    features:
      - case_search
      - statute_lookup
      - citation_checking
      
  - name: document-drafting
    description: Draft legal documents from templates
    templates:
      - contracts
      - motions
      - letters
      - memos
      
  - name: time-tracker
    description: Track billable time
    features:
      - timer
      - narrative_assist
      - matter_linking
      
  - name: client-intake
    description: New client/matter intake
    features:
      - conflict_check
      - engagement_letter
      - matter_setup
```

### Compliance

```yaml
compliance:
  attorney_client_privilege:
    - All communications potentially privileged
    - No sharing without authorization
    - Encryption required
    
  data_residency:
    - US data stays in US
    - EU option for GDPR
    - Client-specific options
    
  professional_responsibility:
    - No UPL (unauthorized practice)
    - Attorney supervision required
    - Competence standards
    
  audit_trail:
    - All access logged
    - Document versions preserved
    - Immutable audit log
    
  security:
    - SOC 2 Type II
    - Encryption at rest and transit
    - Role-based access
```

---

## 5. Accounting/Tax Vertical

> **Price:** $249/month  
> **Target:** CPAs, bookkeepers, small business owners  
> **Compliance:** SOC2, data encryption, audit trails  

### Vertical SOUL.md

```markdown
# Accounting/Tax Vertical SOUL

You are a sophisticated financial management platform for accounting 
professionals and business owners.

## Core Mission
Streamline accounting workflows, minimize tax liability legally, and 
provide actionable financial insights.

## Key Principles
1. Accuracy is non-negotiable—double-check calculations
2. Conservative positions unless risk tolerance specified
3. Always consider tax implications of transactions
4. Deadlines are sacred—never miss a filing date
5. Document everything for audit defense

## Disclaimers
- "Consult a licensed CPA for specific tax advice"
- "Tax laws vary by jurisdiction"
- "This is not a substitute for professional judgment"
```

### Specialized Agents

#### Tax Strategist Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Tax planning and optimization |
| **Credentials** | CPA, former IRS, Big 4 experience |
| **Focus Areas** | Individual, business, estate tax |

**Capabilities:**
- Tax projection and planning
- Entity structure optimization
- Deduction maximization
- Retirement planning
- Audit defense strategy

**System Prompt:**
```
You are an experienced tax strategist with CPA credentials, former IRS 
experience, and Big 4 background. You specialize in legal tax minimization.

When analyzing a tax situation:
1. Understand the complete financial picture
2. Identify all available deductions and credits
3. Consider timing strategies (acceleration/deferral)
4. Evaluate entity structure implications
5. Project multi-year tax impact

Communication style: Precise, numbers-focused, explain the "why" behind 
strategies. Always distinguish between aggressive and conservative positions.
```

#### Bookkeeper Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Transaction categorization and reconciliation |
| **Experience** | High-volume multi-client practice |
| **Focus Areas** | Daily bookkeeping, categorization, cleanup |

**Capabilities:**
- Auto-categorization with learning
- Bank reconciliation
- Invoice processing
- Expense management
- Month-end close

#### Auditor Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Anomaly detection and compliance |
| **Background** | Internal audit, external audit |
| **Focus Areas** | Fraud detection, compliance, controls |

**Capabilities:**
- Anomaly detection
- Duplicate detection
- Ratio analysis
- Compliance checking
- Red flag identification

#### CFO Advisor Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Financial strategy and analysis |
| **Background** | CFO of growth companies |
| **Focus Areas** | Cash flow, forecasting, decision support |

**Capabilities:**
- Cash flow forecasting
- Scenario modeling
- Financial KPI tracking
- Board reporting
- Strategic recommendations

### Analysis Agents

#### Transaction Classifier

**Purpose:** Auto-categorize transactions with high accuracy

**Methods:**
1. **Pattern matching** - Vendor name → category
2. **ML classification** - Description analysis
3. **Rule-based** - Amount patterns, recurring
4. **User learning** - Improve from corrections

**Output:**
```yaml
classification_output:
  transaction_id: string
  predicted_category: string
  confidence: percentage
  alternatives:
    - category: string
      confidence: percentage
  tax_relevant: boolean
  needs_review: boolean
  similar_past_transactions: list
```

#### Tax Liability Calculator

**Purpose:** Estimate tax liability across jurisdictions

**Calculations:**
- Federal income tax (brackets, AMT)
- State income tax
- Self-employment tax
- Estimated payments
- Credits and deductions

#### Cash Flow Forecaster

**Purpose:** Project future cash flows

**Inputs:**
- Historical patterns
- Known receivables/payables
- Seasonal adjustments
- User assumptions

**Output:**
- 13-week cash flow
- Stress scenarios
- Recommended cash buffer

#### Audit Risk Scorer

**Purpose:** Assess audit risk and flag issues

**Factors:**
- Unusual ratios
- Industry comparisons
- Red flag transactions
- Prior audit history
- Return characteristics

### Coordination Agents

#### Engagement Manager

**Purpose:** Client relationship and project coordination

**Functions:**
- Client onboarding
- Document collection
- Project tracking
- Communication log
- Deliverable tracking

#### Deadline Tracker

**Purpose:** Never miss a deadline

**Tracks:**
- Federal filing dates
- State filing dates
- Estimated payments
- Extensions
- Client-specific deadlines

### Data Sources

```yaml
data_sources:
  accounting_platforms:
    - provider: quickbooks_api
      type: oauth2
      data: full_access
      
    - provider: xero_api
      type: oauth2
      data: full_access
      
  banking:
    - provider: plaid
      type: oauth2
      data: transactions_balances
      
  irs:
    - provider: irs_publications
      type: web
      data: tax_rules_forms
      
  state_tax:
    - varies by state
    - automated monitoring
```

### Skills Bundle

```yaml
skills:
  - name: receipt-scanner
    description: OCR and categorize receipts
    
  - name: bank-reconciliation
    description: Match and reconcile bank feeds
    
  - name: tax-estimator
    description: Calculate estimated tax liability
    
  - name: financial-reports
    description: Generate P&L, balance sheet, cash flow
    
  - name: client-portal
    description: Secure document exchange with clients
```

### Compliance

```yaml
compliance:
  soc2:
    - Type II certification
    - Annual audits
    
  encryption:
    - At rest: AES-256
    - In transit: TLS 1.3
    
  audit_trail:
    - All changes logged
    - Immutable history
    - User attribution
    
  data_retention:
    - 7 years default
    - Client-specific policies
    
  access_controls:
    - Role-based access
    - MFA required
    - Session management
```

---

## 6. Healthcare Operations Vertical

> **Price:** $399/month  
> **Target:** Medical practices, clinics, small hospitals  
> **Compliance:** HIPAA, BAA required, PHI handling  

### Vertical SOUL.md

```markdown
# Healthcare Operations Vertical SOUL

You are a healthcare practice management platform focused on operations,
billing, and administrative efficiency—NOT clinical decision-making.

## Core Mission
Streamline healthcare administration so providers can focus on patients.

## Scope Limitations
- Operations and billing ONLY
- NO clinical decision support
- NO diagnosis or treatment recommendations
- NO patient-facing interactions without provider approval

## Key Principles
1. HIPAA compliance is non-negotiable
2. PHI handling follows minimum necessary
3. Speed matters for prior auths—but accuracy first
4. Denials are revenue leakage—minimize them
5. Patient experience affects everything

## Disclaimers
- "For administrative use only—not clinical guidance"
- "Always verify insurance information"
- "Coding suggestions require provider review"
```

### Specialized Agents

#### Patient Intake Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Scheduling and registration |
| **Experience** | High-volume multi-provider practice |
| **Focus Areas** | Scheduling, demographics, forms |

**Capabilities:**
- Appointment scheduling
- Patient registration
- Form distribution
- Reminder automation
- Wait list management

#### Insurance Navigator Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Coverage and authorization |
| **Experience** | Payer relations, appeals |
| **Focus Areas** | Eligibility, benefits, prior auth |

**Capabilities:**
- Real-time eligibility
- Benefits interpretation
- Prior auth initiation
- Approval tracking
- Appeals drafting

#### Clinical Documentation Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Documentation assistance |
| **Experience** | Medical scribe, HIM |
| **Focus Areas** | Note templates, documentation gaps |

**Capabilities:**
- Note template suggestions
- Documentation gap alerts
- Coding hints (for provider review)
- Quality measure tracking

#### Billing Specialist Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Medical coding and claims |
| **Credentials** | CPC, experience with major payers |
| **Focus Areas** | CPT/ICD coding, claim submission, denials |

**Capabilities:**
- Coding suggestions
- Claim scrubbing
- Submission tracking
- Denial management
- Payment posting

### Analysis Agents

#### Eligibility Verifier

**Purpose:** Real-time insurance eligibility checks

**Checks:**
- Active coverage
- Effective dates
- Copay/deductible
- In-network status
- Prior auth requirements

#### Prior Auth Predictor

**Purpose:** Predict authorization approval likelihood

**Factors:**
- Procedure code
- Diagnosis code
- Payer patterns
- Clinical documentation
- Prior history

**Output:**
- Approval probability
- Required documentation
- Average turnaround
- Appeal likelihood if denied

#### Coding Optimizer

**Purpose:** Suggest optimal CPT/ICD codes

**Analysis:**
- Documentation review
- Code appropriateness
- Unbundling alerts
- Modifier suggestions
- Revenue optimization (compliant)

#### Denial Analyzer

**Purpose:** Analyze denials and suggest appeals

**Analysis:**
- Denial reason categorization
- Appeal success probability
- Root cause identification
- Documentation gaps
- Process improvements

### Coordination Agents

#### Care Coordinator

**Purpose:** Care coordination and follow-ups

**Functions:**
- Follow-up scheduling
- Referral tracking
- Care gap alerts
- Patient outreach
- Transition management

#### Revenue Cycle Manager

**Purpose:** End-to-end revenue cycle oversight

**Functions:**
- Claims tracking
- Aging analysis
- KPI monitoring
- Staff alerts
- Executive reporting

### Data Sources

```yaml
data_sources:
  ehr:
    - provider: epic_fhir
      type: fhir_r4
      data: clinical_admin
      
    - provider: cerner_fhir
      type: fhir_r4
      data: clinical_admin
      
  eligibility:
    - provider: availity
      type: api
      data: eligibility_claims
      
    - provider: change_healthcare
      type: api
      data: eligibility_claims
      
  fee_schedules:
    - provider: cms
      type: web
      data: medicare_fee_schedule
      
  drug_data:
    - provider: fda_openfda
      type: api
      data: drug_info
```

### Skills Bundle

```yaml
skills:
  - name: eligibility-check
    description: Real-time insurance verification
    
  - name: prior-auth
    description: Prior authorization workflow
    
  - name: claim-tracker
    description: Track claims through lifecycle
    
  - name: denial-manager
    description: Manage and appeal denials
    
  - name: scheduling
    description: Patient appointment management
```

### Compliance

```yaml
compliance:
  hipaa:
    requirements:
      - Privacy Rule compliance
      - Security Rule compliance
      - Breach notification ready
      
    controls:
      - Access controls (RBAC)
      - Audit logging
      - Encryption (rest/transit)
      - Minimum necessary
      - De-identification options
      
  baa:
    - Required for all customers
    - Template provided
    - Annual review
    
  phi_handling:
    - Data minimization
    - Purpose limitation
    - Storage limitations
    - No PHI in logs
    
  certifications:
    - SOC 2 Type II
    - HITRUST (target)
```

---

## 7. Real Estate Vertical

> **Price:** $199/month  
> **Target:** Agents, brokers, investors, property managers  
> **Focus:** Transaction efficiency and investment analysis  

### Vertical SOUL.md

```markdown
# Real Estate Vertical SOUL

You are a real estate professional's intelligent assistant, focused on 
deal analysis, market research, and transaction coordination.

## Core Mission
Help real estate professionals close more deals, faster, with better analysis.

## Key Principles
1. Data-driven valuations (no wishful thinking)
2. Speed to respond wins deals
3. Relationship management is everything
4. Every market is local—hyperlocal matters
5. Investment math must be conservative

## Disclaimers
- "Market data may have delays"
- "Valuations are estimates, not appraisals"
- "Verify all information before relying"
```

### Specialized Agents

#### Property Analyst Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Property valuation and analysis |
| **Background** | Appraiser, investment analyst |
| **Focus Areas** | Valuation, comps, condition assessment |

**Capabilities:**
- ARV calculation
- Comp analysis
- Rent estimates
- Condition assessment
- Value-add opportunities

**System Prompt:**
```
You are an experienced real estate analyst with appraisal and investment 
background. You think like a conservative investor—no rosy projections.

When analyzing a property:
1. Pull and analyze comparable sales
2. Adjust for condition, location, features
3. Calculate multiple valuation approaches
4. Identify value-add opportunities
5. Stress-test the numbers

Communication style: Numbers-first, conservative assumptions, clear 
about uncertainty ranges.
```

#### Market Researcher Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Market trends and demographics |
| **Background** | Urban planning, market research |
| **Focus Areas** | Appreciation trends, demographics, development |

**Capabilities:**
- Market trend analysis
- Demographic research
- Development tracking
- Rent growth analysis
- Neighborhood scoring

#### Deal Underwriter Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Investment analysis |
| **Background** | Private equity real estate |
| **Focus Areas** | Returns, cash flow, financing |

**Capabilities:**
- Cap rate analysis
- Cash-on-cash return
- IRR projections
- Financing scenarios
- Sensitivity analysis

#### Client Relationship Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | CRM and client management |
| **Background** | Top-producing agent |
| **Focus Areas** | Follow-ups, nurturing, transactions |

**Capabilities:**
- Client tracking
- Follow-up automation
- Transaction coordination
- Market updates
- Anniversary/birthday reminders

### Analysis Agents

#### Valuation Engine

**Purpose:** Multi-method property valuation

**Methods:**
1. **Sales Comparison** - Adjusted comps
2. **Income Approach** - Cap rate, GRM
3. **Cost Approach** - Replacement cost
4. **ARV** - After repair value

**Output:**
```yaml
valuation_output:
  address: string
  property_type: string
  
  sales_comparison:
    value: number
    comps_used: number
    confidence: low|medium|high
    
  income_approach:
    noi: number
    cap_rate: percentage
    value: number
    
  arv:
    current_value: number
    repair_costs: number
    arv: number
    profit_margin: percentage
    
  recommended_value:
    low: number
    mid: number
    high: number
```

#### Market Trend Analyzer

**Purpose:** Local market analysis

**Tracks:**
- Days on market
- Price per sqft trends
- Inventory levels
- Absorption rate
- Year-over-year appreciation

#### Deal Scorer

**Purpose:** Score deals against criteria

**Criteria (customizable):**
- Cash flow positive
- Cap rate minimum
- Location quality
- Value-add potential
- Exit strategies

#### Comparable Finder

**Purpose:** Find and adjust comparable sales

**Adjustments:**
- Location
- Size (price/sqft)
- Condition
- Age
- Features
- Date of sale

### Coordination Agents

#### Transaction Coordinator

**Purpose:** Manage transaction lifecycle

**Tracks:**
- Contract to close checklist
- Deadlines and contingencies
- Document collection
- Party coordination
- Closing preparation

#### Pipeline Manager

**Purpose:** Deal flow and pipeline

**Tracks:**
- Lead to close pipeline
- Stage progression
- Probability weighting
- Revenue forecast
- Activity metrics

### Data Sources

```yaml
data_sources:
  mls:
    - varies by market
    - RESO Web API where available
    - Often requires brokerage relationship
    
  public_data:
    - provider: zillow_api
      type: api
      data: zestimates_listings
      
    - provider: redfin_api
      type: api
      data: listings_trends
      
    - provider: realtor_api
      type: api
      data: listings
      
  census:
    - provider: census_api
      type: api
      data: demographics
      
  rent_data:
    - provider: rentometer
      type: api
      data: rent_comps
```

### Skills Bundle

```yaml
skills:
  - name: property-analyzer
    description: Comprehensive property analysis
    
  - name: crm
    description: Client relationship management
    
  - name: showing-scheduler
    description: Schedule and confirm showings
    
  - name: offer-generator
    description: Generate and track offers
    
  - name: market-reports
    description: Generate market analysis reports
```

---

## 8. Marketing/Sales Vertical

> **Price:** $149/month  
> **Target:** Marketing agencies, sales teams, small business  
> **Focus:** Lead generation, content, and pipeline  

### Vertical SOUL.md

```markdown
# Marketing/Sales Vertical SOUL

You are a marketing and sales intelligence platform focused on 
generating leads, creating content, and closing deals.

## Core Mission
Help marketing and sales teams generate more qualified leads and 
close more business through intelligent automation.

## Key Principles
1. Quality > quantity for leads
2. Personalization at scale
3. Data-driven optimization
4. Multi-channel coordination
5. Speed to lead matters

## Voice
Energetic, results-focused, testing-oriented. Talk about metrics, 
conversion rates, and ROI. Push for experimentation.
```

### Specialized Agents

#### Content Strategist Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Content creation and messaging |
| **Background** | Brand agency, content marketing |
| **Focus Areas** | Copy, campaigns, brand voice |

**Capabilities:**
- Content ideation
- Copy generation
- Campaign messaging
- Brand voice maintenance
- A/B test suggestions

#### SEO Specialist Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Search optimization |
| **Background** | Technical and content SEO |
| **Focus Areas** | Keywords, content, technical |

**Capabilities:**
- Keyword research
- Content optimization
- Technical SEO audits
- Competitor analysis
- Ranking tracking

#### Sales Development Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Outbound sales and follow-up |
| **Background** | Top SDR, sales leadership |
| **Focus Areas** | Prospecting, outreach, qualification |

**Capabilities:**
- Prospect research
- Outreach personalization
- Follow-up sequences
- Objection handling
- Meeting scheduling

#### Analytics Interpreter Agent

| Attribute | Value |
|-----------|-------|
| **Specialty** | Marketing analytics and insights |
| **Background** | Marketing analytics, data science |
| **Focus Areas** | Metrics, attribution, optimization |

**Capabilities:**
- Performance analysis
- Attribution modeling
- Trend identification
- Recommendations
- Executive reporting

### Analysis Agents

#### Lead Scorer

**Purpose:** Score and prioritize leads

**Factors:**
- Demographic fit
- Behavioral signals
- Engagement history
- Intent signals
- Timing indicators

#### Campaign Analyzer

**Purpose:** Analyze campaign performance

**Metrics:**
- Spend and ROI
- Conversion rates
- Attribution
- A/B test results
- Optimization opportunities

#### Competitor Monitor

**Purpose:** Track competitor activity

**Tracks:**
- Website changes
- Content publishing
- Pricing changes
- Ad activity
- Social presence

#### Content Performance Tracker

**Purpose:** Track content effectiveness

**Metrics:**
- Traffic and engagement
- Conversions
- SEO performance
- Social shares
- Lead generation

### Coordination Agents

#### Campaign Manager

**Purpose:** Orchestrate marketing campaigns

**Functions:**
- Campaign planning
- Asset coordination
- Channel execution
- Performance tracking
- Optimization

#### Pipeline Manager

**Purpose:** Sales pipeline management

**Functions:**
- Deal tracking
- Stage management
- Forecasting
- Activity management
- Win/loss analysis

### Data Sources

```yaml
data_sources:
  crm:
    - provider: hubspot_api
      type: oauth2
      data: full_access
      
    - provider: salesforce_api
      type: oauth2
      data: full_access
      
  analytics:
    - provider: google_analytics_api
      type: oauth2
      data: reporting
      
  social:
    - provider: linkedin_api
      type: oauth2
      data: company_pages
      
    - provider: twitter_api
      type: oauth2
      data: timeline_analytics
      
  email:
    - provider: mailchimp_api
      type: api_key
      data: campaigns_lists
```

### Skills Bundle

```yaml
skills:
  - name: lead-scorer
    description: Score and prioritize leads
    
  - name: content-generator
    description: Generate marketing content
    
  - name: seo-analyzer
    description: Analyze and optimize for SEO
    
  - name: email-sequencer
    description: Create and manage email sequences
    
  - name: campaign-tracker
    description: Track campaign performance
```

---

## 9. Implementation Roadmap

### Phase 1: Finance Vertical (Month 1-2)

**Week 1-2: Foundation**
- [ ] Fork ai-hedge-fund repository
- [ ] Analyze architecture and patterns
- [ ] Design Clawer integration layer
- [ ] Define agent YAML schema

**Week 3-4: Core Agents**
- [ ] Implement 4 specialized agents (Buffett, Wood, Burry, Dalio)
- [ ] Implement analysis agents
- [ ] Build coordination layer
- [ ] Test multi-agent decision flow

**Week 5-6: Data & Skills**
- [ ] Integrate Financial Datasets API
- [ ] Integrate SEC EDGAR
- [ ] Integrate FRED
- [ ] Build skills bundle (screener, DCF, etc.)

**Week 7-8: UI & Launch**
- [ ] Build dashboard widgets
- [ ] Build backtest visualization
- [ ] Beta testing with 10 users
- [ ] Launch to paid users

**Deliverables:**
- Finance Vertical v1.0
- Documentation
- Pricing page
- 10 beta users

### Phase 2: Law + Accounting Verticals (Month 3-4)

**Law Vertical:**
- [ ] Adapt Finance template
- [ ] Integrate CourtListener API
- [ ] Build contract analyzer skill
- [ ] Partner with legal advisor for review
- [ ] Compliance review (privilege, data)

**Accounting Vertical:**
- [ ] Adapt Finance template
- [ ] Integrate QuickBooks/Xero APIs
- [ ] Build tax estimator skill
- [ ] Partner with CPA advisor
- [ ] SOC2 compliance check

**Deliverables:**
- Law Vertical v1.0
- Accounting Vertical v1.0
- Partner agreements

### Phase 3: Healthcare + Real Estate (Month 5-6)

**Healthcare Vertical:**
- [ ] HIPAA compliance implementation
- [ ] BAA template creation
- [ ] FHIR integration (Epic, Cerner)
- [ ] PHI handling procedures
- [ ] Compliance audit

**Real Estate Vertical:**
- [ ] MLS partnership exploration
- [ ] Zillow/Redfin API integration
- [ ] Property analyzer skill
- [ ] CRM integration

**Deliverables:**
- Healthcare Vertical v1.0 (HIPAA compliant)
- Real Estate Vertical v1.0
- HIPAA documentation

### Phase 4: Marketing/Sales + Custom (Month 7+)

**Marketing/Sales Vertical:**
- [ ] HubSpot/Salesforce integrations
- [ ] Content generation skills
- [ ] Lead scoring skill
- [ ] Campaign analytics

**Custom Verticals Program:**
- [ ] Define custom vertical process
- [ ] Pricing structure ($15k+ build fee)
- [ ] Partner onboarding
- [ ] White-label documentation

**Deliverables:**
- Marketing/Sales Vertical v1.0
- Custom Vertical Program
- White-label partner kit

---

## 10. Vertical Success Metrics

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Vertical adoption rate | 30% of paid users | Users on vertical / total paid |
| Vertical retention | 90%+ (vs 80% base) | 12-month cohort retention |
| Revenue per user | 3x base tier | ARPU vertical / ARPU base |
| NPS by vertical | >60 | Quarterly NPS surveys |
| Time to value | <10 minutes | First meaningful output |
| Support tickets per user | 50% fewer vs base | Tickets / user / month |

### Per-Vertical Metrics

#### Finance Vertical
| Metric | Target |
|--------|--------|
| Portfolios tracked | 5+ per user |
| Analyses run/month | 50+ |
| Backtest runs/month | 10+ |
| Agent consensus accuracy | Track over time |

#### Law Vertical
| Metric | Target |
|--------|--------|
| Contracts analyzed/month | 20+ |
| Research queries/month | 100+ |
| Time saved/matter | 5+ hours |
| Citation accuracy | 99%+ |

#### Accounting Vertical
| Metric | Target |
|--------|--------|
| Transactions processed/month | 1000+ |
| Tax returns prepared | 10+ during season |
| Reconciliation accuracy | 99%+ |
| Deadlines missed | 0 |

#### Healthcare Vertical
| Metric | Target |
|--------|--------|
| Eligibility checks/month | 500+ |
| Prior auths submitted | 50+ |
| Denial overturn rate | 60%+ |
| Revenue cycle improvement | 10%+ |

#### Real Estate Vertical
| Metric | Target |
|--------|--------|
| Properties analyzed/month | 50+ |
| Deals in pipeline | 10+ |
| Offers generated | 5+ |
| Closing rate improvement | 15%+ |

#### Marketing/Sales Vertical
| Metric | Target |
|--------|--------|
| Leads scored/month | 500+ |
| Content pieces created | 20+ |
| Campaigns tracked | 10+ |
| Pipeline value increase | 20%+ |

### Review Cadence

- **Weekly:** Key metrics dashboard
- **Monthly:** Vertical performance review
- **Quarterly:** NPS and user interviews
- **Annually:** Vertical strategy review

---

## 11. Partner/White-Label Strategy

### Partner Types

#### Industry Partners

**Definition:** Domain experts who customize Clawer for their clients

**Example:** CPA firm adds accounting vertical for their 200 clients

**Terms:**
- 20% revenue share
- Partner manages clients
- Clawer provides platform
- Co-branded experience

**Requirements:**
- 50+ potential users
- Industry expertise
- Support capability
- Good standing

#### Agency White-Label

**Definition:** Agencies rebrand Clawer entirely

**Example:** Marketing agency offers "AgencyClaw" to clients

**Terms:**
- 30% revenue share
- Full white-label
- Agency billing
- Custom domain

**Requirements:**
- 100+ potential users
- Technical capability
- Financial stability
- Annual commitment

#### Enterprise Custom

**Definition:** Large organizations with custom vertical needs

**Example:** Hospital system needs custom healthcare vertical

**Terms:**
- $15k+ build fee
- $999+/month licensing
- Custom development
- Dedicated support

**Requirements:**
- $50k+ annual commitment
- Clear requirements
- Executive sponsor
- IT cooperation

### Partner Onboarding Process

```
Week 1: Discovery
├── Partner interview
├── Use case analysis
├── Technical assessment
└── Agreement signing

Week 2-3: Setup
├── Environment provisioning
├── Customization requirements
├── Branding setup
└── Integration planning

Week 4: Training
├── Platform training
├── Admin training
├── Support process
└── Go-live checklist

Week 5+: Launch
├── Pilot users
├── Feedback collection
├── Optimization
└── Full rollout
```

### Partner Success Metrics

| Metric | Target |
|--------|--------|
| Partner user activation | 80% within 30 days |
| Partner NPS | >50 |
| Partner churn | <10% annual |
| Revenue per partner | $5k+/month |

### Partner Support Model

**Tier 1:** Partner handles
- User questions
- Configuration
- Basic troubleshooting

**Tier 2:** Clawer escalation
- Technical issues
- Feature requests
- Bug reports

**Tier 3:** Engineering
- Platform issues
- Custom development
- Security concerns

---

## Appendix A: Technical Implementation Notes

### Container Architecture

```yaml
# docker-compose.yaml for vertical
version: '3.8'

services:
  clawer-core:
    image: clawer/core:latest
    environment:
      - VERTICAL=finance
      
  vertical-agents:
    image: clawer/finance-agents:latest
    depends_on:
      - clawer-core
    volumes:
      - ./agents:/app/agents
      
  vertical-skills:
    image: clawer/finance-skills:latest
    depends_on:
      - clawer-core
    volumes:
      - ./skills:/app/skills
      
  dashboard:
    image: clawer/dashboard:latest
    ports:
      - "3000:3000"
    environment:
      - VERTICAL=finance
```

### Agent Communication Protocol

```yaml
# Message format between agents
message:
  id: uuid
  timestamp: datetime
  from_agent: string
  to_agent: string
  type: analysis|recommendation|veto|consensus
  payload:
    ticker: string
    action: buy|sell|hold
    confidence: number
    reasoning: string
    data: object
```

### Skill Registration

```yaml
# How skills register with the platform
skill_registration:
  name: string
  version: semver
  description: string
  vertical: string
  
  capabilities:
    - name: string
      input_schema: json_schema
      output_schema: json_schema
      
  dependencies:
    - skill: string
      version: string
      
  resources:
    cpu: string
    memory: string
    
  api_keys_required:
    - name: string
      env_var: string
```

---

## Appendix B: Pricing Calculator

### Base Pricing Model

```
Monthly Revenue = (Base Users × $49) + Σ(Vertical Users × Vertical Price)

Example:
- 1000 total users
- 30% on verticals (300 users)
  - 100 Finance ($199) = $19,900
  - 80 Law ($299) = $23,920
  - 60 Accounting ($249) = $14,940
  - 40 Healthcare ($399) = $15,960
  - 20 Real Estate ($199) = $3,980
- 70% base tier (700 users × $49) = $34,300

Total MRR: $113,000
Vertical Revenue: $78,700 (70% of revenue from 30% of users)
```

### Vertical Premium Justification

| Vertical | Base Value | Vertical Value | Premium Factor |
|----------|------------|----------------|----------------|
| Finance | Generic AI | Expert + Data + Skills | 4x |
| Law | Generic AI | Compliance + Data + Skills | 6x |
| Accounting | Generic AI | Integrations + Compliance | 5x |
| Healthcare | Generic AI | HIPAA + Integrations | 8x |
| Real Estate | Generic AI | Data + Skills | 4x |
| Marketing | Generic AI | Integrations + Skills | 3x |

---

*Last Updated: 2026-02-07*
*Status: Ready for Review*
*Next Review: After Finance Vertical Beta*
