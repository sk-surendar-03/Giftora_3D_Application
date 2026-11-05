import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../components/layout/AnnouncementBar'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
