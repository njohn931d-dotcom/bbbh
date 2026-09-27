---
key: url-fragment-state
order: 4
title: "Shareable calculator state with no backend: URL fragments, base64url, and a warning"
description: "Encoding app state into the URL fragment instead of the query string: no server logs, no cache pollution, no accounts. Plus the decode-side validation most tutorials skip."
tags: javascript, webdev, frontend, web
canonical:
cover: devto/url-fragment-state.jpg
---

A calculator is more useful when you can send someone the exact inputs behind a result. "Here is why the car is $41k over five years" lands differently when the link reproduces the numbers.

You can do this with no backend, no accounts, and no database — the state goes in the URL. The only interesting decisions are *where* in the URL, and what you do when someone hands you a link that has been edited.

## Fragment, not query string

Use the fragment (`#...`), not the query string (`?...`), for anything input by a user:

- **The fragment never leaves the browser.** Query strings land in server logs, CDN cache keys, and the `Referer` header sent to every third party on the page. Calculator inputs can be a salary or a debt figure; there is no reason for that to be on someone else's disk.
- **No cache-key pollution.** One URL, one cached response, regardless of state.
- **It is honest about being client-side.** The state only exists where the JavaScript runs.

The tradeoff: fragments are invisible to the server, so you cannot render a server-side preview of a shared calculation, and some chat clients cut long URLs. Keep the payload small.

## Encode: JSON to base64url

Base64's standard alphabet contains `+` and `/`, which have meaning in URLs, and `=` padding which some clients mangle. So swap them out:

```js
const encodeState = (state) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(state))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
```

The `TextEncoder` step is not optional if any user-entered string can contain non-ASCII characters — otherwise `btoa` throws `InvalidCharacterError` the first time someone names an expense in a non-Latin script. That bug ships quietly, because every test uses ASCII.

## Decode: treat the link as untrusted input

This is the part most snippets skip. A shared link is user input, arrives from a stranger, and can be anything at all:

```js
const decodeState = (fragment) => {
  try {
    const b64 = fragment.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return sanitize(parsed);
  } catch {
    return null; // malformed link: fall back to the default state, do not throw
  }
};
```

Three rules for the sanitizer:

1. **Whitelist keys.** Build the output object field by field. Never spread the parsed JSON into your state — that is how an attacker gets a property you never expected.
2. **Coerce and clamp.** `Number(value)`, then clamp to a sane range (`0 … 1e9` for money, `0.01 … 50000` for an hourly rate). A rate of `0` behind a link turns every result into `Infinity`.
3. **Never render raw.** If state contains a label the user typed, put it in `textContent`, not into an HTML string.

## Store the minimum, derive the rest

If the calculation is `hours = total / rate`, do not put `hours` in the URL. Store the inputs:

```js
// good: two numbers, everything else recomputed
const state = { mode: 'purchase', price: 899, income: 32, period: 'hour' };
```

Derived fields double the payload, and worse, they can disagree with the inputs after an edit — now you have a shareable link that is internally inconsistent and nobody can tell which number is wrong.

## Tell the user what the link contains

Encoding inputs into a URL makes them easy to share by accident, so say so. On my site the share action warns before it copies, and the docs state plainly that a fragment includes the numbers entered. It costs one sentence and it is the difference between a useful feature and a privacy surprise.

If you want to see it in a small, readable implementation, the whole thing is in one file:

- Source: https://github.com/njohn931d-dotcom/bbbh/blob/main/app.js
- A page that uses it: https://njohn931d-dotcom.github.io/bbbh/calculators/cost-per-use/
- The rest of the tools: https://njohn931d-dotcom.github.io/bbbh/

Disclosure: my project, free, static, no accounts — the share feature is the reason it can stay that way.
