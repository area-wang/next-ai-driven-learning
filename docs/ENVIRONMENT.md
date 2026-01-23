# 环境配置

## 系统要求

- Node.js 20+（使用 nvm 管理版本）
- npm 或 yarn
- Git

## 环境变量配置

### 创建 .env.local 文件

在项目根目录创建 `.env.local` 文件，配置以下环境变量：

```env
# NextAuth 配置（必需）
AUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# AI 功能配置（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# OAuth 配置（可选）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Cloudflare R2 配置（可选，用于文件上传）
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

## 本地开发设置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.dev.vars.example` 为 `.dev.vars`，填入必要的配置：

```bash
cp .dev.vars.example .dev.vars
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## Node 版本管理

### 使用 nvm 切换 Node 版本

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node 20
nvm install 20

# 使用 Node 20
nvm use 20

# 设置默认版本
nvm alias default 20
```

## 验证环境

### 检查 Node 版本

```bash
node --version  # 应该是 v20.x.x
npm --version
```

### 检查类型

```bash
npx tsc --noEmit
```

### 检查编译

```bash
npm run preview
```

## 开发工作流

### 每次开发前

1. 确保 Node 版本正确
   ```bash
   nvm use 20
   ```

2. 检查类型
   ```bash
   npx tsc --noEmit
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   ```

### 提交代码前

1. 检查类型
   ```bash
   npx tsc --noEmit
   ```

2. 检查编译
   ```bash
   npm run preview
   ```

3. 运行测试（如果有）
   ```bash
   npm run test
   ```

## 常见问题

### Q: 环境变量未生效

**A:** 
1. 确保文件名是 `.env.local`
2. 重启开发服务器
3. 检查环境变量是否正确

### Q: Node 版本不对

**A:**
```bash
nvm use 20
node --version  # 验证版本
```

### Q: 类型检查失败

**A:**
```bash
npx tsc --noEmit  # 查看具体错误
```

### Q: 编译失败

**A:**
```bash
npm run preview  # 查看具体错误
```

