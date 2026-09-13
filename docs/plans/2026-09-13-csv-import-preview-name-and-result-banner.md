# CSV 导入体验优化：预检名称列 + 提交结果显性提醒

日期：2026-09-13
状态：已确认（用户已拍板），实施中

## 背景

用户在使用 CSV 导入更新家庭资产负债表时发现两处体验缺口：

1. 预检结果只有 行号/动作/错误 三列，没有资产名称，行号对不上具体是哪条资产，核对困难
2. 提交导入后没有显性化的成功/失败提醒，唯一反馈是导入日志新增一条记录，用户无法确定「成了没有」

## 决策记录（用户已拍板）

- 错误明细 CSV 同步加名称列（与界面预检表格一致）
- 不开 Git Worktree，直接在 main 上实施

## 需求 1：预检结果增加「名称」列

### 后端（backend/app/services/import_service.py）

1. `ParsedRow` 新增 `name: str | None = None` 字段（带默认值，既有构造点与测试不受影响）
2. `_parse_csv()` 填充规则：
   - 解析成功行 → `payload["name"]`（已 strip 的规范名）
   - 解析失败行 → 从原始 CSV 行捞 `raw.get("name", "")`；失败行往往正是名称写错的行，没名字用户无法定位
3. `_to_preview()` 每行输出加 `name`
4. `_write_error_report()` 错误明细 CSV 表头从 `row,action,error` 改为 `row,name,action,error`

### 前端（frontend/src）

1. `services/imports.ts`：`ImportPreview.rows` 元素类型加 `name: string | null`
2. `pages/ImportPage.tsx` 的 `PreviewRowsTable`：三列变四列（行号/名称/动作/错误）
   - 普通表与 react-virtual 虚拟滚动表两套渲染同步加列，colSpan 3→4
   - 名称为空的行显示 `—`
   - 行高估算 44px 不变

### 边界

| 场景 | 名称列 |
|---|---|
| 正常行 | 规范名称 |
| 失败行（成员/分类不存在等） | 原始 name 字段原文 |
| 失败行且 name 为空 | `—` |

## 需求 2：提交后显性成功/失败提醒

纯前端改动（commit 响应已带 `import_id` 与各计数，后端无需动）。

`pages/ImportPage.tsx`：

1. 新增 `commitResult` 状态：`{ status: 'success' | 'failure', inserted, updated, failed, importId } | null`
2. `commitMutation.onSuccess` → success 结果；`onError` → failure + 错误消息（与预检区 `error` 状态分离，各司其职）
3. 按钮区下方渲染结果横幅（Card），三态：

| 状态 | 样式 | 内容 |
|---|---|---|
| 成功且 0 失败 | emerald 绿底 | 「导入成功：新增 X 条，更新 Y 条」 |
| 成功但有失败行 | amber 黄底 | 「部分导入成功：新增 X，更新 Y，失败 N」+「下载错误明细」按钮（复用 `handleDownloadErrors(importId)`） |
| 提交失败 | rose 红底 | 「导入失败：<原因>」 |

4. 横幅可手动关闭；选择新文件时自动清除（避免陈旧结果误导）

### 选型：为什么是横幅而不是 Toast / 弹窗

- 应用没有 Toast 基础设施，新增 toaster 属过度建设
- Dialog 弹窗打断感强、需多点一次关闭，且无法承载「下载错误明细」后续动作
- 就地横幅显眼、可持续可见、可内嵌操作，与现有 Card 体系风格一致

## 测试计划

- 后端 `test_import_service.py`：预检行名称覆盖（成功行规范名 / 失败行原始名 / 无名失败行 None）；错误明细 CSV 含名称列
- 前端 `importPage.test.ts`（源码级断言）：预检表四列表头；commitResult 三态横幅；失败时下载按钮条件渲染
- 回归：backend pytest + frontend node --test + typecheck + vite build 全绿

## 验收标准

1. 预检结果表格展示 行号/名称/动作/错误 四列，失败行也能看到名称
2. 提交后：全成功→绿横幅；部分失败→黄横幅+错误明细下载；请求失败→红横幅
3. 错误明细 CSV 含名称列
4. 选择新文件后旧横幅消失
5. 全量测试通过
