export default function Footer() {
  return (
    <footer className="border-t border-dark-border mt-16 relative z-10">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <div>© {new Date().getFullYear()} Chattr.com</div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-accent transition-colors">Blog</a>
          <a href="#" className="hover:text-accent transition-colors">Rules</a>
          <a href="#" className="hover:text-accent transition-colors">Terms</a>
          <a href="#" className="hover:text-accent transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
