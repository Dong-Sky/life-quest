# Supabase 云端基础

## 本轮目的

这一轮只建立多账号需要的云端地基，不会自动将现有浏览器数据迁移到数据库，也不会修改当前可用的本地原型体验。

## Vercel 环境变量

在 Vercel 项目的 **Settings → Environment Variables** 中添加到 Production、Preview 与 Development：

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Publishable Key 可以出现在浏览器应用中，但只有启用 Row Level Security 后才安全。不要提交数据库密码、Secret Key 或 service_role Key。

## 应用数据库迁移

1. 打开 Supabase 项目。
2. 左侧打开 **SQL Editor**。
3. 点击 **New query**。
4. 粘贴 `supabase/migrations/202607150001_initial_cloud_schema.sql` 的完整内容。
5. 点击 **Run**。
6. 确认结果没有错误；随后可在 **Table Editor** 看到 profiles、quests、rewards 等表。

该迁移创建：

- 用户资料与自动建档触发器
- 主线、副本、任务、里程碑、奖励、结算及周计划表
- 每个用户只能访问自己数据的 Row Level Security 规则
- 支持未来“共同副本”前的安全数据边界

## 下一轮

- 邮箱 Magic Link 登录
- 会话保护与退出登录
- 读取和写入云端任务、主线与奖励
- 一次性导入现有浏览器原型数据
