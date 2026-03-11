import { createTRPCClient, httpBatchLink } from '@trpc/client'
// Type-only import — references the web app router for full end-to-end type safety.
// Nothing from this path is bundled at runtime (erased by TypeScript).
// If apps/web/server/routers/index.ts moves, update this path.
import type { AppRouter } from '../../../apps/web/server/routers'

const API_URL = process.env.PLASMO_PUBLIC_API_URL ?? 'https://topprompt.dev/api/trpc'

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      headers: async () => {
        const stored = await chrome.storage.local.get('toprompt_user')
        const user = stored.toprompt_user as { userId: string } | undefined
        return user ? { 'x-extension-user-id': user.userId } : {}
      },
    }),
  ],
})
