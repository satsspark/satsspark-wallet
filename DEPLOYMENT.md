# SatsSpark 钱包 - Vercel 部署指南

## 🚀 快速部署

### 方法一：通过 Vercel 网站部署

1. **访问 Vercel 官网**
   - 打开 [vercel.com](https://vercel.com)
   - 点击 "Start Deploying" 或 "Sign Up"

2. **注册/登录账户**
   - 建议使用 GitHub 账户登录
   - 授权 Vercel 访问您的 GitHub 仓库

3. **导入项目**
   - 点击 "New Project"
   - 选择您的 GitHub 仓库 (satsspark-wallet)
   - 点击 "Import"

4. **配置项目设置**
   ```
   Project Name: satsspark-wallet
   Framework Preset: Create React App
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **环境变量设置**（如果需要）
   - 在 "Environment Variables" 部分添加必要的环境变量
   - 目前项目无需特殊环境变量

6. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约2-5分钟）

### 方法二：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **在项目目录下运行**
   ```bash
   cd btc
   vercel
   ```

3. **按照提示配置**
   - 选择账户/团队
   - 确认项目设置
   - 等待部署完成

## ⚙️ 自动部署配置

部署后，每次推送到 main/master 分支都会自动触发重新部署。

## 🌐 自定义域名

1. 在 Vercel 项目设置中点击 "Domains"
2. 添加您的自定义域名
3. 根据提示配置 DNS 记录

## 🔒 安全设置

项目已配置以下安全头：
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Content Security Policy
- Referrer Policy

## 📊 性能优化

- 静态资源缓存：1年
- 支持 React Router 单页应用路由
- 自动 GZIP 压缩
- CDN 全球分发

## 🛠️ 故障排除

### 构建失败
- 检查依赖是否正确安装
- 确认 Node.js 版本兼容性
- 查看构建日志了解具体错误

### 路由问题
- 确保 vercel.json 配置正确
- SPA 路由已正确配置重定向

### API 连接问题
- 检查 CORS 设置
- 确认外部 API 调用地址正确

## 📝 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] vercel.json 配置文件已添加
- [ ] .vercelignore 文件已配置
- [ ] 构建命令正确设置
- [ ] 环境变量已配置（如需要）
- [ ] 自定义域名已设置（如需要）

## 🎯 推荐设置

- **Production Branch**: main
- **Auto Deploy**: 启用
- **Function Region**: Hong Kong (hkg1) - 亚洲用户
- **Node.js Version**: 18.x 