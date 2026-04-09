export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { prompt } = req.body || {};

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server' });
    }

    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024,
            }),
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
            return res.status(groqRes.status).json({
                error: data.error?.message || `Groq returned ${groqRes.status}`,
            });
        }

        return res.status(200).json({ response: data.choices[0].message.content });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
}
