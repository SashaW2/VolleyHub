const express = require('express');
const locationService = require('../services/locationService');
const router = express.Router();

router.post('/geocode', async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.status(400).json({ success: false, message: 'Адрес обязателен' });
        }

        const coords = await locationService.getAddressCoordinates(address);

        if (!coords) {
            return res.status(404).json({ success: false, message: 'Координаты не найдены' });
        }

        res.json({ success: true, coords });
    } catch (error) {
        console.error('Geocode error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;