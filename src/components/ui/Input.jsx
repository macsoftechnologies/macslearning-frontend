import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Input.css';

export function Field({ label, required, error, hint, children }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      {label && (
        <label className="field__label">
          {label} {required && <span className="field__req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="field__error">{error}</span>}
      {!error && hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export default function Input({ type = 'text', className = '', ...rest }) {
  const [show, setShow] = useState(false);
  if (type === 'password') {
    return (
      <div className="input-wrap">
        <input type={show ? 'text' : 'password'} className={`input ${className}`} {...rest} />
        <button type="button" className="input-wrap__toggle" onClick={() => setShow((s) => !s)} tabIndex={-1}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
  return <input type={type} className={`input ${className}`} {...rest} />;
}

export function Textarea({ className = '', ...rest }) {
  return <textarea className={`input textarea ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`input select ${className}`} {...rest}>
      {children}
    </select>
  );
}
