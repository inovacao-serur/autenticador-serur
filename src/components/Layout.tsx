import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-black">
      {!isLoginPage && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  )
}