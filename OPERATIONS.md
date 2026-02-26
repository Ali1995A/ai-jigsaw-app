# 智能拼图 App 运维文档

## 1. 目标与范围
本项目是一个基于 `React + TypeScript + Vite` 的前端静态站点，默认部署到 Vercel。
本文档用于指导日常运维、发布、回滚与故障排查。

## 2. 系统基线
- 运行时：`Node.js >= 18`
- 包管理器：`pnpm@9.12.3`
- 构建命令：`pnpm build`
- 本地预览命令：`pnpm preview`
- 部署平台：Vercel（静态产物目录 `dist`）

仓库中关键配置：
- `package.json`：脚本与版本约束
- `vercel.json`：安装/构建命令、输出目录、SPA 重写规则
- `vite.config.ts`：Vite 基础配置

## 3. 目录与职责
- `src/`：前端业务代码
- `public/`：静态资源
- `scripts/clean.mjs`：清理依赖与构建产物
- `dist/`：构建产物（由 `pnpm build` 生成）

## 4. 常用运维命令
在仓库根目录执行：

```bash
pnpm install
```
安装依赖（建议在首次拉取或依赖变更后执行）。

```bash
pnpm dev
```
启动开发环境。

```bash
pnpm build
```
执行 TypeScript 构建检查并生成 `dist`。

```bash
pnpm preview
```
本地预览构建产物，默认用于发布前验收。

```bash
pnpm lint
```
执行 ESLint 检查。

```bash
pnpm clean
```
清理可再生文件：`node_modules`、`dist`、缓存和 `*.tsbuildinfo`。

```bash
pnpm fresh
```
一键清理并重新安装依赖。

## 5. 发布流程（Vercel）

### 5.1 发布前检查（必须）
1. 拉取目标分支最新代码。
2. 执行 `pnpm install`。
3. 执行 `pnpm lint`，确保无阻断问题。
4. 执行 `pnpm build`，确保构建成功。
5. 执行 `pnpm preview`，人工验证关键页面与资源加载。

### 5.2 Vercel 配置基线
仓库 `vercel.json` 当前定义：
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Rewrites: `/(.*) -> /index.html`（SPA 路由回退）

### 5.3 发布执行
1. 将代码合入发布分支（常见为 `main`）。
2. 由 Vercel 自动触发构建与部署。
3. 在 Vercel 控制台确认：
   - 构建日志无错误
   - 部署状态为 Ready
   - 线上域名访问正常

## 6. 回滚流程
1. 打开 Vercel 项目 Deployments。
2. 选择最近一个稳定版本。
3. 执行 Promote/回滚操作，使该版本重新成为线上版本。
4. 回滚后立即验证：
   - 首页可访问
   - 关键路径页面可访问（刷新不 404）
   - 静态资源加载正常

## 7. 监控与巡检
本项目为静态前端，建议最小巡检项：
- 可用性：站点首页 HTTP 状态是否为 200。
- 资源健康：JS/CSS 主资源是否返回 200。
- 路由健康：随机抽查 2~3 个前端路由，直接访问不报 404（依赖 rewrite）。
- 发布健康：每次发布后观察 10 分钟内是否出现异常反馈。

## 8. 常见故障与处理

### 8.1 本地安装失败
现象：`pnpm install` 失败。
处理：
1. 检查 Node 版本是否 >= 18。
2. 执行 `pnpm fresh` 后重试。
3. 确认网络与 npm/pnpm 源可用。

### 8.2 构建失败
现象：`pnpm build` 报错。
处理：
1. 先执行 `pnpm lint` 定位语法/规范问题。
2. 根据 TypeScript 报错修复类型问题。
3. 若为依赖问题，执行 `pnpm fresh` 后重试。

### 8.3 线上刷新 404
现象：前端路由页面刷新后 404。
处理：
1. 检查 `vercel.json` rewrite 是否仍为 `/(.*) -> /index.html`。
2. 重新部署并验证路由。

### 8.4 静态资源 404 或缓存异常
处理：
1. 确认 `pnpm build` 后 `dist` 内容完整。
2. 检查 Vercel 构建日志是否有产物目录错误。
3. 触发一次新部署以刷新产物与缓存。

## 9. 安全与变更建议
- 依赖升级：按月检查并升级依赖，升级后至少执行一次完整构建与预览验收。
- 变更控制：涉及构建链路（Vite、TypeScript、pnpm）变更时，建议走 PR 审核。
- 最小权限：Vercel 项目权限按最小化原则分配。

## 10. 运维值班检查清单
每次发布按以下清单打勾：
- [ ] `pnpm lint` 通过
- [ ] `pnpm build` 通过
- [ ] 本地 `pnpm preview` 验证通过
- [ ] Vercel 部署 Ready
- [ ] 线上首页访问正常
- [ ] 关键路由直达访问正常
- [ ] 发布后 10 分钟无异常反馈

---
如后续接入后端 API、对象存储或鉴权服务，应新增对应运维章节（密钥管理、API SLA、告警、备份与恢复演练）。
