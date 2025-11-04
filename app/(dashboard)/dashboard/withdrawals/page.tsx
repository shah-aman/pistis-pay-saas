'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Withdrawal {
  id: string;
  amountUsdc: number;
  amountFiat: number;
  currency: string;
  bankAccountLast4: string | null;
  sphereWithdrawalId: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface WithdrawalsResponse {
  withdrawals: Withdrawal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function formatUSDC(amount: number | null | undefined): string {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function WithdrawalRow({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {formatUSDC(withdrawal.amountUsdc)} USDC
        </div>
        <div className="text-sm text-gray-500">
          {formatCurrency(withdrawal.amountFiat, withdrawal.currency)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {withdrawal.bankAccountLast4 ? `****${withdrawal.bankAccountLast4}` : 'N/A'}
        </div>
        <div className="text-sm text-gray-500">
          {withdrawal.currency}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
          {withdrawal.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy HH:mm')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {withdrawal.completedAt ? format(new Date(withdrawal.completedAt), 'MMM dd, yyyy HH:mm') : '—'}
      </td>
    </tr>
  );
}

export default function WithdrawalsPage() {
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('limit', '50');
    return `/api/withdrawals?${params.toString()}`;
  };

  const { data, error, isLoading } = useSWR<WithdrawalsResponse>(buildUrl(), fetcher);

  useEffect(() => {
    setPage(1);
  }, [status, startDate, endDate]);

  if (error) {
    return (
      <section className="flex-1">
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load withdrawals</p>
        </div>
      </section>
    );
  }

  const withdrawals = data?.withdrawals || [];
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

  return (
    <section className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Withdrawals</h1>
        <Button asChild>
          <Link href="/dashboard/withdrawals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Withdrawal
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {pagination.total > 0 ? (
              <>Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} withdrawals</>
            ) : (
              'Withdrawals'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No withdrawals found</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/withdrawals/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Withdrawal
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Account
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} />
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}



