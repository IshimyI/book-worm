import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <div className="siteFooter">
        <div className="siteFooterInner">
          <div className="siteFooterBrand">
            📚 Mr Book Worm
            <span>читай · оценивай · обсуждай</span>
          </div>

          <div className="siteFooterCol">
            <div className="siteFooterColTitle">Разделы</div>
            <nav className="siteFooterLinks">
              <NavLink to="/">Каталог</NavLink>
              <NavLink to="/collections">Подборки</NavLink>
              <NavLink to="/news">Новости</NavLink>
              <NavLink to="/faq">FAQ</NavLink>
            </nav>
          </div>

          <div className="siteFooterCol">
            <div className="siteFooterColTitle">Документы</div>
            <nav className="siteFooterLinks">
              <NavLink to="/privacy">Политика конфиденциальности</NavLink>
              <NavLink to="/terms">Пользовательское соглашение</NavLink>
            </nav>
          </div>

          <div className="siteFooterCol">
            <div className="siteFooterColTitle">Контакты</div>
            <nav className="siteFooterLinks">
              <a href="mailto:ivanborisenko.msk@gmail.com">Написать нам</a>
            </nav>
          </div>
        </div>
        <div className="siteFooterCopy" style={{ marginTop: '28px', maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' }}>
          © {new Date().getFullYear()} Mr Book Worm
        </div>
      </div>
    </footer>
  );
}
