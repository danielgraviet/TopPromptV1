import type { Prompt } from '@toprompt/types'
import { Badge, Button, Card, Input } from '@toprompt/ui'

const samplePrompt: Prompt = {
  id: 'sample-1',
  title: 'Senior Engineer Code Review',
  description: 'Review a pull request for architecture, reliability, and maintainability',
  promptText: 'Review this diff for correctness and edge cases.',
  category: 'coding',
  tags: ['code-review', 'engineering'],
  models: ['claude-3-7', 'gpt-4o'],
  creatorId: 'user-1',
  upvoteCount: 4200,
  saveCount: 1800,
  createdAt: new Date(),
  updatedAt: new Date()
}

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <Badge>TopPrompt</Badge>
      <Card className="space-y-3 p-5">
        <h1 className="text-2xl font-semibold">{samplePrompt.title}</h1>
        <p className="text-sm text-slate-600">{samplePrompt.description}</p>
        <Input defaultValue={samplePrompt.promptText} readOnly />
        <Button>Copy Prompt</Button>
      </Card>
    </main>
  )
}
