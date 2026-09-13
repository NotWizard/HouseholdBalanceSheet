import { formatCurrency } from '../../utils/format';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Select } from '../ui/select';
import type { Holding } from '../../types';
import type { BulkDeleteSummary } from './entryPageLogic';

type EntryBulkDeleteDialogsProps = {
  selectedDeleteOpen: boolean;
  memberDeleteOpen: boolean;
  bulkDeleteError: string | null;
  selectedSummary: BulkDeleteSummary;
  memberDeleteId: string;
  memberDeleteOptions: Array<{ label: string; value: number }>;
  memberDeleteSummary: BulkDeleteSummary;
  baseCurrency: string;
  pending: boolean;
  onCloseSelectedDelete: () => void;
  onCloseMemberDelete: () => void;
  onMemberDeleteIdChange: (value: string) => void;
  onSubmitDeleteSelected: () => void;
  onSubmitDeleteByMember: () => void;
  // 单个删除的二次确认：目标为 null 时弹窗关闭
  singleDeleteTarget: Holding | null;
  singleDeletePending: boolean;
  onCloseSingleDelete: () => void;
  onSubmitSingleDelete: () => void;
};

export function EntryBulkDeleteDialogs({
  selectedDeleteOpen,
  memberDeleteOpen,
  bulkDeleteError,
  selectedSummary,
  memberDeleteId,
  memberDeleteOptions,
  memberDeleteSummary,
  baseCurrency,
  pending,
  onCloseSelectedDelete,
  onCloseMemberDelete,
  onMemberDeleteIdChange,
  onSubmitDeleteSelected,
  onSubmitDeleteByMember,
  singleDeleteTarget,
  singleDeletePending,
  onCloseSingleDelete,
  onSubmitSingleDelete,
}: EntryBulkDeleteDialogsProps) {
  return (
    <>
      <Dialog
        open={singleDeleteTarget != null}
        title="删除该条目？"
        description="删除后将立即刷新录入列表、快照与分析看板数据。"
        onClose={onCloseSingleDelete}
        footer={
          <>
            <Button variant="outline" onClick={onCloseSingleDelete}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={onSubmitSingleDelete}
              disabled={singleDeletePending}
            >
              {singleDeletePending ? '删除中...' : '确认删除'}
            </Button>
          </>
        }
      >
        {singleDeleteTarget ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant={
                  singleDeleteTarget.type === 'asset' ? 'default' : 'secondary'
                }
              >
                {singleDeleteTarget.type === 'asset' ? '资产' : '负债'}
              </Badge>
              <span className="font-medium">{singleDeleteTarget.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(
                  singleDeleteTarget.amount_original,
                  singleDeleteTarget.currency
                )}
              </span>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">
              此操作不可撤销，该条目将从当前账本中删除。
            </div>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        open={selectedDeleteOpen}
        title="批量删除已选条目"
        description="删除后将立即刷新录入列表、快照与分析看板数据。"
        onClose={onCloseSelectedDelete}
        footer={
          <>
            <Button variant="outline" onClick={onCloseSelectedDelete}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={onSubmitDeleteSelected}
              disabled={pending || selectedSummary.count === 0}
            >
              {pending ? '删除中...' : `删除已选（${selectedSummary.count}）`}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <SummaryCards
            summary={selectedSummary}
            baseCurrency={baseCurrency}
            countLabel="已选条目"
          />
          <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">
            此操作不可撤销，将删除当前已勾选的资产与负债，并立即重建最新快照。
          </div>
          {selectedSummary.previewNames.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              示例条目：{selectedSummary.previewNames.join('、')}
            </div>
          ) : null}
          {bulkDeleteError ? (
            <p className="text-sm text-rose-600">{bulkDeleteError}</p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={memberDeleteOpen}
        title="按成员删除资产负债"
        description="支持直接清空某个成员名下的全部资产和负债数据。"
        onClose={onCloseMemberDelete}
        footer={
          <>
            <Button variant="outline" onClick={onCloseMemberDelete}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={onSubmitDeleteByMember}
              disabled={pending || memberDeleteSummary.count === 0}
            >
              {pending ? '删除中...' : '删除该成员全部数据'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">成员</label>
            <Select
              value={memberDeleteId}
              onChange={(event) => onMemberDeleteIdChange(event.target.value)}
              options={memberDeleteOptions}
            />
          </div>
          <SummaryCards
            summary={memberDeleteSummary}
            baseCurrency={baseCurrency}
            countLabel="待删除条目"
          />
          <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-700">
            将删除该成员名下全部资产与负债。删除完成后，录入列表与分析数据会立即刷新。
          </div>
          {memberDeleteSummary.previewNames.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              示例条目：{memberDeleteSummary.previewNames.join('、')}
            </div>
          ) : null}
          {bulkDeleteError ? (
            <p className="text-sm text-rose-600">{bulkDeleteError}</p>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}

function SummaryCards({
  summary,
  baseCurrency,
  countLabel,
}: {
  summary: BulkDeleteSummary;
  baseCurrency: string;
  countLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-secondary/20 p-3">
        <div className="text-xs text-muted-foreground">{countLabel}</div>
        <div className="mt-1 text-lg font-semibold">{summary.count}</div>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-3">
        <div className="text-xs text-muted-foreground">资产 / 负债</div>
        <div className="mt-1 text-lg font-semibold">
          {summary.assetCount} / {summary.liabilityCount}
        </div>
      </div>
      <div className="rounded-lg border bg-secondary/20 p-3">
        <div className="text-xs text-muted-foreground">折算金额</div>
        <div className="mt-1 text-lg font-semibold">
          {formatCurrency(summary.totalBase, baseCurrency)}
        </div>
      </div>
    </div>
  );
}
