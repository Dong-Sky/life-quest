# 初始架构

## 技术基线

- Next.js（App Router）
- TypeScript 严格模式
- React
- Tailwind CSS
- Zod
- Vitest + Testing Library
- Playwright（在核心流程稳定后加入）

## 分层原则

奖励与等级规则属于领域逻辑，不能散落在页面组件中。

```text
src/
  domain/
    rewards/
    quests/
    levels/
  validation/
  types/
app/
components/
tests/
docs/
```

## 数据演进

第一阶段采用本地演示数据验证任务结算体验。引入真实账户后，再接入 Supabase、数据库迁移、奖励流水和 Row Level Security；这一步不得跳过审计与权限设计。

## 工程约束

- 所有业务规则必须有单元测试。
- 所有未来数据库变更必须使用版本化 migration。
- 不在客户端暴露密钥。
- 不用 `any` 绕过类型检查。
- 页面只能调用明确的领域服务或服务层，不直接实现计分公式。
