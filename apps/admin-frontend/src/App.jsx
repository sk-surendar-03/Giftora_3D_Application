import { Route, Routes } from 'react-router-dom'
import Login from './app/login/Login.jsx'
import Dashboard from './app/dashboard/Dashboard.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />} />
    </Routes>
  )
}

export default App
