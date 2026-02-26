# 智能拼图 App（Web）

用 React + TypeScript + Vite 初始化的「智能拼图」应用骨架，后续可以在此基础上接入图片分割、拖拽拼图、难度与智能提示等能力。

## 开发

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
pnpm preview
```

## 节省磁盘空间（清理依赖/产物）

当仓库短时间不更新、想释放磁盘空间时，可以删除可再生成的依赖与构建产物（不会改动源码与锁文件）：

```bash
pnpm clean
```

需要恢复运行时：

```bash
pnpm install
pnpm dev
```

也可以一步完成：

```bash
pnpm fresh
```

## 部署到 Vercel

- Framework: `Vite`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: `dist`

## 目录结构

- `src/` 前端源码
- `public/` 静态资源
- `vite.config.ts` Vite 配置

## 下一步（可选）

- 选择技术路线：纯 Web / PWA / React Native / Flutter
- 定义核心能力：拼图切分算法、拖拽交互、AI 提示（下一步位置/边缘匹配/颜色相似度）
