export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const city  = req.query.city  || 'Amaravati';
    const units = req.query.units || 'metric';

    if (!process.env.WEATHER_API_KEY) {
        return res.status(500).json({ error: 'WEATHER_API_KEY is not configured' });
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
}
