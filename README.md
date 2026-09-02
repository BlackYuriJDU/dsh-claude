# DSH Claude

**DSH Claude** (`dshc`) is a fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — an open-source, plugin-based agent harness — with a UI experience inspired by [Claude](https://claude.ai)'s calm, editorial feel. You bring your own models and API keys; the harness, tools, and interface stay open.

> **Not affiliated with Anthropic.** DSH Claude is an independent open-source project. "Claude" is a trademark of Anthropic, PBC — used here only to describe design inspiration. The UI is a re-skin, not a copy: no Anthropic assets, logos, or fonts are included.

## Why

- **Everything is a plugin.** The upstream architecture (vendored Cordis) is kept intact — DSH Claude layers a theme and UX pack on top instead of forking behavior.
- **Bring your own models.** Configure any provider/keys in your own settings; nothing is bundled, nothing phones home.
- **Runs side by side.** The `dshc` command and its default port (3090) never collide with a stock `dsh` install on 3080.

## Run

### From npm (stock harness)

```sh
npx @deepseek-ai/dsh web          # original, port 3080
```

### DSH Claude

```sh
dshc web                          # serves http://127.0.0.1:3090
dshc web --port 0                 # or let the OS pick a free port
```

`dshc` is a thin launcher over the built CLI in this checkout (`apps/cli/dist/bin.js`); `DSHC_HOME` overrides the checkout path.

### From source

```sh
git clone https://github.com/BlackYuriJDU/dsh-claude.git
cd dsh-claude
pnpm install
pnpm run build
pnpm dsh web --port 3090
```

## Roadmap

- [ ] Claude-inspired theme pack for the Web UI (typography, palette, motion)
- [ ] Keyless web search provider (no API key required for basic search)
- [ ] Prebuilt `dshc` npm distribution

## License

[MIT](LICENSE) — inherited from DeepSeek Harness (© 2026 DeepSeek). Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
