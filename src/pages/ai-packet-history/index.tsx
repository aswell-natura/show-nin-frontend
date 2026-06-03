import { BarChart3, CalendarDays, JapaneseYen, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";

const usageData = [
  { date: "05/10", value: 3.7 },
  { date: "05/11", value: 10.7 },
  { date: "05/12", value: 7.3 },
];

export default function AiPacketHistoryPage() {
  const maxValue = 12;
  const chartWidth = 900;
  const chartHeight = 260;
  const chartTop = 20;
  const chartBottom = 220;
  const barWidth = 240;
  const xPositions = [150, 450, 750];
  const points = usageData
    .map((item, index) => {
      const y = chartBottom - (item.value / maxValue) * (chartBottom - chartTop);
      return `${xPositions[index]},${y}`;
    })
    .join(" ");

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  現在の残高
                </h2>
              </div>

              <div className="rounded-lg bg-primary/10 px-5 py-4">
                <span className="text-4xl font-bold tracking-wider text-primary">
                  978.16
                </span>
                <span className="ml-3 text-xl font-bold text-primary">P</span>
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  期間
                </div>
                <input
                  type="date"
                  defaultValue="2026-03-28"
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground">〜</span>
                <input
                  type="date"
                  defaultValue="2026-05-27"
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="inline-flex w-fit overflow-hidden rounded-lg border border-border bg-background">
                <Button type="button" variant="primary" size="sm" className="rounded-none">
                  日別
                </Button>
                <Button type="button" variant="ghost" size="sm" className="rounded-none">
                  月別
                </Button>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-7 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  利用量グラフ（機能別）
                </h2>
              </div>

              <div className="overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-[330px] min-w-[900px] text-muted-foreground"
                  role="img"
                  aria-label="AIパケット利用量グラフ"
                >
                  {[0, 3, 6, 9, 12].map((tick) => {
                    const y = chartBottom - (tick / maxValue) * (chartBottom - chartTop);
                    return (
                      <g key={tick}>
                        <line
                          x1="48"
                          x2="850"
                          y1={y}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="3 4"
                          opacity="0.22"
                        />
                        <text x="20" y={y + 4} fontSize="12" fill="currentColor">
                          {tick}P
                        </text>
                      </g>
                    );
                  })}

                  {[200, 500, 800].map((x) => (
                    <line
                      key={x}
                      x1={x}
                      x2={x}
                      y1={chartTop}
                      y2={chartBottom}
                      stroke="currentColor"
                      strokeDasharray="3 4"
                      opacity="0.18"
                    />
                  ))}

                  <line x1="48" x2="850" y1={chartBottom} y2={chartBottom} stroke="currentColor" />
                  <line x1="48" x2="48" y1={chartTop} y2={chartBottom} stroke="currentColor" />

                  <polyline
                    points={points}
                    fill="none"
                    stroke="#94a3b8"
                    strokeDasharray="4 3"
                    strokeWidth="2"
                  />

                  {usageData.map((item, index) => {
                    const height = (item.value / maxValue) * (chartBottom - chartTop);
                    const x = xPositions[index] - barWidth / 2;
                    const y = chartBottom - height;
                    return (
                      <g key={item.date}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="3"
                          fill="#94a3b8"
                          opacity="0.95"
                        />
                        <text
                          x={xPositions[index]}
                          y={chartBottom + 16}
                          textAnchor="middle"
                          fontSize="12"
                          fill="currentColor"
                        >
                          {item.date}
                        </text>
                      </g>
                    );
                  })}

                  <rect x="405" y="238" width="14" height="10" fill="#94a3b8" />
                  <text x="425" y="247" fontSize="13" fill="currentColor">
                    タスク抽出
                  </text>
                </svg>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <JapaneseYen className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  月別利用コスト集計
                </h2>
                <span className="text-xs text-muted-foreground">
                  （1トークン = ¥1）
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">月</th>
                      <th className="px-3 py-3 text-right font-medium">利用回数</th>
                      <th className="px-3 py-3 text-right font-medium">消費トークン</th>
                      <th className="px-3 py-3 text-right font-medium">推定コスト</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-3 py-3">2026年05月</td>
                      <td className="px-3 py-3 text-right">84 回</td>
                      <td className="px-3 py-3 text-right">21.8 P</td>
                      <td className="px-3 py-3 text-right font-bold text-destructive">
                        ¥21.84
                      </td>
                    </tr>
                    <tr className="bg-muted/30 font-bold">
                      <td className="px-3 py-3">合計</td>
                      <td className="px-3 py-3 text-right">84 回</td>
                      <td className="px-3 py-3 text-right">21.8 P</td>
                      <td className="px-3 py-3 text-right text-destructive">
                        ¥21.84
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
