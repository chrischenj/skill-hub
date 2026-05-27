import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-figma-black text-white mt-24">
      <div className="max-w-content mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-pink to-accent-purple flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-lg">Skill Hub</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Discover, monitor, and install Claude Code skills from GitHub.
              Stay updated with the latest and greatest AI-powered development tools.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Explore</h4>
            <div className="space-y-2.5">
              <Link to="/skills" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Browse Skills
              </Link>
              <Link to="/trending" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Trending
              </Link>
              <Link to="/watched" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Watched
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Resources</h4>
            <div className="space-y-2.5">
              <Link to="/settings" className="block text-sm text-gray-400 hover:text-white transition-colors">
                Settings
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2026 Skill Hub</p>
          <p className="text-sm text-gray-500">
            Powered by Claude Code
          </p>
        </div>
      </div>
    </footer>
  );
}
