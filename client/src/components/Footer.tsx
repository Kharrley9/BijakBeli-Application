import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} BijakBeli. All rights reserved.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> in Batu Pahat, Johor
        </p>
      </div>
    </footer>
  );
}
