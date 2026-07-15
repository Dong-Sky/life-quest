# 邮箱 Magic Link 设置

## 功能

Questline 使用 Supabase 的一次性邮箱登录链接。用户不需要密码；首次使用某邮箱时，Supabase 会创建账号，现有数据库触发器会创建对应的 `profile`。

## Supabase 设置

在 Supabase Dashboard：

1. 打开 **Authentication → URL Configuration**。
2. 把 **Site URL** 设置为 Questline 的生产 Vercel 网址，例如 `https://life-quest-xxx.vercel.app`。
3. 在 **Redirect URLs** 添加：
   ```text
   https://life-quest-xxx.vercel.app/auth/callback
   ```
4. 保存。

需要测试预览部署时，可额外添加该预览网址的 `/auth/callback` 地址。

## 验收

1. 无痕窗口打开生产网址，应出现邮箱登录页。
2. 输入一个可收邮件的邮箱，点击“发送登录邮件”。
3. 邮箱中点击链接，应回到 Questline 的 `/auth/callback`，随后进入今日页面。
4. 在 Supabase **Authentication → Users** 可见用户；**Table Editor → profiles** 可见该用户的 profile。
5. 点击侧栏底部“退出登录”，应回到登录页。
6. 用第二个邮箱重复测试，确认它是另一名用户。

## 限制

本轮只完成身份确认与会话。现有任务、主线与奖励仍存在浏览器本地；下一轮再把它们逐步切换到带 RLS 的云端表。
