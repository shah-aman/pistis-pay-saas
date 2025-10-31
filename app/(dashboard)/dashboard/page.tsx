'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useSWR from 'swr';
import { DollarSign, TrendingUp, CreditCard, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreatePaymentModal } from '@/components/dashboard/create-payment-modal';

const fetcher = (url: string) => fetch(url, {
  credentials: 'include', // Include cookies in requests
}).then((res) => res.json());

interface DashboardStats {
  stats: {
    todayRevenue: number;
    monthRevenue: number;
    allTimeRevenue: number;
    transactionCount: number;
  };
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amountUsdc: number;
    status: string;
    customerWallet: string | null;
    createdAt: string;
    description: string | null;
  }>;
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

function formatWallet(wallet: string | null): string {
  if (!wallet) return 'N/A';
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
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

function StatsCard({ title, value, icon: Icon, description }: { title: string; value: string; icon: any; description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: Number(item.revenue),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => formatUSDC(value)}
              labelStyle={{ color: '#000' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#f97316" 
              fill="#f97316" 
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function RecentTransactions({ transactions }: { transactions: DashboardStats['recentTransactions'] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Link href="/dashboard/transactions">
          <Button variant="outline" size="sm">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {tx.description || 'Payment'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatWallet(tx.customerWallet)} • {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-semibold">{formatUSDC(tx.amountUsdc)}</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.status === 'completed' && (
                    <Link
                      href={`/dashboard/receipt/${tx.id}`}
                      className="text-xs text-orange-600 hover:text-orange-700"
                    >
                      Receipt
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher);

  if (error) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="text-center py-12">
          <p className="text-red-500">Failed to load dashboard data</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium mb-6">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const stats = data?.stats || {
    todayRevenue: 0,
    monthRevenue: 0,
    allTimeRevenue: 0,
    transactionCount: 0,
  };

  const dailyRevenue = data?.dailyRevenue || [];
  const recentTransactions = data?.recentTransactions || [];

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/transactions">
            <Button variant="outline">View Transactions</Button>
          </Link>
          <Button onClick={() => setIsPaymentModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payment Link
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Today's Revenue"
          value={formatUSDC(stats.todayRevenue)}
          icon={DollarSign}
          description="Revenue from today"
        />
        <StatsCard
          title="This Month"
          value={formatUSDC(stats.monthRevenue)}
          icon={TrendingUp}
          description="Revenue this month"
        />
        <StatsCard
          title="All Time"
          value={formatUSDC(stats.allTimeRevenue)}
          icon={CreditCard}
          description="Total revenue"
        />
        <StatsCard
          title="Transactions"
          value={stats.transactionCount.toString()}
          icon={Calendar}
          description="Total completed"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <RevenueChart data={dailyRevenue} />
        <RecentTransactions transactions={recentTransactions} />
      </div>

      <CreatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          mutate(); // Refresh dashboard stats
        }}
      />
    </section>
  );
}
