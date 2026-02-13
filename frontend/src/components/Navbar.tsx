import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { LANG_STORAGE_KEY } from '../i18n'

const navLinks = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/authors', labelKey: 'nav.authors' },
  { to: '/plays', labelKey: 'nav.plays' },
  { to: '/library', labelKey: 'nav.library' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/admin', labelKey: 'nav.admin' },
] as const

const Navbar = () => {
  const { t, i18n } = useTranslation()

  const setLang = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem(LANG_STORAGE_KEY, lng)
  }

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <NavLink to="/">bgpiesa</NavLink>
        <span className="navbar__subtitle">{t('nav.subtitle')}</span>
      </div>
      <nav className="navbar__links">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            {t(link.labelKey)}
          </NavLink>
        ))}
        <div className="navbar__lang">
          <button
            type="button"
            className={`navbar__lang-btn ${i18n.language === 'bg' ? 'navbar__lang-btn--active' : ''}`}
            onClick={() => setLang('bg')}
            aria-label="Български"
          >
            БГ
          </button>
          <button
            type="button"
            className={`navbar__lang-btn ${i18n.language === 'en' ? 'navbar__lang-btn--active' : ''}`}
            onClick={() => setLang('en')}
            aria-label="English"
          >
            EN
          </button>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
