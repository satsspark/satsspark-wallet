import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star,
  BarChart3,
  Volume2
} from 'lucide-react';

function Market() {
  const { i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('marketCap');
  const [showDevModal, setShowDevModal] = useState(true);

  // 真实市场数据 - 从API获取
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取真实市场数据
  React.useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        // 使用CoinGecko API获取真实市场数据
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }
        
        const data = await response.json();
        
        // 转换数据格式，重点关注比特币生态代币
        const formattedData = data
          .filter(coin => {
            // 优先显示比特币生态相关代币
            const bitcoinEcosystem = ['bitcoin', 'ordinals', 'stacks', 'wrapped-bitcoin'];
            const isRelevant = bitcoinEcosystem.includes(coin.id) || 
                             coin.name.toLowerCase().includes('bitcoin') ||
                             coin.name.toLowerCase().includes('btc') ||
                             coin.symbol.toLowerCase().includes('btc');
            return isRelevant || data.indexOf(coin) < 20; // 前20个市值最大的币种
          })
          .slice(0, 20)
          .map((coin, index) => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price || 0,
            change24h: coin.price_change_percentage_24h || 0,
            volume24h: coin.total_volume || 0,
            marketCap: coin.market_cap || 0,
            favorite: coin.symbol.toLowerCase() === 'btc' || coin.id === 'bitcoin',
            image: coin.image
          }));
        
        setMarketData(formattedData);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
        // 如果API失败，使用基础的比特币数据
        setMarketData([{
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 43000,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          favorite: true,
          image: null
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // 每30秒更新一次数据
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const categories = [
    { key: 'all', label: i18n.language === 'en' ? 'All' : '全部' },
    { key: 'favorites', label: i18n.language === 'en' ? 'Favorites' : '收藏' },
    { key: 'trending', label: i18n.language === 'en' ? 'Trending' : '热门' },
    { key: 'gainers', label: i18n.language === 'en' ? 'Gainers' : '涨幅榜' },
    { key: 'losers', label: i18n.language === 'en' ? 'Losers' : '跌幅榜' }
  ];

  // 切换收藏状态
  const toggleFavorite = (id) => {
    setMarketData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  };

  // 格式化价格
  const formatPrice = (price) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  // 格式化市值
  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${(marketCap / 1e3).toFixed(2)}K`;
    }
  };

  // 格式化交易量
  const formatVolume = (volume) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else {
      return `$${(volume / 1e3).toFixed(2)}K`;
    }
  };

  // 过滤和排序数据
  const filteredData = marketData
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      switch (selectedCategory) {
        case 'favorites':
          return matchesSearch && item.favorite;
        case 'gainers':
          return matchesSearch && item.change24h > 0;
        case 'losers':
          return matchesSearch && item.change24h < 0;
        case 'trending':
          return matchesSearch && Math.abs(item.change24h) > 10;
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'change24h':
          return b.change24h - a.change24h;
        case 'volume24h':
          return b.volume24h - a.volume24h;
        case 'marketCap':
        default:
          return b.marketCap - a.marketCap;
      }
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {i18n.language === 'en' ? 'Market' : '市场'}
        </h1>
        <div className="text-xs sm:text-sm text-gray-400">
          {i18n.language === 'en' ? 'Real-time cryptocurrency prices' : '实时加密货币价格'}
        </div>
      </div>

      {/* 市场统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-green-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">
                {i18n.language === 'en' ? 'Market Cap' : '总市值'}
              </p>
              <p className="text-white text-lg sm:text-xl font-bold">
                {loading ? '...' : formatMarketCap(marketData.reduce((sum, coin) => sum + coin.marketCap, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Volume2 className="text-blue-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">
                {i18n.language === 'en' ? '24h Volume' : '24小时成交量'}
              </p>
              <p className="text-white text-lg sm:text-xl font-bold">
                {loading ? '...' : formatVolume(marketData.reduce((sum, coin) => sum + coin.volume24h, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
              <BarChart3 className="text-orange-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">
                {i18n.language === 'en' ? 'BTC Dominance' : 'BTC占比'}
              </p>
              <p className="text-white text-lg sm:text-xl font-bold">52.3%</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="text-purple-400 w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">
                {i18n.language === 'en' ? 'Active Coins' : '活跃币种'}
              </p>
              <p className="text-white text-lg sm:text-xl font-bold">2,467</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={i18n.language === 'en' ? 'Search tokens...' : '搜索代币...'}
            />
          </div>

          {/* 排序选择 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="marketCap">
              {i18n.language === 'en' ? 'Market Cap' : '市值'}
            </option>
            <option value="price">
              {i18n.language === 'en' ? 'Price' : '价格'}
            </option>
            <option value="change24h">
              {i18n.language === 'en' ? '24h Change' : '24小时涨跌'}
            </option>
            <option value="volume24h">
              {i18n.language === 'en' ? '24h Volume' : '24小时成交量'}
            </option>
          </select>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm transition-all ${
                selectedCategory === category.key
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* 代币列表 */}
        <div className="space-y-2">
          {/* 桌面端表头 */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-gray-400 text-sm font-medium border-b border-gray-800">
            <div className="col-span-1">#</div>
            <div className="col-span-3">
              {i18n.language === 'en' ? 'Name' : '名称'}
            </div>
            <div className="col-span-2 text-right">
              {i18n.language === 'en' ? 'Price' : '价格'}
            </div>
            <div className="col-span-2 text-right">
              {i18n.language === 'en' ? '24h Change' : '24小时涨跌'}
            </div>
            <div className="col-span-2 text-right">
              {i18n.language === 'en' ? '24h Volume' : '24小时成交量'}
            </div>
            <div className="col-span-2 text-right">
              {i18n.language === 'en' ? 'Market Cap' : '市值'}
            </div>
          </div>

          {/* 代币行 - 桌面端 */}
          {filteredData.map((token, index) => (
            <div key={token.id}>
              {/* 桌面端布局 */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer">
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={() => toggleFavorite(token.id)}
                    className={`mr-2 ${token.favorite ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400`}
                  >
                    <Star size={16} fill={token.favorite ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-gray-400">{index + 1}</span>
                </div>
                
                <div className="col-span-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {token.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{token.symbol}</p>
                    <p className="text-gray-400 text-sm">{token.name}</p>
                  </div>
                </div>
                
                <div className="col-span-2 text-right">
                  <p className="text-white font-medium">{formatPrice(token.price)}</p>
                </div>
                
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    {token.change24h > 0 ? (
                      <TrendingUp className="text-green-400" size={16} />
                    ) : (
                      <TrendingDown className="text-red-400" size={16} />
                    )}
                    <span className={`font-medium ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="col-span-2 text-right">
                  <p className="text-white">{formatVolume(token.volume24h)}</p>
                </div>
                
                <div className="col-span-2 text-right">
                  <p className="text-white">{formatMarketCap(token.marketCap)}</p>
                </div>
              </div>

              {/* 移动端卡片布局 */}
              <div className="md:hidden bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => toggleFavorite(token.id)}
                        className={`${token.favorite ? 'text-yellow-400' : 'text-gray-400'} hover:text-yellow-400`}
                      >
                        <Star className="w-3 h-3" fill={token.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <span className="text-gray-400 text-xs">#{index + 1}</span>
                    </div>
                    <div className="w-7 h-7 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {token.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{token.symbol}</p>
                      <p className="text-gray-400 text-xs truncate">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-white font-medium text-sm">{formatPrice(token.price)}</p>
                    <div className="flex items-center justify-end space-x-1">
                      {token.change24h > 0 ? (
                        <TrendingUp className="text-green-400 w-3 h-3" />
                      ) : (
                        <TrendingDown className="text-red-400 w-3 h-3" />
                      )}
                      <span className={`text-xs font-medium ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-gray-700/50">
                  <div>
                    <p className="text-gray-400">{i18n.language === 'en' ? 'Vol' : '成交量'}</p>
                    <p className="text-white font-medium">{formatVolume(token.volume24h)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">{i18n.language === 'en' ? 'Cap' : '市值'}</p>
                    <p className="text-white font-medium">{formatMarketCap(token.marketCap)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {i18n.language === 'en' ? 'No tokens found' : '未找到匹配的代币'}
            </p>
          </div>
        )}
      </div>

      {/* 开发中弹窗 */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowDevModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-white w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {i18n.language === 'en' ? 'Market Feature' : '市场功能'}
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                {i18n.language === 'en' 
                  ? 'Market functionality is currently under development. Please stay tuned for updates!' 
                  : '市场功能正在开发中，敬请期待！'}
              </p>
              
              <button
                onClick={() => setShowDevModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
              >
                {i18n.language === 'en' ? 'Got it' : '我知道了'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Market; 