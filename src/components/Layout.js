import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Rocket, 
  Settings, 
  Lock,
  Globe
} from 'lucide-react';

// X (Twitter) 图标组件
const XIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

function Layout({ children }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lockWallet, balance } = useWallet();
  const [btcPrice, setBtcPrice] = useState(107455); // 默认价格

  // 获取比特币价格
  const fetchBtcPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const data = await response.json();
      setBtcPrice(data.bitcoin.usd);
    } catch (error) {
      console.error('获取BTC价格失败:', error);
      // 保持当前价格不变
    }
  };

  // 初始化时获取价格，然后每小时更新一次
  useEffect(() => {
    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 60 * 60 * 1000); // 1小时更新一次
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { 
      key: 'dashboard', 
      icon: LayoutDashboard, 
      label: i18n.language === 'en' ? 'Dashboard' : '仪表盘',
      path: '/dashboard'
    },
    { 
      key: 'market', 
      icon: TrendingUp, 
      label: i18n.language === 'en' ? 'Market' : '市场',
      path: '/market'
    },
    { 
      key: 'launchpad', 
      icon: Rocket, 
      label: i18n.language === 'en' ? 'Launchpad' : '发射台',
      path: '/launchpad'
    },
    { 
      key: 'settings', 
      icon: Settings, 
      label: i18n.language === 'en' ? 'Settings' : '设置',
      path: '/settings'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 顶部导航栏 */}
      <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左侧：Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg">
                  <svg width="100%" height="100%" viewBox="0 0 32 32" className="rounded-xl">
                    {/* 黑色背景 */}
                    <rect width="32" height="32" fill="#000000" rx="6"/>
                    
                    {/* 白色S字母 */}
                    <path d="M8 12C8 9.79 9.79 8 12 8H16C18.21 8 20 9.79 20 12C20 14.21 18.21 16 16 16H12C9.79 16 8 17.79 8 20C8 22.21 9.79 24 12 24H20C22.21 24 24 22.21 24 20V18" 
                          stroke="#FFFFFF" 
                          strokeWidth="2.5" 
                          fill="none" 
                          strokeLinecap="round"/>
                    
                    {/* 橙色装饰点 */}
                    <circle cx="24" cy="12" r="1.5" fill="#FF8C00"/>
                    <circle cx="8" cy="20" r="1.5" fill="#FF8C00"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-bold text-white">SatsSpark</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/30">
                  BETA
                </span>
                <span className="sm:hidden px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-md border border-orange-500/30">
                  β
                </span>
              </div>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* 余额显示 - 桌面端 */}
              <div className="hidden lg:flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                <span className="text-gray-400 text-sm">{i18n.language === 'en' ? 'Balance:' : '余额:'}</span>
                <span className="text-white font-semibold text-sm">
                  ₿ {balance && balance.balance ? (Number(balance.balance) / 100000000).toFixed(8) : '0.00000000'}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-white font-semibold text-sm">
                  ${balance && balance.balance ? ((Number(balance.balance) / 100000000) * btcPrice).toFixed(2) : '0.00'}
                </span>
              </div>

              {/* 移动端简化余额显示 */}
              <div className="lg:hidden bg-gray-800 px-2 py-1 rounded-lg">
                <span className="text-white font-semibold text-xs">
                  ₿ {balance && balance.balance ? (Number(balance.balance) / 100000000).toFixed(4) : '0.0000'}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* X (Twitter) 链接 - 桌面端显示 */}
                <a 
                  href="https://x.com/sats_spark" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title={i18n.language === 'en' ? 'Follow us on X' : '在X上关注我们'}
                >
                  <XIcon size={20} />
                </a>

                {/* 语言切换 */}
                <button
                  onClick={toggleLanguage}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 锁定钱包 */}
                <button
                  onClick={lockWallet}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

            <div className="flex max-w-screen-2xl mx-auto">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:block w-64 bg-gray-900/30 border-r border-gray-800 min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active 
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-4 sm:p-6 md:pb-6 pb-24 max-w-5xl">
          {children}
        </main>
      </div>

      {/* 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-4 gap-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors min-h-[60px] ${
                  active 
                    ? 'text-orange-500 bg-orange-500/10' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default Layout; 