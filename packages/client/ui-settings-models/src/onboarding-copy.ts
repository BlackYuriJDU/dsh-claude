/** Durable settings namespace for product-wide GUI onboarding facts. */
export const WELCOME_NOTICE_SETTINGS_NAMESPACE = 'ui-onboarding'

/** Field storing the last welcome notice version the user acknowledged. */
export const WELCOME_NOTICE_ACK_FIELD = 'welcomeNoticeVersion'

/**
 * Bump only when the notice changes materially and every user should see it
 * again. The acknowledgement is compared for exact equality.
 */
export const WELCOME_NOTICE_VERSION = '2026-09-02.1'

/** The complete welcome notice in both supported GUI locales. */
export const WELCOME_NOTICE_COPY = {
  zh: {
    title: 'DSH Claude',
    body: 'DSH Claude 是一个由你掌控的智能体工作台：暖色画布、衬线标题、珊瑚色点缀。自带模型与 API 密钥（BYOK），一切能力皆由插件驱动，你的密钥只保存在你自己的机器上。',
    continueLabel: '继续',
  },
  en: {
    title: 'DSH Claude',
    body: 'DSH Claude is your agent workspace: a warm cream canvas, serif display headlines, and one coral accent. Bring your own models and API keys (BYOK) — every capability is a plugin, and your keys never leave your machine.\n\nNot affiliated with Anthropic. "Claude" describes design inspiration only — the interface is an independent re-skin, built in the open.',
    continueLabel: 'Continue',
  },
} as const
