import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

test('导入提交成功后清空文件与预检状态，防止重复提交同一文件', () => {
  // 页面组件无法在 node --test 渲染，用源码级断言锁定回归（同 desktopBridge 测试模式）
  const source = readFileSync(
    resolve(process.cwd(), 'src/pages/ImportPage.tsx'),
    'utf8'
  );

  const commitBlock = source.match(/const commitMutation[\s\S]*?onError/);
  assert.ok(commitBlock, '应找到 commitMutation 定义');
  assert.match(commitBlock[0], /setFile\(null\)/);
  assert.match(commitBlock[0], /setPreview\(null\)/);
  assert.match(commitBlock[0], /fileInputRef\.current\.value = ''/);
});

test('预检结果表格为 行号/名称/动作/错误 四列（普通表与虚拟滚动表一致）', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/pages/ImportPage.tsx'),
    'utf8'
  );

  // 两套渲染（普通 + 虚拟滚动）都要有「名称」列
  const nameHeaders = source.match(/<TableHead>名称<\/TableHead>/g) ?? [];
  assert.equal(nameHeaders.length, 2, '普通表与虚拟滚动表都应有名称列');
  const nameCells = source.match(/row\.name \?\? '—'/g) ?? [];
  assert.equal(nameCells.length, 2, '两套渲染都应显示名称或占位符 —');
  // 虚拟滚动表的 padding 行 colSpan 应随四列调整
  assert.match(source, /colSpan=\{4\}/);
  assert.doesNotMatch(source, /colSpan=\{3\}/);
});

test('提交导入后有显性成功/部分成功/失败三态横幅', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/pages/ImportPage.tsx'),
    'utf8'
  );

  // commitResult 三态
  assert.match(source, /status: 'success' \| 'partial' \| 'failure'/);
  assert.match(source, /导入成功：新增/);
  assert.match(source, /部分导入成功：新增/);
  assert.match(source, /导入失败：/);
  // 失败行可下载错误明细
  assert.match(source, /下载错误明细/);
  // 选择新文件时清除旧结果
  assert.match(source, /setCommitResult\(null\)/);
});
