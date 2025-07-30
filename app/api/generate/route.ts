import axios from 'axios'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const response = await axios.post(process.env.N8N_WEBHOOK_URL!, body, {
      headers: { 'Content-Type': 'application/json' },
    })

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: unknown) {
    let errorMessage = 'AI generation failed'

    if (axios.isAxiosError(error) && error.message) {
      console.error('Axios error calling n8n:', error.message)
      errorMessage = error.message
    } else if (error instanceof Error) {
      console.error('General error calling n8n:', error.message)
      errorMessage = error.message
    } else {
      console.error('Unknown error calling n8n:', error)
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
