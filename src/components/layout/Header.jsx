import React, { useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';
import useTradeStore from '../../store/useTradeStore';

const Header = () => {
  const { theme, cycleTheme } = useThemeStore();
  const { balance, myAssets } = useTradeStore();

  // 테마에 따라 html에 .dark 클래스 적용
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = false;

      if (theme === 'dark') isDark = true;
      else if (theme === 'light') isDark = false;
      else
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      root.classList.toggle('dark', isDark);
    };

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // 총 자산 계산 (간략)
  const totalAsset =
    balance +
    Object.entries(myAssets).reduce((acc, [, data]) => {
      return acc + data.averagePrice * data.quantity;
    }, 0);

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        Crypto Dash
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
          총 자산: {Math.floor(totalAsset).toLocaleString()} KRW
        </span>
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={`테마 변경 (현재: ${theme})`}
        >
          <Icon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
