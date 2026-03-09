import type { PromptCategory } from '@toprompt/types'
import { Button, Card } from '@toprompt/ui'

const category: PromptCategory = 'coding'

function IndexPopup() {
  return (
    <main style={{ minWidth: 320, padding: 16 }}>
      <Card className="space-y-2 p-4">
        <h1 style={{ margin: 0 }}>TopPrompt</h1>
        <p style={{ margin: 0 }}>Category: {category}</p>
        <Button>Open Prompt Library</Button>
      </Card>
    </main>
  )
}

export default IndexPopup
