import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { 
  Send, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy,
  Eye,
  EyeOff,
  Upload,
  ArrowUp,
  QrCode,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

function Dashboard() {
  const { i18n } = useTranslation();
  const { 
    wallet, 
    sparkAddress, 
    balance, 
    transactions, 
    tokens, 
    transfer, 
    transferTokens, 
    isSparkConnected, 
    refreshBalance, 
    getTransfers, 
    getTokenInfo,
    createLightningInvoice
  } = useWallet();
  
  const [showBalance, setShowBalance] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showTokenSendModal, setShowTokenSendModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [tokenSendAmount, setTokenSendAmount] = useState('');
  const [tokenSendAddress, setTokenSendAddress] = useState('');
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [lightningInvoice, setLightningInvoice] = useState('');
  const [lightningAmount, setLightningAmount] = useState('');
  const [lightningMemo, setLightningMemo] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // 特殊代币标识配置
  const specialTokens = {
    '026a0b6af2f447a722fb5c3313872a2910187ac070e8a2bc1cf3dc2227e0f87ef2': { color: 'yellow', name: '黄标代币' },
    '0377abadfbab8cc1fd7382fab87835ab062fd72c3ae7662fa6b579210fca16cd59': { color: 'blue', name: '蓝标代币' },
    '029e4d50f931c170e100c1b7129e353cddd69c8ae50bf274e7a68b05144ef8b55e': { color: 'blue', name: '蓝标代币' }
  };

  // 获取代币特殊标识 - Twitter风格勾号
  const getTokenBadge = (tokenPublicKey) => {
    const special = specialTokens[tokenPublicKey];
    if (!special) return null;
    
    const badgeStyles = {
      yellow: 'bg-yellow-500 text-white',
      blue: 'bg-blue-500 text-white'
    };
    
    return (
      <span 
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold ${badgeStyles[special.color]}`}
        title={special.name}
      >
        ✓
      </span>
    );
  };

  // 初始化时获取价格，然后每小时更新一次
  useEffect(() => {
    // 获取比特币价格
    const fetchBtcPrice = async () => {
      try {
        setPriceLoading(true);
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
      } catch (error) {
        console.error('获取BTC价格失败:', error);
        // 如果获取失败，使用默认价格
        setBtcPrice(prev => prev || 107455); // 默认价格
      } finally {
        setPriceLoading(false);
      }
    };

    fetchBtcPrice();
    const interval = setInterval(fetchBtcPrice, 60 * 60 * 1000); // 1小时 = 60分钟 * 60秒 * 1000毫秒
    return () => clearInterval(interval);
  }, []); // 空依赖数组，只在组件挂载时运行一次

  // 当钱包状态改变时，主动获取交易记录
  useEffect(() => {
    if (wallet && sparkAddress && getTransfers) {
      getTransfers().catch(error => {
        console.error('获取交易记录失败:', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, sparkAddress]); // 故意忽略 getTransfers 和 getTokenTransactions 依赖以避免无限循环

  // 复制地址
  const copyAddress = () => {
    const addressToCopy = sparkAddress || '';
    if (addressToCopy) {
      navigator.clipboard.writeText(addressToCopy);
      toast.success(i18n.language === 'en' ? 'Spark address copied!' : 'Spark地址已复制！');
    } else {
      toast.error(i18n.language === 'en' ? 'No address available' : '没有可用地址');
    }
  };

  // 手动刷新所有数据（余额、交易记录、代币）
  const handleRefreshBalance = async () => {
    try {
      toast.loading(i18n.language === 'en' ? 'Refreshing data...' : '正在刷新数据...', { id: 'refresh-data' });
      
      // 先刷新代币信息，再刷新余额，最后刷新交易记录
      let tokenInfo = [];
      try {
        tokenInfo = await getTokenInfo(); // 先获取代币信息
      } catch (error) {
        console.warn('刷新代币信息失败:', error);
      }
      
      await Promise.all([
        refreshBalance(wallet, true, tokenInfo), // 强制刷新余额，传入代币信息
        getTransfers && getTransfers() // 刷新交易记录
      ]);
      
      toast.dismiss('refresh-data');
      toast.success(i18n.language === 'en' ? 'Data refreshed!' : '数据已刷新！');
    } catch (error) {
      toast.dismiss('refresh-data');
      toast.error(i18n.language === 'en' ? 'Failed to refresh data' : '刷新数据失败');
      console.error('刷新数据失败:', error);
    }
  };

  // 创建闪电网络发票
  const handleCreateLightningInvoice = async () => {
    if (!lightningAmount || isNaN(lightningAmount) || Number(lightningAmount) <= 0) {
      toast.error(i18n.language === 'en' ? 'Please enter a valid amount' : '请输入有效金额');
      return;
    }

    try {
      toast.loading(i18n.language === 'en' ? 'Creating Lightning invoice...' : '正在创建闪电网络发票...', { id: 'create-invoice' });
      
      const result = await createLightningInvoice(
        Number(lightningAmount), 
        lightningMemo.trim() || undefined
      );
      
      // 根据实际返回的数据结构处理
      let invoiceString = null;
      if (result) {
        // 可能的返回格式
        if (result.paymentRequest) {
          invoiceString = result.paymentRequest;
        } else if (result.invoice && result.invoice.paymentRequest) {
          invoiceString = result.invoice.paymentRequest;
        } else if (result.invoice && result.invoice.encoded_invoice) {
          invoiceString = result.invoice.encoded_invoice;
        } else if (result.invoice && result.invoice.encodedInvoice) {
          invoiceString = result.invoice.encodedInvoice;
        } else if (typeof result === 'string') {
          invoiceString = result;
        } else if (result.id && result.invoice) {
          // 可能是 LightningReceiveRequest 格式
          const invoice = result.invoice;
          if (invoice.encoded_invoice) {
            invoiceString = invoice.encoded_invoice;
          }
        }
      }
      
      if (invoiceString) {
        setLightningInvoice(invoiceString);
        toast.dismiss('create-invoice');
        toast.success(i18n.language === 'en' ? 'Lightning invoice created!' : '闪电网络发票已创建！');
      } else {
        console.error('Unexpected invoice response format:', result);
        throw new Error('Invalid invoice response format');
      }
    } catch (error) {
      toast.dismiss('create-invoice');
      toast.error(i18n.language === 'en' ? `Failed to create Lightning invoice: ${error.message}` : `创建闪电网络发票失败: ${error.message}`);
      console.error('创建闪电网络发票失败:', error);
    }
  };

  // 复制闪电网络发票
  const copyLightningInvoice = () => {
    if (lightningInvoice) {
      navigator.clipboard.writeText(lightningInvoice);
      toast.success(i18n.language === 'en' ? 'Lightning invoice copied!' : '闪电网络发票已复制！');
    }
  };

  // 发送交易
  const handleSendTransaction = async () => {
    
    if (!sendAddress || !sendAmount) {
      toast.error(i18n.language === 'en' ? 'Please fill in all information' : '请填写完整信息');
      return;
    }

    // 验证地址格式
    if (!sendAddress.trim().startsWith('sp')) {
      toast.error(i18n.language === 'en' ? 'Please enter a valid Spark address (starts with sp)' : '请输入有效的Spark地址（以sp开头）');
      return;
    }

    // 验证金额
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(i18n.language === 'en' ? 'Please enter a valid amount' : '请输入有效金额');
      return;
    }

    // 检查钱包状态
    if (!wallet || !sparkAddress) {
      toast.error(i18n.language === 'en' ? 'Wallet not ready, please wait' : '钱包未就绪，请稍等');
      return;
    }

    try {
      // 直接使用sats，不需要转换
      const amountSats = Math.floor(amount);

      if (amountSats <= 0) {
        toast.error(i18n.language === 'en' ? 'Amount must be greater than 0' : '金额必须大于0');
        return;
      }

      // 检查余额是否足够
      const currentBalance = balance?.balance ? Number(balance.balance) : 0;
      if (amountSats > currentBalance) {
        toast.error(i18n.language === 'en' ? 'Insufficient balance' : '余额不足');
        return;
      }

      // 显示加载状态
      toast.loading(i18n.language === 'en' ? 'Sending transaction...' : '正在发送交易...', { 
        id: 'sending-tx' 
      });

      await transfer(sendAddress.trim(), amountSats);
      
      toast.dismiss('sending-tx');
      toast.success(i18n.language === 'en' ? 'Transaction sent successfully!' : '交易发送成功！');
      
      setShowSendModal(false);
      setSendAmount('');
      setSendAddress('');
    } catch (error) {
      console.error('Send transaction failed:', error);
      toast.dismiss('sending-tx');
      
      // 更友好的错误消息
      let errorMessage = error.message;
      if (error.message.includes('insufficient')) {
        errorMessage = i18n.language === 'en' ? 'Insufficient balance' : '余额不足';
      } else if (error.message.includes('invalid address')) {
        errorMessage = i18n.language === 'en' ? 'Invalid recipient address' : '接收地址无效';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = i18n.language === 'en' ? 'Network error, please try again' : '网络错误，请重试';
      }
      
      toast.error(i18n.language === 'en' ? `Transaction failed: ${errorMessage}` : `交易失败: ${errorMessage}`);
    }
  };

  // 发送代币交易
  const handleTokenSendTransaction = async () => {
    if (!tokenSendAddress || !tokenSendAmount) {
      toast.error(i18n.language === 'en' ? 'Please fill in all information' : '请填写完整信息');
      return;
    }

    // 验证地址格式
    if (!tokenSendAddress.trim().startsWith('sp')) {
      toast.error(i18n.language === 'en' ? 'Please enter a valid Spark address (starts with sp)' : '请输入有效的Spark地址（以sp开头）');
      return;
    }

    // 验证金额
    const amount = parseFloat(tokenSendAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(i18n.language === 'en' ? 'Please enter a valid amount' : '请输入有效金额');
      return;
    }

    // 检查钱包状态
    if (!wallet || !sparkAddress) {
      toast.error(i18n.language === 'en' ? 'Wallet not ready, please wait' : '钱包未就绪，请稍等');
      return;
    }

    // 检查是否选择了代币
    if (!selectedToken) {
      toast.error(i18n.language === 'en' ? 'No token selected' : '未选择代币');
      return;
    }

    try {
      // 转换金额 - 根据代币的decimals处理
      let amountToSend;
      if (selectedToken.decimals && selectedToken.decimals > 0) {
        // 如果代币有decimals，需要相应地调整金额
        amountToSend = Math.floor(amount * Math.pow(10, selectedToken.decimals));
      } else {
        // 如果没有decimals，直接使用整数
        amountToSend = Math.floor(amount);
      }

      if (amountToSend <= 0) {
        toast.error(i18n.language === 'en' ? 'Amount must be greater than 0' : '金额必须大于0');
        return;
      }

      // 检查余额是否足够
      const currentBalance = selectedToken.balance || selectedToken.amount || 0;
      if (amountToSend > currentBalance) {
        toast.error(i18n.language === 'en' ? 'Insufficient token balance' : '代币余额不足');
        return;
      }

      // 获取代币公钥
      const tokenPublicKey = selectedToken.tokenPublicKey;
      if (!tokenPublicKey) {
        toast.error(i18n.language === 'en' ? 'Token public key not found' : '代币公钥未找到');
        return;
      }

      // 显示加载状态
      toast.loading(i18n.language === 'en' ? 'Sending tokens...' : '正在发送代币...', { 
        id: 'sending-token' 
      });

      await transferTokens(tokenPublicKey, amountToSend, tokenSendAddress.trim());
      
      toast.dismiss('sending-token');
      toast.success(i18n.language === 'en' ? 'Token transfer sent successfully!' : '代币转账发送成功！');
      
      setShowTokenSendModal(false);
      setSelectedToken(null);
      setTokenSendAmount('');
      setTokenSendAddress('');
    } catch (error) {
      console.error('Token transfer failed:', error);
      toast.dismiss('sending-token');
      
      // 更友好的错误消息
      let errorMessage = error.message;
      if (error.message.includes('insufficient')) {
        errorMessage = i18n.language === 'en' ? 'Insufficient token balance' : '代币余额不足';
      } else if (error.message.includes('invalid address')) {
        errorMessage = i18n.language === 'en' ? 'Invalid recipient address' : '接收地址无效';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = i18n.language === 'en' ? 'Network error, please try again' : '网络错误，请重试';
      } else if (error.message.includes('token')) {
        errorMessage = i18n.language === 'en' ? 'Token operation failed' : '代币操作失败';
      }
      
      toast.error(i18n.language === 'en' ? `Token transfer failed: ${errorMessage}` : `代币转账失败: ${errorMessage}`);
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // 格式化交易类型
  const getTransactionIcon = (direction) => {
    return direction === 'OUTBOUND' ? (
      <ArrowUpRight className="text-red-400" size={16} />
    ) : (
      <ArrowDownLeft className="text-green-400" size={16} />
    );
  };

  // 格式化交易类型名称
  const getTransactionTypeName = (type) => {
    const typeNames = {
      'SPARK_TRANSFER': i18n.language === 'en' ? 'Spark Transfer' : 'Spark转账',
      'BITCOIN_DEPOSIT': i18n.language === 'en' ? 'Bitcoin Deposit' : '比特币存款',
      'BITCOIN_WITHDRAWAL': i18n.language === 'en' ? 'Bitcoin Withdrawal' : '比特币提现',
      'LIGHTNING_PAYMENT': i18n.language === 'en' ? 'Lightning Payment' : '闪电支付',
      'TOKEN_TRANSFER': i18n.language === 'en' ? 'Token Transfer' : '代币转账'
    };
    return typeNames[type] || type;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {i18n.language === 'en' ? 'Dashboard' : '仪表盘'}
        </h1>
        <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">
          <div className="flex items-center space-x-2">
            <span>{i18n.language === 'en' ? 'Welcome back!' : '欢迎回来！'}</span>
            {btcPrice && (
              <span className="text-orange-400">
                • BTC: ${btcPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 余额卡片 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex-1">
            <p className="text-orange-100 text-sm">
              {i18n.language === 'en' ? 'Total Balance' : '总余额'}
            </p>
            <div className="flex items-center space-x-2">
              {showBalance ? (
                <div className="flex flex-col">
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {isSparkConnected ? 
                      `${balance && balance.balance ? Number(balance.balance).toLocaleString() : '0'} sats` : 
                      `₿ ${balance && balance.balance ? (Number(balance.balance) / 100000000).toFixed(8) : '0.00000000'}`
                    }
                  </h2>
                  {isSparkConnected && balance && balance.balance && Number(balance.balance) > 0 && (
                    <p className="text-orange-200 text-sm">
                      ≈ ₿ {(Number(balance.balance) / 100000000).toFixed(8)}
                    </p>
                  )}
                </div>
              ) : (
                <h2 className="text-2xl sm:text-3xl font-bold">••••••••</h2>
              )}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleRefreshBalance}
                  className="text-orange-100 hover:text-white transition-colors"
                  title={i18n.language === 'en' ? 'Refresh balance, transactions and tokens' : '刷新余额、交易记录和代币'}
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-orange-100 hover:text-white"
                >
                  {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
            <p className="text-orange-100 text-base sm:text-lg">
              {showBalance ? (
                btcPrice ? 
                  `≈ $${balance && balance.balance ? ((Number(balance.balance) / 100000000) * btcPrice).toFixed(2) : '0.00'}` :
                  (priceLoading ? '≈ $...' : '≈ $0.00')
              ) : '≈ $••••••'}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-orange-100 text-xs">
              {isSparkConnected ? 
                (i18n.language === 'en' ? 'Spark Address' : 'Spark地址') : 
                (i18n.language === 'en' ? 'Bitcoin Address' : '比特币地址')
              }
            </p>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-white/10 px-2 py-1 rounded">
                {sparkAddress && isSparkConnected ? 
                  `${sparkAddress.slice(0, 6)}...${sparkAddress.slice(-4)}` : 
                  (wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Loading...')
                }
              </code>
              <button
                onClick={copyAddress}
                className="text-orange-100 hover:text-white"
              >
                <Copy size={14} />
              </button>
            </div>
            {/* 显示连接状态 */}
            <div className="mt-1">
              <span className={`text-xs px-2 py-1 rounded-full ${
                isSparkConnected ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {isSparkConnected ? 
                  (i18n.language === 'en' ? 'Spark Connected' : 'Spark已连接') : 
                  (i18n.language === 'en' ? 'Offline Mode' : '离线模式')
                }
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 transition-all"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium">
              {i18n.language === 'en' ? 'Send' : '发送'}
            </span>
          </button>
          
          <button
            onClick={() => setShowReceiveModal(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 transition-all"
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium">
              {i18n.language === 'en' ? 'Receive' : '接收'}
            </span>
          </button>
          
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 transition-all"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium">
              {i18n.language === 'en' ? 'Withdraw' : '提现'}
            </span>
            <span className="text-xs text-orange-400 font-medium">
              {i18n.language === 'en' ? 'Maintenance' : '维护中'}
            </span>
          </button>
          
          <button 
            onClick={() => setShowDepositModal(true)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 flex flex-col items-center space-y-1 sm:space-y-2 transition-all"
          >
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-medium">
              {i18n.language === 'en' ? 'Deposit' : '充值'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 代币模块 */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
            {i18n.language === 'en' ? 'Tokens' : '代币'}
          </h3>
          
          <div className="space-y-2 sm:space-y-3">
            {/* 显示来自balance的代币余额 */}
            {balance && balance.tokenBalances && balance.tokenBalances.length > 0 ? (
              balance.tokenBalances.map((token, index) => (
                <div key={token.tokenPublicKey || token.symbol || `token-${index}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {token.symbol.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium text-sm sm:text-base">{token.symbol}</p>
                        {getTokenBadge(token.tokenPublicKey)}
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm sm:text-base">
                      {token.displayBalance ? token.displayBalance.toLocaleString() : token.balance.toLocaleString()}
                    </p>
                    {token.decimals > 0 && (
                      <p className="text-gray-400 text-xs">
                        {token.decimals} decimals
                      </p>
                    )}
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <button
                        onClick={() => {
                          setSelectedToken(token);
                          setShowTokenSendModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 hover:text-orange-300 text-xs px-2 py-1 bg-orange-500/10 rounded"
                      >
                        {i18n.language === 'en' ? 'Send' : '发送'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : tokens && tokens.length > 0 ? (
              // 回退到原来的tokens数据
              tokens.map((token, index) => (
                <div key={token.tokenPublicKey || token.symbol || `token-${index}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {(token.symbol || token.tokenSymbol || 'T').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium text-sm sm:text-base">{token.symbol || token.tokenSymbol || 'Unknown Token'}</p>
                        {getTokenBadge(token.tokenPublicKey)}
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm">{token.name || token.tokenName || 'Token'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium text-sm sm:text-base">
                      {token.displayBalance ? token.displayBalance.toLocaleString() : (token.balance || token.amount || 0).toLocaleString()}
                    </p>
                    {token.decimals > 0 && (
                      <p className="text-gray-400 text-xs">
                        {token.decimals} decimals
                      </p>
                    )}
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <button
                        onClick={() => {
                          setSelectedToken(token);
                          setShowTokenSendModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400 hover:text-orange-300 text-xs px-2 py-1 bg-orange-500/10 rounded"
                      >
                        {i18n.language === 'en' ? 'Send' : '发送'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>{i18n.language === 'en' ? 'No tokens yet' : '暂无代币'}</p>
                <p className="text-xs mt-1">{i18n.language === 'en' ? 'Token balances will appear here' : '代币余额将在此显示'}</p>
              </div>
            )}
          </div>
        </div>

        {/* 最近交易 */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
            {i18n.language === 'en' ? 'Recent Transactions' : '最近交易'}
          </h3>
          
          <div className="space-y-2 sm:space-y-3">
            {transactions && transactions.length > 0 ? (
              transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(tx.direction)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base">
                        {tx.direction === 'OUTBOUND' ? 
                          (i18n.language === 'en' ? 'Sent' : '发送') : 
                          (i18n.language === 'en' ? 'Received' : '接收')
                        }
                        <span className="text-gray-400 text-xs ml-2">
                          {getTransactionTypeName(tx.type || 'SPARK_TRANSFER')}
                        </span>
                      </p>
                      {(() => {
                        // 获取对方地址和类型
                        const getOtherAddressInfo = () => {
                          if (tx.direction === 'OUTBOUND') {
                            return {
                              address: tx.receiverSparkAddress || '',
                              isIdentityKey: tx.receiverIsIdentityKey || false
                            };
                          } else {
                            return {
                              address: tx.senderSparkAddress || '',
                              isIdentityKey: tx.senderIsIdentityKey || false
                            };
                          }
                        };
                        
                        const { address: otherAddress, isIdentityKey } = getOtherAddressInfo();
                        

                        
                        if (!otherAddress) {
                          return (
                            <span className="text-gray-400 text-xs sm:text-sm">
                              {i18n.language === 'en' ? 'Unknown address' : '未知地址'}
                            </span>
                          );
                        }
                        
                        return (
                          <div className="flex flex-col">
                            <span className="text-gray-400 text-xs">
                              {tx.direction === 'OUTBOUND' ? 
                                (i18n.language === 'en' ? 'To:' : '发送至:') : 
                                (i18n.language === 'en' ? 'From:' : '来自:')
                              }
                            </span>
                            <div className="flex items-center space-x-1">
                              <a 
                                href={`https://www.sparkscan.io/address/${otherAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:text-orange-300 text-xs sm:text-sm transition-colors flex items-center space-x-1"
                                title={i18n.language === 'en' ? 'View on Spark Explorer' : '在Spark浏览器中查看'}
                              >
                                <span className="truncate">
                                  {otherAddress.slice(0, isIdentityKey ? 8 : 6)}...{otherAddress.slice(isIdentityKey ? -6 : -4)}
                                </span>
                                <ExternalLink size={12} className="flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-medium text-sm sm:text-base ${tx.direction === 'OUTBOUND' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.direction === 'OUTBOUND' ? '-' : '+'}{(tx.amountSats || 0).toLocaleString()} sats
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">{formatTime(tx.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>{i18n.language === 'en' ? 'No transactions yet' : '暂无交易记录'}</p>
              </div>
            )}
            
            {/* 查看更多按钮 */}
            {transactions && transactions.length > 0 && sparkAddress && (
              <div className="mt-4 text-center">
                <a
                  href={`https://www.sparkscan.io/address/${sparkAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium"
                >
                  <span>{i18n.language === 'en' ? 'View All Transactions' : '查看全部交易'}</span>
                  <ExternalLink size={14} />
                </a>
                <p className="text-gray-500 text-xs mt-1">
                  {i18n.language === 'en' ? 'View complete transaction history on Spark Explorer' : '在Spark浏览器查看完整交易记录'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 发送模态框 */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {i18n.language === 'en' ? 'Send Sats' : '发送Sats'}
            </h3>
            
            {/* 余额显示 */}
                         <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
               <p className="text-gray-400 text-sm">
                 {i18n.language === 'en' ? 'Available Balance' : '可用余额'}
               </p>
               <p className="text-white font-medium">
                 {balance?.balance ? `${Number(balance.balance).toLocaleString()} sats` : '0 sats'}
                 <span className="text-gray-400 text-sm ml-2">
                   (≈ ₿ {balance?.balance ? (Number(balance.balance) / 100000000).toFixed(8) : '0.00000000'})
                   {btcPrice && balance?.balance && (
                     <span className="text-green-400 ml-1">
                       ≈ ${((Number(balance.balance) / 100000000) * btcPrice).toFixed(2)}
                     </span>
                   )}
                 </span>
               </p>
             </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {i18n.language === 'en' ? 'Address' : '地址'}
                </label>
                <input
                  type="text"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter recipient address' : '输入接收地址'}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {i18n.language === 'en' ? 'Amount (sats)' : '金额 (sats)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (balance?.balance) {
                        // 留一点手续费，发送99%的余额
                        const maxAmount = Math.floor(Number(balance.balance) * 0.99);
                        setSendAmount(maxAmount.toString());
                      }
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {i18n.language === 'en' ? 'Max' : '最大'}
                  </button>
                </div>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="1000"
                  step="1"
                  min="1"
                />
                {sendAmount && (
                  <p className="text-gray-400 text-xs mt-1">
                    ≈ ₿ {(parseFloat(sendAmount || 0) / 100000000).toFixed(8)}
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  {i18n.language === 'en' ? 'Cancel' : '取消'}
                </button>
                <button
                  onClick={handleSendTransaction}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {i18n.language === 'en' ? 'Send' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 代币发送模态框 */}
      {showTokenSendModal && selectedToken && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {i18n.language === 'en' ? `Send ${selectedToken.symbol || 'Token'}` : `发送 ${selectedToken.symbol || '代币'}`}
            </h3>
            
            {/* 代币余额显示 */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
              <p className="text-gray-400 text-sm">
                {i18n.language === 'en' ? 'Available Balance' : '可用余额'}
              </p>
              <p className="text-white font-medium">
                {selectedToken.displayBalance ? selectedToken.displayBalance.toLocaleString() : (selectedToken.balance || selectedToken.amount || 0).toLocaleString()} {selectedToken.symbol || 'tokens'}
              </p>
              {selectedToken.decimals > 0 && (
                <p className="text-gray-400 text-xs mt-1">
                  Raw: {(selectedToken.balance || 0).toLocaleString()} ({selectedToken.decimals} decimals)
                </p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {i18n.language === 'en' ? 'Address' : '地址'}
                </label>
                <input
                  type="text"
                  value={tokenSendAddress}
                  onChange={(e) => setTokenSendAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter recipient address' : '输入接收地址'}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {i18n.language === 'en' ? `Amount (${selectedToken.symbol || 'tokens'})` : `金额 (${selectedToken.symbol || '代币'})`}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const maxAmount = selectedToken.displayBalance || selectedToken.balance || selectedToken.amount || 0;
                      setTokenSendAmount(maxAmount.toString());
                    }}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    {i18n.language === 'en' ? 'Max' : '最大'}
                  </button>
                </div>
                <input
                  type="number"
                  value={tokenSendAmount}
                  onChange={(e) => setTokenSendAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="100"
                  step="1"
                  min="1"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowTokenSendModal(false);
                    setSelectedToken(null);
                    setTokenSendAmount('');
                    setTokenSendAddress('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  {i18n.language === 'en' ? 'Cancel' : '取消'}
                </button>
                <button
                  onClick={handleTokenSendTransaction}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {i18n.language === 'en' ? 'Send' : '发送'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 充值模态框 */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {i18n.language === 'en' ? 'Deposit Bitcoin' : '充值比特币'}
            </h3>
            
            <div className="space-y-4">
              {/* 闪电网络充值说明 */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-400 text-lg">⚡</span>
                  <p className="text-yellow-400 text-sm font-medium">
                    {i18n.language === 'en' ? 'Lightning Network Deposit' : '闪电网络充值'}
                  </p>
                </div>
                <p className="text-yellow-300 text-xs">
                  {i18n.language === 'en' 
                    ? 'Fast, instant deposits with low fees via Lightning Network'
                    : '通过闪电网络快速充值，即时到账，手续费低'
                  }
                </p>
              </div>



              {/* 闪电网络充值 - 创建发票 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Amount (sats)' : '金额 (sats)'}
                  </label>
                  <input
                    type="number"
                    value={lightningAmount}
                    onChange={(e) => setLightningAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="1000"
                    step="1"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Memo (optional)' : '备注 (可选)'}
                  </label>
                  <input
                    type="text"
                    value={lightningMemo}
                    onChange={(e) => setLightningMemo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Payment description' : '支付描述'}
                    maxLength={100}
                  />
                </div>
                
                <button
                  onClick={handleCreateLightningInvoice}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {i18n.language === 'en' ? 'Create Lightning Invoice' : '创建闪电网络发票'}
                </button>
              </div>



              {/* 闪电网络发票显示 */}
              {lightningInvoice && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lightningInvoice)}`}
                        alt="Lightning Invoice QR Code"
                        className="w-48 h-48 rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-48 h-48 bg-gray-200 rounded-lg items-center justify-center hidden">
                        <QrCode size={64} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">
                      {i18n.language === 'en' ? 'Lightning Invoice' : '闪电网络发票'}
                    </p>
                    <div className="max-h-20 overflow-y-auto">
                      <code className="text-white break-all text-xs leading-tight block">{lightningInvoice}</code>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">{i18n.language === 'en' ? 'Amount:' : '金额:'}</span>
                      <span className="text-white">{lightningAmount} sats</span>
                    </div>
                    {lightningMemo && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">{i18n.language === 'en' ? 'Memo:' : '备注:'}</span>
                        <span className="text-white">{lightningMemo}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={copyLightningInvoice}
                    className="w-full py-2 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy size={16} />
                    <span>{i18n.language === 'en' ? 'Copy Invoice' : '复制发票'}</span>
                  </button>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-yellow-400 text-sm">
                      {i18n.language === 'en' 
                        ? 'Share this Lightning invoice with the sender. Payment will be instant and funds will appear in your wallet immediately. No manual claiming required.'
                        : '将此闪电网络发票分享给发送方。支付将即时完成，资金会立即出现在您的钱包中，无需手动认领。'
                      }
                    </p>
                  </div>
                </div>
              )}



              <div className="flex space-x-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    // 清理所有状态
                    setLightningInvoice('');
                    setLightningAmount('');
                    setLightningMemo('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  {i18n.language === 'en' ? 'Close' : '关闭'}
                </button>
                {lightningInvoice && (
                  <button
                    onClick={() => {
                      // 清理闪电网络发票状态
                      setLightningInvoice('');
                      setLightningAmount('');
                      setLightningMemo('');
                    }}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium"
                  >
                    {i18n.language === 'en' ? 'New Request' : '新建请求'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 接收模态框 */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {i18n.language === 'en' ? 'Receive Bitcoin' : '接收比特币'}
            </h3>
            
            <div className="text-center">
              {sparkAddress ? (
                <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sparkAddress)}`}
                    alt="QR Code"
                    className="w-48 h-48 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-48 h-48 bg-gray-200 rounded-lg items-center justify-center hidden">
                    <QrCode size={64} className="text-gray-400" />
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl mb-4 inline-block">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <QrCode size={64} className="text-gray-400" />
                  </div>
                </div>
              )}
              
              <div className="bg-gray-800 rounded-xl p-4 mb-4">
                <p className="text-gray-400 text-sm mb-2">
                  {i18n.language === 'en' ? 'Your Spark Address' : '您的Spark地址'}
                </p>
                <code className="text-white break-all text-sm">{sparkAddress || 'Loading...'}</code>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={copyAddress}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy size={16} />
                  <span>{i18n.language === 'en' ? 'Copy Address' : '复制地址'}</span>
                </button>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  {i18n.language === 'en' ? 'Close' : '关闭'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提现维护模态框 */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowUp className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {i18n.language === 'en' ? 'Withdraw Function' : '提现功能'}
              </h3>
              <div className="inline-flex items-center px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                <span className="text-orange-400 text-sm font-medium">
                  {i18n.language === 'en' ? '🔧 Under Maintenance' : '🔧 维护中'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-medium mb-2">
                  {i18n.language === 'en' ? '⚠️ Service Notice' : '⚠️ 服务通知'}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {i18n.language === 'en' 
                    ? 'The withdraw function is currently under maintenance for security upgrades. We apologize for any inconvenience.'
                    : '提现功能目前正在进行安全升级维护，给您带来的不便我们深表歉意。'
                  }
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-blue-400 font-medium mb-3">
                  {i18n.language === 'en' ? '💡 Alternative Solutions' : '💡 替代方案'}
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 font-bold">1.</span>
                    <div>
                      <p className="text-white font-medium">
                        {i18n.language === 'en' ? 'Use Other Wallets' : '使用其他钱包'}
                      </p>
                      <p className="text-gray-400 mt-1">
                        {i18n.language === 'en' 
                          ? 'You can send your balance to other Bitcoin or Lightning wallets for withdrawal.'
                          : '您可以将余额发送到其他比特币或闪电网络钱包进行提现。'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 font-bold">2.</span>
                    <div>
                      <p className="text-white font-medium">
                        {i18n.language === 'en' ? 'Lightning Network' : '闪电网络'}
                      </p>
                      <p className="text-gray-400 mt-1">
                        {i18n.language === 'en' 
                          ? 'Use Lightning payments for instant transfers to compatible wallets.'
                          : '使用闪电支付向兼容钱包进行即时转账。'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 font-bold">3.</span>
                    <div>
                      <p className="text-white font-medium">
                        {i18n.language === 'en' ? 'Spark Transfers' : 'Spark转账'}
                      </p>
                      <p className="text-gray-400 mt-1">
                        {i18n.language === 'en' 
                          ? 'Send to other Spark wallet addresses for free and instant transfers.'
                          : '发送到其他Spark钱包地址，享受免费即时转账。'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-gray-300 font-medium mb-2">
                  {i18n.language === 'en' ? '📞 Need Help?' : '📞 需要帮助？'}
                </h4>
                <p className="text-gray-400 text-sm">
                  {i18n.language === 'en' 
                    ? 'If you need assistance with transfers, please contact our support team or check our documentation.'
                    : '如果您需要转账方面的帮助，请联系我们的支持团队或查看我们的文档。'
                  }
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                {i18n.language === 'en' ? 'Close' : '关闭'}
              </button>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setShowSendModal(true);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
              >
                {i18n.language === 'en' ? 'Send Instead' : '使用发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 