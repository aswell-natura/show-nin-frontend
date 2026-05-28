import { CreditCard } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

const payments = [
  {
    date: "2024-12-18",
    description: "ビジネスプラン月額",
    amount: "¥9,800",
  },
  {
    date: "2024-11-18",
    description: "ビジネスプラン月額",
    amount: "¥9,800",
  },
  {
    date: "2024-11-05",
    description: "AIパケット追加 3000P",
    amount: "¥2,500",
  },
  {
    date: "2024-10-18",
    description: "ビジネスプラン月額",
    amount: "¥9,800",
  },
];

export default function PaymentHistoryPage() {
  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <section className="mx-auto max-w-5xl rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="mb-12 flex items-center gap-4">
              <CreditCard className="h-7 w-7 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                決済履歴
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="w-[23%] px-1 pb-5 font-medium">日付</th>
                    <th className="w-[47%] px-1 pb-5 font-medium">内容</th>
                    <th className="w-[15%] px-1 pb-5 text-right font-medium">
                      金額
                    </th>
                    <th className="w-[15%] px-1 pb-5 text-right font-medium">
                      状態
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={`${payment.date}-${payment.description}`}
                      className="border-b border-border"
                    >
                      <td className="px-1 py-5 text-lg text-foreground">
                        {payment.date}
                      </td>
                      <td className="px-1 py-5 text-lg text-foreground">
                        {payment.description}
                      </td>
                      <td className="px-1 py-5 text-right text-xl text-foreground">
                        {payment.amount}
                      </td>
                      <td className="px-1 py-5 text-right">
                        <span className="inline-flex rounded-md bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">
                          支払済
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
