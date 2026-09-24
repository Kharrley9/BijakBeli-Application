const storeService = require('../services/storeService');

function originFrom(query) {
  const { lat, lng } = query;
  if (lat === undefined || lng === undefined) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

exports.createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getNearbyStores = async (req, res, next) => {
  try {
    const { lat, lng, maxKm, limit } = req.query;
    const stores = await storeService.getNearbyStores({ lat, lng, maxKm, limit });
    res.status(200).json({ success: true, data: stores });
  } catch (error) { next(error); }
};

exports.getStore = async (req, res, next) => {
  try {
    const store = await storeService.getStore(req.params.id, originFrom(req.query));
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getAllStores = async (req, res, next) => {
  try {
    const { admin, state, city, q } = req.query;
    const stores = await storeService.getAllStores(
      { admin: admin === 'true', state, city, q },
      originFrom(req.query)
    );
    res.status(200).json({ success: true, data: stores });
  } catch (error) { next(error); }
};

exports.updateStore = async (req, res, next) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.status(200).json({ success: true, message: 'Store deleted' });
  } catch (error) { next(error); }
};
