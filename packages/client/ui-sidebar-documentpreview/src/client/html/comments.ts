/**
 * Design comments from the interactive HTML preview: the iframe reports the
 * element a person clicks in comment mode, and the parent turns the report
 * into a quote for the Session draft. Every report is untrusted page input,
 * so it is validated and bounded here before any text reaches the draft.
 */

/** Message the parent posts to switch comment mode inside the iframe. */
export const COMMENT_MODE_MESSAGE = 'dsh-comment-mode'

/** Message the iframe posts for one clicked element. */
export const COMMENT_MESSAGE = 'dsh-comment'

/** Longest element text excerpt carried by one report. */
export const COMMENT_TEXT_LIMIT = 160

/** One clicked element as reported by the preview. */
export interface HtmlComment {
  readonly tag: string
  readonly id: string
  readonly classes: readonly string[]
  readonly text: string
}

const TAG = /^[a-z][a-z0-9-]{0,31}$/
const NAME = /^[^\s<>"]{1,48}$/

/**
 * Accept one message only when it is a complete, bounded element report.
 * @param data - the message payload as received.
 * @returns the report, or undefined for anything else.
 */
export function parseHtmlComment(data: unknown): HtmlComment | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const { type, tag, id, classes, text } = data as Record<string, unknown>
  if (type !== COMMENT_MESSAGE || typeof tag !== 'string' || !TAG.test(tag)) return undefined
  if (typeof id !== 'string' || (id !== '' && !NAME.test(id))) return undefined
  if (!Array.isArray(classes) || classes.length > 3) return undefined
  const names: string[] = []
  for (const name of classes) {
    if (typeof name !== 'string' || !NAME.test(name)) return undefined
    names.push(name)
  }
  if (typeof text !== 'string' || text.length > COMMENT_TEXT_LIMIT) return undefined
  return { tag, id, classes: names, text: text.replace(/\s+/g, ' ').trim() }
}

/**
 * Quote one element for the draft: the file, a selector, and the excerpt.
 * @param comment - validated element report.
 * @param file - the previewed file's path as the tab shows it.
 * @returns one line naming the element the person comments on.
 */
export function formatHtmlComment(comment: HtmlComment, file: string): string {
  const selector = `${comment.tag}${comment.id === '' ? '' : `#${comment.id}`}${comment.classes.map(name => `.${name}`).join('')}`
  return `${file} <${selector}>${comment.text === '' ? '' : ` "${comment.text}"`}`
}

/**
 * Script appended to the iframe bootstrap. It waits for the parent's
 * comment-mode switch; while on, it outlines the hovered element and turns a
 * click into one bounded element report instead of the page's own action.
 */
export const COMMENT_SCRIPT = `
const style=document.createElement('style');
style.textContent='[data-dsh-comment-hover]{outline:2px solid #c6613f!important;outline-offset:2px!important;cursor:crosshair!important}';
let on=false,hovered=null;
const clear=()=>{if(hovered){hovered.removeAttribute('data-dsh-comment-hover');hovered=null}};
addEventListener('message',event=>{
  if(event.source!==parent||!event.data||event.data.type!=='${COMMENT_MODE_MESSAGE}')return;
  on=event.data.on===true;
  if(on)(document.head||document.documentElement).appendChild(style);else{style.remove();clear()}
});
document.addEventListener('mouseover',event=>{
  if(!on)return;clear();
  const target=event.target;
  if(target instanceof Element&&target!==document.documentElement&&target!==document.body){hovered=target;target.setAttribute('data-dsh-comment-hover','')}
},true);
document.addEventListener('click',event=>{
  if(!on)return;
  const target=event.target;
  if(!(target instanceof Element))return;
  event.preventDefault();event.stopPropagation();
  const name=value=>/^[^\\s<>"]{1,48}$/.test(value);
  parent.postMessage({type:'${COMMENT_MESSAGE}',tag:target.tagName.toLowerCase(),id:name(target.id)?target.id:'',
    classes:[...target.classList].filter(name).slice(0,3),
    text:(target.textContent||'').replace(/\\s+/g,' ').trim().slice(0,${COMMENT_TEXT_LIMIT})},'*');
},true);`
