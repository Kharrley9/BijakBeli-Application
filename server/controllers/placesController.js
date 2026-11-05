const placesService = require('../services/placesService');

exports.getNearbyMalls = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm, limit } = req.query;
    const malls = await placesService.getNearbyMalls(
      { lat: Number(lat), lng: Number(lng) },
      {
        radiusM: radiusKm ? Number(radiusKm) * 1000 : undefined,
        limit,
      }
    );
    res.status(200).json({ success: true, data: malls });
  } catch (error) { next(error); }
};
