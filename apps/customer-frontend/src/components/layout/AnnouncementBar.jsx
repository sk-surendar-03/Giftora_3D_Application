import { useEffect, useState } from 'react'
import { fetchAnnouncement } from '../../features/settings/announcementApi.js'

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchAnnouncement(controller.signal)
      .then((data) => {
        setAnnouncement(data)
        setLoaded(true)
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setLoaded(true)
        }
      })

    return () => controller.abort()
  }, [])

  if (!loaded || !announcement || !announcement.enabled || !announcement.text?.trim()) {
    return null
  }

  return (
    <div className="bg-band text-ink text-center py-2 px-4 text-[12.5px] max-[760px]:text-[11.5px] font-medium tracking-[0.02em] select-none">
      {announcement.text.trim()}
    </div>
  )
}
