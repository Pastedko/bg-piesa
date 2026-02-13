import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import About from './pages/About'
import Admin from './pages/Admin'
import AuthorDetails from './pages/AuthorDetails'
import Authors from './pages/Authors'
import Home from './pages/Home'
import Library from './pages/Library'
import LibraryDetail from './pages/LibraryDetail'
import PlayDetails from './pages/PlayDetails'
import Plays from './pages/Plays'
import './App.css'

function App() {
  const { t } = useTranslation()
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
          <Route path="/library" element={<Library />} />
          <Route path="/library/:id" element={<LibraryDetail />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>bgpiesa · {t('footer.subtitle')} · {new Date().getFullYear()}</p>
        <p>{t('footer.contact')}</p>
      </footer>
    </div>
  )
}

export default App
