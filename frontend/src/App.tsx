import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import About from './pages/About'
import Admin from './pages/Admin'
import AuthorDetails from './pages/AuthorDetails'
import Authors from './pages/Authors'
import Home from './pages/Home'
import PlayDetails from './pages/PlayDetails'
import Plays from './pages/Plays'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/authors/:id" element={<AuthorDetails />} />
          <Route path="/plays" element={<Plays />} />
          <Route path="/plays/:id" element={<PlayDetails />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>bgpiesa · Български театър онлайн · {new Date().getFullYear()}</p>
        <p>Свържи се с нас: contact@bgpiesa.bg</p>
      </footer>
    </div>
  )
}

export default App
