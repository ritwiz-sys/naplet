
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');




dotenv.config({ path: path.join(__dirname, '.env') })

const app = express();

app.use(cors());
app.use(express.json());
app.post('/api/ask-ai', async (req, res) => {
    const { prompt } = req.body
    
    try {
        const aiRes = await fetch('https://naplet.onrender.com/api/ask-ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });
        
        const data = await aiRes.json();
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch from AI service' });
    }
})





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

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
