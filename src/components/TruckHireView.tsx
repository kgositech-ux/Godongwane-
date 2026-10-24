import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Gauge,
  Fuel,
  Wrench,
  Navigation,
} from 'lucide-react';
import { TruckVehicle, TruckHireBooking, Client, Project, TruckCategory, TruckStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logActivity } from '../utils/activityLogger';

interface TruckHireViewProps {
  vehicles: TruckVehicle[];
  bookings: TruckHireBooking[];
  clients: Client[];
  projects: Project[];
}

export const TruckHireView: React.FC<TruckHireViewProps> = ({
  vehicles,
  bookings,
  clients,
  projects,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'fleet' | 'bookings'>('fleet');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TruckVehicle | null>(null);

  // New Booking State
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [clientId, setClientId] = useState(clients.length > 0 ? clients[0].id : '');
  const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10));
  const [rateType, setRateType] = useState<'daily' | 'hourly' | 'monthly' | 'tonnage'>('daily');
  const [agreedRate, setAgreedRate] = useState(6500);
  const [driverAssigned, setDriverAssigned] = useState('Jabu Mokoena (Code 14 PrDP)');
  const [pickupLocation, setPickupLocation] = useState('Godongwane Depot, Wadeville');
  const [destination, setDestination] = useState('Mining Site / Processing Plant');
  const [material, setMaterial] = useState('Heavy Steel Fabrications / Bulk Aggregate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New / Edit Vehicle State
  const [vName, setVName] = useState('');
  const [vModel, setVModel] = useState('');
  const [vRegistration, setVRegistration] = useState('');
  const [vCategory, setVCategory] = useState<TruckCategory>('tipper');
  const [vCapacity, setVCapacity] = useState('34-Ton / 24 m³');
  const [vDailyRate, setVDailyRate] = useState(6500);
  const [vHourlyRate, setVHourlyRate] = useState(850);
  const [vStatus, setVStatus] = useState<TruckStatus>('available');
  const [vLocation, setVLocation] = useState('Wadeville Depot, Germiston');
  const [vDescription, setVDescription] = useState('');

  const openAddVehicleModal = () => {
    setEditingVehicle(null);
    setVName('');
    setVModel('');
    setVRegistration('');
    setVCategory('tipper');
    setVCapacity('34-Ton Side Tipper');
    setVDailyRate(6500);
    setVHourlyRate(850);
    setVStatus('available');
    setVLocation('Wadeville Depot, Germiston');
    setVDescription('');
    setIsVehicleModalOpen(true);
  };

  const openEditVehicleModal = (v: TruckVehicle) => {
    setEditingVehicle(v);
    setVName(v.name);
    setVModel(v.model);
    setVRegistration(v.registration);
    setVCategory(v.category);
    setVCapacity(v.capacity);
    setVDailyRate(v.dailyRate);
    setVHourlyRate(v.hourlyRate);
    setVStatus(v.status);
    setVLocation(v.location);
    setVDescription(v.description || '');
    setIsVehicleModalOpen(true);
  };

  const openNewBookingModal = (truck?: TruckVehicle) => {
    if (truck) {
      setSelectedTruckId(truck.id);
      setAgreedRate(truck.dailyRate);
    } else if (vehicles.length > 0) {
      setSelectedTruckId(vehicles[0].id);
      setAgreedRate(vehicles[0].dailyRate);
    }
    setIsBookingModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vRegistration.trim()) return;
    setSubmitting(true);

    try {
      if (editingVehicle) {
        await updateDoc(doc(db, 'truck_vehicles', editingVehicle.id), {
          name: vName.trim(),
          model: vModel.trim(),
          registration: vRegistration.trim(),
          category: vCategory,
          capacity: vCapacity.trim(),
          dailyRate: Number(vDailyRate),
          hourlyRate: Number(vHourlyRate),
          status: vStatus,
          location: vLocation.trim(),
          description: vDescription.trim(),
        });
      } else {
        const newV: Omit<TruckVehicle, 'id'> = {
          name: vName.trim(),
          model: vModel.trim(),
          registration: vRegistration.trim(),
          category: vCategory,
          capacity: vCapacity.trim(),
          dailyRate: Number(vDailyRate),
          hourlyRate: Number(vHourlyRate),
          status: vStatus,
          location: vLocation.trim(),
          description: vDescription.trim(),
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'truck_vehicles'), newV);
      }
      setIsVehicleModalOpen(false);
    } catch (err) {
      handleFirestoreError(
        err,
        editingVehicle ? OperationType.UPDATE : OperationType.CREATE,
        editingVehicle ? `truck_vehicles/${editingVehicle.id}` : 'truck_vehicles'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckId) return;
    setSubmitting(true);

    try {
      const selectedTruck = vehicles.find((v) => v.id === selectedTruckId);
      const selectedClient = clients.find((c) => c.id === clientId);
      const selectedProject = projects.find((p) => p.id === projectId);

      const days = Math.max(
        1,
        Math.round(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const estimatedTotal = days * Number(agreedRate);

      const bookingData: Omit<TruckHireBooking, 'id'> = {
        truckId: selectedTruckId,
        truckName: selectedTruck ? selectedTruck.name : 'Heavy Truck',
        clientId: clientId || 'client-default',
        clientName: selectedClient ? selectedClient.name : 'Godongwane Progressive Projects',
        projectId: projectId || undefined,
        projectName: selectedProject ? selectedProject.name : undefined,
        startDate,
        endDate,
        rateType,
        agreedRate: Number(agreedRate),
        totalEstimatedCost: estimatedTotal,
        status: 'active',
        driverAssigned: driverAssigned.trim() || undefined,
        pickupLocation: pickupLocation.trim(),
        destination: destination.trim(),
        material: material.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'truck_hire_bookings'), bookingData);

      // Update truck status to on_hire
      await updateDoc(doc(db, 'truck_vehicles', selectedTruckId), {
        status: 'on_hire',
        currentProject: selectedProject ? selectedProject.name : 'Active Hire Contract',
        driverAssigned: driverAssigned.trim() || undefined,
      });

      logActivity({
        type: 'truck_hire',
        action: 'dispatched',
        title: `Truck Hire: ${selectedTruck?.name}`,
        description: `Dispatched ${selectedTruck?.name} for ${selectedClient?.name || 'Client'} to ${destination}.`,
        userName: currentUser?.displayName || 'Admin',
        userEmail: currentUser?.email || 'mthethwapraisegodcebolenkosi@gmail.com',
      });

      setIsBookingModalOpen(false);
      setActiveTab('bookings');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'truck_hire_bookings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVehicleStatus = async (vehicleId: string, status: TruckStatus) => {
    try {
      await updateDoc(doc(db, 'truck_vehicles', vehicleId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `truck_vehicles/${vehicleId}`);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Delete this truck from fleet records?')) return;
    try {
      await deleteDoc(doc(db, 'truck_vehicles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `truck_vehicles/${id}`);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.capacity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || v.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const availableCount = vehicles.filter((v) => v.status === 'available').length;
  const onHireCount = vehicles.filter((v) => v.status === 'on_hire').length;
  const dispatchedCount = vehicles.filter((v) => v.status === 'dispatched').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-amber-500" />
              <span>Truck Hire & Logistics Services</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              Official Service
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
            Heavy plant mobilization, 34-ton side tippers, flatbed transport, and crane trucks for mining & industrial contracts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openNewBookingModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>+ Book Truck Hire</span>
          </button>

          {isAdmin && (
            <button
              onClick={openAddVehicleModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Fleet Truck</span>
            </button>
          )}
        </div>
      </div>

      {/* Services Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-blue-950/40 border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              Godongwane Heavy Transport & Plant Hire Capabilities
            </h3>
          </div>
          <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 max-w-3xl leading-relaxed">
            We provide full turnkey transport solutions across South Africa and SADC. Specialized in <strong>34-Ton Side Tippers</strong> for mining ore haulage, <strong>45-Ton Lowbeds</strong> for excavator and structural plant delivery, and <strong>25-Ton Crane Trucks</strong> with certified rigging crews.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-100 p-3 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 shrink-0 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fleet Status</div>
            <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
              {availableCount} Available / {vehicles.length} Total
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Hires</div>
            <div className="font-mono font-bold text-amber-400 text-sm mt-0.5">
              {onHireCount + dispatchedCount} Dispatched
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: Fleet vs Active Hires */}
      <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'fleet'
                ? 'border-b-2 border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Heavy Truck Fleet ({vehicles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'border-b-2 border-amber-500 text-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Active Hire Contracts & Trips ({bookings.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Rates in ZAR (excl. VAT) • Monitored 24/7 with GPS Fleet Tracking
        </div>
      </div>

      {/* TAB 1: FLEET SHOWCASE */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search fleet, registration, payload..."
                className="w-full bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="tipper">Side Tippers (34-Ton)</option>
                <option value="lowbed">Lowbeds (45-Ton)</option>
                <option value="flatbed">Flatbeds (14m Deck)</option>
                <option value="crane_truck">Crane Trucks (25-Ton Boom)</option>
                <option value="rigid_truck">Rigid Tippers</option>
                <option value="water_tanker">Water Tankers</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available for Hire</option>
                <option value="on_hire">On Active Hire</option>
                <option value="dispatched">Dispatched</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((truck) => {
              const isAvailable = truck.status === 'available';
              const isOnHire = truck.status === 'on_hire';
              const isDispatched = truck.status === 'dispatched';

              return (
                <div
                  key={truck.id}
                  className="p-5 rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isAvailable
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isOnHire
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : isDispatched
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {truck.status.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditVehicleModal(truck)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit vehicle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteVehicle(truck.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-white dark:text-white light:text-slate-900">
                        {truck.name}
                      </h3>
                      <div className="text-xs font-mono text-amber-400 mt-0.5 font-bold">
                        REG: {truck.registration} • {truck.capacity}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {truck.model}
                      </div>
                    </div>

                    {truck.description && (
                      <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                        {truck.description}
                      </p>
                    )}

                    <div className="p-2.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300 dark:text-slate-300 light:text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" />
                          <span>Location:</span>
                        </span>
                        <span className="font-medium truncate max-w-[160px]">{truck.location}</span>
                      </div>

                      {truck.driverAssigned && (
                        <div className="flex items-center justify-between text-slate-300 dark:text-slate-300 light:text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Operator:</span>
                          </span>
                          <span className="font-medium truncate max-w-[160px]">{truck.driverAssigned}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hire Pricing & Booking CTA */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Daily Hire Rate</div>
                      <div className="font-mono font-bold text-sm text-white dark:text-white light:text-slate-900">
                        R {truck.dailyRate.toLocaleString('en-ZA')}
                        <span className="text-[10px] text-slate-400 font-normal"> / day</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openNewBookingModal(truck)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span>Book Hire</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE HIRE CONTRACTS & TRIPS */}
      {activeTab === 'bookings' && (
        <div className="rounded-2xl bg-[#111927] dark:bg-[#111927] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="p-3.5">Contract / Truck</th>
                  <th className="p-3.5">Client & Project</th>
                  <th className="p-3.5">Hire Dates</th>
                  <th className="p-3.5">Pickup & Route</th>
                  <th className="p-3.5">Assigned Operator</th>
                  <th className="p-3.5">Rate & Value</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 dark:hover:bg-slate-900/40 light:hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-white dark:text-white light:text-slate-900">
                        {b.truckName}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        {b.material || 'Heavy Logistics'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-200 dark:text-slate-200 light:text-slate-800">
                        {b.clientName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {b.projectName || 'General Logistics Hire'}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700">
                      <div>{b.startDate}</div>
                      <div className="text-slate-400 text-[10px]">to {b.endDate}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                      <div className="truncate max-w-xs font-medium">To: {b.destination}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">From: {b.pickupLocation}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 dark:text-slate-300 light:text-slate-700">
                      {b.driverAssigned || 'TBD'}
                    </td>
                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-white dark:text-white light:text-slate-900">
                        R {b.totalEstimatedCost.toLocaleString('en-ZA')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        R {b.agreedRate.toLocaleString('en-ZA')} / {b.rateType}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          b.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : b.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Book Truck Hire */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] dark:bg-[#111827] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-base">
                  Book Truck Hire & Haulage Trip
                </h3>
                <p className="text-xs text-slate-400">
                  Godongwane Progressive Projects Fleet Logistics Dispatch
                </p>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Truck / Trailer *</label>
                <select
                  required
                  value={selectedTruckId}
                  onChange={(e) => {
                    setSelectedTruckId(e.target.value);
                    const t = vehicles.find((v) => v.id === e.target.value);
                    if (t) setAgreedRate(t.dailyRate);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.capacity}) — R {v.dailyRate}/day ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Project Assignment</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">General Standalone Hire</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hire Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hire End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Daily Agreed Rate (ZAR) *</label>
                  <input
                    type="number"
                    required
                    value={agreedRate}
                    onChange={(e) => setAgreedRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Assigned Code 14 Driver</label>
                  <input
                    type="text"
                    value={driverAssigned}
                    onChange={(e) => setDriverAssigned(e.target.value)}
                    placeholder="e.g. Jabu Mokoena"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Destination Address / Mine</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Cargo / Material Description</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. 34-Ton Chrome Ore / Structural Steel Trusses"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Dispatching...' : 'Confirm Hire & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Truck Vehicle */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111827] dark:bg-[#111827] light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 text-base">
                {editingVehicle ? 'Edit Fleet Truck' : 'Register New Heavy Truck'}
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Truck Model Name *</label>
                <input
                  type="text"
                  required
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. Mercedes-Benz Actros 3344 Side Tipper"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Registration Plate *</label>
                  <input
                    type="text"
                    required
                    value={vRegistration}
                    onChange={(e) => setVRegistration(e.target.value)}
                    placeholder="e.g. GP 841-902"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="tipper">Side Tipper (34-Ton)</option>
                    <option value="lowbed">Lowbed Plant Transporter</option>
                    <option value="flatbed">Flatbed (14m Deck)</option>
                    <option value="crane_truck">Crane Truck (Mobile Rigging)</option>
                    <option value="rigid_truck">Rigid Rock Tipper</option>
                    <option value="water_tanker">Dust Suppression Tanker</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Payload Capacity</label>
                  <input
                    type="text"
                    value={vCapacity}
                    onChange={(e) => setVCapacity(e.target.value)}
                    placeholder="e.g. 34-Ton / 24 m³"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Base Daily Rate (ZAR)</label>
                  <input
                    type="number"
                    value={vDailyRate}
                    onChange={(e) => setVDailyRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Operational Status</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="available">Available for Hire</option>
                    <option value="on_hire">On Active Hire</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Base Depot Location</label>
                  <input
                    type="text"
                    value={vLocation}
                    onChange={(e) => setVLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Specifications & Features</label>
                <textarea
                  rows={2}
                  value={vDescription}
                  onChange={(e) => setVDescription(e.target.value)}
                  placeholder="Mechanical features, hydraulics, bin material, brake specs..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
