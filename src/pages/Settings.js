import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { 
  Key, 
  Globe, 
  Shield,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

function Settings() {
  const { i18n } = useTranslation();
  const { wallet, sparkAddress, identityPublicKey, mnemonic, lockWallet, resetWallet } = useWallet();
  
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [password, setPassword] = useState('');
  const [showMnemonicModal, setShowMnemonicModal] = useState(false);
  const [verifiedPassword, setVerifiedPassword] = useState(false);
  const [showClearWalletModal, setShowClearWalletModal] = useState(false);
  const [mnemonicDisplayTime, setMnemonicDisplayTime] = useState(0);

  // 自动清理助记词显示 - 5分钟后自动隐藏
  useEffect(() => {
    let timer;
    if (showMnemonic && verifiedPassword) {
      setMnemonicDisplayTime(300); // 5分钟倒计时
      timer = setInterval(() => {
        setMnemonicDisplayTime(prev => {
          if (prev <= 1) {
            setShowMnemonic(false);
            toast.info(i18n.language === 'en' ? 'Mnemonic hidden for security' : '出于安全考虑已隐藏助记词');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showMnemonic, verifiedPassword, i18n.language]);

  // 切换语言
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
    toast.success(i18n.language === 'en' ? 'Language switched to Chinese' : 'Language switched to English');
  };

  // 复制助记词
  const copyMnemonic = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      toast.success(i18n.language === 'en' ? 'Mnemonic copied!' : '助记词已复制！');
    }
  };

  // 验证密码并显示助记词
  const handleExportMnemonic = async () => {
    if (!password.trim()) {
      toast.error(i18n.language === 'en' ? 'Please enter password' : '请输入密码');
      return;
    }

    try {
      // 验证密码是否正确
      const encryptedMnemonic = localStorage.getItem('spark_wallet_data');
      if (!encryptedMnemonic) {
        toast.error(i18n.language === 'en' ? 'No wallet data found' : '未找到钱包数据');
        return;
      }

      // 尝试解密来验证密码
      // 检测是否是新格式（Web Crypto API）还是旧格式（XOR）
      let testMnemonic;
      if (encryptedMnemonic.includes(':')) {
        // 旧格式 - XOR加密
        try {
          const encrypted = atob(encryptedMnemonic);
          const encryptedBytes = new Uint8Array([...encrypted].map(char => char.charCodeAt(0)));
          const passwordBytes = new TextEncoder().encode(password);
          const decrypted = [];
          
          for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted.push(encryptedBytes[i] ^ passwordBytes[i % passwordBytes.length]);
          }
          
          testMnemonic = new TextDecoder().decode(new Uint8Array(decrypted));
        } catch (error) {
          throw new Error('密码错误');
        }
      } else {
        // 新格式 - Web Crypto API
        try {
          const data = new Uint8Array([...atob(encryptedMnemonic)].map(char => char.charCodeAt(0)));
          const salt = data.slice(0, 16);
          const iv = data.slice(16, 28);
          const encrypted = data.slice(28);
          
          const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
          );
          
          const key = await crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: salt,
              iterations: 100000,
              hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
          );
          
          const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
          );
          
          testMnemonic = new TextDecoder().decode(decrypted);
        } catch (error) {
          throw new Error('密码错误');
        }
      }

      // 验证解密结果是否像助记词
      if (!testMnemonic || testMnemonic.length < 20 || !/^[a-z\s]+$/i.test(testMnemonic.trim())) {
        throw new Error('密码错误');
      }

      // 密码正确，显示助记词
      setVerifiedPassword(true);
      toast.success(i18n.language === 'en' ? 'Password verified!' : '密码验证成功！');
    } catch (error) {
      toast.error(i18n.language === 'en' ? 'Incorrect password' : '密码错误');
      console.error('密码验证失败:', error);
    }
  };

  // 清除钱包数据
  const handleClearWallet = () => {
    setShowClearWalletModal(true);
  };

  // 确认清除钱包数据
  const confirmClearWallet = () => {
    resetWallet(); // 使用WalletContext的resetWallet方法
    setShowClearWalletModal(false);
    window.location.reload();
  };

  // 关闭模态框时清理所有敏感数据
  const handleCloseModal = () => {
    setShowMnemonicModal(false);
    setVerifiedPassword(false);
    setPassword('');
    setShowMnemonic(false);
    setMnemonicDisplayTime(0);
    
    // 强制垃圾回收（如果浏览器支持）
    if (window.gc) {
      window.gc();
    }
  };

  const settingSections = [
    {
      title: i18n.language === 'en' ? 'Security' : '安全',
      icon: Shield,
      items: [
        {
          title: i18n.language === 'en' ? 'Export Mnemonic Phrase' : '导出助记词',
          description: i18n.language === 'en' ? 'Back up your wallet recovery phrase' : '备份您的钱包恢复短语',
          icon: Key,
          action: () => setShowMnemonicModal(true),
          danger: false
        },
        {
          title: i18n.language === 'en' ? 'Lock Wallet' : '锁定钱包',
          description: i18n.language === 'en' ? 'Secure your wallet with password protection' : '使用密码保护您的钱包',
          icon: Shield,
          action: lockWallet,
          danger: false
        },
        {
          title: i18n.language === 'en' ? 'Clear Wallet Data' : '清除钱包数据',
          description: i18n.language === 'en' ? 'Remove all wallet data from this device' : '从此设备删除所有钱包数据',
          icon: AlertTriangle,
          action: handleClearWallet,
          danger: true
        }
      ]
    },
    {
      title: i18n.language === 'en' ? 'Preferences' : '偏好设置',
      icon: SettingsIcon,
      items: [
        {
          title: i18n.language === 'en' ? 'Language' : '语言',
          description: i18n.language === 'en' ? 'Change application language' : '更改应用程序语言',
          icon: Globe,
          action: toggleLanguage,
          danger: false,
          rightContent: (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>{i18n.language === 'en' ? 'English' : '中文'}</span>
            </div>
          )
        }
      ]
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {i18n.language === 'en' ? 'Settings' : '设置'}
        </h1>
        <div className="text-xs sm:text-sm text-gray-400">
          {i18n.language === 'en' ? 'Manage your wallet preferences' : '管理您的钱包偏好'}
        </div>
      </div>

      {/* 钱包信息 */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
          {i18n.language === 'en' ? 'Wallet Information' : '钱包信息'}
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Spark地址 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <span className="text-gray-400 text-sm">
              {i18n.language === 'en' ? 'Spark Address' : 'Spark地址'}
            </span>
            <div className="flex items-center space-x-2">
              <code className="text-white bg-gray-800 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                {sparkAddress ? `${sparkAddress.slice(0, 8)}...${sparkAddress.slice(-6)}` : 'Loading...'}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sparkAddress || '');
                  toast.success(i18n.language === 'en' ? 'Spark address copied!' : 'Spark地址已复制！');
                }}
                className="text-gray-400 hover:text-white"
                disabled={!sparkAddress}
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          
          {/* 身份公钥 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <span className="text-gray-400 text-sm">
              {i18n.language === 'en' ? 'Identity Public Key' : '身份公钥'}
            </span>
            <div className="flex items-center space-x-2">
              <code className="text-white bg-gray-800 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                {identityPublicKey ? `${identityPublicKey.slice(0, 8)}...${identityPublicKey.slice(-6)}` : 'Loading...'}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(identityPublicKey || '');
                  toast.success(i18n.language === 'en' ? 'Identity key copied!' : '身份公钥已复制！');
                }}
                className="text-gray-400 hover:text-white"
                disabled={!identityPublicKey}
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          
          {/* 钱包状态 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <span className="text-gray-400 text-sm">
              {i18n.language === 'en' ? 'Status' : '状态'}
            </span>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                wallet ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {wallet ? 
                  (i18n.language === 'en' ? 'Active' : '活跃') : 
                  (i18n.language === 'en' ? 'Inactive' : '未活跃')
                }
              </span>
            </div>
          </div>

          {/* 钱包创建时间 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <span className="text-gray-400 text-sm">
              {i18n.language === 'en' ? 'Created' : '创建时间'}
            </span>
            <span className="text-white text-sm">
              {localStorage.getItem('spark_wallet_data') ? 
                new Date().toLocaleDateString() : 
                (i18n.language === 'en' ? 'Unknown' : '未知')
              }
            </span>
          </div>
        </div>
      </div>

      {/* 设置选项 */}
      {settingSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center space-x-3 mb-4">
            <section.icon className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-xl font-bold text-white">{section.title}</h2>
          </div>
          
          <div className="space-y-2">
            {section.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={item.action}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.danger 
                      ? 'bg-red-500/20 text-red-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium text-sm sm:text-base ${item.danger ? 'text-red-400' : 'text-white'}`}>
                      {item.title}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">{item.description}</p>
                  </div>
                </div>
                
                {item.rightContent || (
                  <div className="text-gray-400 flex-shrink-0 ml-2">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 助记词导出模态框 */}
      {showMnemonicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {i18n.language === 'en' ? 'Export Mnemonic Phrase' : '导出助记词'}
            </h3>
            
            {!verifiedPassword ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400 mb-2">
                    <AlertTriangle size={16} />
                    <span className="font-medium">
                      {i18n.language === 'en' ? 'Security Warning' : '安全警告'}
                    </span>
                  </div>
                  <p className="text-red-300 text-sm">
                    {i18n.language === 'en' 
                      ? 'Never share your mnemonic phrase with anyone. Anyone with this phrase can access your wallet.'
                      : '永远不要与任何人分享您的助记词。任何人拥有此助记词都可以访问您的钱包。'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Enter your password to continue' : '输入密码以继续'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Enter password' : '输入密码'}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    {i18n.language === 'en' ? 'Cancel' : '取消'}
                  </button>
                  <button
                    onClick={handleExportMnemonic}
                    disabled={!password}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
                  >
                    {i18n.language === 'en' ? 'Continue' : '继续'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {mnemonic?.split(' ').map((word, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg text-center font-mono"
                      >
                        <span className="text-xs text-gray-400">{index + 1}</span>
                        <div className={showMnemonic ? '' : 'blur-sm'}>{word}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowMnemonic(!showMnemonic)}
                        className="flex items-center space-x-2 text-orange-500 hover:text-orange-400"
                      >
                        {showMnemonic ? <EyeOff size={16} /> : <Eye size={16} />}
                        <span>{showMnemonic ? (i18n.language === 'en' ? 'Hide' : '隐藏') : (i18n.language === 'en' ? 'Show' : '显示')}</span>
                      </button>
                      
                      <button
                        onClick={copyMnemonic}
                        className="flex items-center space-x-2 text-orange-500 hover:text-orange-400"
                        disabled={!showMnemonic}
                      >
                        <Copy size={16} />
                        <span>{i18n.language === 'en' ? 'Copy' : '复制'}</span>
                      </button>
                    </div>
                    
                    {showMnemonic && mnemonicDisplayTime > 0 && (
                      <div className="text-xs text-yellow-400">
                        {i18n.language === 'en' ? 'Auto-hide in' : '自动隐藏倒计时'}: {Math.floor(mnemonicDisplayTime / 60)}:{(mnemonicDisplayTime % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  {i18n.language === 'en' ? 'I have saved it securely' : '我已安全保存'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 清除钱包数据确认弹窗 */}
      {showClearWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-400">
                  {i18n.language === 'en' ? 'Clear Wallet Data' : '清除钱包数据'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {i18n.language === 'en' ? 'This action cannot be undone' : '此操作无法撤销'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <p className="text-red-300 text-sm leading-relaxed">
                  {i18n.language === 'en' 
                    ? 'Are you sure you want to clear all wallet data? This will permanently remove your wallet from this device. Make sure you have backed up your mnemonic phrase before proceeding.'
                    : '确定要清除所有钱包数据吗？这将永久从此设备删除您的钱包。请确保在继续之前已备份助记词。'}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearWalletModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  {i18n.language === 'en' ? 'Cancel' : '取消'}
                </button>
                <button
                  onClick={confirmClearWallet}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  {i18n.language === 'en' ? 'Clear Data' : '清除数据'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings; 