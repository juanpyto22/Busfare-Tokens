// Serverless endpoint to request Supabase to (re)send confirmation email for a signup
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in environment (Vercel Project Secrets)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email required' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase not configured on server (missing service role key)' })
  }

  try {
    const resp = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ type: 'signup', email })
    })

    const data = await resp.json()
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.error || data })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) })
  }
}
