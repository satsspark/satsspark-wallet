import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, Plus, Upload, Globe, Eye, EyeOff, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

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

function WelcomeScreen() {
  const { i18n } = useTranslation();
  const { createWallet, restoreWallet, unlockWallet, isLoading, error } = useWallet();
  
  const [mode, setMode] = useState('welcome');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const hasWallet = localStorage.getItem('spark_wallet_data');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  // 创建钱包流程
  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      toast.error(i18n.language === 'en' ? 'Passwords do not match' : '密码不匹配');
      return;
    }
    if (password.length < 8) {
      toast.error(i18n.language === 'en' ? 'Password must be at least 8 characters long' : '密码至少需要8位字符');
      return;
    }

    try {
      const result = await createWallet(password);
      setGeneratedMnemonic(result.mnemonic);
      setMode('showMnemonic');
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  // 导入钱包
  const handleImportWallet = async () => {
    if (!mnemonic.trim()) {
      toast.error(i18n.language === 'en' ? 'Please enter mnemonic phrase' : '请输入助记词');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(i18n.language === 'en' ? 'Passwords do not match' : '密码不匹配');
      return;
    }
    if (password.length < 8) {
      toast.error(i18n.language === 'en' ? 'Password must be at least 8 characters long' : '密码至少需要8位字符');
      return;
    }

    try {
      await restoreWallet(mnemonic.trim(), password);
    } catch (error) {
      console.error('Failed to restore wallet:', error);
    }
  };

  // 解锁钱包
  const handleUnlockWallet = async () => {
    if (!password) {
      toast.error(i18n.language === 'en' ? 'Please enter password' : '请输入密码');
      return;
    }
    try {
      await unlockWallet(password);
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
    }
  };

  // 复制助记词
  const copyMnemonic = () => {
    navigator.clipboard.writeText(generatedMnemonic);
    toast.success(i18n.language === 'en' ? 'Copied to clipboard' : '已复制到剪贴板');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-8">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            <Globe size={18} />
            <span>{i18n.language === 'en' ? '中文' : 'English'}</span>
          </button>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
          {mode === 'welcome' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-8">
                <svg width="100%" height="100%" viewBox="0 0 64 64" className="rounded-full">
                  {/* 黑色背景圆角矩形 */}
                  <rect width="64" height="64" fill="#000000" rx="32"/>
                  
                  {/* 白色S字母 */}
                  <path d="M16 24C16 19.58 19.58 16 24 16H32C36.42 16 40 19.58 40 24C40 28.42 36.42 32 32 32H24C19.58 32 16 35.58 16 40C16 44.42 19.58 48 24 48H40C44.42 48 48 44.42 48 40V36" 
                        stroke="#FFFFFF" 
                        strokeWidth="4" 
                        fill="none" 
                        strokeLinecap="round"/>
                  
                  {/* 橙色装饰点 */}
                  <circle cx="48" cy="24" r="3" fill="#FF8C00"/>
                  <circle cx="16" cy="40" r="3" fill="#FF8C00"/>
                </svg>
              </div>
              
              <h1 className="text-4xl font-bold text-white mb-4">SatsSpark</h1>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {i18n.language === 'en' ? 'Secure, simple, and powerful Bitcoin wallet' : '安全、简单、功能强大的比特币钱包'}
              </p>
              
              {/* 社交媒体链接 */}
              <div className="flex justify-center mb-8">
                <a 
                  href="https://x.com/sats_spark" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
                  title={i18n.language === 'en' ? 'Follow us on X' : '在X上关注我们'}
                >
                  <XIcon size={18} className="group-hover:text-orange-400 transition-colors" />
                  <span className="text-sm group-hover:text-white">@sats_spark</span>
                </a>
              </div>

              <div className="space-y-4">
                {!hasWallet ? (
                  <>
                    <button
                      onClick={() => {
                        setMode('create');
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold"
                    >
                      <Plus size={20} />
                      <span>{i18n.language === 'en' ? 'Create Wallet' : '创建钱包'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setMode('import');
                        setPassword('');
                        setConfirmPassword('');
                        setMnemonic('');
                      }}
                      className="w-full flex items-center justify-center space-x-3 bg-gray-700 text-white py-4 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                    >
                      <Upload size={20} />
                      <span>{i18n.language === 'en' ? 'Import Wallet' : '导入钱包'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMode('unlock')}
                    className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold"
                  >
                    <Wallet size={20} />
                    <span>{i18n.language === 'en' ? 'Unlock Wallet' : '解锁钱包'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div>
              <button
                onClick={() => {
                  setMode('welcome');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
              >
                <span>←</span>
                <span>{i18n.language === 'en' ? 'Back' : '返回'}</span>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">{i18n.language === 'en' ? 'Create New Wallet' : '创建新钱包'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Password' : '密码'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={i18n.language === 'en' ? 'Enter password (at least 8 characters)' : '输入密码（至少8位字符）'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Confirm Password' : '确认密码'}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Confirm password' : '确认密码'}
                  />
                </div>

                <button
                  onClick={handleCreateWallet}
                                      disabled={isLoading || !password || !confirmPassword}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (i18n.language === 'en' ? 'Creating...' : '创建中...') : (i18n.language === 'en' ? 'Create Wallet' : '创建钱包')}
                </button>
              </div>
            </div>
          )}

          {mode === 'showMnemonic' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">{i18n.language === 'en' ? 'Backup Mnemonic' : '备份助记词'}</h2>
              <p className="text-gray-400 mb-6">
                {i18n.language === 'en' ? 'Please write down your mnemonic phrase and keep it safe. This is the only way to recover your wallet.' : '请写下您的助记词并妥善保管。这是恢复钱包的唯一方式。'}
              </p>

              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {generatedMnemonic.split(' ').map((word, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 text-white px-3 py-2 rounded-lg text-center font-mono"
                    >
                      <span className="text-xs text-gray-400">{index + 1}</span>
                      <div className={showMnemonic ? '' : 'blur-sm'}>{word}</div>
                    </div>
                  ))}
                </div>

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
                  >
                    <Copy size={16} />
                    <span>{i18n.language === 'en' ? 'Copy' : '复制'}</span>
                  </button>
                </div>
              </div>

                            <button
                onClick={() => {
                  setMode('welcome');
                  setPassword('');
                  setConfirmPassword('');
                  setGeneratedMnemonic('');
                }}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold"
              >
 {i18n.language === 'en' ? 'I have safely saved my mnemonic' : '我已安全保存助记词'}
              </button>
            </div>
          )}

          {mode === 'import' && (
            <div>
              <button
                onClick={() => {
                  setMode('welcome');
                  setPassword('');
                  setConfirmPassword('');
                  setMnemonic('');
                }}
                className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
              >
                <span>←</span>
                <span>{i18n.language === 'en' ? 'Back' : '返回'}</span>
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">{i18n.language === 'en' ? 'Import Wallet' : '导入钱包'}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
{i18n.language === 'en' ? 'Mnemonic Phrase' : '助记词'}
                  </label>
                  <textarea
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder={i18n.language === 'en' ? 'Enter 12 mnemonic words separated by spaces' : '输入12个助记词，用空格分隔'}
                  />
                </div>

                                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Password' : '密码'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={i18n.language === 'en' ? 'Set wallet password (at least 8 characters)' : '设置钱包密码（至少8位字符）'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {i18n.language === 'en' ? 'Confirm Password' : '确认密码'}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={i18n.language === 'en' ? 'Confirm password' : '确认密码'}
                  />
                </div>

                <button
                  onClick={handleImportWallet}
                                    disabled={isLoading || !mnemonic || !password || !confirmPassword}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (i18n.language === 'en' ? 'Importing...' : '导入中...') : (i18n.language === 'en' ? 'Import Wallet' : '导入钱包')}
                </button>
              </div>
            </div>
          )}

          {mode === 'unlock' && (
            <div>
              <button
                onClick={() => {
                  setMode('welcome');
                  setPassword('');
                }}
                className="text-gray-400 hover:text-white mb-6 flex items-center space-x-2"
              >
                <span>←</span>
                <span>{i18n.language === 'en' ? 'Back' : '返回'}</span>
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4">
                  <svg width="100%" height="100%" viewBox="0 0 64 64" className="rounded-full">
                    {/* 黑色背景圆角矩形 */}
                    <rect width="64" height="64" fill="#000000" rx="32"/>
                    
                    {/* 白色S字母 */}
                    <path d="M16 24C16 19.58 19.58 16 24 16H32C36.42 16 40 19.58 40 24C40 28.42 36.42 32 32 32H24C19.58 32 16 35.58 16 40C16 44.42 19.58 48 24 48H40C44.42 48 48 44.42 48 40V36" 
                          stroke="#FFFFFF" 
                          strokeWidth="4" 
                          fill="none" 
                          strokeLinecap="round"/>
                    
                    {/* 橙色装饰点 */}
                    <circle cx="48" cy="24" r="3" fill="#FF8C00"/>
                    <circle cx="16" cy="40" r="3" fill="#FF8C00"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{i18n.language === 'en' ? 'Unlock Wallet' : '解锁钱包'}</h2>
                <p className="text-gray-400">{i18n.language === 'en' ? 'Enter password to continue' : '输入密码以继续'}</p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={i18n.language === 'en' ? 'Enter wallet password' : '输入钱包密码'}
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlockWallet()}
                />

                <button
                  onClick={handleUnlockWallet}
                  disabled={isLoading || !password}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold disabled:opacity-50"
                >
{isLoading ? (i18n.language === 'en' ? 'Unlocking...' : '解锁中...') : (i18n.language === 'en' ? 'Unlock Wallet' : '解锁钱包')}
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;