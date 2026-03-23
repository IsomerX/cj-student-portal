'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { paymentApi } from '@/lib/api/payment';
import { toast } from 'sonner';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

function PayFeePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Tuition Fee Payment');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolId) {
      toast.error('School ID not provided');
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!studentEmail || !studentPhone) {
      toast.error('Please provide email and phone number');
      return;
    }

    try {
      setLoading(true);

      // Create payment order
      const response = await paymentApi.createPaymentOrder({
        schoolId,
        amount: amountValue,
        description,
        studentEmail,
        studentPhone,
      });

      if (!response.success) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount: totalAmount, schoolAmount, platformFee, razorpayKeyId } = response.data;

      // Initialize Razorpay checkout
      const options = {
        key: razorpayKeyId,
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        name: 'SchoolDost',
        description: description,
        order_id: orderId,
        prefill: {
          email: studentEmail,
          contact: studentPhone,
        },
        theme: {
          color: '#3b82f6',
        },
        handler: async function (response: any) {
          handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setProcessingPayment(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessingPayment(true);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      setProcessingPayment(true);

      // Verify payment on backend
      await paymentApi.verifyPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );

      toast.success('Payment successful!');
      router.push('/fees/payment-success?orderId=' + response.razorpay_order_id);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Please contact support.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateFees = () => {
    const baseAmount = parseFloat(amount) || 0;
    const platformCommission = 2.5; // 2.5% platform fee
    const razorpayCharges = 2.0; // Approximate Razorpay charges
    const totalFee = baseAmount * (platformCommission + razorpayCharges) / 100;
    const totalAmount = baseAmount + totalFee;

    return {
      baseAmount,
      platformFee: totalFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const fees = calculateFees();

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <CardTitle>Pay Fees</CardTitle>
          </div>
          <CardDescription>Secure payment powered by Razorpay</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Payment will be automatically transferred to your school's account.
              A small convenience fee will be added to cover platform and payment gateway charges.
            </AlertDescription>
          </Alert>

          <form onSubmit={handlePayment} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Fee Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Payment Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuition Fee, Exam Fee, etc."
              />
            </div>

            {/* Student Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
                required
              />
            </div>

            {/* Student Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                placeholder="9999999999"
                required
              />
            </div>

            <Separator />

            {/* Fee Breakdown */}
            {parseFloat(amount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm mb-3">Payment Summary</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Amount</span>
                  <span className="font-medium">₹{fees.baseAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee (4.5%)</span>
                  <span className="font-medium">₹{fees.platformFee}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{fees.totalAmount}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your school receives ₹{fees.baseAmount.toFixed(2)}.
                  Convenience fee covers platform and payment gateway charges.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || processingPayment || !amount}
            >
              {loading || processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingPayment ? 'Processing Payment...' : 'Creating Order...'}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{fees.totalAmount}
                </>
              )}
            </Button>

            {/* Security Info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              Secured by Razorpay | PCI DSS Compliant
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PayFeePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <PayFeePageContent />
    </Suspense>
  );
}
