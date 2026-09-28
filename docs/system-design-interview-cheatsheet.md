# System Design Interview Cheatsheet: High Availability, Scalability, Caching & Rate Limiting

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Worth Tools](https://img.shields.io/badge/Worth-Open%20Source-blue)](https://github.com/njohn931d-dotcom/bbbh)
[![Live Site](https://img.shields.io/badge/Live-Calculators-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)

A comprehensive system design reference guide for software engineers preparing for architecture interviews and designing production distributed systems handling millions of requests per second.

---

## 📑 Table of Contents

1. [Latency Numbers Every Programmer Should Know](#1-latency-numbers-every-programmer-should-know)
2. [Data Scale & Throughput Estimation (Back of the Envelope)](#2-data-scale--throughput-estimation)
3. [Rate Limiting Algorithms (Formulas & Tradeoffs)](#3-rate-limiting-algorithms)
4. [Caching Strategies & Invalidation Patterns](#4-caching-strategies--invalidation-patterns)
5. [Database Sharding & Partitioning Strategies](#5-database-sharding--partitioning-strategies)
6. [CAP Theorem & PACELC Cheat Table](#6-cap-theorem--pacelc-cheat-table)
7. [High Availability & Redundancy Checklist](#7-high-availability--redundancy-checklist)
8. [Frequently Asked Questions (PAA Snippets)](#8-frequently-asked-questions)

---

## 1. Latency Numbers Every Programmer Should Know

Understanding physical latencies enables rapid architectural validation during design reviews:

| Operation | Typical Latency | Human-Scale Analogy (1ns = 1 sec) |
|---|---|---|
| L1 Cache Reference | **0.5 ns** | 0.5 seconds (heartbeat) |
| Branch Mispredict | **5 ns** | 5 seconds |
| L2 Cache Reference | **7 ns** | 7 seconds |
| Mutex Lock / Unlock | **25 ns** | 25 seconds |
| Main Memory (RAM) Access | **100 ns** | 1.6 minutes |
| Compress 1KB with Snappy | **2,000 ns (2 µs)** | 33 minutes |
| Read 1 MB sequentially from RAM | **250,000 ns (250 µs)** | 2.9 days |
| Read 1 MB sequentially from NVMe SSD | **1,000,000 ns (1 ms)** | 11.6 days |
| Round trip within same datacenter | **500,000 ns (0.5 ms)** | 5.8 days |
| Read 1 MB sequentially from HDD | **20,000,000 ns (20 ms)** | 7.7 months |
| Send packet US East to West Coast | **60,000,000 ns (60 ms)** | ~2 years |
| Send packet Europe to US West Coast | **150,000,000 ns (150 ms)** | ~4.75 years |

*Key Takeaway:* In-memory operations are 10,000x to 1,000,000x faster than disk and cross-continental network hops. Cache aggressively at the edge.

---

## 2. Data Scale & Throughput Estimation

### Standard Math Conversion Formulas

- $1\text{ Day} = 86,400\text{ seconds} \approx 100,000\text{ seconds (for easy mental math)}$
- $1\text{ Million requests/day} \approx \frac{1,000,000}{86,400} \approx 12\text{ QPS (Queries Per Second)}$
- $10\text{ Million requests/day} \approx 120\text{ QPS}$
- $100\text{ Million requests/day} \approx 1,200\text{ QPS}$
- Peak traffic multiplier: $\text{Peak QPS} = \text{Average QPS} \times 2 \text{ to } 5$

### Storage Capacity Rule

$$\text{Annual Storage} = \text{Daily Active Users (DAU)} \times \text{Writes Per User} \times \text{Payload Size} \times 365 \text{ Days}$$

*Example:* 10M DAU × 2 photos/day × 200KB = **4 TB / day = 1.46 PB / year**. Always factor 3x replication factor (**4.38 PB/year raw**).

---

## 3. Rate Limiting Algorithms

| Algorithm | Mechanism | Pros | Cons | Ideal Use Case |
|---|---|---|---|---|
| **Token Bucket** | Tokens added at fixed rate $r$ up to capacity $b$. Requests consume 1 token. | Handles bursty traffic smoothly; memory efficient ($O(1)$). | Difficult to tune $r$ and $b$ across distributed nodes without Redis Lua. | Public APIs (Stripe, GitHub) |
| **Leaky Bucket** | Requests enter FIFO queue; processed at constant output rate. | Constant output flow; prevents downstream overloading. | Drops requests when buffer fills; latency for queued requests. | E-commerce checkout queues, video transcoding |
| **Fixed Window Counter** | Counts hits in static time windows (e.g. 00:00 - 00:01). | Extremely simple; low memory footprint. | Traffic spike at window boundaries can allow 2x limit. | Basic anti-DDoS, internal service tiering |
| **Sliding Window Log** | Stores timestamp of every request in sorted set (Redis ZSET). | 100% accurate; no boundary burst issues. | High memory footprint ($O(N)$ with request count). | Strict banking transactions, login attempt throttles |
| **Sliding Window Counter** | Blends previous window count with current window elapsed percent. | Low memory ($O(1)$); solves 2x edge spike within 99.9% accuracy. | Approximate count (acceptable for web rate limits). | Enterprise APIs (Cloudflare, AWS WAF) |

### Sliding Window Formula

$$\text{Current Requests} = \text{Current Window Count} + \left( \text{Previous Window Count} \times \frac{\text{Remaining Time in Prev Window}}{\text{Window Size}} \right)$$

---

## 4. Caching Strategies & Invalidation Patterns

### Cache Read Patterns
1. **Cache-Aside (Lazy Loading):** Application reads from cache. On miss, reads from DB, updates cache, and returns. Best for read-heavy workloads where missing data isn't catastrophic.
2. **Read-Through:** Application talks only to cache provider. Cache fetches missing data from DB transparently.

### Cache Write Patterns
1. **Write-Through:** Data written to cache and DB simultaneously. Strong consistency; higher write latency.
2. **Write-Behind (Write-Back):** Data written to cache immediately; asynchronously flushed to DB in batch. Ultra-low write latency; risk of data loss on cache node crash.
3. **Write-Around:** Data written directly to DB. Avoids polluting cache with data that may not be read soon.

### Invalidation Strategies
- **TTL (Time to Live):** Automatic expiration. Prevents stale data accumulation.
- **Explicit Eviction on Mutation:** Clear cache key upon `UPDATE`/`DELETE`.
- **Cache Stampede Prevention:** Use probabilistic early expiration (XFetch) or distributed mutex locks.

---

## 5. Database Sharding & Partitioning Strategies

- **Horizontal Partitioning (Range-Based):** Shard by range (e.g. User IDs 1–1,000,000 on Node 1). Risk: hotspotting on recent sequential keys.
- **Hash-Based Sharding:** Shard = $\text{Hash}(Key) \pmod N$. Distributes load evenly. Disadvantage: adding a node requires rehashing entire dataset.
- **Consistent Hashing:** Hashes both nodes and data keys onto a virtual ring (0 to $2^{32}-1$). When a node is added/removed, only $\frac{K}{N}$ keys are relocated. Standard for DynamoDB, Cassandra, Memcached.

---

## 6. CAP Theorem & PACELC Cheat Table

### CAP Theorem
In any asynchronous distributed network subject to partitions ($P$):
- **CP (Consistency + Partition Tolerance):** Rejects writes or times out to preserve data correctness (e.g., Google Spanner, MongoDB with majority write, HBase).
- **AP (Availability + Partition Tolerance):** Accepts reads/writes; may return stale data; eventual consistency (e.g., AWS DynamoDB, Apache Cassandra, CouchDB).

### PACELC Extension
If Partition ($P$): choose between Availability ($A$) and Consistency ($C$);  
Else ($E$): choose between Latency ($L$) and Consistency ($C$).

| System | Default PACELC Model |
|---|---|
| **PostgreSQL / MySQL** | PC/EC (Strict ACID consistency) |
| **MongoDB** | PC/EC (Configurable to PA/EL) |
| **Cassandra** | PA/EL (Low latency, high availability) |
| **DynamoDB** | PA/EL (Single-digit millisecond SLA) |

---

## 7. High Availability & Redundancy Checklist

- [x] Zero single point of failure (SPOF) across load balancers, proxies, databases, and message brokers.
- [x] Multi-Region / Multi-Availability Zone redundancy.
- [x] Circuit breaker pattern implemented on external downstream dependencies (Netflix Hystrix, Resilience4j).
- [x] Health check probes (`/healthz` liveness, `/readyz` readiness) decoupled from heavy database queries.
- [x] Database replication: 1 Primary (Write) + $N$ Read Replicas with automatic failover (Patroni / Orchestrator).
- [x] Graceful degradation: serve cached or static UI state when background services degrade.

---

## 8. Frequently Asked Questions

### What is the difference between horizontal and vertical scaling?
Vertical scaling (scale up) increases compute resources (CPU, RAM, NVMe) on a single server, bounded by hardware limits and single point of failure. Horizontal scaling (scale out) adds more commodity instances behind a load balancer, providing virtually unlimited elasticity and fault tolerance.

### How does consistent hashing prevent cascading cache failure?
In standard modulo hashing ($K \pmod N$), changing $N$ (adding or removing a server) causes almost all keys to map to new locations, producing a 100% cache miss storm on the database. Consistent hashing ensures that adding or removing a node affects only $\frac{1}{N}$ of the keys on average.

### Where can I calculate real-world infrastructure and engineering costs?
Use [Worth Finance Calculators](https://njohn931d-dotcom.github.io/bbbh/) to evaluate [Cost of Time](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/), [Developer Hourly Rates](https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate/), and [Cloud/SaaS Subscription Costs](https://njohn931d-dotcom.github.io/bbbh/calculators/subscription-cost/).
