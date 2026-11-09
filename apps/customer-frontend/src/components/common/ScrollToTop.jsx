import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop ensures the window scroll position resets to the top
 * whenever the customer navigates to a new route / pathname.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If an in-page anchor hash exists, allow the browser to scroll to that element
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView()
        return
      }
    }

    // Scroll instantly to the top-left of the viewport
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    } catch {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
