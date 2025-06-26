import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        market: 'Market',
        launchpad: 'Launchpad',
        settings: 'Settings'
      },
      // Common
      common: {
        balance: 'Balance',
        send: 'Send',
        receive: 'Receive',
        withdraw: 'Withdraw',
        transfer: 'Transfer',
        history: 'History',
        tokens: 'Tokens',
        confirm: 'Confirm',
        cancel: 'Cancel',
        copy: 'Copy',
        copied: 'Copied!',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        amount: 'Amount',
        address: 'Address',
        fee: 'Fee',
        total: 'Total',
        back: 'Back',
        hide: 'Hide',
        show: 'Show'
      },
      // Wallet
      wallet: {
        create: 'Create Wallet',
        import: 'Import Wallet',
        lock: 'Lock Wallet',
        unlock: 'Unlock Wallet',
        locked: 'Wallet Locked',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        mnemonic: 'Mnemonic Phrase',
        exportMnemonic: 'Export Mnemonic',
        enterPassword: 'Enter your password',
        createPassword: 'Create a password',
        secureWarning: 'Keep your mnemonic phrase safe. Anyone with this phrase can access your wallet.',
        invalidPassword: 'Invalid password',
        walletCreated: 'Wallet created successfully',
        walletImported: 'Wallet imported successfully',
        walletLocked: 'Wallet locked',
        walletUnlocked: 'Wallet unlocked',
        description: 'Secure, simple, and powerful Bitcoin wallet',
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 8 characters',
        enterMnemonic: 'Please enter mnemonic phrase',
        createNew: 'Create New Wallet',
        enterPasswordPlaceholder: 'Enter password (at least 8 characters)',
        creating: 'Creating...',
        backupMnemonic: 'Backup Mnemonic',
        mnemonicSaved: 'I have safely saved my mnemonic phrase',
        mnemonicPlaceholder: 'Enter 12 mnemonic words separated by spaces',
        setWalletPassword: 'Set wallet password',
        importing: 'Importing...',
        enterPasswordToContinue: 'Enter password to continue',
        enterWalletPassword: 'Enter wallet password',
        unlocking: 'Unlocking...'
      },
      // Transaction
      transaction: {
        send: 'Send Transaction',
        receive: 'Receive Payment',
        recent: 'Recent Transactions',
        pending: 'Pending',
        confirmed: 'Confirmed',
        failed: 'Failed',
        noTransactions: 'No transactions yet',
        transactionId: 'Transaction ID',
        viewExplorer: 'View in Explorer',
        sendSuccess: 'Transaction sent successfully',
        invalidAddress: 'Invalid address',
        insufficientBalance: 'Insufficient balance'
      },
      // Market
      market: {
        trending: 'Trending',
        gainers: 'Top Gainers',
        losers: 'Top Losers',
        volume: 'Volume',
        change24h: '24h Change',
        price: 'Price',
        marketCap: 'Market Cap'
      },
      // Launchpad
      launchpad: {
        featured: 'Featured Projects',
        upcoming: 'Upcoming',
        live: 'Live',
        ended: 'Ended',
        participate: 'Participate',
        details: 'Details'
      }
    }
  },
  zh: {
    translation: {
      // Navigation
      nav: {
        dashboard: '仪表盘',
        market: '市场',
        launchpad: '发射台',
        settings: '设置'
      },
      // Common
      common: {
        balance: '余额',
        send: '发送',
        receive: '接收',
        withdraw: '提现',
        transfer: '转账',
        history: '历史记录',
        tokens: '代币',
        confirm: '确认',
        cancel: '取消',
        copy: '复制',
        copied: '已复制！',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        amount: '金额',
        address: '地址',
        fee: '手续费',
        total: '总计',
        back: '返回',
        hide: '隐藏',
        show: '显示'
      },
      // Wallet
      wallet: {
        create: '创建钱包',
        import: '导入钱包',
        lock: '锁定钱包',
        unlock: '解锁钱包',
        locked: '钱包已锁定',
        password: '密码',
        confirmPassword: '确认密码',
        mnemonic: '助记词',
        exportMnemonic: '导出助记词',
        enterPassword: '请输入密码',
        createPassword: '创建密码',
        secureWarning: '请妥善保管您的助记词。任何人拥有此助记词都可以访问您的钱包。',
        invalidPassword: '密码错误',
        walletCreated: '钱包创建成功',
        walletImported: '钱包导入成功',
        walletLocked: '钱包已锁定',
        walletUnlocked: '钱包已解锁',
        description: '安全、简单、功能强大的比特币钱包',
        passwordMismatch: '密码不匹配',
        passwordTooShort: '密码至少需要8位',
        enterMnemonic: '请输入助记词',
        createNew: '创建新钱包',
        enterPasswordPlaceholder: '输入密码（至少8位）',
        creating: '创建中...',
        backupMnemonic: '备份助记词',
        mnemonicSaved: '我已安全保存助记词',
        mnemonicPlaceholder: '输入12个助记词，用空格分隔',
        setWalletPassword: '设置钱包密码',
        importing: '导入中...',
        enterPasswordToContinue: '输入密码以继续',
        enterWalletPassword: '输入钱包密码',
        unlocking: '解锁中...'
      },
      // Transaction
      transaction: {
        send: '发送交易',
        receive: '接收付款',
        recent: '最近交易',
        pending: '待确认',
        confirmed: '已确认',
        failed: '失败',
        noTransactions: '暂无交易记录',
        transactionId: '交易哈希',
        viewExplorer: '在区块浏览器中查看',
        sendSuccess: '交易发送成功',
        invalidAddress: '地址无效',
        insufficientBalance: '余额不足'
      },
      // Market
      market: {
        trending: '热门',
        gainers: '涨幅榜',
        losers: '跌幅榜',
        volume: '成交量',
        change24h: '24小时涨跌',
        price: '价格',
        marketCap: '市值'
      },
      // Launchpad
      launchpad: {
        featured: '精选项目',
        upcoming: '即将开始',
        live: '进行中',
        ended: '已结束',
        participate: '参与',
        details: '详情'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 