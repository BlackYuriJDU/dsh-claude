import { writeFile } from 'node:fs/promises'
const KEY = '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'
const queries = ["claude.ai home greeting behavior personalization","claude.ai composer UI details input card","claude.ai send button appears when typing","claude streaming responses UI rendering","claude thinking mode collapsible UI","claude artifacts panel behavior side","claude artifacts publish share","claude styles feature responses","claude.ai sidebar organization chats","claude projects UI organization","claude search conversations feature","claude.ai keyboard shortcuts list","claude markdown rendering style","claude code blocks copy button UI","claude citations inline UI","claude file upload chips preview","claude image upload preview UI","claude dark mode palette colors","claude light mode cream background","claude serif headlines typography","claude coral terracotta accent color","claude starburst logo meaning","claude model picker UI selector","claude extended thinking toggle UI","claude web search toggle UI","claude memory settings UI","claude connectors settings page","claude skills page UI","claude empty state suggestions","claude prompt suggestion chips home","Claude system prompt full text","Claude Code system prompt contents","Claude personality traits defined","Anthropic Claude tone of voice","Claude honesty core value","Claude refusal style graceful","Claude hedging language avoidance","Claude response formatting rules markdown","Claude when to use bullet lists","Claude conciseness instructions","Claude proactive tool use behavior","Claude asking clarifying questions when","Claude admits uncertainty hallucination","Claude no sycophancy rule","Claude copyright reproduction limits","Claude privacy conversation training","Anthropic ASL safety levels","Claude constitution principles list","constitutional AI RLAIF method","Claude character training Anthropic","Claude system prompt tools section","Claude parallel tool use rules","Claude TodoWrite when to use","Claude Code plan mode workflow","Claude Code permission modes explain","Claude Code auto accept edits","Claude Code git worktree isolation","Claude Code hooks system","Claude Code subagents orchestration","Claude Code background tasks bash","Claude Code commit message style","Claude Code comments philosophy minimal","Claude Code testing expectations","Claude agent memory tool usage","Claude Skills progressive disclosure","Claude MCP connectors behavior","Claude web search citations behavior","Claude computer use screenshot loop","Claude long context handling","Claude multilingual response behavior","claude desktop app features 2025","claude chat vs cowork desktop app","claude cowork agentic mode explained","claude projects knowledge base","claude custom instructions profile","claude.ai pricing page design","claude connectors catalog apps","claude integrations directory MCP","claude mobile app UI features","claude artifacts types documents","claude role playing artifacts","claude file creation excel artifacts","claude analysis tool javascript","claude google drive integration","claude remote MCP connectors","claude artifacts versioning history","claude compare models selector","claude output length setting","claude team workspace features","claude enterprise security features","Anthropic release notes 2025","claude changelog new features","claude voice dictation input","claude screenshot image input","claude about page Anthropic mission","Anthropic brand guidelines typography","claude.ai settings account page","claude profile preferences options","claude new chat flow UX","claude conversation history UI","claude.ai onboarding first run","claude interface design analysis"]
const out = []
let done = 0, failed = 0
async function one(q) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
        body: JSON.stringify({ query: q, max_results: 3, search_depth: 'basic' }),
      })
      if (!res.ok) throw new Error('http ' + res.status)
      const json = await res.json()
      done++
      return { q, results: (json.results || []).map(r => ({ title: r.title, url: r.url, snippet: (r.content || '').slice(0, 220) })) }
    } catch (e) {
      if (attempt === 1) { failed++; return { q, error: String(e) } }
      await new Promise(r => setTimeout(r, 1500))
    }
  }
}
const workers = Array.from({ length: 3 }, async () => {
  while (queries.length) {
    const q = queries.shift()
    if (q === undefined) break
    out.push(await one(q))
    if (done % 10 === 0) console.log(done + '/' + 102)
  }
})
await Promise.all(workers)
const md = out.map(o => {
  if (o.error) return '### ' + o.q + '\nERRO: ' + o.error
  return '### ' + o.q + '\n' + o.results.map(r => '* [' + r.title + '](' + r.url + ') — ' + r.snippet).join('\n')
}).join('\n\n')
await writeFile('/home/arthur/jarvis/dsh-claude/docs/claude-behavior-research.md', '# Claude behavior research — ' + out.length + ' queries\n\n' + md, 'utf8')
console.log('DONE ok=' + done + ' fail=' + failed)
