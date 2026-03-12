const functions = require("firebase-functions");
const axios = require("axios");
 
const APP_ID = process.env.EDAMAM_APP_ID;
const APP_KEY = process.env.EDAMAM_APP_KEY;
const BASE = "https://api.edamam.com/api/recipes/v2";
 
exports.edamamSearch = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
 
  try {
    const params = {
      type: "public",
      app_id: APP_ID,
      app_key: APP_KEY,
      ...req.query,
    };
    const response = await axios.get(BASE, { params });
    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});
 
exports.edamamById = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
 
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    const params = { type: "public", app_id: APP_ID, app_key: APP_KEY };
    const response = await axios.get(`${BASE}/${encodeURIComponent(id)}`, { params });
    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});
 
exports.edamamSearch = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
 
  try {
    const params = {
      type: "public",
      app_id: APP_ID,
      app_key: APP_KEY,
      ...req.query,
    };
    const response = await axios.get(BASE, { params });
    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});
 
exports.edamamById = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
 
  try {
    const { id } = req.query;
    if (!id) { res.status(400).json({ error: "Missing id" }); return; }
    const params = { type: "public", app_id: APP_ID, app_key: APP_KEY };
    const response = await axios.get(`${BASE}/${encodeURIComponent(id)}`, { params });
    res.json(response.data);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(e.response?.status || 500).json({ error: e.message });
  }
});