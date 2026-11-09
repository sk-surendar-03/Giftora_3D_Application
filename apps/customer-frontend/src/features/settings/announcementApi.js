import api from '../../services/api'

export async function fetchAnnouncement(signal) {
  const { data } = await api.get('/settings/announcement', { signal })
  return data.announcement
}
