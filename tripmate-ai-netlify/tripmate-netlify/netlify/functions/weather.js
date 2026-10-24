// GET /api/weather?lat=..&lon=..  ->  dữ liệu thật từ Open-Meteo, không có số liệu giả.
const J = (c, b) => ({ statusCode: c, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(b) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return J(405, { error: 'Chỉ hỗ trợ GET.' });
  const p = event.queryStringParameters || {};
  const lat = Number(p.lat), lon = Number(p.lon);
  if (p.lat == null || p.lon == null || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < 5 || lat > 25 || lon < 100 || lon > 115)
    return J(400, { error: 'Tọa độ không hợp lệ hoặc nằm ngoài phạm vi Việt Nam.' });
  const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
    latitude: lat.toFixed(3), longitude: lon.toFixed(3),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
    timezone: 'Asia/Bangkok', forecast_days: '7'
  });
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ac.signal });
    if (r.status === 429) return J(429, { error: 'Open-Meteo đang giới hạn lượt truy vấn. Vui lòng thử lại sau.' });
    if (!r.ok) return J(502, { error: 'Open-Meteo trả lỗi ' + r.status + '.' });
    const d = await r.json();
    if (!d || !d.current || !d.daily || !Array.isArray(d.daily.time) || !d.daily.time.length)
      return J(502, { error: 'Open-Meteo trả dữ liệu rỗng hoặc sai định dạng.' });
    return J(200, { source: 'Open-Meteo', fetchedAt: new Date().toISOString(), current: d.current, daily: d.daily });
  } catch (e) {
    return J(e.name === 'AbortError' ? 504 : 502, { error: e.name === 'AbortError' ? 'Open-Meteo phản hồi quá chậm.' : 'Không kết nối được Open-Meteo.' });
  } finally { clearTimeout(t); }
};
