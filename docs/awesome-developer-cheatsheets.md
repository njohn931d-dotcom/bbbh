# Awesome Developer Cheatsheets: Git, Docker, Linux, Regex, SQL & Web Performance (2026)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Live Site](https://img.shields.io/badge/Live%20Tools-Worth%20Finance-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-njohn931d--dotcom%2Fbbbh-blue)](https://github.com/njohn931d-dotcom/bbbh)

A curated, copy-pasteable reference guide of the most frequently searched developer cheatsheets, command-line one-liners, regex patterns, SQL queries, and web performance metrics. Part of the [Worth Open-Source Tools](https://github.com/njohn931d-dotcom/bbbh) suite.

---

## 📑 Table of Contents

1. [Git Cheatsheet (Most Searched Operations)](#1-git-cheatsheet)
2. [Docker & Container CLI Cheatsheet](#2-docker--container-cli-cheatsheet)
3. [Linux & Bash Power One-Liners](#3-linux--bash-power-one-liners)
4. [Regular Expressions (Regex) Common Patterns](#4-regular-expressions-regex-common-patterns)
5. [SQL Queries & Performance Indexes](#5-sql-queries--performance-indexes)
6. [HTTP Status Codes Quick Reference](#6-http-status-codes-quick-reference)
7. [Web Performance & Core Web Vitals (2026)](#7-web-performance--core-web-vitals-2026)
8. [Developer Productivity: Cost of Time Math](#8-developer-productivity-cost-of-time-math)
9. [Frequently Asked Questions (PAA)](#9-frequently-asked-questions)

---

## 1. Git Cheatsheet

### Undo Changes Safely

| Task | Command | Note |
|---|---|---|
| Discard unstaged changes in working tree | `git restore <file>` | Replaces file with index copy |
| Unstage a staged file | `git restore --staged <file>` | Keeps changes in working directory |
| Amend previous commit message without code changes | `git commit --amend -m "new message"` | Rewrites latest local commit |
| Undo last commit, keep changes staged | `git reset --soft HEAD~1` | Safe for local rework |
| Undo last commit, keep changes unstaged | `git reset HEAD~1` | Default mixed reset |
| Completely erase last commit and all changes | `git reset --hard HEAD~1` | ⚠️ Destructive: cannot easily recover |
| Safely revert a pushed commit | `git revert <commit-sha>` | Creates new inverse commit |

### Branching & Merging

```bash
# Create and switch to new branch
git switch -c feature/my-new-feature

# List branches sorted by most recent commit
git branch --sort=-committerdate

# Clean up local branches deleted on remote
git fetch --prune && git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D

# Interactive rebase of last 5 commits (squash, reword, fixup)
git rebase -i HEAD~5
```

---

## 2. Docker & Container CLI Cheatsheet

### Container Lifecycle & Debugging

```bash
# Run background container with port mapping and volume
docker run -d --name app-service -p 8080:8080 -v $(pwd):/app -e NODE_ENV=production node:22-alpine

# Exec into running container with bash/sh
docker exec -it app-service sh

# Stream container resource metrics (CPU, RAM, Network I/O)
docker stats --no-stream

# View real-time container logs with timestamps
docker logs -f --tail 200 -t app-service

# Deep clean dangling containers, networks, and unused images
docker system prune -af --volumes
```

---

## 3. Linux & Bash Power One-Liners

| Task | One-Liner |
|---|---|
| Find files larger than 100MB | `find / -type f -size +100M -exec ls -lh {} + 2>/dev/null` |
| Check listening TCP ports & PIDs | `ss -tulpn` or `netstat -tlpn` |
| Show disk space consumption human-readable | `df -h` and `du -sh * \| sort -hr \| head -10` |
| Find and kill process listening on port 3000 | `lsof -ti:3000 \| xargs kill -9` |
| Live memory consumption (RAM + Swap) | `free -h` |
| Search text recursively ignoring node_modules | `grep -rnI --exclude-dir={node_modules,.git,dist} "keyword" .` |

---

## 4. Regular Expressions (Regex) Common Patterns

| Target | Regex Pattern | Description |
|---|---|---|
| **Email Address** | `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$` | RFC 5322 standard match |
| **URL (HTTP/HTTPS)** | `^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$` | Matches modern web URLs |
| **IPv4 Address** | `^(?:(?:25[0-5]\|2[0-4][0-9]\|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]\|2[0-4][0-9]\|[01]?[0-9][0-9]?)$` | Validates 0.0.0.0 - 255.255.255.255 |
| **UUID v4** | `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` | RFC 4122 v4 UUID format |
| **ISO 8601 Date** | `^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$` | UTC or offset timestamp |
| **Semantic Version** | `^v?(0\|[1-9]\d*)\.(0\|[1-9]\d*)\.(0\|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+)?$` | SemVer 2.0.0 compliance |

---

## 5. SQL Queries & Performance Indexes

### Top Analytical & Performance Queries

```sql
-- Find slow queries / query execution plan
EXPLAIN ANALYZE
SELECT u.id, u.email, COUNT(o.id) AS order_count, SUM(o.total) AS lifetime_value
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2026-01-01'
GROUP BY u.id, u.email
HAVING COUNT(o.id) > 5
ORDER BY lifetime_value DESC
LIMIT 20;

-- Composite index for fast filtering + sorting
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- Find table disk bloat in PostgreSQL
SELECT pg_size_pretty(pg_total_relation_size('orders')) AS total_table_size;
```

---

## 6. HTTP Status Codes Quick Reference

- **200 OK**: Request succeeded.
- **201 Created**: Resource created successfully.
- **204 No Content**: Action succeeded, no body returned.
- **301 Moved Permanently**: Permanent redirect (SEO juice passes).
- **304 Not Modified**: Cached copy valid (ETag / If-None-Match).
- **400 Bad Request**: Malformed client payload.
- **401 Unauthorized**: Missing or invalid authentication token.
- **403 Forbidden**: Authenticated, but lacking permissions.
- **404 Not Found**: Endpoint or resource does not exist.
- **429 Too Many Requests**: Rate limit exceeded (check `Retry-After` header).
- **500 Internal Server Error**: Unhandled server exception.
- **502 Bad Gateway**: Upstream proxy / service failed to respond.
- **503 Service Unavailable**: Temporary overload or maintenance.
- **504 Gateway Timeout**: Upstream service took too long.

---

## 7. Web Performance & Core Web Vitals (2026)

| Metric | Name | Good Target | Why It Matters |
|---|---|---|---|
| **LCP** | Largest Contentful Paint | ≤ 2.5s | Perceived page loading speed |
| **INP** | Interaction to Next Paint | ≤ 200ms | UI responsiveness upon user clicks / typing |
| **CLS** | Cumulative Layout Shift | ≤ 0.1 | Visual stability (elements don't jump around) |
| **TTFB** | Time to First Byte | ≤ 800ms | Server response and CDN edge speed |
| **FCP** | First Contentful Paint | ≤ 1.8s | First DOM element render |

---

## 8. Developer Productivity: Cost of Time Math

As software engineers, our time is our most constrained capital. Using the [Worth Cost of Time Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/):

$$\text{Real Hourly Wage} = \frac{\text{Annual Take-Home Pay}}{\text{2,080 Work Hours}}$$

If you earn **$140,000/year** ($105,000 take-home after tax):
- Your hourly value is **~$50.48/hr**.
- Spending 4 hours manually debugging a server configuration vs automating it costs **$201.92** in engineering time.
- If a $20/month SaaS tool saves you 30 minutes a week, it saves **26 hours/year ($1,312.48 of value)** for a $240 annual outlay — an ROI of **546%**.

Calculate your custom figures at:
- ⏱️ [Cost of Time Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/)
- 💼 [Developer Salary to Hourly Converter](https://njohn931d-dotcom.github.io/bbbh/calculators/salary-to-hourly/)
- 🚀 [Freelance Rate Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate/)

---

## 9. Frequently Asked Questions

### What is the most effective command to recover an accidentally deleted git commit?
Run `git reflog` to inspect all recent HEAD moves, locate the commit SHA prior to the deletion, and run `git checkout -b recovery-branch <commit-sha>` or `git reset --hard <commit-sha>`.

### How do I reduce Docker image size for Node.js apps?
Use multi-stage builds (`FROM node:22-alpine AS builder`, then copy only production output and `node_modules --omit=dev` into a slim runtime container).

### Where can I find more open-source engineering and financial tools?
Explore the full directory on [Worth Finance](https://njohn931d-dotcom.github.io/bbbh/) and our [GitHub Repository](https://github.com/njohn931d-dotcom/bbbh).
