# DSHC

English | [中文](README.zh.md)

DSHC (`dshc`) is a fork of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), an open-source, plugin-based agent harness, with a Web client styled after the Claude app. You bring your own models and API keys; the harness, tools, and interface stay open.

> **Not affiliated with Anthropic.** DSHC is an independent open-source project. "Claude" is a trademark of Anthropic, PBC, used here only to describe the design inspiration. No Anthropic logos, fonts, or other assets are included.

## What the fork adds

The fork is a layer over the upstream harness, so upstream updates merge without touching it:

- [`ui-brand-dshc`](packages/client/ui-brand-dshc/README.md) recolors the light and dark palettes to the Claude app's warm neutrals and clay accent and shows the DSHC mark.
- [`web-search-searxng`](packages/web/web-search-searxng/README.md) searches the web through a SearXNG instance with no API key.
- [`dsh-dshc`](packages/bundle/dshc/README.md) is the patch layer of the `dshc` profile, which stacks both over the Web profile.
- [`bin/dshc`](bin/dshc) starts that profile with its own home directory and port, so it runs beside a stock `dsh` install.

## Run

<a id="run-from-source"></a>

### Run from source

Build the checkout, then start DSHC:

```sh
git clone https://github.com/BlackYuriJDU/dsh-claude.git
cd dsh-claude
pnpm install
pnpm run build
bin/dshc
```

`bin/dshc` serves `http://127.0.0.1:3090` from the built CLI at `apps/cli/lib/bin.js` and keeps its state in `~/.dshc`. Set `DSHC_PORT`, `DSHC_DSH_HOME`, `DSHC_WORKSPACE`, or `DSHC_HOME` to change the port, the home directory, the working directory, or the checkout. Set `SEARXNG_URL` to a SearXNG instance with JSON output enabled to turn on keyless web search. The `dsh` options `--patch`, `--from-default-profile`, and the `--dump-*` flags pass through to `dsh`; any other argument goes to the app.

The upstream profiles still work from the same checkout, for example `pnpm dsh web` on port 3080.

## Upstream

DeepSeek Harness documentation: [https://deepseek-harness.github.io/deepseek-harness/](https://deepseek-harness.github.io/deepseek-harness/). Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md); agents follow [AGENTS.md](AGENTS.md). Review the [safety notice](SAFETY.md) before running the project.

## License

[MIT](LICENSE), inherited from DeepSeek Harness. Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
