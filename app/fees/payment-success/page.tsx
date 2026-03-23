'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container max-w-2xl py-16 px-4">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <p className="text-muted-foreground">Your fee payment has been processed successfully</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {orderId && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Order ID</div>
              <div className="font-mono font-semibold">{orderId}</div>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Payment confirmed</p>
                <p className="text-muted-foreground">Your payment has been received and processed</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Funds transferred to school</p>
                <p className="text-muted-foreground">
                  Money has been automatically transferred to your school's account
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Receipt sent</p>
                <p className="text-muted-foreground">
                  Payment receipt has been sent to your registered email
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
            <Button className="flex-1" onClick={() => router.push('/fees')}>
              View Fees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
