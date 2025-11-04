'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SubscriptionsPage() {
  return (
    <section className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg lg:text-2xl font-medium">Subscriptions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Subscription management coming soon</p>
            <p className="text-sm text-muted-foreground">
              This feature will allow you to create and manage subscription plans using Loop Crypto.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}



