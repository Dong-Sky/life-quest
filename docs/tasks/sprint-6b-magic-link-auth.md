# Sprint 6B：邮箱免密码登录

## 目标

用户可通过邮箱 Magic Link 登录 Questline。每个邮箱对应一个独立的 Supabase 账户与私密数据空间。

## 包含

- 未登录时显示简洁邮箱登录页
- 发送 Magic Link，并在回跳页面完成会话
- 顶层登录状态确认与退出登录
- 首次登录自动创建 Supabase 用户，数据库触发器自动创建 profile
- 登录后的主应用界面保留现有工作台体验
- 回跳 URL、Supabase 控制台设置和人工验收说明

## 不包含

- 云端任务、主线、奖励的读取与写入
- 把旧浏览器数据导入云端
- 共同副本和账号间共享
- 邮箱品牌模板与自定义 SMTP

## 需要的控制台设置

合并后在 Supabase 的 **Authentication → URL Configuration** 中：

- 将 **Site URL** 设置为生产 Vercel 网址
- 在 **Redirect URLs** 添加：`https://你的-Vercel-网址/auth/callback`

Magic Link 邮箱认证默认已开启。
