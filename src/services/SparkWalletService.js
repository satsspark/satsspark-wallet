import { SparkWallet } from '@buildonspark/spark-sdk';

// 声明全局BigInt，避免eslint错误
/* global BigInt */

class SparkWalletService {
  constructor() {
    this.wallet = null;
    this.isInitialized = false;
  }

  // 初始化钱包 - 按照btc3的正确配置
  async initializeWallet(mnemonic) {
    try {
      
      // 按照btc3的配置，使用MAINNET（全大写）和accountNumber: 1
      const initParams = mnemonic ? {
        mnemonicOrSeed: mnemonic,
        accountNumber: 1,
        options: {
          network: "MAINNET", // 指定主网，地址将以 sp 开头
        },
      } : {
        accountNumber: 1,
        options: {
          network: "MAINNET", // 指定主网，地址将以 sp 开头
        },
      };
      
      const result = await SparkWallet.initialize(initParams);
      
      this.wallet = result.wallet;
      this.isInitialized = true;
      
      return {
        success: true,
        wallet: this.wallet,
        mnemonic: result.mnemonic
      };
    } catch (error) {
      console.error('Failed to initialize Spark wallet:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // 检查是否是认证错误
      if (error.message && (error.message.includes('Authentication failed') || error.message.includes('Failed to fetch'))) {
        console.error('Authentication/Network error detected');
        return {
          success: false,
          error: '无法连接到Spark网络服务。请检查网络连接或稍后重试。',
          technicalError: error.message
        };
      }
      
      return {
        success: false,
        error: error.message || '初始化Spark钱包失败'
      };
    }
  }

  // 获取钱包地址 - 官方API调用
  async getWalletAddress() {
    if (!this.isInitialized || !this.wallet) {
      console.warn('Wallet not initialized');
      return {
        sparkAddress: null,
        identityPublicKey: null
      };
    }
    
    try {
      // 按照官方文档API调用
      const sparkAddress = await this.wallet.getSparkAddress();
      const identityPublicKey = await this.wallet.getIdentityPublicKey();
      
      return {
        sparkAddress,
        identityPublicKey
      };
    } catch (error) {
      console.error('Failed to get wallet address:', error);
      return {
        sparkAddress: null,
        identityPublicKey: null
      };
    }
  }

  // 获取余额 - 官方API调用
  async getBalance() {
    if (!this.isInitialized || !this.wallet) {
      return {
        btc: 0,
        btcSats: 0,
        tokenBalances: {}
      };
    }
    
    try {
      // 按照官方文档调用getBalance()
      const balanceData = await this.wallet.getBalance();
      
      // 根据文档，balance是bigint类型
      const satsBalance = balanceData.balance ? Number(balanceData.balance) : 0;
      
      return {
        btc: satsBalance / 100000000,
        btcSats: satsBalance,
        tokenBalances: this.formatTokenBalances(balanceData.tokenBalances)
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      console.error('Error details:', error.message);
      return {
        btc: 0,
        btcSats: 0,
        tokenBalances: {}
      };
    }
  }

  // 格式化代币余额
  formatTokenBalances(tokenBalances) {
    const formatted = {};
    if (tokenBalances && tokenBalances instanceof Map) {
      for (const [tokenKey, tokenData] of tokenBalances) {
        formatted[tokenKey] = {
          balance: Number(tokenData.balance || 0)
        };
      }
    }
    return formatted;
  }

  // 发送转账
  async sendTransfer(receiverSparkAddress, amountSats) {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const transfer = await this.wallet.transfer({
        receiverSparkAddress,
        amountSats: Number(amountSats)
      });
      
      return {
        success: true,
        transfer
      };
    } catch (error) {
      console.error('Transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 支付Lightning发票
  async payLightningInvoice(invoice, maxFeeSats, preferSpark = false) {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const payment = await this.wallet.payLightningInvoice({
        invoice,
        maxFeeSats: Number(maxFeeSats),
        preferSpark
      });
      
      return {
        success: true,
        payment
      };
    } catch (error) {
      console.error('Lightning payment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 创建Lightning发票
  async createLightningInvoice(amountSats, memo = '') {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const invoice = await this.wallet.createLightningInvoice({
        amountSats: Number(amountSats),
        memo
      });
      
      return {
        success: true,
        invoice
      };
    } catch (error) {
      console.error('Create Lightning invoice failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取一次性存款地址
  async getSingleUseDepositAddress() {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }
    
    try {
      const address = await this.wallet.getSingleUseDepositAddress();
      return address;
    } catch (error) {
      console.error('Failed to get single-use deposit address:', error);
      return null;
    }
  }

  // 获取存款地址（兼容性）
  async getDepositAddress() {
    return this.getSingleUseDepositAddress();
  }

  // 认领存款
  async claimDeposit(txId) {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    if (!txId || typeof txId !== 'string' || !txId.trim()) {
      throw new Error('Transaction ID cannot be empty');
    }
    
    const trimmedTxId = txId.trim();
    
    try {
      console.log('SparkWalletService: 开始认领存款，交易ID:', trimmedTxId);
      
      // 调用SDK的认领存款方法
      const result = await this.wallet.claimDeposit(trimmedTxId);
      
      console.log('SparkWalletService: 认领存款成功:', result);
      return result;
    } catch (error) {
      console.error('SparkWalletService: 认领存款失败:', error);
      
      // 处理常见错误
      if (error.message.includes('SparkSDKError')) {
        // 如果是SDK错误，提取更有用的错误信息
        let errorMsg = error.message;
        if (errorMsg.includes('not found')) {
          throw new Error('Transaction not found or not eligible for claiming');
        } else if (errorMsg.includes('already claimed')) {
          throw new Error('Deposit has already been claimed');
        } else if (errorMsg.includes('already been used') || errorMsg.includes('Deposit address has already been used')) {
          throw new Error('Deposit address has already been used');
        } else if (errorMsg.includes('invalid')) {
          throw new Error('Invalid transaction ID');
        }
      }
      
      throw error;
    }
  }

  // 获取静态存款地址
  async getStaticDepositAddress() {
    if (!this.isInitialized || !this.wallet) {
      return null;
    }
    
    try {
      const address = await this.wallet.getStaticDepositAddress();
      return address;
    } catch (error) {
      console.error('Failed to get static deposit address:', error);
      return null;
    }
  }

  // 提现
  async withdraw(destinationAddress, amountSats, speed = 'MEDIUM') {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const withdrawal = await this.wallet.withdraw({
        destinationAddress,
        amountSats: Number(amountSats),
        speed
      });
      
      return {
        success: true,
        withdrawal
      };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取提现费用估算
  async getWithdrawalFeeEstimate(amountSats) {
    if (!this.isInitialized || !this.wallet) {
      return {
        fast: 0,
        medium: 0,
        slow: 0
      };
    }
    
    try {
      const feeEstimate = await this.wallet.getWithdrawalFeeEstimate({
        amountSats: Number(amountSats)
      });
      
      return feeEstimate;
    } catch (error) {
      console.error('Failed to get withdrawal fee estimate:', error);
      return {
        fast: 0,
        medium: 0,
        slow: 0
      };
    }
  }

  // 获取转账记录
  async getTransfers(limit = 20, offset = 0) {
    if (!this.isInitialized || !this.wallet) {
      return {
        transfers: [],
        offset: 0
      };
    }
    
    try {
      const result = await this.wallet.getTransfers(limit, offset);
      return result;
    } catch (error) {
      console.error('Failed to get transfers:', error);
      return {
        transfers: [],
        offset: 0
      };
    }
  }

  // 获取代币信息
  async getTokenInfo() {
    if (!this.isInitialized || !this.wallet) {
      return [];
    }
    
    try {
      const tokenInfo = await this.wallet.getTokenInfo();
      return tokenInfo;
    } catch (error) {
      console.error('Failed to get token info:', error);
      return [];
    }
  }

  // 转移代币
  async transferTokens(tokenPublicKey, tokenAmount, receiverSparkAddress) {
    if (!this.isInitialized || !this.wallet) {
      throw new Error('Wallet not initialized');
    }
    
    try {
      const transfer = await this.wallet.transferTokens({
        tokenPublicKey,
        tokenAmount: BigInt(tokenAmount),
        receiverSparkAddress
      });
      
      return {
        success: true,
        transfer
      };
    } catch (error) {
      console.error('Token transfer failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 查询代币交易
  async queryTokenTransactions(tokenPublicKeys, tokenTransactionHashes = null) {
    if (!this.isInitialized || !this.wallet) {
      return [];
    }
    
    try {
      const transactions = await this.wallet.queryTokenTransactions(
        tokenPublicKeys,
        tokenTransactionHashes
      );
      
      return transactions;
    } catch (error) {
      console.error('Failed to query token transactions:', error);
      return [];
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    if (!this.isInitialized || !this.wallet) {
      return;
    }

    // 转账确认事件
    this.wallet.on('transfer:claimed', (transferId, updatedBalance) => {
      // 可以在这里添加UI更新逻辑
    });

    // 存款确认事件
    this.wallet.on('deposit:confirmed', (depositId, updatedBalance) => {
      // 可以在这里添加UI更新逻辑
    });

    // 连接状态事件
    this.wallet.on('stream:connected', () => {
      // 可以在这里添加连接成功的处理逻辑
    });

    this.wallet.on('stream:disconnected', (reason) => {
      // 可以在这里添加连接断开的处理逻辑
    });
  }

  // 清理资源
  cleanup() {
    if (this.wallet) {
      this.wallet.cleanupConnections();
    }
    this.wallet = null;
    this.isInitialized = false;
  }
}

// 单例模式，导出具名实例
const sparkWalletService = new SparkWalletService();
export default sparkWalletService; 