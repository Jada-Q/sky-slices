# Sky Slices

> 你窗外的天空，是什么颜色？

一个共时性 art piece：用户取一块代表此刻自己窗外天空的颜色，连同所在城市，提交到一面实时刷新的墙上。100 块色块拼起来，就是地球此刻的天空切片。

- **picker**（`/`）：取色器 + 城市（自动检测）+ 提交
- **wall**（`/wall`）：实时网格，新提交立刻冒出来

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Realtime) — anon key + RLS
- `react-colorful` HexColorPicker
- ipapi.co (free tier, 城市级 IP geolocation)

## 一次性 setup（约 3 分钟）

1. **建 Supabase 项目** — https://supabase.com/dashboard → New project（选最近的区域，密码随便记一下）

2. **跑 schema** — Dashboard → SQL Editor → New query → 粘贴 `supabase/schema.sql` 里的内容 → Run

3. **复制 keys** — Dashboard → Project Settings → API
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **写到 `.env.local`**（注意用 `printf` 而不是 `echo`，避免隐藏字符）：

   ```bash
   cp .env.example .env.local
   # 然后用编辑器填值，或者：
   printf 'NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...\n' > .env.local
   ```

5. **跑起来**：

   ```bash
   npm run dev
   ```

   打开 http://localhost:3000，挑一块天空 → 点提交 → 看 `/wall`。

## 部署

Vercel 一键。环境变量在 Project Settings → Environment Variables 里加同样两条。

## License

MIT — fork it, remix it, run your own sky.
