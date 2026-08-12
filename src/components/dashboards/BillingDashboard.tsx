import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BillingInvoice } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import {
  Receipt,
  Clock,
  CheckCircle2,
  CreditCard,
  QrCode,
  DollarSign,
  Plus,
  Search,
  Building2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  User,
  ShieldCheck,
  FileText,
  Printer,
  Bell,
  ArrowRight,
  Filter,
  Check,
  X,
  Wallet,
  Smartphone,
  Info,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';

export function BillingDashboard() {
  const { user } = useAuth();

  // Primary State
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [stats, setStats] = useState({
    waitingPatientsCount: 0,
    processingBillsCount: 0,
    completedBillsCount: 0,
    avgWaitTimeMins: 4,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Active Tab: QUEUE | PATIENT_VIEW | CREATE_TOKEN | PAYMENT_SIM | RECEIPTS
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'PATIENT_VIEW' | 'CREATE_TOKEN' | 'PAYMENT_SIM' | 'RECEIPTS'>('QUEUE');

  // Selected Invoice for Payment Simulation Modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<BillingInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [upiVpa, setUpiVpa] = useState('patient@okicici');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cashTendered, setCashTendered] = useState<number>(0);

  // Selected Invoice for Digital Receipt Modal
  const [receiptModalInvoice, setReceiptModalInvoice] = useState<BillingInvoice | null>(null);

  // Generate Token Form State
  const [createTokenOpen, setCreateTokenOpen] = useState(false);
  const [newTokenData, setNewTokenData] = useState({
    patientName: '',
    mrn: '',
    patientPhone: '',
    serviceType: 'OPD Consultation & Diagnostic Services',
    consultationFee: 40,
    laboratoryCharges: 35,
    pharmacyCharges: 25,
    otherCharges: 10,
    isDischargeBill: false,
    notes: ''
  });

  // Notification Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load Billing Data
  const loadBillingData = async () => {
    setLoading(true);
    try {
      const data = await hospitalService.getBillingInvoices();
      if (data && data.invoices) {
        setInvoices(data.invoices);
        setStats(data.stats);
      } else if (Array.isArray(data)) {
        setInvoices(data as unknown as BillingInvoice[]);
      }
    } catch (err) {
      console.error('Error fetching billing invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'WAITING'
        ? inv.status === 'WAITING' || inv.status === 'PENDING'
        : statusFilter === 'PROCESSING'
        ? inv.status === 'PROCESSING'
        : statusFilter === 'PAID'
        ? inv.status === 'PAID'
        : statusFilter === 'DISCHARGE'
        ? inv.isDischargeBill
        : true;

    return matchesSearch && matchesStatus;
  });

  // Selected Invoice for Patient View
  const patientActiveBill = invoices.find(
    (i) => i.status === 'WAITING' || i.status === 'PROCESSING' || i.status === 'PENDING'
  ) || invoices[0];

  // Handler: Start Processing Invoice
  const handleProcessBill = async (invId: string) => {
    try {
      const updated = await hospitalService.processBillingInvoice(invId);
      showToast(`Bill ${updated.invoiceNumber} (Token #${updated.tokenNumber}) is now being processed!`);
      loadBillingData();
    } catch (err) {
      showToast('Failed to update billing status');
    }
  };

  // Handler: Execute Simulated Payment
  const handleSimulatePayment = async () => {
    if (!paymentModalInvoice) return;
    try {
      const refId =
        paymentMethod === 'UPI'
          ? `UPI/${upiVpa}/${Date.now().toString().slice(-6)}`
          : paymentMethod === 'CARD'
          ? `CARD-TXN-${Date.now().toString().slice(-6)}`
          : `CASH-DESK-${Date.now().toString().slice(-6)}`;

      const res = await hospitalService.payBillingInvoice(
        paymentModalInvoice.id,
        paymentMethod,
        refId
      );

      showToast(`Payment of $${res.invoice.amount.toFixed(2)} completed! Receipt #${res.invoice.receiptNumber} generated.`);
      setPaymentModalInvoice(null);
      loadBillingData();
    } catch (err) {
      showToast('Payment simulation failed');
    }
  };

  // Handler: Create New Billing Token
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenData.patientName || !newTokenData.mrn) {
      showToast('Please enter Patient Name and MRN');
      return;
    }

    try {
      const created = await hospitalService.createBillingToken(newTokenData);
      showToast(`Billing Token #${created.tokenNumber} generated for ${created.patientName}!`);
      setCreateTokenOpen(false);
      setNewTokenData({
        patientName: '',
        mrn: '',
        patientPhone: '',
        serviceType: 'OPD Consultation & Diagnostic Services',
        consultationFee: 40,
        laboratoryCharges: 35,
        pharmacyCharges: 25,
        otherCharges: 10,
        isDischargeBill: false,
        notes: ''
      });
      loadBillingData();
    } catch (err) {
      showToast('Failed to create billing token');
    }
  };

  // Handler: Trigger Notification
  const handleSendNotification = async (invId: string, type: 'PENDING' | 'DISCHARGE') => {
    try {
      const res = await hospitalService.sendBillingNotification(invId, type);
      showToast(`Notification sent: "${res.notificationTitle}"`);
    } catch (err) {
      showToast('Failed to send notification');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <Sparkles className="h-5 w-5 text-sky-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-600/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Smart Hospital Billing & Revenue Desk
                </h2>
                <Badge variant="info">Live Queue & Cashless Pay</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Streamlining hospital billing queues with token generation, itemized charges, UPI/Card payment simulation, and digital receipts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadBillingData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateTokenOpen(true)}
            className="shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Generate Billing Token
          </Button>
        </div>
      </div>

      {/* Hospital Billing Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Waiting Queue</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.waitingPatientsCount}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">Patients waiting for payment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Process</span>
            <RefreshCw className="h-4 w-4 text-sky-500 animate-spin-slow" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.processingBillsCount}
          </div>
          <span className="text-[10px] text-sky-600 font-medium">Bills currently processing</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Bills</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.completedBillsCount}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Digital receipts generated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Wait Time</span>
            <Clock className="h-4 w-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.avgWaitTimeMins} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <span className="text-[10px] text-teal-600 font-medium">Express token clearance</span>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-slate-900 to-sky-950 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-sky-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <span className="text-[10px] text-emerald-300 font-medium">Demo collection total</span>
        </div>
      </div>

      {/* Main Module Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'QUEUE'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="h-3.5 w-3.5 mr-1.5" />
            Billing Queue ({invoices.length})
          </button>

          <button
            onClick={() => setActiveTab('PATIENT_VIEW')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'PATIENT_VIEW'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5 mr-1.5" />
            Patient View & Token
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT_SIM')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'PAYMENT_SIM'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            Payment Simulator
          </button>

          <button
            onClick={() => setActiveTab('RECEIPTS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center ${
              activeTab === 'RECEIPTS'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Completed Receipts ({invoices.filter((i) => i.status === 'PAID').length})
          </button>
        </div>

        {/* Search & Filter Options */}
        {activeTab === 'QUEUE' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-60">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, MRN, token..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">Waiting / Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Completed (Paid)</option>
              <option value="DISCHARGE">Discharge Bills</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: BILLING QUEUE & INVOICE MANAGEMENT */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Hospital Billing Tokens & Invoices
              </h3>
              <p className="text-xs text-slate-500">
                Itemized breakdown of consultation, lab, pharmacy, and hospital fees.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredInvoices.length} of {invoices.length} records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvoices.map((inv) => {
              const isPaid = inv.status === 'PAID';
              const isProcessing = inv.status === 'PROCESSING';
              const isWaiting = inv.status === 'WAITING' || inv.status === 'PENDING';

              return (
                <Card
                  key={inv.id}
                  className={`transition-all shadow-xs relative flex flex-col justify-between ${
                    isPaid
                      ? 'bg-slate-50/60 border-slate-200'
                      : isProcessing
                      ? 'border-2 border-sky-500 bg-sky-50/20'
                      : inv.isDischargeBill
                      ? 'border-2 border-rose-300 bg-rose-50/20'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div>
                    <CardHeader className="p-4 pb-3 border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md font-mono">
                              Token #{inv.tokenNumber}
                            </span>
                            {inv.isDischargeBill && (
                              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                                Discharge
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base text-slate-900 font-mono mt-1">
                            {inv.invoiceNumber}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-600 font-medium">
                            {inv.patientName} &bull; <span className="font-mono">{inv.mrn}</span>
                          </CardDescription>
                        </div>

                        <Badge
                          variant={
                            isPaid
                              ? 'success'
                              : isProcessing
                              ? 'info'
                              : inv.isDischargeBill
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3">
                      {/* Location & Queue Position */}
                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        <span className="text-slate-600 text-[11px]">
                          Location: <strong className="text-slate-800">{inv.counter}</strong>
                        </span>
                        {!isPaid && (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                            {inv.patientsAhead} ahead &bull; ~{inv.estimatedTimeMins}m
                          </span>
                        )}
                      </div>

                      {/* Service Type Description */}
                      <div className="text-xs text-slate-700 font-medium">
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">
                          Service Description:
                        </span>
                        {inv.serviceType}
                      </div>

                      {/* Itemized Charges Table */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100">
                          Itemized Charge Breakdown:
                        </span>
                        <div className="flex justify-between text-slate-600">
                          <span className="flex items-center">
                            <Stethoscope className="h-3 w-3 mr-1 text-sky-600" />
                            Consultation Fee:
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${(inv.consultationFee || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="flex items-center">
                            <FlaskConical className="h-3 w-3 mr-1 text-purple-600" />
                            Laboratory Charges:
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${(inv.laboratoryCharges || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="flex items-center">
                            <Pill className="h-3 w-3 mr-1 text-teal-600" />
                            Pharmacy Charges:
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${(inv.pharmacyCharges || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="flex items-center">
                            <Building2 className="h-3 w-3 mr-1 text-amber-600" />
                            Other Hospital Charges:
                          </span>
                          <span className="font-semibold text-slate-800">
                            ${(inv.otherCharges || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Total Highlight */}
                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                          <span className="text-slate-900">Total Payable:</span>
                          <span className="text-base text-sky-700 font-extrabold">
                            ${inv.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Paid Details if Paid */}
                      {isPaid && (
                        <div className="p-2.5 bg-emerald-50 rounded-lg text-xs border border-emerald-200 space-y-1">
                          <div className="flex justify-between items-center text-emerald-800">
                            <span className="font-bold flex items-center">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                              Paid via {inv.paymentMethod}
                            </span>
                            <span className="text-[10px] font-mono">{inv.paidAt}</span>
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono flex justify-between">
                            <span>Receipt: {inv.receiptNumber}</span>
                            <span>Ref: {inv.paymentReference?.slice(0, 14)}...</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 flex flex-wrap gap-2 mt-2">
                    {isWaiting && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleProcessBill(inv.id)}
                      >
                        Start Processing
                      </Button>
                    )}

                    {!isPaid && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setPaymentModalInvoice(inv);
                          setCashTendered(inv.amount);
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                        Simulate Payment
                      </Button>
                    )}

                    {isPaid ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setReceiptModalInvoice(inv)}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1 text-sky-600" />
                        Digital Receipt
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 hover:text-sky-700"
                        onClick={() =>
                          handleSendNotification(inv.id, inv.isDischargeBill ? 'DISCHARGE' : 'PENDING')
                        }
                        title="Send SMS/App Alert to Patient"
                      >
                        <Bell className="h-3.5 w-3.5 mr-1" />
                        Notify
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT VIEW & LIVE TOKEN TRACKER */}
      {activeTab === 'PATIENT_VIEW' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-900 to-teal-900 text-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-800/80 px-2.5 py-1 rounded-md border border-sky-700">
                  Patient Self-Service Kiosk
                </span>
                <h3 className="text-xl font-black mt-2 text-white">
                  Live Billing Token & Cashless Checkout
                </h3>
                <p className="text-xs text-sky-100 mt-1 max-w-xl">
                  Patients or attenders can track their billing queue token in real time, view itemized charges, and pay via mobile UPI or cash counter without standing in line.
                </p>
              </div>

              {/* Patient Selector for Demo */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-xs space-y-1">
                <span className="text-[10px] text-sky-200 block font-bold">Select Active Patient:</span>
                <select
                  value={patientActiveBill?.id}
                  onChange={(e) => {
                    const found = invoices.find((i) => i.id === e.target.value);
                    if (found) setReceiptModalInvoice(found);
                  }}
                  className="bg-sky-950 text-white text-xs rounded-lg px-2 py-1 border border-sky-700 focus:outline-none"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      Token #{inv.tokenNumber} - {inv.patientName} (${inv.amount})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {patientActiveBill ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Token Display Card */}
              <Card className="lg:col-span-1 border-2 border-sky-500 shadow-md">
                <CardHeader className="bg-sky-50 border-b border-sky-100 text-center py-6">
                  <span className="text-xs font-bold text-sky-800 uppercase tracking-widest">
                    Current Billing Token Number
                  </span>
                  <div className="text-5xl font-black text-sky-900 font-mono my-2">
                    #{patientActiveBill.tokenNumber}
                  </div>
                  <Badge
                    variant={patientActiveBill.status === 'PAID' ? 'success' : 'info'}
                    className="mx-auto"
                  >
                    {patientActiveBill.status}
                  </Badge>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Patient Name:</span>
                      <strong className="text-slate-900">{patientActiveBill.patientName}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 font-mono">
                      <span>Medical Record #:</span>
                      <span className="text-slate-800">{patientActiveBill.mrn}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Assigned Counter:</span>
                      <span className="font-bold text-sky-800">{patientActiveBill.counter}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Issued At:</span>
                      <span>{patientActiveBill.issuedAt}</span>
                    </div>
                  </div>

                  {patientActiveBill.status !== 'PAID' ? (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center space-y-1">
                      <div className="text-xs text-amber-800 font-bold uppercase">
                        Queue Position & Wait Time
                      </div>
                      <div className="text-2xl font-black text-amber-900">
                        {patientActiveBill.patientsAhead} Patients Ahead
                      </div>
                      <div className="text-xs text-amber-700">
                        Estimated Wait: <strong>~{patientActiveBill.estimatedTimeMins} minutes</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center space-y-1">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                      <div className="text-xs text-emerald-800 font-bold">
                        Payment Verified & Complete
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono">
                        Receipt #{patientActiveBill.receiptNumber}
                      </div>
                    </div>
                  )}

                  {patientActiveBill.status !== 'PAID' && (
                    <Button
                      variant="teal"
                      className="w-full py-3"
                      onClick={() => setPaymentModalInvoice(patientActiveBill)}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Pay Instantly via Mobile UPI
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Itemized Charges & Digital Receipt Preview */}
              <Card className="lg:col-span-2 shadow-xs">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base text-slate-900">
                        Itemized Hospital Charge Breakdown
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Invoice ID: {patientActiveBill.invoiceNumber}
                      </CardDescription>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReceiptModalInvoice(patientActiveBill)}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1 text-sky-600" />
                      Print / Download Invoice
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Fee Items Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-sky-100 rounded-lg text-sky-700">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Doctor Consultation Fee</span>
                          <span className="text-[10px] text-slate-500">Specialist / OPD Doctor charges</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ${patientActiveBill.consultationFee.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Laboratory & Diagnostics</span>
                          <span className="text-[10px] text-slate-500">Blood tests, ECG, Imaging charges</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ${patientActiveBill.laboratoryCharges.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Pharmacy Prescriptions</span>
                          <span className="text-[10px] text-slate-500">Prescribed medicines & consumables</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ${patientActiveBill.pharmacyCharges.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">Other Hospital Charges</span>
                          <span className="text-[10px] text-slate-500">Registration, nursing, facility charges</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        ${patientActiveBill.otherCharges.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Total Box */}
                  <div className="bg-sky-900 text-white p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-sky-200 font-bold block uppercase tracking-wider">
                        Total Amount Payable
                      </span>
                      <span className="text-[11px] text-sky-300">Includes all taxes and hospital fees</span>
                    </div>
                    <div className="text-3xl font-black text-white font-mono">
                      ${patientActiveBill.amount.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
              No active billing tokens found.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT SIMULATION DESK */}
      {activeTab === 'PAYMENT_SIM' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
              <CreditCard className="h-6 w-6 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Demo Hospital Payment Gateway
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate digital payments via UPI, Credit/Debit Card, or Counter Cash safely.
                </p>
              </div>
            </div>

            {/* Prototype Disclaimer Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start space-x-2.5 mb-6">
              <Info className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Student Prototype Notice:</strong> Payments are simulated safely for demonstration purposes without charging real payment credentials or money.
              </div>
            </div>

            {/* Step 1: Select Invoice */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Select Billing Invoice to Pay:
                </label>
                <select
                  value={paymentModalInvoice?.id || ''}
                  onChange={(e) => {
                    const found = invoices.find((i) => i.id === e.target.value);
                    if (found) {
                      setPaymentModalInvoice(found);
                      setCashTendered(found.amount);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Pending Invoice --</option>
                  {invoices
                    .filter((i) => i.status !== 'PAID')
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        Token #{inv.tokenNumber} - {inv.patientName} (${inv.amount.toFixed(2)}) &bull; {inv.invoiceNumber}
                      </option>
                    ))}
                </select>
              </div>

              {paymentModalInvoice ? (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  {/* Bill Overview Banner */}
                  <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-sky-900 block text-sm">
                        {paymentModalInvoice.patientName} ({paymentModalInvoice.mrn})
                      </span>
                      <span className="text-slate-600">
                        Invoice #{paymentModalInvoice.invoiceNumber} &bull; {paymentModalInvoice.serviceType}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount Due</span>
                      <span className="text-2xl font-black text-sky-900 font-mono">
                        ${paymentModalInvoice.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Select Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      2. Choose Payment Method:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('UPI')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'UPI'
                            ? 'border-2 border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Smartphone className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                        <span className="text-xs block">UPI / QR Scan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'CARD'
                            ? 'border-2 border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="h-5 w-5 mx-auto mb-1 text-sky-600" />
                        <span className="text-xs block">Credit / Debit Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'CASH'
                            ? 'border-2 border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Wallet className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                        <span className="text-xs block">Cash Counter</span>
                      </button>
                    </div>
                  </div>

                  {/* Method Content */}
                  {paymentMethod === 'UPI' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-2xs">
                        <QrCode className="h-32 w-32 text-slate-900 mx-auto" />
                      </div>
                      <p className="text-xs text-slate-600">
                        Scan QR code using GPay, PhonePe, Paytm, or BHIM app
                      </p>
                      <div className="max-w-xs mx-auto text-left text-xs space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Virtual Payment Address (VPA):
                        </label>
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CARD' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-slate-600 font-medium block mb-1">Card Number:</label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium block mb-1">Expiry Date:</label>
                          <input
                            type="text"
                            value="12 / 28"
                            readOnly
                            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium block mb-1">CVV:</label>
                          <input
                            type="password"
                            value="•••"
                            readOnly
                            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'CASH' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-600 font-medium block mb-1">Tendered Cash Amount ($):</label>
                          <input
                            type="number"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium block mb-1">Change to Return:</label>
                          <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg font-bold text-sm font-mono">
                            ${Math.max(0, cashTendered - paymentModalInvoice.amount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="teal"
                    className="w-full py-3 font-bold text-sm"
                    onClick={handleSimulatePayment}
                  >
                    Confirm & Complete Simulated Payment (${paymentModalInvoice.amount.toFixed(2)})
                  </Button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  Please choose an active unpaid billing invoice above to initiate payment simulation.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPLETED RECEIPTS HISTORY */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hospital Digital Billing Receipts & Transactions
              </h3>
              <p className="text-xs text-slate-500">
                Verified digital payment receipts with itemized charge history.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {invoices.filter((i) => i.status === 'PAID').length} Completed Receipts
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices
              .filter((i) => i.status === 'PAID')
              .map((inv) => (
                <Card key={inv.id} className="hover:border-emerald-300 transition-all shadow-xs">
                  <CardHeader className="p-4 pb-3 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                          Receipt #{inv.receiptNumber}
                        </span>
                        <CardTitle className="text-base text-slate-900 mt-1">
                          {inv.patientName}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 font-mono">
                          {inv.mrn} &bull; Inv #{inv.invoiceNumber}
                        </CardDescription>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-700 block font-mono">
                          ${inv.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">{inv.paidAt}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="text-xs space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-bold text-slate-800">{inv.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Reference ID:</span>
                        <span className="text-slate-700">{inv.paymentReference}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setReceiptModalInvoice(inv)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5 text-sky-600" />
                      View Full Digital Receipt
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* MODAL 1: GENERATE BILLING TOKEN FORM */}
      {createTokenOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-sky-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Generate New Billing Token
                </h3>
              </div>
              <button
                onClick={() => setCreateTokenOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={newTokenData.patientName}
                    onChange={(e) => setNewTokenData({ ...newTokenData, patientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Medical Record Number (MRN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="MRN-2026-9011"
                    value={newTokenData.mrn}
                    onChange={(e) => setNewTokenData({ ...newTokenData, mrn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Category Description</label>
                <input
                  type="text"
                  value={newTokenData.serviceType}
                  onChange={(e) => setNewTokenData({ ...newTokenData, serviceType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>

              {/* Charge Breakdown Fields */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-200 pb-1">
                  Itemized Charges Breakdown ($):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block">Consultation Fee</label>
                    <input
                      type="number"
                      value={newTokenData.consultationFee}
                      onChange={(e) => setNewTokenData({ ...newTokenData, consultationFee: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Lab Charges</label>
                    <input
                      type="number"
                      value={newTokenData.laboratoryCharges}
                      onChange={(e) => setNewTokenData({ ...newTokenData, laboratoryCharges: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Pharmacy Charges</label>
                    <input
                      type="number"
                      value={newTokenData.pharmacyCharges}
                      onChange={(e) => setNewTokenData({ ...newTokenData, pharmacyCharges: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Other Hospital Fees</label>
                    <input
                      type="number"
                      value={newTokenData.otherCharges}
                      onChange={(e) => setNewTokenData({ ...newTokenData, otherCharges: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-sky-900">
                  <span>Calculated Total Amount:</span>
                  <span className="text-sm font-extrabold">
                    $
                    {(
                      Number(newTokenData.consultationFee) +
                      Number(newTokenData.laboratoryCharges) +
                      Number(newTokenData.pharmacyCharges) +
                      Number(newTokenData.otherCharges)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Discharge Bill Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="dischargeCheck"
                  checked={newTokenData.isDischargeBill}
                  onChange={(e) => setNewTokenData({ ...newTokenData, isDischargeBill: e.target.checked })}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="dischargeCheck" className="text-slate-800 font-bold text-xs">
                  Mark as Inpatient Discharge Bill
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setCreateTokenOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Generate Token & Notify Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIGITAL RECEIPT VIEW / PRINT */}
      {receiptModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md font-mono">
                Official Digital Receipt
              </span>
              <button
                onClick={() => setReceiptModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Content */}
            <div className="my-4 p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  Smart Hospital Healthcare Center
                </h4>
                <p className="text-[11px] text-slate-500">
                  Hospital Road, Central Medical Zone &bull; GSTIN: 29AAAAA0000A1Z5
                </p>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                  Receipt No: {receiptModalInvoice.receiptNumber || 'REC-2026-PENDING'} &bull; Invoice: {receiptModalInvoice.invoiceNumber}
                </span>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient Name:</span>
                  <strong className="text-slate-900">{receiptModalInvoice.patientName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">MRN:</span>
                  <span className="font-mono text-slate-800">{receiptModalInvoice.mrn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Payment Method:</span>
                  <span className="font-bold text-emerald-700">{receiptModalInvoice.paymentMethod || 'Simulated Cash/UPI'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Date & Time:</span>
                  <span>{receiptModalInvoice.paidAt || receiptModalInvoice.issuedAt}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-500">
                    <th className="py-1">Service Particulars</th>
                    <th className="py-1 text-right">Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  <tr>
                    <td className="py-1.5">Doctor Consultation Charges</td>
                    <td className="py-1.5 text-right font-mono">${(receiptModalInvoice.consultationFee || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Laboratory & Diagnostic Tests</td>
                    <td className="py-1.5 text-right font-mono">${(receiptModalInvoice.laboratoryCharges || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Pharmacy Prescriptions & Supplies</td>
                    <td className="py-1.5 text-right font-mono">${(receiptModalInvoice.pharmacyCharges || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Other Hospital / Nursing Facilities</td>
                    <td className="py-1.5 text-right font-mono">${(receiptModalInvoice.otherCharges || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold text-slate-900">
                    <td className="py-2 text-sm">TOTAL AMOUNT PAID</td>
                    <td className="py-2 text-right text-base text-sky-800 font-mono font-extrabold">
                      ${receiptModalInvoice.amount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Digital Stamp & QR */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  <span className="text-[10px] text-slate-500">
                    Authorized Cashier Digital Seal &bull; Smart Hospital
                  </span>
                </div>
                <QrCode className="h-10 w-10 text-slate-800" />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setReceiptModalInvoice(null)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Official Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
