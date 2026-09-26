# bbbh

A Forge control-plane VM host with a Linux desktop and browser-accessible terminal. This repo also includes a static landing page for the workspace setup service described in [INCOME_PLAYBOOK.md](INCOME_PLAYBOOK.md).

## Preview the site

From the repository root, run:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open the served page on port `4173`.

Before publishing, set a real `contactEmail` in `site-config.js`. In demo mode the inquiry form only copies the request to the visitor's clipboard; it does not send or store leads. The page does not take payments. Agree on a paid pilot and invoice/payment terms directly with a customer before beginning work.

## Security

The current devcontainer is demo-only: it exposes a writable shell and GUI on public ports and includes a static demo GUI password. Do not use it to host customer workspaces or data as-is. The income playbook describes the security work needed before offering anything to customers.
