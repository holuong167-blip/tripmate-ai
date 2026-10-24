// GET /api/places?type=attraction|lodging|restaurant&q=<khu vực>
// Dùng Google Places API (New) - Text Search. Khóa nằm ở biến môi trường, không bao giờ gửi về trình duyệt.
const J = (c, b) => ({ statusCode: c, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(b) });
const TYPES = { attraction: 'điểm du lịch', lodging: 'khách sạn homestay nhà nghỉ', restaurant: 'nhà hàng quán ăn' };

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return J(405, { error: 'Chỉ hỗ trợ GET.' });
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return J(503, { configured: false, error: 'Chưa cấu hình GOOGLE_PLACES_API_KEY.' });
  const p = event.queryStringParameters || {};
  const q = String(p.q || '').replace(/[\u0000-\u001f]/g, ' ').trim();
  if (!TYPES[p.type]) return J(400, { error: 'Loại tìm kiếm không hợp lệ.' });
  if (q.length < 2 || q.length > 80) return J(400, { error: 'Khu vực cần từ 2 đến 80 ký tự.' });
  const fields = ['places.id', 'places.displayName', 'places.formattedAddress', 'places.location', 'places.googleMapsUri'];
  if (process.env.PLACES_RICH_FIELDS === 'true') fields.push('places.rating', 'places.userRatingCount');
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST', signal: ac.signal,
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields.join(',') },
      body: JSON.stringify({ textQuery: TYPES[p.type] + ' ' + q, languageCode: 'vi', regionCode: 'VN', pageSize: 10 })
    });
    if (r.status === 429) return J(429, { error: 'Google Places đã hết hạn mức. Thử lại sau.' });
    if (r.status === 400 || r.status === 401 || r.status === 403) return J(502, { error: 'Google từ chối yêu cầu (' + r.status + '). Kiểm tra bật Places API (New), thanh toán và giới hạn khóa.' });
    if (!r.ok) return J(502, { error: 'Google Places trả lỗi ' + r.status + '.' });
    const d = await r.json();
    const places = (d.places || []).map(x => ({
      id: x.id, name: x.displayName && x.displayName.text, address: x.formattedAddress || '',
      lat: x.location && x.location.latitude, lng: x.location && x.location.longitude,
      mapsUri: typeof x.googleMapsUri === 'string' && x.googleMapsUri.startsWith('https://') ? x.googleMapsUri : null,
      rating: x.rating ?? null, ratingCount: x.userRatingCount ?? null
    })).filter(x => x.name && x.mapsUri);
    return J(200, { source: 'Google Maps Platform (Places API New)', fetchedAt: new Date().toISOString(), places });
  } catch (e) {
    return J(e.name === 'AbortError' ? 504 : 502, { error: e.name === 'AbortError' ? 'Google Places phản hồi quá chậm.' : 'Không kết nối được Google Places.' });
  } finally { clearTimeout(t); }
};
