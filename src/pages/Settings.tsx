import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { Loader2, DollarSign, Percent } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Settings() {
  const { isAdmin } = useAuth();
  const { 
    rates, 
    isLoading: ratesLoading, 
    updateRates, 
    isUpdating: ratesUpdating 
  } = useExchangeRates();
  
  const {
    getCommissionPercentage,
    updateCommissionRate,
    isLoading: commissionLoading,
    isUpdating: commissionUpdating,
  } = useAppSettings();

  const [eurRate, setEurRate] = useState('');
  const [jodRate, setJodRate] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');

  // Initialize form values when data loads
  useEffect(() => {
    if (rates) {
      setEurRate(rates.EUR.toString());
      setJodRate(rates.JOD.toString());
    }
  }, [rates]);

  useEffect(() => {
    const percent = getCommissionPercentage();
    setCommissionPercent(percent.toString());
  }, [getCommissionPercentage]);

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSaveRates = async () => {
    const eurValue = parseFloat(eurRate);
    const jodValue = parseFloat(jodRate);

    if (isNaN(eurValue) || isNaN(jodValue) || eurValue <= 0 || jodValue <= 0) {
      toast.error('Please enter valid positive exchange rates');
      return;
    }

    try {
      await updateRates({ EUR: eurValue, JOD: jodValue });
      toast.success('Exchange rates updated');
    } catch (error) {
      toast.error('Failed to update exchange rates');
    }
  };

  const handleSaveCommission = async () => {
    const value = parseFloat(commissionPercent);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error('Please enter a valid percentage (0-100)');
      return;
    }

    try {
      await updateCommissionRate(value);
      toast.success('Commission rate updated');
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  const isLoading = ratesLoading || commissionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system-wide settings and configurations"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Exchange Rates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Exchange Rates
            </CardTitle>
            <CardDescription>
              Set exchange rates relative to USD. These rates are used to calculate totals in the pricing form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>USD (Base Currency)</Label>
              <Input value="1.00" disabled className="bg-muted" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eurRate">EUR Rate (1 USD = ? EUR)</Label>
              <Input
                id="eurRate"
                type="number"
                step="0.01"
                value={eurRate}
                onChange={(e) => setEurRate(e.target.value)}
                placeholder="0.92"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jodRate">JOD Rate (1 USD = ? JOD)</Label>
              <Input
                id="jodRate"
                type="number"
                step="0.01"
                value={jodRate}
                onChange={(e) => setJodRate(e.target.value)}
                placeholder="0.71"
              />
            </div>

            <Button 
              onClick={handleSaveRates} 
              disabled={ratesUpdating}
              className="w-full"
            >
              {ratesUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Exchange Rates'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Commission Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Commission Rate
            </CardTitle>
            <CardDescription>
              Default commission percentage applied to gross profit for salesperson commissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionPercent">Commission Percentage (%)</Label>
              <Input
                id="commissionPercent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                placeholder="4"
              />
            </div>

            <Button 
              onClick={handleSaveCommission} 
              disabled={commissionUpdating}
              className="w-full"
            >
              {commissionUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Commission Rate'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
