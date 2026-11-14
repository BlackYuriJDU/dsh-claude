/** The SearXNG page's staged form over the composed `web-search-searxng` entry. */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel, settingsNumberField, settingsTextField,
  type SettingsFieldState, type SettingsFormActions, type SettingsFormScope, type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'

/** Profile entry id of the SearXNG search provider in the DSHC bundle. */
export const SEARXNG_NS = 'web-search-searxng'

/** The provider fields this page edits; the Host schema validates each save. */
export interface SearxngSettings {
  /** Instance base URL; empty falls back to `$SEARXNG_URL`. */
  baseURL?: string
  /** Search language, for example `pt-BR`. */
  language?: string
  /** Comma-separated SearXNG categories. */
  categories?: string
  /** SafeSearch level: 0 off, 1 moderate, 2 strict. */
  safeSearch?: number
}

/** What the SearXNG page renders. */
export interface SearxngCardState extends SettingsFormShell {
  baseURL: SettingsFieldState
  language: SettingsFieldState
  categories: SettingsFieldState
  safeSearch: SettingsFieldState
}

/** The registration-side face the page's slot entry injects. */
export interface SearxngCardFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer as useSearxngCard. */
    searxngCard: SnapshotStore<SearxngCardState>
  }
}

/** Bridges the provider entry's form onto the page's staged form. */
export class SearxngCardController {
  private readonly form: SettingsFormModel<SearxngSettings>
  private readonly store: SnapshotStore<SearxngCardState>

  /** @param scope - the shared configuration form of the composed provider entry. */
  constructor(scope: SettingsFormScope<SearxngSettings>) {
    this.form = new SettingsFormModel(scope, [
      settingsTextField('baseURL'), settingsTextField('language'), settingsTextField('categories'), settingsNumberField('safeSearch'),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): SearxngCardState {
    return {
      ...this.form.shell(),
      baseURL: this.form.field('baseURL'),
      language: this.form.field('language'),
      categories: this.form.field('categories'),
      safeSearch: this.form.field('safeSearch'),
    }
  }

  /**
   * Build the face the page's slot registration injects.
   * @returns the page's snapshot and its form actions.
   */
  inject(): SearxngCardFace {
    return { hooks: { searxngCard: this.store }, ...this.form.actions() }
  }

  /** Release the form subscription. */
  dispose(): void { this.form.dispose() }
}
