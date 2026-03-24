import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') ?? 'TopPrompt'
  const category = searchParams.get('category') ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b',
          width: '100%',
          height: '100%',
          padding: 60,
        }}
      >
        <div style={{ color: '#818cf8', fontSize: 24, marginBottom: 24, fontWeight: 600 }}>
          TopPrompt
        </div>
        <div
          style={{
            color: 'white',
            fontSize: title.length > 50 ? 42 : 52,
            fontWeight: 700,
            lineHeight: 1.2,
            flex: 1,
          }}
        >
          {title}
        </div>
        {category && (
          <div
            style={{
              color: '#818cf8',
              fontSize: 20,
              background: 'rgba(99,102,241,0.15)',
              padding: '6px 16px',
              borderRadius: 6,
              width: 'fit-content',
              marginBottom: 24,
            }}
          >
            {category}
          </div>
        )}
        <div style={{ color: '#52525b', fontSize: 18 }}>
          topprompt.io | prompt files for AI coding tools
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
