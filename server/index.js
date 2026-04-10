
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
app.post('/api/ask-ai', async (req, res) => {
    const { prompt } = req.body || {};

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: 'GROQ_API_KEY is missing in .env' });
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

        return res.json({ response: data?.choices?.[0]?.message?.content || '' });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error' });
    }
});





app.get('/api/weather', async (req, res) => {
    const city = req.query.city || 'Amaravati';
    const units = req.query.units || 'metric';

    if (!process.env.WEATHER_API_KEY) {
        return res.status(500).json({ error: 'WEATHER_API_KEY is missing in server/.env' });
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${encodeURIComponent(units)}&appid=${process.env.WEATHER_API_KEY}`;
    try {
        const weatherResponse = await fetch(url);
        const data = await weatherResponse.json();

        if (!weatherResponse.ok) {
            return res.status(weatherResponse.status).json({
                error: data.message || 'Weather API request failed',
            });
        }

        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
