const unwrap = (payload) => {
  if (payload?.retcode !== undefined && payload.retcode !== 0) throw new Error(payload.message || 'API tidak tersedia')
  return payload?.data
}
export async function request(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Gagal mengambil data (${response.status})`)
  return response.json()
}
export async function getLatest() {
  const p = await request('/api/latest')
  return unwrap(p)?.results || unwrap(p) || []
}
export async function getTop() {
  const p = await request('/api/top')
  return unwrap(p)?.results || unwrap(p) || []
}
export async function searchManga(q) {
  const p = await request(`/api/search?q=${encodeURIComponent(q)}`)
  return unwrap(p)?.results || unwrap(p) || []
}
export async function getManga(id) {
  const p = await request(`/api/manga/${encodeURIComponent(id)}`)
  return unwrap(p)
}
export async function getChapter(id) {
  const p = await request(`/api/chapter/${encodeURIComponent(id)}`)
  return unwrap(p)
}
export function normalizeManga(m) {
  return {
    id: m?.manga_id || m?.id || '',
    title: m?.title || 'Tanpa judul',
    cover: m?.cover_portrait_url || m?.cover_image_url || m?.cover_url || '',
    description: m?.description || '',
    rating: Number(m?.user_rate || 0),
    genres: (m?.taxonomy?.Genre || m?.genres || []).map(x => typeof x === 'string' ? x : x.name).filter(Boolean),
    latest: m?.latest_chapter_number || '',
    status: m?.status === 2 ? 'Completed' : (m?.status || 'Ongoing'),
    chapters: m?.chapters || []
  }
}