'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { Truck, Package, Search, RefreshCw, CheckCircle2, AlertCircle, MapPin, Printer, FileText, ChevronRight, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface AdminShipment {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  userId?: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    title: string;
    sku: string;
    quantity: number;
    topLevelCategory: string;
  }>;
}

interface Stats {
  total: number;
  inTransitCount: number;
  deliveredCount: number;
  pendingDispatchCount: number;
}

export default function AdminShippingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, inTransitCount: 0, deliveredCount: 0, pendingDispatchCount: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Modal State
  const [editingShipment, setEditingShipment] = useState<AdminShipment | null>(null);
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusInput, setStatusInput] = useState('SHIPPED');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadAdminShipments();
  }, [activeStatus, selectedCarrier]);

  async function loadAdminShipments() {
    setLoading(true);
    try {
      let url = `/admin/shipping?page=1&limit=50`;
      if (activeStatus !== 'ALL') url += `&status=${activeStatus}`;
      if (selectedCarrier !== 'ALL') url += `&carrier=${encodeURIComponent(selectedCarrier)}`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

      const data = await api.get<{ success: boolean; shipments: AdminShipment[]; stats: Stats }>(url);
      if (data.success) {
        setShipments(data.shipments);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin shipments:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEditModal = (shipment: AdminShipment) => {
    setEditingShipment(shipment);
    setCarrierInput(shipment.shippingCarrier || 'FastVelix Express Logistics');
    setTrackingInput(shipment.trackingNumber || `AWB-FV-${Math.floor(100000 + Math.random() * 900000)}`);
    setStatusInput(shipment.status);
  };

  const handleUpdateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShipment) return;
    setIsUpdating(true);

    try {
      const res = await api.put<{ success: boolean; order: any }>(`/admin/shipping/${editingShipment._id}`, {
        shippingCarrier: carrierInput,
        trackingNumber: trackingInput,
        status: statusInput,
      });

      if (res.success) {
        setEditingShipment(null);
        loadAdminShipments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update admin shipping.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAdminShipments();
  };

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
          <Link href="/admin" className="hover:text-dark">Admin Dashboard</Link>
          <ChevronRight size={12} />
          <span className="text-dark">Global Logistics & Shipping</span>
        </div>

        {/* Title & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-neutral-200 gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark uppercase tracking-tight flex items-center gap-2">
              <Truck size={24} className="text-brand" /> Admin Logistics & Shipping Control
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Master control panel for cross-seller order shipments, AWB tracking, carrier management, and shipping labels.
            </p>
          </div>

          <button
            onClick={loadAdminShipments}
            className="flex items-center gap-2 px-4 py-2 bg-dark hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          >
            <RefreshCw size={14} /> Refresh Logistics Data
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 p-4 shadow-sm-custom">
            <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">Total Orders</span>
            <p className="text-2xl font-black text-dark mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-4 shadow-sm-custom border-l-4 border-l-amber-500">
            <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">Pending Dispatch</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingDispatchCount}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-4 shadow-sm-custom border-l-4 border-l-blue-500">
            <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">In Transit</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.inTransitCount}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-4 shadow-sm-custom border-l-4 border-l-green-500">
            <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">Delivered Total</span>
            <p className="text-2xl font-black text-brand mt-1">{stats.deliveredCount}</p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white border border-neutral-200 p-4 shadow-sm-custom mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto flex-grow max-w-md">
            <div className="relative flex-grow">
              <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search AWB, Order #, Customer, City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-dark"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-dark text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-1 text-xs text-neutral-500 font-bold uppercase">
              <Filter size={14} /> Carrier:
            </div>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value)}
              className="text-xs border border-neutral-300 p-2 bg-white font-semibold outline-none"
            >
              <option value="ALL">All Carriers</option>
              <option value="FastVelix Express Logistics">FastVelix Express</option>
              <option value="Delhivery Express">Delhivery</option>
              <option value="BlueDart Courier">BlueDart</option>
              <option value="Ecom Express">Ecom Express</option>
              <option value="India Post Speed Post">India Post</option>
            </select>
          </div>

        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-neutral-200 pb-3 mb-6 text-xs font-bold uppercase tracking-wider">
          {[
            { id: 'ALL', label: 'All Shipments' },
            { id: 'CONFIRMED', label: 'Ready for Dispatch' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'SHIPPED', label: 'In Transit' },
            { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { id: 'DELIVERED', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={clsx(
                "px-4 py-2 border whitespace-nowrap cursor-pointer transition-colors",
                activeStatus === tab.id
                  ? "bg-dark text-white border-dark"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-dark"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Master Logistics Table */}
        {loading ? (
          <div className="py-16 text-center text-sm text-neutral-400 animate-pulse">
            Loading master shipping records...
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center bg-white border border-neutral-200 p-8 shadow-sm">
            <Package size={36} className="mx-auto text-neutral-300 mb-3" />
            <h3 className="text-sm font-bold text-dark uppercase">No Shipments Found</h3>
            <p className="text-xs text-neutral-500 mt-1">No orders matched your active filters or search term.</p>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 shadow-sm-custom overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-dark font-extrabold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer & Destination</th>
                  <th className="p-3.5">Carrier & Tracking AWB</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Payment</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-neutral-50/50">
                    
                    {/* Order Ref */}
                    <td className="p-3.5">
                      <span className="font-extrabold text-dark block">#{shipment.orderNumber}</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {new Date(shipment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </td>

                    {/* Customer & Address */}
                    <td className="p-3.5">
                      <span className="font-bold text-dark block">{shipment.deliveryAddress.fullName}</span>
                      <span className="text-neutral-500 text-[11px] block">
                        {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state} - <strong>{shipment.deliveryAddress.pincode}</strong>
                      </span>
                    </td>

                    {/* Carrier & AWB */}
                    <td className="p-3.5">
                      {shipment.trackingNumber ? (
                        <div>
                          <span className="font-bold text-dark block">{shipment.shippingCarrier || 'Express'}</span>
                          <span className="font-mono text-brand font-semibold text-[11px] block">{shipment.trackingNumber}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 text-[11px] font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> AWB Unassigned
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <span className={clsx(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 text-white inline-block",
                        shipment.status === 'DELIVERED' && "bg-brand",
                        shipment.status === 'SHIPPED' && "bg-blue-600",
                        shipment.status === 'OUT_FOR_DELIVERY' && "bg-indigo-600",
                        shipment.status === 'CONFIRMED' && "bg-amber-600",
                        shipment.status === 'CANCELLED' && "bg-red-500",
                        !['DELIVERED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'CONFIRMED', 'CANCELLED'].includes(shipment.status) && "bg-neutral-600"
                      )}>
                        {shipment.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Payment */}
                    <td className="p-3.5 text-center">
                      <span className={clsx(
                        "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border inline-block",
                        shipment.paymentMethod === 'COD' ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-green-50 text-green-700 border-green-300"
                      )}>
                        {shipment.paymentMethod}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="p-3.5 text-right font-extrabold text-dark">
                      ₹{shipment.grandTotal.toLocaleString('en-IN')}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(shipment)}
                          className="px-2.5 py-1.5 bg-dark hover:bg-neutral-800 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                          title="Edit Shipping"
                        >
                          Edit
                        </button>
                        <Link
                          href={`/seller/shipping/label/${shipment._id}`}
                          target="_blank"
                          className="p-1.5 bg-brand text-white hover:bg-brand-hover cursor-pointer"
                          title="Print Shipping Label"
                        >
                          <Printer size={13} />
                        </Link>
                        <Link
                          href={`/orders/${shipment._id}/invoice`}
                          target="_blank"
                          className="p-1.5 bg-neutral-100 text-dark hover:bg-neutral-200 border border-neutral-300 cursor-pointer"
                          title="View Tax Invoice"
                        >
                          <FileText size={13} />
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Shipping Modal (Admin) */}
        {editingShipment && (
          <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <h3 className="font-bold text-sm uppercase tracking-wider text-dark flex items-center gap-2">
                  <Truck size={16} className="text-brand" /> Admin Logistics Override
                </h3>
                <button
                  onClick={() => setEditingShipment(null)}
                  className="text-xs font-bold text-neutral-400 hover:text-dark cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateShipping} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-500 mb-1 uppercase tracking-wider">Order Reference</label>
                  <input
                    type="text"
                    disabled
                    value={`#${editingShipment.orderNumber} - ${editingShipment.deliveryAddress.fullName}`}
                    className="w-full p-2 bg-neutral-100 border border-neutral-200 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 mb-1 uppercase tracking-wider">Logistics Carrier Partner</label>
                  <select
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    className="w-full p-2 border border-neutral-300 bg-white font-semibold outline-none"
                  >
                    <option value="FastVelix Express Logistics">FastVelix Express Logistics</option>
                    <option value="Delhivery Express">Delhivery Express</option>
                    <option value="BlueDart Courier">BlueDart Courier</option>
                    <option value="Ecom Express">Ecom Express</option>
                    <option value="India Post Speed Post">India Post Speed Post</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 mb-1 uppercase tracking-wider">AWB / Tracking Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWB987654321"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full p-2 border border-neutral-300 font-mono font-bold uppercase focus:outline-none focus:border-dark"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 mb-1 uppercase tracking-wider">Shipment Status</label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full p-2 border border-neutral-300 bg-white font-semibold outline-none"
                  >
                    <option value="CONFIRMED">CONFIRMED (Order Confirmed)</option>
                    <option value="PROCESSING">PROCESSING (Packing in warehouse)</option>
                    <option value="SHIPPED">SHIPPED (Handed over to carrier)</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Last mile)</option>
                    <option value="DELIVERED">DELIVERED (Successfully delivered)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingShipment(null)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-600 font-bold uppercase text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-dark hover:bg-neutral-800 text-white font-bold uppercase text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Save Logistics Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}
