# Currency Converter

A small Angular app that converts between 17 world currencies using live mid-market rates from [Fixer.io](https://fixer.io).

Built by Hazal Sigic for the Netwealth Front-End Engineer take-home.

---

## Prerequisites

Node 20+ and npm 10+. No global installs required.

## Running it

You'll need a free Fixer.io API key to run the app — takes about 60 seconds:

1. Sign up at [fixer.io](https://fixer.io) and grab your access key from the dashboard.
2. Open `src/environments/environment.ts` and replace `YOUR_FIXER_API_KEY_HERE` with your key.

Then:

```bash
npm install
npm start
```

The app runs at `http://localhost:4200`.

To run the test suite:

```bash
npm test           # one-shot
npm run test:watch # re-runs on file changes
npm run test:ci    # single-run with coverage
```

44 tests across 7 files. They cover the API service (cross-rate maths, input validation, error handling), the NgRx Signals store (state setters, computed signals, the async convert pipeline), and each component.

---

## What it does

Pick a source currency, type an amount, pick a target currency. The converter shows the result, the underlying rate, and when that rate was last updated by Fixer.

The swap button between the two dropdowns flips source and target. Below 520px the layout stacks vertically and the swap button rotates 90 degrees to match.

The app opens to **GBP to EUR** by default. UK firm, UK clients, most common conversion in this context.

---

## Architecture decisions

A few choices worth explaining.

### NgRx Signals over the classic store

The Netwealth spec lists "NgRx/Redux experience" as a must-have and "Signals" as a nice-to-have. The signal store ([@ngrx/signals](https://ngrx.io/guide/signals)) gives you both in one move, same redux principles (single source of truth, immutable updates via `patchState`, derived state via `computed`) but without the five-file ceremony of actions/reducers/effects/selectors. For a feature this size, the classic pattern would have been overkill.

The store is provided at the **component level**, not in `root`, so the state's lifecycle is tied to the converter page. Navigate away and back and you get a fresh store. Cleaner than a global instance for a self-contained feature.

### The cross-rate workaround

Fixer's free plan has three relevant limitations:

- **EUR is the only base currency.** You can't ask Fixer for "USD to GBP" directly.
- **HTTP only.** HTTPS requires a paid plan.
- **100 requests per month.** Hard cap.

The first one shaped the service. To convert "X to Y", we fetch EUR-based rates for both currencies and compute the cross-rate locally:

```
rate(from → to) = rate(EUR → to) / rate(EUR → from)
```

This handles three branches: EUR as source, EUR as target, and the through-EUR cross-rate when neither side is EUR. The maths is the same in all three cases (we always go through EUR), but splitting them makes the intent more readable.

The HTTP limitation is acceptable for local development on `localhost`, but a real production deployment would need to proxy through a server-side endpoint to avoid mixed-content errors. Not addressed in this app.

### Fetch-on-every-change, not cached

Every time the user changes the amount, source, or target, we hit Fixer. We don't cache the rate even when only the amount changes.

I considered three caching strategies:

1. **Cache rates per currency pair.** Fast subsequent conversions, but leaving a tab open for two hours and changing the amount would compute against a stale rate.
2. **Cache with a TTL.** Solves the staleness window but introduces invisible behaviour the user can't see or control.
3. **ETag-based revalidation.** Fixer supports HTTP ETags, you can ask "is the data new?" and get a `304 Not Modified` for free. Saves bandwidth but uses the same quota, so it doesn't change the fundamental trade-off.

For a wealth-management context, freshness wins over efficiency. A client looking at a converted figure should be confident it's current. Not the right place to optimise quota usage.

### Reactive conversion trigger

The store is self-driving. A `computed` signal combines `source`, `target`, and `amount`; `toObservable` pipes it into the `convert` rxMethod in `onInit`. Any state change automatically kicks off the debounce-then-fetch cycle, the page component only calls setters, nothing else.

`loading: true` is set before the debounce, so the result panel fades immediately on the first keystroke rather than snapping to a new value after a silent 300ms. `switchMap` handles concurrency, if the user keeps typing, in-flight requests are cancelled and only the latest result lands in state.

### Showing the previous result while loading

When a refresh starts, we don't blank out the existing result. Instead the `<app-conversion-result>` panel stays visible and fades to 55% opacity, with a small "Updating…" badge in the top-right corner. The previous answer stays readable while the new one is being fetched.

This avoids layout-shift jank and matches what good finance UIs do — showing stale-but-correct beats a flash of nothing.

### What "Rate as of" actually means

The timestamp shown alongside the result is the *rate's last-update time from Fixer*, not "when the user clicked convert". On the free plan Fixer updates rates roughly hourly; on paid plans, every 60 seconds.

### Zoneless change detection

Generated with `--zoneless`. Together with NgRx Signals, the whole app's reactivity flows through one mechanism — change a signal, the components that read it re-render. No zone.js patching every async API in the browser, smaller bundle, more predictable.

---

## Project structure

```
src/app/
├── core/
│   ├── models/                Currency, ExchangeRateResponse, ConversionResult, ApiError
│   └── services/              CurrencyApiService — Fixer integration + cross-rate maths
└── features/currency-converter/
    ├── store/                 CurrencyConverterStore — NgRx Signals store
    ├── components/
    │   ├── currency-converter-page/   Smart container (provides the store)
    │   ├── amount-input/              Dumb numeric input
    │   ├── currency-select/           Dumb dropdown
    │   └── conversion-result/         Pure presentational result panel
    └── currency-converter.routes.ts
```


## Testing

The Netwealth spec lists Jest specifically, so the app uses Jest. Running tests takes about 15 seconds for the whole suite.

The pattern across all spec files is the same: mock the layer below the one you're testing. 

Fake timers (`jest.useFakeTimers()`) are used in any test that exercises the debounced conversion.

---

## What I'd change with more time

Honest list of things I noticed and didn't get to.

### Bidirectional editing

The most common feature on a real currency converter. Wise, Revolut, Google all do it: both fields are editable, type in either side, the other updates. I realised this design pattern near the end of the build but the time pressure made the simpler amount to result model the right call. Worth doing properly with more time, involves splitting the amount into `amountFrom`/`amountTo`, and tracking which side the user last edited so we know which side to recompute when a new rate arrives.

### A custom dropdown

Currently the currency selector is a native `<select>` element. A few improvements would all need a custom dropdown:

- Show the code and country flag in the closed state and the full name in the open state. The native `<select>` shows selected and unselected options identically, there's no way around it without going custom.
- Show all 170 currencies Fixer supports, not just the 17 I curated, with a search/filter at the top of the dropdown. A long unsearchable list is worse UX than a curated short one, but a long searchable list beats both.
- Country flags alongside each option.

A properly accessible custom dropdown, combobox semantics, keyboard nav, focus management, mobile picker behaviour is meaningful work. I judged the scope didn't justify it for the take-home.

### HTTP interceptor for the API key

Right now the key is appended manually to params inside the service. With multiple services hitting Fixer, I'd extract auth into an HTTP interceptor. 


### Internationalisation

Strings are hard-coded English. For an actual prooduct, a `@angular/localize` setup would be defensible. Skipped for scope.

### Server-side proxy for HTTPS

Fixer's free plan only serves HTTP. A real production deployment would need to proxy through a server-side endpoint to avoid mixed-content blocks in the browser.


---

## Notes

The repository ships without a Fixer API key, `src/environments/environment.ts`  contain placeholders. You'll need to add your own key locally to run the app (see "Running it" above).

In a real deployment, the production environment file would receive its key via CI-injected environment variables at build time.