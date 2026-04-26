import { Link } from "react-router-dom";
import RetainLearnLogo from "../../svg/RetainLearnLogo";

const Footer = () => {
  return (
    <footer className="bg-brand-dark font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/" className="inline-flex items-center gap-0.5 group mb-4">
              <RetainLearnLogo className="h-9 w-auto" />
              <span className="text-base font-bold text-white group-hover:text-brand-accent transition-colors duration-200">
                RetainLearn
              </span>
            </Link>
            <p className="text-sm text-white/55 leading-relaxed">
              A free, open-source flashcard and quiz platform. Create decks,
              test yourself, and track what you've learned.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 sm:gap-20">
            <div>
              <h3 className="text-[10px] font-semibold text-white/45 uppercase tracking-widest mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/"
                    className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/categories"
                    className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold text-white/45 uppercase tracking-widest mb-4">
                Connect
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/FrOz3nFir3/retainlearn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors duration-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@retainlearn.com"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[10px] font-semibold text-white/45 uppercase tracking-widest mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/privacy"
                    className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-sm text-white/65 hover:text-white transition-colors duration-200"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-white/45">
            RetainLearn — open source, no restrictions.
          </p>
          <p className="text-xs text-white/45">
            Released under the{" "}
            <a
              href="https://unlicense.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/75 transition-colors duration-200"
            >
              Unlicense
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
