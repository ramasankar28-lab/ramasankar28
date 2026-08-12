import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PharmacyOrder, MedicineInventoryItem } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import {
  Pill,
  Clock,
  CheckCircle2,
  PackageCheck,
  Search,
  Building2,
  AlertCircle,
  QrCode,
  Zap,
  Plus,
  FileText,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Check,
  User,
  Stethoscope,
  MapPin,
  Eye,
  ShieldCheck,
  ArrowRight,
  Filter,
  Layers,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function PharmacyDashboard() {
  const { user } = useAuth();

  // State Management
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState({ totalMedicines: 0, lowStockCount: 0, outOfStockCount: 0 });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Active Tab: DISPENSING | PATIENT_VIEW | EXPRESS | INVENTORY | SIMULATE_DOCTOR
  const [activeTab, setActiveTab] = useState<'DISPENSING' | 'PATIENT_VIEW' | 'EXPRESS' | 'INVENTORY' | 'SIMULATE_DOCTOR'>('DISPENSING');

  // Selected Prescription View Modal
  const [viewingOrder, setViewingOrder] = useState<PharmacyOrder | null>(null);

  // Selected Order for Patient Live Track
  const [patientTrackOrder, setPatientTrackOrder] = useState<PharmacyOrder | null>(null);

  // Verification & Express Pickup Modal
  const [verifyModalOrder, setVerifyModalOrder] = useState<PharmacyOrder | null>(null);
  const [verifyInputCode, setVerifyInputCode] = useState('');

  // Inventory Restock / Edit Modal
  const [editingMedicine, setEditingMedicine] = useState<MedicineInventoryItem | null>(null);
  const [addMedicineModalOpen, setAddMedicineModalOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    name: '',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '500mg',
    stockQuantity: 100,
    minStockLevel: 25,
    expiryDate: '2028-06-30',
    pricePerUnit: 15.00,
    locationRack: 'Rack A-01'
  });

  // Doctor Prescription Simulation Form
  const [simPatientName, setSimPatientName] = useState('David Miller');
  const [simMrn, setSimMrn] = useState('MRN-2026-8812');
  const [simDoctorName, setSimDoctorName] = useState('Dr. Aris Vance, MD');
  const [simDiagnosis, setSimDiagnosis] = useState('Acute Bronchitis & High Fever');
  const [simMeds, setSimMeds] = useState('Amoxicillin 500mg (thrice daily for 7 days), Paracetamol 650mg (SOS for fever)');

  // Toast Banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadPharmacyData = async () => {
    try {
      const ordersData = await hospitalService.getPharmacyOrders();
      setOrders(ordersData);
      if (ordersData.length > 0 && !patientTrackOrder) {
        setPatientTrackOrder(ordersData[0]);
      }

      const invData = await hospitalService.getPharmacyInventory();
      setInventory(invData.inventory);
      setInventoryStats(invData.stats);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, []);

  // Pharmacist Actions
  const handleVerifyOrder = async (orderId: string) => {
    try {
      await hospitalService.verifyPharmacyOrder(orderId, user?.name || 'Chief Pharmacist Sanjeev', 'Dosage and contraindications verified');
      showToast('Prescription verified successfully');
      loadPharmacyData();
    } catch {
      showToast('Failed to verify prescription');
    }
  };

  const handleUpdateStatus = async (orderId: string, status: 'WAITING' | 'VERIFIED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPENSED', counter?: string) => {
    try {
      await hospitalService.updatePharmacyStatus(orderId, status, counter || 'Pharmacy Counter #2');
      if (status === 'READY_FOR_PICKUP') {
        showToast('Prescription marked READY! SMS/App update sent to patient');
      } else if (status === 'DISPENSED') {
        showToast('Prescription dispensed & completed');
      } else {
        showToast(`Order status updated to ${status}`);
      }
      loadPharmacyData();
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder(null);
      }
    } catch {
      showToast('Failed to update order status');
    }
  };

  const handleExpressPickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInputCode) return;
    try {
      const res = await hospitalService.processExpressPickup(verifyInputCode.trim());
      showToast(`Express Pickup verified! Token #${res.order?.tokenNumber || verifyInputCode} cleared.`);
      setVerifyInputCode('');
      setVerifyModalOrder(null);
      loadPharmacyData();
    } catch {
      showToast('Express pickup code invalid or not found');
    }
  };

  // Inventory Actions
  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;
    try {
      await hospitalService.updateInventoryItem(editingMedicine.id, {
        stockQuantity: Number(editingMedicine.stockQuantity),
        minStockLevel: Number(editingMedicine.minStockLevel),
        expiryDate: editingMedicine.expiryDate,
        locationRack: editingMedicine.locationRack
      });
      showToast(`Stock updated for ${editingMedicine.name}`);
      setEditingMedicine(null);
      loadPharmacyData();
    } catch {
      showToast('Failed to update stock');
    }
  };

  const handleAddMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await hospitalService.createInventoryItem(newMedData);
      showToast(`Added ${newMedData.name} to pharmacy inventory`);
      setAddMedicineModalOpen(false);
      setNewMedData({
        name: '',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '500mg',
        stockQuantity: 100,
        minStockLevel: 25,
        expiryDate: '2028-06-30',
        pricePerUnit: 15.00,
        locationRack: 'Rack A-01'
      });
      loadPharmacyData();
    } catch {
      showToast('Failed to add medicine');
    }
  };

  const handleSimulatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const medArray = simMeds.split(',').map(m => ({
        name: m.trim(),
        dosage: '1 tablet twice daily',
        duration: '5 days',
        instructions: 'Take after food with water'
      }));

      await hospitalService.createPrescription({
        mrn: simMrn,
        patientName: simPatientName,
        doctorName: simDoctorName,
        departmentName: 'General OPD',
        diagnosis: simDiagnosis,
        medicines: medArray
      });

      showToast(`e-Prescription automatically transmitted to Pharmacy queue!`);
      setActiveTab('DISPENSING');
      loadPharmacyData();
    } catch {
      showToast('Failed to simulate prescription creation');
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = selectedStatusFilter === 'ALL' || o.status === selectedStatusFilter || (selectedStatusFilter === 'EXPRESS' && o.isExpressPickup);
    const matchesSearch = o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter Inventory
  const filteredInventory = inventory.filter(m => {
    const matchesCategory = selectedCategoryFilter === 'ALL' || m.category === selectedCategoryFilter;
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.locationRack.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // KPI Calculations
  const waitingCount = orders.filter(o => o.status === 'WAITING' || o.status === 'VERIFIED').length;
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;
  const completedCount = orders.filter(o => o.status === 'DISPENSED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Pharmacy Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Pill className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Hospital Pharmacy & Token Dispensing Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {user?.name || 'Chief Pharmacist Sanjeev'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
            Station: <strong className="text-amber-300 font-bold">{user?.roomNumber || 'Counter #2'}</strong> | Block C OPD Dispensary Wing
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setActiveTab('EXPRESS')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md border-none"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Express Pickup Counter</span>
          </Button>

          <Button
            onClick={() => setActiveTab('SIMULATE_DOCTOR')}
            variant="outline"
            className="border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/50 text-xs font-bold flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>+ Simulate e-Prescription</span>
          </Button>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Waiting */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Waiting</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{waitingCount}</div>
          <p className="text-[10px] text-slate-400 font-medium">Pending verification</p>
        </div>

        {/* Metric 2: Preparing */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Preparing</span>
            <Pill className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 font-mono">{preparingCount}</div>
          <p className="text-[10px] text-slate-400 font-medium">Pharmacist bench</p>
        </div>

        {/* Metric 3: Ready */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready</span>
            <PackageCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{readyCount}</div>
          <p className="text-[10px] text-emerald-600 font-semibold">Ready at counter</p>
        </div>

        {/* Metric 4: Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">{completedCount}</div>
          <p className="text-[10px] text-slate-400 font-medium">Dispensed today</p>
        </div>

        {/* Metric 5: Avg Wait Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Wait Time</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 font-mono">~5m</div>
          <p className="text-[10px] text-emerald-600 font-semibold">-35% vs conventional</p>
        </div>

        {/* Metric 6: Out of Stock Warning */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">{inventoryStats.outOfStockCount}</div>
          <p className="text-[10px] text-rose-500 font-bold">{inventoryStats.lowStockCount} low stock alerts</p>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('DISPENSING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DISPENSING' ? 'bg-teal-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Prescription Queue & Workflow</span>
        </button>

        <button
          onClick={() => setActiveTab('PATIENT_VIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'PATIENT_VIEW' ? 'bg-teal-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Patient Live Track & Token</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPRESS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'EXPRESS' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Express Fast-Track Counter</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'INVENTORY' ? 'bg-teal-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Inventory & Low-Stock ({inventoryStats.lowStockCount + inventoryStats.outOfStockCount})</span>
          {(inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('SIMULATE_DOCTOR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'SIMULATE_DOCTOR' ? 'bg-teal-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Simulate e-Prescription</span>
        </button>
      </div>

      {/* TAB 1: PRESCRIPTION QUEUE & WORKFLOW */}
      {activeTab === 'DISPENSING' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">E-Prescription & Medicine Queue</h2>
              <p className="text-xs text-slate-500">Pharmacist verification, medicine bench preparation, and dispensing workflow</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, token, order..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <Button variant="outline" size="sm" onClick={loadPharmacyData} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-bold px-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status Filter:
            </span>
            {['ALL', 'WAITING', 'VERIFIED', 'PREPARING', 'READY_FOR_PICKUP', 'DISPENSED', 'EXPRESS'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedStatusFilter === st
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'READY_FOR_PICKUP' ? 'READY' : st}
              </button>
            ))}
          </div>

          {/* Orders Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Token & Order #</th>
                  <th className="px-4 py-3">Patient & MRN</th>
                  <th className="px-4 py-3">Prescribed Doctor</th>
                  <th className="px-4 py-3">Prescription Items</th>
                  <th className="px-4 py-3">Pickup Counter</th>
                  <th className="px-4 py-3">Workflow Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No prescription orders found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Token & Order # */}
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            #{o.tokenNumber}
                          </span>
                          {o.isExpressPickup && (
                            <Badge variant="warning" className="text-[10px] py-0">
                              <Zap className="w-3 h-3 fill-current inline mr-0.5" /> Express
                            </Badge>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{o.orderNumber} &bull; {o.issuedAt}</div>
                      </td>

                      {/* Patient & MRN */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{o.patientName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{o.mrn}</div>
                      </td>

                      {/* Doctor */}
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {o.prescribedBy}
                      </td>

                      {/* Medicines Summary */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{o.itemsCount} Items Prescribed</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {o.medicines.join(', ')}
                        </div>
                      </td>

                      {/* Pickup Counter */}
                      <td className="px-4 py-3 font-bold text-teal-700 font-mono">
                        {o.pickupCounter}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            o.status === 'WAITING'
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : o.status === 'VERIFIED'
                              ? 'bg-blue-100 text-blue-800'
                              : o.status === 'PREPARING'
                              ? 'bg-amber-100 text-amber-800'
                              : o.status === 'READY_FOR_PICKUP'
                              ? 'bg-teal-100 text-teal-800 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {o.status === 'WAITING' && <Clock className="w-3 h-3" />}
                          {o.status === 'VERIFIED' && <ShieldCheck className="w-3 h-3" />}
                          {o.status === 'PREPARING' && <Pill className="w-3 h-3" />}
                          {o.status === 'READY_FOR_PICKUP' && <PackageCheck className="w-3 h-3" />}
                          {o.status === 'DISPENSED' && <CheckCircle2 className="w-3 h-3" />}
                          <span>{o.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingOrder(o)}
                          className="text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600 mr-1" /> View
                        </Button>

                        {o.status === 'WAITING' && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleVerifyOrder(o.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                          >
                            Verify
                          </Button>
                        )}

                        {(o.status === 'WAITING' || o.status === 'VERIFIED') && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleUpdateStatus(o.id, 'PREPARING')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                          >
                            Prepare
                          </Button>
                        )}

                        {o.status === 'PREPARING' && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleUpdateStatus(o.id, 'READY_FOR_PICKUP')}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                          >
                            Mark Ready
                          </Button>
                        )}

                        {o.status === 'READY_FOR_PICKUP' && (
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleUpdateStatus(o.id, 'DISPENSED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Dispense
                          </Button>
                        )}

                        {o.status === 'DISPENSED' && (
                          <span className="text-[11px] text-slate-400 font-semibold italic px-2">Dispensed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT LIVE TRACK & TOKEN QUEUE VIEW */}
      {activeTab === 'PATIENT_VIEW' && patientTrackOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Track Display */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-700" /> Patient Live Prescription Progress
                </h2>
                <p className="text-xs text-slate-500">Real-time status view as rendered on the patient mobile app & lounge display</p>
              </div>

              <Badge variant="teal" className="text-xs font-mono font-bold">
                Token #{patientTrackOrder.tokenNumber}
              </Badge>
            </div>

            {/* Step-by-Step Progress Bar */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>PATIENT: <strong className="text-white">{patientTrackOrder.patientName}</strong></span>
                <span>MRN: <strong className="text-teal-300">{patientTrackOrder.mrn}</strong></span>
              </div>

              {/* 4-Stage Progress Line */}
              <div className="grid grid-cols-4 gap-2 text-center relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-8 right-8 h-1 bg-slate-800 -z-0" />

                {[
                  { key: 'WAITING', label: 'Prescription Received', icon: FileText },
                  { key: 'PREPARING', label: 'Preparing Medicine', icon: Pill },
                  { key: 'READY_FOR_PICKUP', label: 'Ready at Counter', icon: PackageCheck },
                  { key: 'DISPENSED', label: 'Pickup Completed', icon: CheckCircle2 }
                ].map((step, idx) => {
                  const statusOrder = ['WAITING', 'VERIFIED', 'PREPARING', 'READY_FOR_PICKUP', 'DISPENSED'];
                  const currIdx = statusOrder.indexOf(patientTrackOrder.status);
                  const stepIdx = statusOrder.indexOf(step.key);
                  const isDone = currIdx >= stepIdx;
                  const isActive = patientTrackOrder.status === step.key || (patientTrackOrder.status === 'VERIFIED' && step.key === 'WAITING');
                  const IconComp = step.icon;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isDone
                            ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/30'
                            : isActive
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className={`text-[11px] font-bold mt-2 block ${isDone ? 'text-teal-300' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Patient Token Spotlight Banner */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Patients Ahead</span>
                  <span className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                    {patientTrackOrder.patientsAhead}
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Est. Waiting Time</span>
                  <span className="text-2xl font-black text-teal-400 font-mono mt-0.5">
                    {patientTrackOrder.estimatedTimeMins} mins
                  </span>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">Pickup Counter</span>
                  <span className="text-lg font-bold text-white font-mono mt-1 block truncate">
                    {patientTrackOrder.pickupCounter}
                  </span>
                </div>
              </div>
            </div>

            {/* Prescribed Medicines Checklist for Patient */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescription Package Content ({patientTrackOrder.medicines.length} Items)
              </h3>

              <div className="space-y-2">
                {patientTrackOrder.medicines.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>{m}</span>
                    </div>
                    <Badge variant="teal">Verified Item</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Switch Patient & QR Token Card */}
          <div className="lg:col-span-4 space-y-6">
            {/* Verification QR Code Token Box */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 text-center">
              <QrCode className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-300 block">Token Verification QR</span>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  #{patientTrackOrder.tokenNumber}
                </div>
              </div>

              {/* QR Code Graphic Mock */}
              <div className="bg-white p-4 rounded-xl max-w-[160px] mx-auto border-2 border-amber-400 shadow-md">
                <div className="grid grid-cols-5 gap-1.5 opacity-90">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 rounded-sm ${
                        i % 2 === 0 || i % 5 === 0 ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-teal-100/80">
                Present this QR code or Token #{patientTrackOrder.tokenNumber} at <strong>{patientTrackOrder.pickupCounter}</strong> for instant pickup verification.
              </p>
            </div>

            {/* Select Patient to Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Patient Preview
              </h3>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {orders.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setPatientTrackOrder(o)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                      patientTrackOrder.id === o.id
                        ? 'bg-teal-50 border-teal-400 font-bold text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs">{o.patientName}</div>
                      <div className="text-[10px] text-slate-400">Token #{o.tokenNumber}</div>
                    </div>
                    <Badge variant={o.status === 'READY_FOR_PICKUP' ? 'success' : 'teal'}>
                      {o.status}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPRESS PICKUP FAST-TRACK */}
      {activeTab === 'EXPRESS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Express Pickup Fast-Track Counter
              </h2>
              <p className="text-xs text-slate-500">Dedicated express workflow for pre-prepared, single-item, or repeat prescriptions.</p>
            </div>

            <Badge variant="warning" className="text-xs font-mono font-bold">
              Express Counter #3 Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Express Scanner Form */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <QrCode className="w-5 h-5" />
                <span>Express QR & Token Scanner</span>
              </div>

              <p className="text-xs text-amber-100/80">
                Scan the patient's token QR code or enter token number (e.g. <strong>P-101</strong> or <strong>RX-8821</strong>) for instant express dispensing.
              </p>

              <form onSubmit={handleExpressPickupSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
                    Token # / RX Number / QR Code
                  </label>
                  <input
                    type="text"
                    value={verifyInputCode}
                    onChange={(e) => setVerifyInputCode(e.target.value)}
                    placeholder="e.g. P-101 or RX-8821"
                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-amber-500/50 text-amber-200 font-mono font-bold rounded-xl focus:outline-none focus:border-amber-400 uppercase"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2.5 shadow-lg border-none"
                >
                  Verify & Dispense Express Order
                </Button>
              </form>
            </div>

            {/* Ready Express Prescriptions List */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pre-prepared Express Orders Waiting at Counter #3
              </h3>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {orders.filter(o => o.isExpressPickup || o.status === 'READY_FOR_PICKUP').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No express prescriptions currently queued.</p>
                ) : (
                  orders
                    .filter(o => o.isExpressPickup || o.status === 'READY_FOR_PICKUP')
                    .map(o => (
                      <div
                        key={o.id}
                        className="p-4 rounded-xl border border-slate-200 bg-amber-50/50 hover:bg-amber-50 transition-all flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                            <span>#{o.tokenNumber}</span>
                            <span className="text-slate-600 font-sans">{o.patientName}</span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{o.medicines.join(', ')}</p>
                        </div>

                        <Button
                          variant="teal"
                          size="sm"
                          onClick={() => {
                            setVerifyInputCode(o.tokenNumber);
                            handleUpdateStatus(o.id, 'DISPENSED', 'Express Counter #3');
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0"
                        >
                          Express Clear
                        </Button>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEDICINE INVENTORY & LOW STOCK ALERTS */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-6">
          {/* Inventory Controls & Add Button */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-teal-700" /> Pharmacy Medicine Inventory
                </h2>
                <p className="text-xs text-slate-500">Real-time stock tracking, minimum thresholds, shelf rack locations, and expiry dates.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search medicine, category, rack..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                  />
                </div>

                <Button
                  onClick={() => setAddMedicineModalOpen(true)}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Medicine
                </Button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              {['ALL', 'Antibiotics', 'Analgesic & Fever', 'Cardiovascular', 'Antidiabetic', 'Respiratory', 'GI & Antacid'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Low Stock Alert Banner if any */}
          {(inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">Inventory Replenishment Alert</span>
                  <span className="text-amber-800">
                    {inventoryStats.outOfStockCount} items OUT OF STOCK and {inventoryStats.lowStockCount} items below minimum threshold.
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className="text-xs border-amber-400 text-amber-900 font-bold shrink-0"
              >
                View Stock Alerts
              </Button>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Medicine & Strength</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Rack Location</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-slate-400 text-[11px] font-mono">{m.dosageForm} &bull; {m.strength}</div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 font-semibold text-slate-700">{m.category}</td>

                      {/* Rack */}
                      <td className="px-4 py-3 font-mono font-bold text-teal-800">{m.locationRack}</td>

                      {/* Expiry */}
                      <td className="px-4 py-3 font-mono text-slate-700">{m.expiryDate}</td>

                      {/* Stock Level */}
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900">{m.stockQuantity}</span>
                        <span className="text-slate-400 text-[10px]"> / Min {m.minStockLevel}</span>
                      </td>

                      {/* Availability Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            m.availability === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.availability === 'LOW_STOCK'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {m.availability.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMedicine(m)}
                          className="text-xs"
                        >
                          Restock / Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SIMULATE DOCTOR E-PRESCRIPTION */}
      {activeTab === 'SIMULATE_DOCTOR' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Simulate Incoming e-Prescription</h2>
              <p className="text-xs text-slate-500">Test the automatic doctor consultation to pharmacy queue transmission.</p>
            </div>
          </div>

          <form onSubmit={handleSimulatePrescription} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={simPatientName}
                  onChange={(e) => setSimPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient MRN</label>
                <input
                  type="text"
                  value={simMrn}
                  onChange={(e) => setSimMrn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prescribing Doctor</label>
                <input
                  type="text"
                  value={simDoctorName}
                  onChange={(e) => setSimDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Diagnosis & Clinical Notes</label>
                <input
                  type="text"
                  value={simDiagnosis}
                  onChange={(e) => setSimDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Prescribed Medicines (Comma Separated)</label>
              <textarea
                rows={3}
                value={simMeds}
                onChange={(e) => setSimMeds(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="e.g. Amoxicillin 500mg, Paracetamol 650mg"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 text-xs">
              Transmit e-Prescription to Pharmacy
            </Button>
          </form>
        </div>
      )}

      {/* VIEW PRESCRIPTION DETAILS MODAL */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-4">
            <div className="p-5 bg-teal-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-teal-300 font-mono uppercase tracking-widest block">Prescription Details</span>
                <h3 className="text-lg font-bold">Order #{viewingOrder.orderNumber} (Token #{viewingOrder.tokenNumber})</h3>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Patient Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingOrder.patientName}</span>
                  <span className="text-slate-500 font-mono block text-[10px]">{viewingOrder.mrn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Prescribing Doctor:</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingOrder.prescribedBy}</span>
                  <span className="text-slate-500 block text-[10px]">{viewingOrder.issuedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Prescribed Medicines List:</span>
                {viewingOrder.medicines.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      <span>{m}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">In Stock</span>
                  </div>
                ))}
              </div>

              {viewingOrder.notes && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-0.5">Pharmacist Notes:</span>
                  <span>{viewingOrder.notes}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingOrder(null)}>
                  Close
                </Button>
                {viewingOrder.status === 'WAITING' && (
                  <Button size="sm" onClick={() => handleVerifyOrder(viewingOrder.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Verify Prescription
                  </Button>
                )}
                {viewingOrder.status === 'PREPARING' && (
                  <Button size="sm" onClick={() => handleUpdateStatus(viewingOrder.id, 'READY_FOR_PICKUP')} className="bg-teal-600 hover:bg-teal-700 text-white">
                    Mark Ready for Pickup
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/RESTOCK MEDICINE MODAL */}
      {editingMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Restock / Edit {editingMedicine.name}</h3>
              <button onClick={() => setEditingMedicine(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Stock Quantity</label>
                <input
                  type="number"
                  value={editingMedicine.stockQuantity}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, stockQuantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Stock Threshold</label>
                <input
                  type="number"
                  value={editingMedicine.minStockLevel}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, minStockLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shelf Rack Location</label>
                <input
                  type="text"
                  value={editingMedicine.locationRack}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, locationRack: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingMedicine(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-800 text-white font-bold">
                  Save Stock Updates
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW MEDICINE MODAL */}
      {addMedicineModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Medicine to Inventory</h3>
              <button onClick={() => setAddMedicineModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={newMedData.name}
                  onChange={(e) => setNewMedData({ ...newMedData, name: e.target.value })}
                  placeholder="e.g. Ciprofloxacin 500mg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newMedData.category}
                    onChange={(e) => setNewMedData({ ...newMedData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesic & Fever">Analgesic & Fever</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="GI & Antacid">GI & Antacid</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={newMedData.stockQuantity}
                    onChange={(e) => setNewMedData({ ...newMedData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rack Location</label>
                  <input
                    type="text"
                    value={newMedData.locationRack}
                    onChange={(e) => setNewMedData({ ...newMedData, locationRack: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newMedData.expiryDate}
                    onChange={(e) => setNewMedData({ ...newMedData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddMedicineModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-teal-700 hover:bg-teal-800 text-white font-bold">
                  Add to Inventory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
