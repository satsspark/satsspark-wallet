/* eslint-env es2020 */
/* global BigInt */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SparkWallet } from '@buildonspark/spark-sdk';
import toast from 'react-hot-toast';

const WalletContext = createContext();

const initialState = {
  wallet: null,
  isInitialized: false,
  isLoading: false,
  balance: { balance: 0n, tokenBalances: new Map() },
  sparkAddress: '',
  identityPublicKey: '',
  transfers: [],
  error: null,
  mnemonic: null,
  isLocked: true,
  hasWallet: false,
  staticDepositAddress: '',
  unusedDepositAddresses: [],
  tokenInfo: [],
  tokenMetadata: new Map(),
  lightningInvoices: [],
  withdrawalRequests: [],
  shouldShowBackupReminder: false,
  feeEstimates: {
    withdrawal: null,
    lightning: null,
    swap: null,
  },
  lightningRequests: [],
  coopExitRequests: [],
  tokenTransactions: [],
};

function walletReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_WALLET':
      return { 
        ...state, 
        wallet: action.payload.wallet,
        mnemonic: action.payload.mnemonic,
        isInitialized: true,
        isLoading: false,
        isLocked: false,
        hasWallet: true,
        shouldShowBackupReminder: action.payload.isNewWallet || false
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_SPARK_ADDRESS':
      return { ...state, sparkAddress: action.payload };
    case 'SET_IDENTITY_KEY':
      return { ...state, identityPublicKey: action.payload };
    case 'SET_TRANSFERS':
      return { ...state, transfers: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_HAS_WALLET':
      return { ...state, hasWallet: action.payload };
    case 'SET_LOCKED':
      return { ...state, isLocked: action.payload };
    case 'LOCK_WALLET':
      return { ...state, wallet: null, isInitialized: false, isLocked: true };
    case 'RESET_WALLET':
      return { ...initialState, hasWallet: false };
    case 'SET_STATIC_DEPOSIT_ADDRESS':
      return { ...state, staticDepositAddress: action.payload };
    case 'SET_UNUSED_DEPOSIT_ADDRESSES':
      return { ...state, unusedDepositAddresses: action.payload };
    case 'SET_TOKEN_INFO':
      return { ...state, tokenInfo: action.payload };
    case 'SET_LIGHTNING_INVOICES':
      return { ...state, lightningInvoices: action.payload };
    case 'SET_WITHDRAWAL_REQUESTS':
      return { ...state, withdrawalRequests: action.payload };
    case 'SET_BACKUP_REMINDER':
      return { ...state, shouldShowBackupReminder: action.payload };
    case 'SET_FEE_ESTIMATES':
      return { ...state, feeEstimates: { ...state.feeEstimates, ...action.payload } };
    case 'SET_LIGHTNING_REQUESTS':
      return { ...state, lightningRequests: action.payload };
    case 'SET_COOP_EXIT_REQUESTS':
      return { ...state, coopExitRequests: action.payload };
    case 'SET_TOKEN_TRANSACTIONS':
      return { ...state, tokenTransactions: action.payload };
    default:
      return state;
  }
}

// 企业级加密函数 - 使用浏览器原生Web Crypto API + PBKDF2 + AES-256-GCM
const encrypt = async (text, password) => {
  try {
    // 生成随机盐值（16字节）
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // 使用PBKDF2派生密钥，100,000次迭代（银行级安全）
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
        iterations: 100000, // 100,000次迭代，符合OWASP建议
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // 生成随机IV（12字节，AES-GCM推荐）
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // AES-256-GCM加密（提供认证加密）
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      new TextEncoder().encode(text)
    );
    
    // 组合: salt(16) + iv(12) + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // 转换为Base64存储
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('加密失败:', error);
    throw new Error('加密失败');
  }
};

const decrypt = async (encryptedData, password) => {
  try {
    // 从Base64解码
    const data = new Uint8Array([...atob(encryptedData)].map(char => char.charCodeAt(0)));
    
    // 分离salt、iv和加密数据
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);
    
    // 使用相同参数派生密钥
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
    
    // 解密
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    const result = new TextDecoder().decode(decrypted);
    
    // 验证解密结果
    if (!result || result.length < 20 || !/^[a-z\s]+$/i.test(result.trim())) {
      throw new Error('密码错误');
    }
    
    return result;
  } catch (error) {
    console.error('解密失败:', error);
    throw new Error('密码错误，请检查后重新输入');
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

const retryOperation = async (operation, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // 检查本地存储中是否有钱包
  useEffect(() => {
    const checkExistingWallet = () => {
      const encryptedMnemonic = localStorage.getItem('spark_wallet_data');
      if (encryptedMnemonic) {
        dispatch({ type: 'SET_HAS_WALLET', payload: true });
      }
    };
    
    checkExistingWallet();
  }, []);

  const createWallet = async (password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const result = await SparkWallet.initialize({
        accountNumber: 1,
        options: {
          network: "MAINNET", // 指定主网，地址将以 sp 开头
        },
      });
      
      // 加密并保存助记词
      const encryptedMnemonic = await encrypt(result.mnemonic, password);
      localStorage.setItem('spark_wallet_data', encryptedMnemonic);
      
      dispatch({ type: 'SET_WALLET', payload: { ...result, isNewWallet: true } });

      // 获取钱包基本信息
      await Promise.all([
        getWalletInfo(result.wallet),
        refreshBalance(result.wallet, true), // 强制刷新以认领任何待处理的余额
        getTransfers(result.wallet),
      ]);
      
      // 单独获取代币信息
      try {
        await getTokenInfo(result.wallet);
      } catch (error) {
        // 忽略代币信息获取错误
      }

      toast.success('钱包创建成功！');
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error(`钱包创建失败: ${error.message}`);
      throw error;
    }
  };

  const restoreWallet = async (mnemonic, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const result = await SparkWallet.initialize({
        mnemonicOrSeed: mnemonic,
        accountNumber: 1,
        options: {
          network: "MAINNET", // 指定主网，地址将以 sp 开头
        },
      });
      
      // 加密并保存助记词
      const encryptedMnemonic = await encrypt(mnemonic, password);
      localStorage.setItem('spark_wallet_data', encryptedMnemonic);
      
      dispatch({ type: 'SET_WALLET', payload: { wallet: result.wallet, mnemonic, isNewWallet: false } });

      // 获取钱包基本信息
      await Promise.all([
        getWalletInfo(result.wallet),
        getTransfers(result.wallet),
      ]);
      
      // 先获取代币信息，再获取余额，这样余额处理时能找到代币元数据
      let tokenInfo = [];
      try {
        tokenInfo = await getTokenInfo(result.wallet);
      } catch (error) {
        console.warn('获取代币信息失败:', error);
      }
      
      // 最后获取余额，传入代币信息确保能正确处理
      try {
        await refreshBalance(result.wallet, true, tokenInfo);
      } catch (error) {
        console.warn('获取余额失败:', error);
      }

      toast.success('钱包恢复成功！');
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error(`钱包恢复失败: ${error.message}`);
      throw error;
    }
  };

  const unlockWallet = async (password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const encryptedMnemonic = localStorage.getItem('spark_wallet_data');
      if (!encryptedMnemonic) {
        throw new Error('未找到钱包数据');
      }

      const mnemonic = await decrypt(encryptedMnemonic, password);
      
      const result = await SparkWallet.initialize({
        mnemonicOrSeed: mnemonic,
        accountNumber: 1,
        options: {
          network: "MAINNET", // 指定主网，地址将以 sp 开头
        },
      });

      dispatch({ type: 'SET_WALLET', payload: { wallet: result.wallet, mnemonic, isNewWallet: false } });

      // 获取钱包基本信息
      await Promise.all([
        getWalletInfo(result.wallet),
        getTransfers(result.wallet),
      ]);
      
      // 检查并认领任何待处理的存款
      try {
        await checkAndClaimDeposits(result.wallet);
      } catch (error) {
        console.warn('检查存款失败:', error);
      }
      
      // 先获取代币信息，再获取余额，这样余额处理时能找到代币元数据
      let tokenInfo = [];
      try {
        tokenInfo = await getTokenInfo(result.wallet);
      } catch (error) {
        console.warn('获取代币信息失败:', error);
      }
      
      // 强制刷新余额以认领任何待处理的余额，传入代币信息确保能正确处理
      await refreshBalance(result.wallet, true, tokenInfo);

      return result;
    } catch (error) {
      
      // 检查是否是密码错误相关的错误
      let errorMessage = error.message;
      if (error.message.includes('hex string expected') || 
          error.message.includes('non-hex character') ||
          error.message.includes('密码错误或数据已损坏')) {
        errorMessage = '密码错误，请检查后重新输入';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const getWalletInfo = async (wallet) => {
    try {
      const [sparkAddress, identityPublicKey] = await Promise.all([
        wallet.getSparkAddress(),
        wallet.getIdentityPublicKey(),
      ]);

      dispatch({ type: 'SET_SPARK_ADDRESS', payload: sparkAddress });
      dispatch({ type: 'SET_IDENTITY_KEY', payload: identityPublicKey });

      return { sparkAddress, identityPublicKey };
    } catch (error) {
      throw error;
    }
  };

  const refreshBalance = async (wallet = state.wallet, forceRefetch = true, tokenInfoOverride = null) => {
    if (!wallet) return;
    
    try {
      // 使用forceRefetch来同步钱包并认领任何待处理的转账、闪电支付或比特币存款
      const balanceResult = await retryOperation(() => wallet.getBalance({ forceRefetch }));
      
      // 使用传入的tokenInfo或当前state中的tokenInfo
      const currentTokenInfo = tokenInfoOverride || state.tokenInfo;
      
      // 处理余额数据格式
      const processedBalance = {
        ...balanceResult,
        balance: balanceResult.balance ? Number(balanceResult.balance) : 0,
        tokenBalances: balanceResult.tokenBalances ? 
          (balanceResult.tokenBalances instanceof Map ? 
            Array.from(balanceResult.tokenBalances.entries()).map(([tokenPublicKey, balanceData]) => {
              const rawBalance = Number(balanceData.balance || 0);
              
              // 查找对应的代币信息
              const tokenInfo = currentTokenInfo?.find(info => info.tokenPublicKey === tokenPublicKey);
              const decimals = tokenInfo?.tokenDecimals || 0;
              const displayBalance = decimals > 0 ? rawBalance / Math.pow(10, decimals) : rawBalance;
              
              return {
                tokenPublicKey: tokenPublicKey,
                balance: rawBalance, // 原始余额
                displayBalance: displayBalance, // 显示余额（考虑小数位）
                decimals: decimals,
                symbol: tokenInfo?.tokenSymbol || `Token${tokenPublicKey.slice(0, 4)}`,
                name: tokenInfo?.tokenName || tokenInfo?.tokenSymbol || `Token ${tokenPublicKey.slice(0, 8)}`
              };
            }) :
            Array.isArray(balanceResult.tokenBalances) ? 
              balanceResult.tokenBalances.map((token, index) => {
                const rawBalance = Number(token.balance || token.amount || 0);
                const tokenInfo = currentTokenInfo?.find(info => info.tokenPublicKey === token.tokenPublicKey);
                const decimals = tokenInfo?.tokenDecimals || token.decimals || 0;
                const displayBalance = decimals > 0 ? rawBalance / Math.pow(10, decimals) : rawBalance;
                
                return {
                  ...token,
                  balance: rawBalance,
                  displayBalance: displayBalance,
                  decimals: decimals,
                  symbol: tokenInfo?.tokenSymbol || token.symbol || token.tokenSymbol || `Token${index}`,
                  name: tokenInfo?.tokenName || token.name || token.tokenName || tokenInfo?.tokenSymbol || `Token ${index}`
                };
              }) : []
          ) : []
      };
      
      dispatch({ type: 'SET_BALANCE', payload: processedBalance });
      return processedBalance;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '获取余额失败: ' + error.message });
      throw error;
    }
  };

  const getTransfers = async (...args) => {
    let wallet = state.wallet;
    let limit = 20;
    let offset = 0;

    if (args.length === 1) {
      // 只有 limit
      limit = args[0];
    } else if (args.length === 2) {
      // limit, offset
      [limit, offset] = args;
    } else if (args.length >= 3) {
      // wallet, limit, offset
      [wallet, limit, offset] = args;
    }

    if (!wallet) {
      return { transfers: [] };
    }
    
    try {
      const result = await wallet.getTransfers(limit, offset);
      
      const standardized = (result.transfers || []).map(t => {
        let dir = t.direction;
        if (!dir) {
          // 使用 transferDirection 字段
          if (t.transferDirection === 'INCOMING') dir = 'INBOUND';
          else if (t.transferDirection === 'OUTGOING') dir = 'OUTBOUND';
          else {
            // 根据身份公钥判定方向
            if (state.wallet) {
              // 获取当前钱包的身份公钥
              const currentIdentityKey = state.wallet.identityPublicKey || state.identityPublicKey;

              if (currentIdentityKey) {
                if (t.receiverIdentityPublicKey === currentIdentityKey) dir = 'INBOUND';
                else if (t.senderIdentityPublicKey === currentIdentityKey) dir = 'OUTBOUND';
                else dir = 'INBOUND'; // 默认为接收
              } else {
                dir = 'INBOUND'; // 默认为接收
              }
            }
          }
        }
        
        const ts = t.timestamp || t.updatedTime || t.createdAt || Date.now();
        const typeMap = {
          BITCOIN_DEPOSIT: 'BITCOIN_DEPOSIT',
          BITCOIN_WITHDRAWAL: 'BITCOIN_WITHDRAWAL', 
          LIGHTNING_PAYMENT: 'LIGHTNING_PAYMENT',
          SPARK_TRANSFER: 'SPARK_TRANSFER',
        };
        const mappedType = typeMap[t.type] || typeMap[t.transferType] || t.type || 'SPARK_TRANSFER';
        
        // 尝试从leaves中获取Spark地址
        let senderSparkAddr = '';
        let receiverSparkAddr = '';
        
        // 尝试从leaves中获取Spark地址
        if (t.leaves && t.leaves.length > 0) {
          t.leaves.forEach(leafWrapper => {
            // leaves数据结构: {leaf: {...}, secretCipher: ..., signature: ...}
            const actualLeaf = leafWrapper.leaf || leafWrapper;
            
            if (actualLeaf && actualLeaf.sparkAddress) {
              // 根据身份公钥匹配对应的Spark地址
              if (actualLeaf.identityPublicKey === t.senderIdentityPublicKey) {
                senderSparkAddr = actualLeaf.sparkAddress;
              }
              if (actualLeaf.identityPublicKey === t.receiverIdentityPublicKey) {
                receiverSparkAddr = actualLeaf.sparkAddress;
              }
            }
          });
        }
        
        // 如果没有找到Spark地址，尝试其他方法
        if (!senderSparkAddr && !receiverSparkAddr) {
          // 检查是否有其他可能的地址字段
          if (t.senderSparkAddress) senderSparkAddr = t.senderSparkAddress;
          if (t.receiverSparkAddress) receiverSparkAddr = t.receiverSparkAddress;
        }
        
        const processed = { 
          ...t, 
          direction: dir, 
          timestamp: ts, 
          type: mappedType,
          // 使用正确的金额字段
          amountSats: t.totalValue || t.amountSats || t.amount || 0,
          // 优先使用从leaves中获取的Spark地址，否则使用身份公钥
          senderSparkAddress: senderSparkAddr || t.senderIdentityPublicKey || '',
          receiverSparkAddress: receiverSparkAddr || t.receiverIdentityPublicKey || '',
          // 添加标识，用于前端判断是否为身份公钥
          senderIsIdentityKey: !senderSparkAddr && !!t.senderIdentityPublicKey,
          receiverIsIdentityKey: !receiverSparkAddr && !!t.receiverIdentityPublicKey
        };
        
        return processed;
      });
      
      const newTransfers = standardized;
      const merged = offset > 0 ? [...state.transfers, ...newTransfers] : newTransfers;
      dispatch({ type: 'SET_TRANSFERS', payload: merged });
      return { ...result, transfers: merged };
    } catch (error) {
      console.error('获取交易记录失败:', error);
      dispatch({ type: 'SET_TRANSFERS', payload: [] });
      return { transfers: [] };
    }
  };

  const transfer = async (receiverSparkAddress, amountSats) => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    try {
      const result = await state.wallet.transfer({
        receiverSparkAddress,
        amountSats: Number(amountSats),
      });

      // 刷新余额和交易记录（强制刷新以认领变更）
      await Promise.all([
        refreshBalance(state.wallet, true),
        getTransfers(),
      ]);

      return result;
    } catch (error) {
      throw error;
    }
  };

  const payLightningInvoice = async (invoice, maxFeeSats, preferSpark = false) => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    try {
      const result = await state.wallet.payLightningInvoice({
        invoice,
        maxFeeSats: Number(maxFeeSats),
        preferSpark,
      });

      // 刷新余额和交易记录
      await Promise.all([
        refreshBalance(),
        getTransfers(),
      ]);

      return result;
    } catch (error) {
      throw error;
    }
  };

  const createLightningInvoice = async (amountSats, memo = '') => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    try {
      // 根据文档，使用完整的参数格式
      const params = {
        amountSats: Number(amountSats)
      };
      
      // 只在有memo时添加memo字段
      if (memo && memo.trim()) {
        params.memo = memo.trim();
      }
      
      const result = await state.wallet.createLightningInvoice(params);
      
      return result;
    } catch (error) {
      console.error('创建闪电网络发票失败:', error);
      
      // 提供更详细的错误信息
      if (error.message.includes('insufficient')) {
        throw new Error('余额不足，无法创建闪电网络发票');
      } else if (error.message.includes('network')) {
        throw new Error('网络连接错误，请稍后重试');
      } else if (error.message.includes('amount')) {
        throw new Error('金额无效，请检查输入的金额');
      }
      
      throw error;
    }
  };

  const getSingleUseDepositAddress = async () => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    try {
      const address = await state.wallet.getSingleUseDepositAddress();
      return address;
    } catch (error) {
      throw error;
    }
  };

  const getStaticDepositAddress = async () => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    try {
      const address = await state.wallet.getStaticDepositAddress();
      return address;
    } catch (error) {
      throw error;
    }
  };

  const claimDeposit = async (txId) => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    // 验证参数
    if (!txId || typeof txId !== 'string' || !txId.trim()) {
      throw new Error('交易ID不能为空');
    }
    
    const trimmedTxId = txId.trim();
    
    // 验证交易ID格式（比特币交易ID是64位十六进制字符串）
    if (trimmedTxId.length !== 64 || !/^[a-fA-F0-9]+$/.test(trimmedTxId)) {
      throw new Error('交易ID格式无效');
    }
    
    try {
      console.log('WalletContext: 开始认领存款，交易ID:', trimmedTxId);
      
      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 3;
      let result;
      
      while (retryCount < maxRetries) {
        try {
          result = await state.wallet.claimDeposit(trimmedTxId);
          console.log('WalletContext: 认领存款成功:', result);
          break;
        } catch (retryError) {
          retryCount++;
          console.warn(`认领存款重试 ${retryCount}/${maxRetries}:`, retryError.message);
          
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // 认领成功后刷新余额和交易记录
      await Promise.all([
        refreshBalance(state.wallet, true),
        getTransfers()
      ]);
      
      return result;
    } catch (error) {
      console.error('WalletContext: 认领存款失败:', error);
      
      // 友好的错误消息
      let userMessage = error.message;
      if (error.message.includes('not found')) {
        userMessage = '交易未找到或不符合认领条件';
      } else if (error.message.includes('already claimed')) {
        userMessage = '存款已被认领';
      } else if (error.message.includes('already been used')) {
        userMessage = '该存款地址已被使用过，无法重复认领';
      } else if (error.message.includes('Deposit address has already been used')) {
        userMessage = '该存款地址已被使用过，无法重复认领';
      } else if (error.message.includes('insufficient')) {
        userMessage = '交易确认数不足，请稍后重试';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        userMessage = '网络连接错误，请检查网络后重试';
      } else if (error.message.includes('invalid')) {
        userMessage = '无效的交易ID';
      } else if (error.message.includes('timeout')) {
        userMessage = '请求超时，请重试';
      } else if (error.message.includes('ValidationError') || error.message.includes('SparkSDKError')) {
        // 处理SDK验证错误
        if (error.message.includes('already been used')) {
          userMessage = '该存款地址已被使用过，请生成新的充值地址';
        } else {
          userMessage = 'SDK验证错误，请检查输入参数';
        }
      }
      
      throw new Error(userMessage);
    }
  };

  // 检查并认领任何待处理的存款
  const checkAndClaimDeposits = async (wallet = state.wallet) => {
    if (!wallet) return;
    
    try {
      // 获取未使用的存款地址
      const unusedAddresses = await wallet.getUnusedDepositAddresses();
      
      // 这里可以添加检查这些地址是否有待认领的存款的逻辑
      // 但由于需要外部API来检查比特币交易，暂时跳过
      
      return unusedAddresses;
    } catch (error) {
      console.warn('检查存款失败:', error);
      return [];
    }
  };

  const withdraw = async (withdrawalAddress, amountSats, speed = 'MEDIUM') => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    // 检查钱包连接状态
    if (!state.isInitialized) {
      throw new Error('钱包未完全初始化，请稍后重试');
    }
    
    // 参数验证
    if (!withdrawalAddress || typeof withdrawalAddress !== 'string' || !withdrawalAddress.trim()) {
      throw new Error('目标地址不能为空');
    }
    
    if (!amountSats || isNaN(amountSats) || Number(amountSats) <= 0) {
      throw new Error('提现金额必须大于0');
    }
    
    // 验证speed参数
    const validSpeeds = ['FAST', 'MEDIUM', 'SLOW'];
    if (!validSpeeds.includes(speed)) {
      throw new Error('交易速度参数无效');
    }
    
    const trimmedAddress = withdrawalAddress.trim();
    const amount = Number(amountSats);
    
    // 确保参数类型正确
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('提现金额必须是正整数');
    }
    
    try {
      
      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 3;
      let result;
      
      while (retryCount < maxRetries) {
        try {
          // 直接调用SDK的高级方法，SDK内部会处理输出选择和参数转换
          result = await state.wallet.withdraw({
            destinationAddress: trimmedAddress,  // 使用文档中的参数名
            amountSats: amount,
            speed,
          });
          break;
        } catch (retryError) {
          retryCount++;
          console.warn(`提现请求重试 ${retryCount}/${maxRetries}:`, retryError.message);
          
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 刷新余额和交易记录
      await Promise.all([
        refreshBalance(),
        getTransfers(),
      ]);
      
      return result;
    } catch (error) {
      console.error('提现失败:', error);
      
      // 友好的错误消息
      let userMessage = error.message;
      if (error.message.includes('insufficient funds')) {
        userMessage = '余额不足';
      } else if (error.message.includes('invalid address')) {
        userMessage = '目标地址无效';
      } else if (error.message.includes('network')) {
        userMessage = '网络连接错误，请稍后重试';
      }
      
      throw new Error(userMessage);
    }
  };

  const getTokenInfo = async (walletInstance = state.wallet) => {
    if (!walletInstance) return;
    
    try {
      const tokenInfo = await walletInstance.getTokenInfo();
      dispatch({ type: 'SET_TOKEN_INFO', payload: tokenInfo });
      return tokenInfo;
    } catch (error) {
      console.warn('获取代币信息失败:', error);
      dispatch({ type: 'SET_TOKEN_INFO', payload: [] });
      return [];
    }
  };

  

  const transferTokens = async (tokenPublicKey, tokenAmount, receiverSparkAddress) => {
    if (!state.wallet) throw new Error('钱包未初始化');
    
    // 检查钱包连接状态
    if (!state.isInitialized) {
      throw new Error('钱包未完全初始化，请稍后重试');
    }
    
    // 参数验证
    if (!tokenPublicKey || typeof tokenPublicKey !== 'string' || !tokenPublicKey.trim()) {
      throw new Error('代币公钥不能为空');
    }
    
    if (!receiverSparkAddress || typeof receiverSparkAddress !== 'string' || !receiverSparkAddress.trim()) {
      throw new Error('接收地址不能为空');
    }
    
    if (!receiverSparkAddress.trim().startsWith('sp')) {
      throw new Error('请输入有效的Spark地址（以sp开头）');
    }
    
    if (!tokenAmount || isNaN(tokenAmount) || Number(tokenAmount) <= 0) {
      throw new Error('代币数量必须大于0');
    }
    
    const trimmedAddress = receiverSparkAddress.trim();
    const amount = Number(tokenAmount);
    
    // 确保参数类型正确
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('代币数量必须是正整数');
    }
    
    try {
      
      // 添加重试机制
      let retryCount = 0;
      const maxRetries = 3;
      let result;
      
      while (retryCount < maxRetries) {
        try {
          // 使用SDK的transferTokens方法
          result = await state.wallet.transferTokens({
            tokenPublicKey: tokenPublicKey.trim(),
            tokenAmount: BigInt(amount), // 使用BigInt类型
            receiverSparkAddress: trimmedAddress,
            // selectedOutputs 参数可选，让SDK自动选择输出
          });
          break;
        } catch (retryError) {
          retryCount++;
          console.warn(`代币转账重试 ${retryCount}/${maxRetries}:`, retryError.message);
          
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // 刷新余额和交易记录，包括代币信息
      await Promise.all([
        refreshBalance(),
        getTransfers(),
        getTokenInfo(),
      ]);
      
      return result;
    } catch (error) {
      console.error('代币转账失败:', error);
      
      // 友好的错误消息
      let userMessage = error.message;
      if (error.message.includes('insufficient')) {
        userMessage = '代币余额不足';
      } else if (error.message.includes('invalid address')) {
        userMessage = '接收地址无效';
      } else if (error.message.includes('network')) {
        userMessage = '网络连接错误，请稍后重试';
      } else if (error.message.includes('token')) {
        userMessage = '代币操作失败，请检查代币信息';
      }
      
      throw new Error(userMessage);
    }
  };

  const lockWallet = () => {
    dispatch({ type: 'LOCK_WALLET' });
    toast.success('钱包已锁定');
  };

  const resetWallet = () => {
    localStorage.removeItem('spark_wallet_data');
    dispatch({ type: 'RESET_WALLET' });
    toast.success('钱包已重置');
  };

  const markAsBackedUp = () => {
    dispatch({ type: 'SET_BACKUP_REMINDER', payload: false });
    toast.success('备份完成！');
  };

  const value = {
    ...state,
    // 新的方法
    createWallet,
    restoreWallet,
    unlockWallet,
    getWalletInfo,
    refreshBalance,
    getTransfers,
    transfer,
    transferTokens,
    payLightningInvoice,
    createLightningInvoice,
    getSingleUseDepositAddress,
    getStaticDepositAddress,
    claimDeposit,
    checkAndClaimDeposits,
    withdraw,
    getTokenInfo,
    lockWallet,
    resetWallet,
    markAsBackedUp,
    // 兼容性别名，保持向后兼容
    transactions: state.transfers,
    tokens: state.tokenInfo,
    sendTransaction: transfer,
    isSparkConnected: state.isInitialized,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 