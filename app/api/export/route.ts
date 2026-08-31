import { getCurrentUserId } from "@/lib/current-user";
import { exportAll } from "@/lib/queries/export";
import { todayInTimeZone } from "@/lib/utils/date";

/** 全量 JSON 备份下载。V0 唯一的备份手段，别让它坏掉。 */
export async function GET() {
  const userId = await getCurrentUserId();
  const data = await exportAll(userId);
  const filename = `personal-workbench-${todayInTimeZone("UTC")}.json`;

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
