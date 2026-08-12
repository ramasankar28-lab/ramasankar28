import { useState, useEffect } from 'react';
import {
  Pill,
  Receipt,
  CheckCircle2,
  Clock,
  Package,
  CreditCard,
  QrCode,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PharmacyOrder, BillingInvoice } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import { getStatusColor } from '../../lib/utils';
import { BillingDashboard } from '../dashboards/BillingDashboard';

export function PharmacyBillingModule() {
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'PHARMACY' | 'BILLING'>('PHARMACY');

  const loadData = async () => {
    try {
      const [o, billingRes] = await Promise.all([
        hospitalService.getPharmacyOrders(),
        hospitalService.getBillingInvoices()
      ]);
      setOrders(o);
      setInvoices(billingRes.invoices || billingRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdatePharmacy = async (orderId: string, status: 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPENSED') => {
    try {
      await hospitalService.updatePharmacyStatus(orderId, status);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Express Pharmacy & Billing Counter
            </h2>
            <Badge variant="teal">Fast Track Desk</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eliminating long medicine pickup and bill payment queues through live prescription tracking and digital checkout.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setSelectedTab('PHARMACY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              selectedTab === 'PHARMACY'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="h-3.5 w-3.5 inline mr-1.5" />
            Express Pharmacy ({orders.length})
          </button>
          <button
            onClick={() => setSelectedTab('BILLING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              selectedTab === 'BILLING'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5 inline mr-1.5" />
            Cashless Billing ({invoices.length})
          </button>
        </div>
      </div>

      {selectedTab === 'PHARMACY' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Live Pharmacy Prescription Dispense Tracker
            </h3>
            <span className="text-xs text-slate-500">Pick up medicines directly at designated counter</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((ord) => {
              const isReady = ord.status === 'READY_FOR_PICKUP';
              const isDispensed = ord.status === 'DISPENSED';

              return (
                <Card
                  key={ord.id}
                  className={`transition-all shadow-xs ${
                    isReady ? 'border-2 border-teal-500 bg-teal-50/20' : 'hover:border-slate-300'
                  }`}
                >
                  <CardHeader className="p-4 pb-3 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded-sm">
                          {ord.pickupCounter}
                        </span>
                        <CardTitle className="text-base text-slate-900 mt-1">
                          {ord.orderNumber}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                          {ord.patientName} &bull; <span className="font-mono">{ord.mrn}</span>
                        </CardDescription>
                      </div>

                      <Badge
                        variant={isReady ? 'success' : isDispensed ? 'default' : 'warning'}
                      >
                        {ord.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Prescribed By:</span>
                        <span className="font-medium text-slate-800">{ord.prescribedBy}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Items Count:</span>
                        <span className="font-bold">{ord.itemsCount} Medicines</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        Prescription Medicines:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 font-medium">
                        {ord.medicines.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      {ord.status === 'PREPARING' && (
                        <Button
                          variant="teal"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUpdatePharmacy(ord.id, 'READY_FOR_PICKUP')}
                        >
                          Mark Ready for Counter Pickup
                        </Button>
                      )}
                      {ord.status === 'READY_FOR_PICKUP' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUpdatePharmacy(ord.id, 'DISPENSED')}
                        >
                          Mark Dispensed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <BillingDashboard />
      )}
    </div>
  );
}
