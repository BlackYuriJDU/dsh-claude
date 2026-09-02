#!/usr/bin/env python3
"""Keyless web-search MCP server (stdio) for DSH / DSH Claude.

Implements a minimal MCP (JSON-RPC over stdio) server exposing one tool:
  web_search  -- DuckDuckGo HTML results, no API key, no payment.

Registered in ~/.dsh/settings.yaml under connectors.mcpServers so every
harness instance on this machine (dsh or dshc) gets natural web search.
"""

import json
import re
import sys
import urllib.parse
import urllib.request

PROTOCOL_VERSION = "2024-11-05"
SERVER_INFO = {"name": "web-search-free", "version": "0.1.0"}
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")


def ddg_search(query: str, max_results: int = 8) -> str:
    """Search DuckDuckGo HTML (lite) and return numbered results as text."""
    data = urllib.parse.urlencode({"q": query}).encode()
    req = urllib.request.Request(
        "https://lite.duckduckgo.com/lite/",
        data=data,
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", "replace")
    # lite layout: result links then snippet lines, table rows
    links = re.findall(r'<a rel="nofollow" href="([^"]+)"[^>]*>(.*?)</a>', html)
    snippets = re.findall(r'<td class="result-snippet">(.*?)</td>', html, re.S)
    clean = lambda s: re.sub(r"<[^>]+>", "", s).strip()
    out = []
    for i, (url, title) in enumerate(links[:max_results]):
        # skip ad/redirect rows
        if "duckduckgo.com/l/" in url or url.startswith("//"):
            continue
        line = f"{len(out) + 1}. {clean(title)}\n   {url}"
        if i < len(snippets):
            snip = clean(snippets[i])
            if snip:
                line += f"\n   {snip[:300]}"
        out.append(line)
    if not out:
        return f"No results for: {query}"
    return "\n\n".join(out)


TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web (DuckDuckGo, no API key). Returns titles, URLs and snippets.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "max_results": {"type": "integer", "description": "Max results (default 8)", "default": 8},
            },
            "required": ["query"],
        },
    }
]


def handle(msg: dict) -> dict | None:
    method = msg.get("method")
    mid = msg.get("id")
    if method == "initialize":
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": PROTOCOL_VERSION,
            "capabilities": {"tools": {}},
            "serverInfo": SERVER_INFO,
        }}
    if method is None:  # notification
        return None
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": TOOLS}}
    if method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        try:
            if name == "web_search":
                text = ddg_search(args["query"], int(args.get("max_results", 8)))
            else:
                text = f"Unknown tool: {name}"
            return {"jsonrpc": "2.0", "id": mid, "result": {
                "content": [{"type": "text", "text": text}], "isError": False}}
        except Exception as exc:  # surface failures to the model, not stderr silence
            return {"jsonrpc": "2.0", "id": mid, "result": {
                "content": [{"type": "text", "text": f"web_search failed: {exc}"}], "isError": True}}
    if mid is not None:
        return {"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"Method not found: {method}"}}
    return None


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        reply = handle(msg)
        if reply is not None:
            sys.stdout.write(json.dumps(reply) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
