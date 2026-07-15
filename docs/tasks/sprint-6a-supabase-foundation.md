# Sprint 6A：Supabase 云端基础

## 目标

为 Questline 建立安全的云端数据模型与前端连接配置，为邮箱登录、多账号隔离及后续数据迁移提供基础。

## 本轮包含

- Supabase 浏览器客户端封装
- 公共环境变量模板
- 用户、主线、副本、任务、奖励、结算与周计划的初始迁移
- 用户资料自动创建
- Row Level Security：默认仅可访问自己的数据
- Supabase 与 Vercel 配置说明

## 本轮不包含

- 邮箱登录界面或会话保护
- 读取、写入或迁移现有浏览器原型数据
- 共同副本和数据共享
- 改变当前本地原型的可用流程

## 人工执行步骤

PR 合并后，由项目管理员在 Supabase SQL Editor 执行：

`supabase/migrations/202607150001_initial_cloud_schema.sql`

随后再进行下一张“邮箱 Magic Link 登录”任务。
