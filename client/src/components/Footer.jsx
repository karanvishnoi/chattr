import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-dark-border mt-16">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <div>© {new Date().getFullYear()} Chattr.com</div>
        <div className="flex items-center gap-5">
          <Link to="/pricing" className="hover:text-accent transition-colors">Pricing</Link>
          <a href="#" className="hover:text-accent transition-colors">Rules</a>
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
