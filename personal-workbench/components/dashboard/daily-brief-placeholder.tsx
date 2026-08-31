import { Card, CardHeader } from "@/components/ui/card";

/**
 * Daily Brief 的版面先占住（PRD 明确要求保留位置），内容在 V3 做。
 * 这是 V0 里唯一允许的占位。
 */
export function DailyBriefPlaceholder() {
  return (
    <Card>
      <CardHeader
        title="Daily Brief"
        action={<span className="text-muted font-mono text-xs">V3</span>}
      />
      <div className="border-border text-muted border-t px-4 py-6 text-center text-xs">
        每天早上按你的兴趣和目标生成的信息摘要，会出现在这里。
      </div>
    </Card>
  );
}
