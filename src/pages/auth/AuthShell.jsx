import { BookMarked } from 'lucide-react';
import './AuthShell.css';

export default function AuthShell({ eyebrow, title, subtitle, children, wide, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__side">
        <div className="auth-shell__brand">
          <span className="auth-shell__mark">
            <BookMarked size={20} />
          </span>
          <span>Ledger LMS</span>
        </div>
        <div className="auth-shell__quote">
          <p className="auth-shell__quote-text">
            "The organized classroom is the one where every learner always knows what comes next."
          </p>
          <div className="auth-shell__stats">
            <div>
              <strong>4</strong>
              <span>Role-based portals</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Progress tracking</span>
            </div>
            <div>
              <strong>Secure</strong>
              <span>Token-based access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-shell__form-col">
        <div className={`auth-card ${wide ? 'auth-card--wide' : ''}`}>
          {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
          <h1 className="auth-card__title">{title}</h1>
          {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          <div className="auth-card__body">{children}</div>
          {footer && <div className="auth-card__footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
