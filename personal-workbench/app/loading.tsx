/** 路由切换时的骨架，避免点了导航之后长时间没有反馈。 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="加载中">
      <div className="bg-surface-hover h-8 w-40 animate-pulse rounded-md" />
      <div className="bg-surface-hover h-24 animate-pulse rounded-lg" />
      <div className="bg-surface-hover h-64 animate-pulse rounded-lg" />
    </div>
  );
}
