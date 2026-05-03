# Sky Slices

> 你窗外的天空，是什么颜色？

一个共时性 art piece：用户取一块代表此刻自己窗外天空的颜色，连同所在城市，提交到一面墙上。色块拼起来，就是地球此刻的天空切片。

- **picker**（`/`）：取色器 + 城市自动检测 + 提交
- **wall**（`/wall`）：网格，每 12 秒轮询新提交

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Backend：GitHub Issues**（`Jada-Q/sky-slices-data`）— 每个 issue = 一片天空
- `react-colorful` HexColorPicker
- ipapi.co（free, IP → 城市）

为啥用 GitHub Issues 当 DB？为了 0 cloud-dashboard 设置。`gh auth token` 已经给了写权限，公开 repo 的 issues 直接可读。

## Setup（一次性）

```bash
git clone https://github.com/Jada-Q/sky-slices.git
cd sky-slices
npm install
printf "GITHUB_TOKEN=$(gh auth token)\n" > .env.local
npm run dev
```

打开 http://localhost:3000 → 挑天空 → 提交 → 看 `/wall`。

## 部署到 Vercel（Phase 2）

1. `vercel link` → 关联项目
2. 在 Vercel Dashboard → Project Settings → Environment Variables 加 `GITHUB_TOKEN`
   - 推荐生成 fine-grained PAT，仅授权 `sky-slices-data` 仓的 `Issues: read & write`
   - https://github.com/settings/personal-access-tokens/new
3. `vercel --prod`

## 数据治理

所有提交都是 `Jada-Q/sky-slices-data` 里的 public issue。删除某条：去 issues 页 close + delete。批量清理：脚本调 `gh issue list --label slice --json number` + `gh issue delete`.

GitHub API 速率：authenticated 5000 req/hour。服务端缓存 10s，写一次 = 一次 issue 创建。撑得住几千用户。

## License

MIT.
