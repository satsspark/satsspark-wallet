import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Star, Rocket, Clock, Target, ExternalLink, Coins, Send } from 'lucide-react';
import toast from 'react-hot-toast';

function Launchpad() {
  const { i18n } = useTranslation();
  const { wallet, sparkAddress, balance, transfer } = useWallet();
  const [selectedTab, setSelectedTab] = useState('featured');
  const [showTokenLaunchModal, setShowTokenLaunchModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [mintCount, setMintCount] = useState(1);

  // SatsSpark代币发射台配置
  const TOKEN_CONFIG = {
    tokenPublicKey: '026a0b6af2f447a722fb5c3313872a2910187ac070e8a2bc1cf3dc2227e0f87ef2',
    tokenName: 'SatsSpark',
    tokenSymbol: 'SATS',
    totalSupply: 5000000000,
    currentMints: 1235,
    totalMints: 50000,
    feeAmount: 500, // sats
    maxUsagePerAddress: 10,
    feeAddresses: [
      'sp1pgssy4kvhsmgr2ke4q6lnw8pxlysyaplrgme4ka2jzdghvz36lp8zp98gxq80t',
      'sp1pgssy4kvhsmgr2ke4q6lnw8pxlysyaplrgme4ka2jzdghvz36lp8zp98gxq80t' // 注：这里是同一个地址，如果需要两个不同地址请提供
    ]
  };

  // 获取随机收费地址
  const getRandomFeeAddress = () => {
    const randomIndex = Math.floor(Math.random() * TOKEN_CONFIG.feeAddresses.length);
    return TOKEN_CONFIG.feeAddresses[randomIndex];
  };

  // 加载使用次数
  useEffect(() => {
    if (sparkAddress) {
      const storageKey = `token_launch_usage_${sparkAddress}`;
      const savedUsage = localStorage.getItem(storageKey);
      setUsageCount(savedUsage ? parseInt(savedUsage) : 0);
    }
  }, [sparkAddress]);

  // 保存使用次数
  const updateUsageCount = (newCount) => {
    if (sparkAddress) {
      const storageKey = `token_launch_usage_${sparkAddress}`;
      localStorage.setItem(storageKey, newCount.toString());
      setUsageCount(newCount);
    }
  };

  // 执行代币发射
  const handleTokenLaunch = async () => {
    // 检查钱包状态
    if (!wallet || !sparkAddress) {
      toast.error(i18n.language === 'en' ? 'Please unlock wallet first' : '请先解锁钱包');
      return;
    }

    // 检查使用次数限制
    if (usageCount + mintCount > TOKEN_CONFIG.maxUsagePerAddress) {
      toast.error(i18n.language === 'en' ? 
        `Exceeds maximum usage limit. Can only mint ${TOKEN_CONFIG.maxUsagePerAddress - usageCount} more times.` : 
        `超出最大使用限制。只能再铸造 ${TOKEN_CONFIG.maxUsagePerAddress - usageCount} 次。`);
      return;
    }

    // 检查余额
    const currentBalance = balance?.balance ? Number(balance.balance) : 0;
    const totalFee = TOKEN_CONFIG.feeAmount * mintCount;
    if (currentBalance < totalFee) {
      toast.error(i18n.language === 'en' ? 
        `Insufficient balance. Need ${totalFee} sats for ${mintCount} mints` : 
        `余额不足，需要 ${totalFee} sats 进行 ${mintCount} 次铸造`);
      return;
    }

    try {
      setIsLaunching(true);
      
      // 获取随机收费地址
      const feeAddress = getRandomFeeAddress();
      
      // 显示确认信息
      const totalFee = TOKEN_CONFIG.feeAmount * mintCount;
      toast.loading(i18n.language === 'en' ? 
        `Minting ${mintCount} SATS... Fee: ${totalFee} sats` : 
        `正在铸造 ${mintCount} 个SATS... 费用: ${totalFee} sats`, 
        { id: 'token-mint' });

      // 发送付费交易（按总费用发送）
      const result = await transfer(feeAddress, totalFee);
      
      if (result) {
        // 更新使用次数
        updateUsageCount(usageCount + mintCount);
        
        toast.dismiss('token-mint');
        toast.success(i18n.language === 'en' ? 
          `${mintCount} SATS minted successfully! Tokens will be distributed after minting ends.` : 
          `${mintCount} 个SATS铸造成功！代币将在铸币结束后分发。`, {
          duration: 5000
        });
        
        setShowTokenLaunchModal(false);
        setMintCount(1);
      }
    } catch (error) {
      console.error('Token minting failed:', error);
      toast.dismiss('token-mint');
      
      let errorMessage = error.message;
      if (error.message.includes('insufficient')) {
        errorMessage = i18n.language === 'en' ? 'Insufficient balance' : '余额不足';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = i18n.language === 'en' ? 'Network error, please try again' : '网络错误，请重试';
      }
      
      toast.error(i18n.language === 'en' ? 
        `Minting failed: ${errorMessage}` : 
        `铸造失败: ${errorMessage}`);
    } finally {
      setIsLaunching(false);
    }
  };

  // SatsSpark项目数据
  const projects = [
    {
      id: 'satsspark-minter',
      name: 'SatsSpark',
      description: i18n.language === 'en' ? 
        'LRC20 token issued on Bitcoin L2 Spark.' : 
        '比特币L2 Spark上发行的LRC20代币。',
      status: 'live',
      raised: TOKEN_CONFIG.currentMints * TOKEN_CONFIG.feeAmount,
      target: TOKEN_CONFIG.totalMints * TOKEN_CONFIG.feeAmount,
      participants: TOKEN_CONFIG.currentMints,
      tokenPrice: TOKEN_CONFIG.feeAmount / 100000000,
      allocation: usageCount,
      featured: true,
      tags: ['LRC20', 'SatsSpark', 'Bitcoin L2', 'Spark'],
      website: '#',
      isTokenLauncher: true,
      isTokenMinter: true,
      usageCount: usageCount,
      maxUsage: TOKEN_CONFIG.maxUsagePerAddress,
      feeAmount: TOKEN_CONFIG.feeAmount,
      tokenInfo: {
        name: TOKEN_CONFIG.tokenName,
        symbol: TOKEN_CONFIG.tokenSymbol,
        totalSupply: TOKEN_CONFIG.totalSupply,
        currentMints: TOKEN_CONFIG.currentMints,
        totalMints: TOKEN_CONFIG.totalMints
      }
    }
  ];

  const tabs = [
    { key: 'featured', label: i18n.language === 'en' ? 'Featured' : '精选', icon: Star },
    { key: 'live', label: i18n.language === 'en' ? 'Live' : '进行中', icon: Rocket },
    { key: 'upcoming', label: i18n.language === 'en' ? 'Upcoming' : '即将开始', icon: Clock },
    { key: 'ended', label: i18n.language === 'en' ? 'Ended' : '已结束', icon: Target }
  ];

  const filteredProjects = projects.filter(project => {
    switch (selectedTab) {
      case 'featured': return project.featured;
      case 'live': return project.status === 'live';
      case 'upcoming': return project.status === 'upcoming';
      case 'ended': return project.status === 'ended';
      default: return true;
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      live: { text: i18n.language === 'en' ? 'Live' : '进行中', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      upcoming: { text: i18n.language === 'en' ? 'Upcoming' : '即将开始', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      ended: { text: i18n.language === 'en' ? 'Ended' : '已结束', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    };
    const badge = badges[status];
    return <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${badge.className}`}>{badge.text}</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-3xl font-bold text-white">
          {i18n.language === 'en' ? 'Launchpad' : '发射台'}
        </h1>
        <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">
          {i18n.language === 'en' ? 'Discover and participate in new projects' : '发现并参与新项目'}
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl">
        {/* 标签导航 */}
        <div className="grid grid-cols-4 border-b border-gray-800 md:flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`flex flex-col md:flex-row items-center justify-center md:justify-start space-y-1 md:space-y-0 md:space-x-2 px-2 md:px-6 py-3 md:py-4 font-medium transition-all ${
                  selectedTab === tab.key
                    ? 'text-orange-500 border-b-2 border-orange-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-6">
          {/* 移动端：紧凑卡片布局 */}
          <div className="md:hidden space-y-2">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-gray-800/50 rounded-lg border border-gray-700 hover:border-orange-500/50 transition-all duration-300 p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{project.name.slice(0, 1)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                      <p className="text-gray-400 text-xs line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                {/* 项目进度 - 仅对进行中项目显示 */}
                {project.status === 'live' && (
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>${(project.raised / 1000).toFixed(0)}K</span>
                      <span>{((project.raised / project.target) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((project.raised / project.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <button 
                  onClick={() => {
                    if (project.isTokenLauncher) {
                      setShowTokenLaunchModal(true);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium text-xs flex items-center justify-center space-x-1"
                >
                  {project.isTokenLauncher ? (
                    <>
                      <Coins className="w-3 h-3" />
                      <span>{i18n.language === 'en' ? 'Mint SATS' : '铸造SATS'}</span>
                    </>
                  ) : (
                    <span>
                      {project.status === 'upcoming' 
                        ? (i18n.language === 'en' ? 'Notify Me' : '提醒我')
                        : project.status === 'live'
                        ? (i18n.language === 'en' ? 'Join Now' : '立即参与')
                        : (i18n.language === 'en' ? 'Details' : '详情')}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* 桌面端：网格布局 */}
          <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-gray-800/50 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all duration-300 overflow-hidden">
                <div className="h-48 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                  <div className="text-white text-4xl font-bold">
                    {project.isTokenLauncher ? 'SatsSpark' : project.name.slice(0, 2)}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-white">{project.name}</h3>
                    {getStatusBadge(project.status)}
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">{tag}</span>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        if (project.isTokenLauncher) {
                          setShowTokenLaunchModal(true);
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium text-sm flex items-center justify-center space-x-2"
                    >
                                              {project.isTokenLauncher ? (
                          <>
                            <Coins className="w-4 h-4" />
                            <span>{i18n.language === 'en' ? 'Mint SATS' : '铸造SATS'}</span>
                          </>
                        ) : (
                        <span>
                          {project.status === 'upcoming' 
                            ? (i18n.language === 'en' ? 'Notify Me' : '提醒我')
                            : project.status === 'live'
                            ? (i18n.language === 'en' ? 'Participate' : '参与')
                            : (i18n.language === 'en' ? 'View Details' : '查看详情')}
                        </span>
                      )}
                    </button>
                    {!project.isTokenLauncher && (
                      <button className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    {project.isTokenLauncher && (
                      <div className="flex items-center px-3 py-2 bg-gray-700 rounded-lg">
                        <span className="text-gray-300 text-xs">
                          {usageCount}/{TOKEN_CONFIG.maxUsagePerAddress}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 代币发射模态框 */}
      {showTokenLaunchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Coins className="w-5 h-5 text-orange-500" />
              <span>SatsSpark</span>
              <span 
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold bg-yellow-500 text-white"
                title={i18n.language === 'en' ? 'Platform Token' : '平台币'}
              >
                ✓
              </span>
            </h3>
            
            {/* 代币信息显示 */}
            <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-orange-400 font-bold text-sm">
                  {TOKEN_CONFIG.tokenName} ({TOKEN_CONFIG.tokenSymbol})
                </span>
                <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-500/20 rounded-full">
                  {i18n.language === 'en' ? 'Platform Token' : '平台币'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">{i18n.language === 'en' ? 'Total Supply' : '总供应量'}</span>
                  <p className="text-orange-300 font-medium">{TOKEN_CONFIG.totalSupply.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-400">{i18n.language === 'en' ? 'Minting Progress' : '铸造进度'}</span>
                  <p className="text-orange-300 font-medium">
                    {TOKEN_CONFIG.currentMints.toLocaleString()}/{TOKEN_CONFIG.totalMints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 使用次数显示 */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">
                  {i18n.language === 'en' ? 'Usage Count' : '使用次数'}
                </span>
                <span className="text-white font-medium">
                  {usageCount}/{TOKEN_CONFIG.maxUsagePerAddress}
                </span>
              </div>
              <div className="bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(usageCount / TOKEN_CONFIG.maxUsagePerAddress) * 100}%` }}
                ></div>
              </div>
              {usageCount >= TOKEN_CONFIG.maxUsagePerAddress && (
                <p className="text-red-400 text-xs mt-2">
                  {i18n.language === 'en' ? 'Maximum usage limit reached' : '已达到最大使用次数'}
                </p>
              )}
            </div>

            {/* 数量选择 */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">
                  {i18n.language === 'en' ? 'Mint Quantity' : '铸造数量'}
                </span>
                <span className="text-white font-medium">
                  {mintCount} {i18n.language === 'en' ? 'times' : '次'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMintCount(1)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mintCount === 1 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  1{i18n.language === 'en' ? 'x' : '次'}
                </button>
                <button
                  onClick={() => setMintCount(5)}
                  disabled={usageCount + 5 > TOKEN_CONFIG.maxUsagePerAddress}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    mintCount === 5 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  5{i18n.language === 'en' ? 'x' : '次'}
                </button>
                <button
                  onClick={() => setMintCount(10)}
                  disabled={usageCount + 10 > TOKEN_CONFIG.maxUsagePerAddress}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    mintCount === 10 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  10{i18n.language === 'en' ? 'x' : '次'}
                </button>
                <button
                  onClick={() => setMintCount(Math.min(TOKEN_CONFIG.maxUsagePerAddress - usageCount, 10))}
                  disabled={usageCount >= TOKEN_CONFIG.maxUsagePerAddress}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {i18n.language === 'en' ? 'Max' : '最大'}
                </button>
              </div>
            </div>

            {/* 费用信息 */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-orange-400 text-sm font-medium">
                  {i18n.language === 'en' ? 'Total Fee' : '总费用'}
                </span>
                <span className="text-orange-400 font-bold">
                  {TOKEN_CONFIG.feeAmount * mintCount} sats
                </span>
              </div>
              <p className="text-orange-300 text-xs mt-1">
                {TOKEN_CONFIG.feeAmount} sats × {mintCount} {i18n.language === 'en' ? 'times' : '次'}
              </p>
            </div>

            {/* 余额检查 */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {i18n.language === 'en' ? 'Your Balance' : '您的余额'}
                </span>
                <span className={`font-medium ${
                  balance?.balance && Number(balance.balance) >= TOKEN_CONFIG.feeAmount * mintCount
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {balance?.balance ? Number(balance.balance).toLocaleString() : '0'} sats
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">
                  {i18n.language === 'en' ? 'Required' : '需要'}
                </span>
                <span className="text-gray-300 text-xs">
                  {(TOKEN_CONFIG.feeAmount * mintCount).toLocaleString()} sats
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowTokenLaunchModal(false);
                  setMintCount(1);
                }}
                className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
              >
                {i18n.language === 'en' ? 'Cancel' : '取消'}
              </button>
              <button
                onClick={handleTokenLaunch}
                disabled={
                  isLaunching || 
                  usageCount + mintCount > TOKEN_CONFIG.maxUsagePerAddress || 
                  !balance?.balance || 
                  Number(balance.balance) < TOKEN_CONFIG.feeAmount * mintCount
                }
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                                  {isLaunching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>{i18n.language === 'en' ? 'Minting...' : '铸造中...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{i18n.language === 'en' ? 'Mint Now' : '立即铸造'}</span>
                    </>
                  )}
              </button>
            </div>

            {/* 分发说明 */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-xs leading-relaxed mb-2">
                <strong>{i18n.language === 'en' ? 'Token Distribution:' : '代币分发：'}</strong>
              </p>
              <p className="text-blue-300 text-xs leading-relaxed">
                {i18n.language === 'en' ? 
                  'SATS tokens will be distributed once the minting activity is fully completed. We will verify all on-chain data to ensure every successful participant receives the correct amount of tokens.' : 
                  'SATS代币将在铸币活动全面结束后一次性发放。届时，我们将验证并确认所有链上数据，确保每位成功参与铸币的用户都能收到正确数量的代币。'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Launchpad;