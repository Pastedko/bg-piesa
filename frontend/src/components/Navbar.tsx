import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Начало' },
  { to: '/authors', label: 'Автори' },
  { to: '/plays', label: 'Пиеси' },
  { to: '/about', label: 'За нас' },
  { to: '/admin', label: 'Админ' },
]

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <NavLink to="/">bgpiesa</NavLink>
        <span className="navbar__subtitle">Български театър онлайн</span>
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
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Navbar

