import { serve } from 'inngest/next'
import { inngest } from '../../../inngest/client'
import {
  recomputeLeaderboard,
  aggregateReddit,
  aggregateHN,
  notifyFollowers,
  detectVoteAnomaly,
} from '../../../inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [recomputeLeaderboard, aggregateReddit, aggregateHN, notifyFollowers, detectVoteAnomaly],
})
