'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { format } from 'date-fns';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

interface Settlement {
  id: string;
  invoiceNumber: string | null;
  amount: number;
  taxAmount: number;
  description: string | null;
  completedAt: string;
  settlementStatus: string;
  settledAt: string | null;
}

interface SettlementsData {
  settlements: Settlement[];
  summary: {
    pendingAmount: number;
    settledAmount: number;
    pendingCount: number;
    settledCount: number;
  };
}

function formatUSDC(amount: number): string {
  return `${amount.toFixed(2)} USDC`;
}

export default function SettlementsPage() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'settled'>('pending');
  const { data, error, isLoading, mutate } = useSWR<SettlementsData>(
    `/api/settlements?status=${statusFilter}`,
    fetcher
  );

  if (isLoading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium mb-6">Settlements</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium mb-6">Settlements</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Failed to load settlements</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Settlements</h1>
        <p className="text-sm text-muted-foreground">
          Track payments received by the platform and pending settlements
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSDC(data.summary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.pendingCount} payment{data.summary.pendingCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSDC(data.summary.settledAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.settledCount} payment{data.summary.settledCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUSDC(data.summary.pendingAmount + data.summary.settledAmount)}
            </div>
            <p className="text-xs text-muted-foreground">All-time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
        >
          Pending ({data.summary.pendingCount})
        </Button>
        <Button
          variant={statusFilter === 'settled' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('settled')}
        >
          Settled ({data.summary.settledCount})
        </Button>
      </div>

      {/* Settlements Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'pending' ? 'Pending Settlements' : 'Settlement History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.settlements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No {statusFilter} settlements found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Invoice</th>
                    <th className="text-left py-3 px-4 font-medium">Description</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-right py-3 px-4 font-medium">Tax</th>
                    <th className="text-left py-3 px-4 font-medium">Completed</th>
                    {statusFilter === 'settled' && (
                      <th className="text-left py-3 px-4 font-medium">Settled</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.settlements.map((settlement) => (
                    <tr key={settlement.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">
                          {settlement.invoiceNumber || settlement.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {settlement.description || 'Payment'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatUSDC(settlement.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        {formatUSDC(settlement.taxAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {settlement.completedAt
                          ? format(new Date(settlement.completedAt), 'MMM dd, yyyy')
                          : 'N/A'}
                      </td>
                      {statusFilter === 'settled' && (
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {settlement.settledAt
                            ? format(new Date(settlement.settledAt), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Notice */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>About Settlements:</strong> The platform acts as Merchant of Record, collecting
          payments on your behalf. Pending settlements will be transferred to your wallet according
          to your settlement schedule (typically 7-14 days).
        </p>
      </div>
    </section>
  );
}



