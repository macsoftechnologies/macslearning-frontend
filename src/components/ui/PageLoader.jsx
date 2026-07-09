import './PageLoader.css';

export default function PageLoader({ label = 'Loading' }) {
  return (
    <div className="page-loader">
      <div className="page-loader__mark">
        <span />
        <span />
        <span />
      </div>
      <p>{label}…</p>
    </div>
  );
}
