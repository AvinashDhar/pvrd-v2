import { Coins } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { formatNumber } from "@/lib/format";
import { listLoyaltyRows } from "@/lib/records";

export default async function LoyaltyPage() {
  const wallets = await listLoyaltyRows();
  const available = wallets.reduce((sum, wallet) => sum + wallet.available, 0);
  const redeemed = wallets.reduce((sum, wallet) => sum + wallet.redeemed, 0);
  const expired = wallets.reduce((sum, wallet) => sum + wallet.expired, 0);
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Points issued" value={available + redeemed} icon={Coins} tone="blue" />
        <StatCard label="Available" value={available} icon={Coins} tone="green" />
        <StatCard label="Redeemed" value={redeemed} icon={Coins} tone="orange" />
        <StatCard label="Expired" value={expired} icon={Coins} tone="red" />
      </section>
      <div className="pvrd-card p-4 sm:p-5">
        <h2 className="font-heading text-base font-semibold">How points are stored</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Product points are saved on each product. Wallets below show the balance recorded for each account.
        </p>
      </div>
      {wallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No loyalty wallets yet.</p>
      ) : (
        <div className="pvrd-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                {["Customer", "Type", "Available", "Redeemed", "Expired"].map((col) => (
                  <th key={col} className="px-4 py-3 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.id} className="pvrd-row">
                  <td className="px-4 py-3 font-medium">{wallet.name}</td>
                  <td className="px-4 py-3 capitalize">{wallet.type}</td>
                  <td className="px-4 py-3">{formatNumber(wallet.available)}</td>
                  <td className="px-4 py-3">{formatNumber(wallet.redeemed)}</td>
                  <td className="px-4 py-3">{formatNumber(wallet.expired)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
