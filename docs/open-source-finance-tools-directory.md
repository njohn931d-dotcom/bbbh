# Awesome Open-Source Finance: 50+ Free Privacy-First Calculators, Budget Tools & Personal Wealth Software

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Worth Suite](https://img.shields.io/badge/Worth-100%25%20Client--Side-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-njohn931d--dotcom%2Fbbbh-blue)](https://github.com/njohn931d-dotcom/bbbh)

A curated list of awesome open-source personal finance software, privacy-first money calculators, double-entry bookkeeping engines, and portfolio analytics tools that respect user data.

---

## 📑 Table of Contents

1. [Browser-Based Calculators (Zero Tracking, No Sign-up)](#1-browser-based-calculators)
2. [Self-Hosted Personal Budgeting Software](#2-self-hosted-personal-budgeting-software)
3. [Plain-Text & Double-Entry Accounting](#3-plain-text--double-entry-accounting)
4. [Portfolio Trackers & Investment Analytics](#4-portfolio-trackers--investment-analytics)
5. [FIRE & Retirement Modeling Engines](#5-fire--retirement-modeling-engines)
6. [Why Privacy-First Architecture Matters in Personal Finance](#6-why-privacy-first-architecture-matters)
7. [Frequently Asked Questions](#7-frequently-asked-questions)

---

## 1. Browser-Based Calculators

### [Worth Finance Tools](https://njohn931d-dotcom.github.io/bbbh/) (This Repo!)
- **License:** MIT
- **Features:** 46 dedicated calculators running 100% client-side in vanilla JavaScript. Zero cookies, zero third-party telemetry, zero server backend.
- **Top Calculators:**
  - [Cost of Time Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/) — Convert any purchase price into exact hours of life worked.
  - [Salary to Hourly Converter](https://njohn931d-dotcom.github.io/bbbh/calculators/salary-to-hourly/) — Fast annual gross to hourly rate breakdown.
  - [Mortgage Calculator 2026](https://njohn931d-dotcom.github.io/bbbh/calculators/mortgage-calculator-2026/) — Monthly principal, interest, and affordability.
  - [Compound Interest Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/compound-interest-calculator/) — Long-term habit compounding simulation.
  - [Freelance Rate Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate/) — 1099 contractor rate setter with tax and overhead.
  - [Cost Per Wear Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-per-wear/) — Practical minimalism and purchase utility analyzer.

---

## 2. Self-Hosted Personal Budgeting Software

- **[Actual Budget](https://github.com/actualbudget/actual)** — 100% local-first personal finance tool with envelope budgeting, end-to-end encryption, and multi-device sync via WebSockets.
- **[Firefly III](https://github.com/firefly-iii/firefly-iii)** — Self-hosted financial manager supporting automated transaction rules, budget categorization, and double-entry book balancing.
- **[Maybe](https://github.com/maybe-finance/maybe)** — Open-source personal wealth manager built with Ruby on Rails, enabling full balance-sheet tracking.
- **[Ghostfolio](https://github.com/ghostfolio/ghostfolio)** — Privacy-first wealth management platform designed for tracking stocks, ETFs, and cryptocurrencies with portfolio weighting metrics.

---

## 3. Plain-Text & Double-Entry Accounting

- **[Ledger-CLI](https://github.com/ledger/ledger)** — Powerful command-line double-entry accounting tool operating directly on plain text files.
- **[Hledger](https://github.com/simonmichael/hledger)** — Robust Haskell implementation of plain-text accounting with web UI and financial reporting modules.
- **[BeanCount](https://github.com/beancount/beancount)** — Python-based double-entry bookkeeping language with rich ecosystem (Fava web interface).

---

## 4. Portfolio Trackers & Investment Analytics

- **[Portfolio Performance](https://github.com/buchen/portfolio)** — Open-source desktop application to calculate the overall performance of an investment portfolio (IRR, True Time-Weighted Rate of Return).
- **[Wallos](https://github.com/ellite/Wallos)** — Self-hosted subscription and recurring payment tracker with customizable notifications.

---

## 5. FIRE & Retirement Modeling Engines

- **[cFIREsim](https://github.com/cfiresim/cfiresim-js)** — Open-source historical retirement simulator testing asset allocation against 120+ years of market cycles.
- **[Worth Net Worth & FIRE Benchmarks](https://njohn931d-dotcom.github.io/bbbh/calculators/net-worth-calculator-2026/)** — Client-side net worth percentile comparison and wealth projection engine.

---

## 6. Why Privacy-First Architecture Matters

Financial data is among the most sensitive personal information a person generates. Commercial finance apps frequently:
1. Aggregate and monetize consumer spending patterns for hedge funds and advertising brokers.
2. Require banking OAuth logins that can expose transaction histories across decades.
3. Lock users into proprietary database formats with recurring subscription fees.

By contrasting this with **local-first, open-source static software**:
- **Zero Data Ingestion:** All calculations execute locally inside your browser's V8 engine.
- **Auditability:** Every equation, formula, and line of code is open to community review.
- **Permanence:** Standalone static HTML/JS files can run offline indefinitely without depending on external venture-backed API servers.

---

## 7. Frequently Asked Questions

### Can I run these calculators offline without an internet connection?
Yes! Worth is configured as a Progressive Web App (PWA) with offline asset caching and a zero-dependency static footprint. Simply install it from your browser or clone the Git repository and open `index.html`.

### How can I contribute a new calculator to this repository?
Fork the repository on [GitHub](https://github.com/njohn931d-dotcom/bbbh), create a feature branch, and submit a pull request. See our [CONTRIBUTING.md](../CONTRIBUTING.md) for architectural guidelines.
