'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { Truck, Package, Printer, Search, RefreshCw, CheckCircle2, AlertCircle, MapPin, Tag, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface Shipment {
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
    thumbnail: string;
    sku: string;
    quantity: number;
    size?: string;
    packSize?: string;
  }>;
}

export default function SellerShippingPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dispatch Modal State
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [carrierInput, setCarrierInput] = useState('FastVelix Express Logistics');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusInput, setStatusInput] = useState('SHIPPED');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadShipments();
  }, [activeTab]);

  async function loadShipments() {
    setLoading(true);
    try {
      const statusParam = activeTab === 'ALL' ? '' : activeTab;
      const data = await api.get<{ success: boolean; shipments: Shipment[] }>(`/seller/shipping?status=${statusParam}`);
      if (data.success) {
        setShipments(data.shipments);
      }
    } catch (err) {
      console.error('Failed to load seller shipments:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenDispatchModal = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setCarrierInput(shipment.shippingCarrier || 'FastVelix Express Logistics');
    setTrackingInput(shipment.trackingNumber || `AWB-FV-${Math.floor(100000 + Math.random() * 900000)}`);
    setStatusInput(shipment.status === 'CONFIRMED' || shipment.status === 'PENDING' ? 'SHIPPED' : shipment.status);
  };

  const handleUpdateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setIsUpdating(true);

    try {
      const res = await api.post<{ success: boolean; order: any }>(`/seller/shipping/${selectedShipment._id}/dispatch`, {
        shippingCarrier: carrierInput,
        trackingNumber: trackingInput,
        status: statusInput,
      });

      if (res.success) {
        setSelectedShipment(null);
        loadShipments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update shipping details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.orderNumber.toLowerCase().includes(q) ||
      s.deliveryAddress.fullName.toLowerCase().includes(q) ||
      s.deliveryAddress.city.toLowerCase().includes(q) ||
      s.deliveryAddress.pincode.includes(q) ||
      (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
          <Link href="/seller" className="hover:text-dark">Seller Dashboard</Link>
          <ChevronRight size={12} />
          <span className="text-dark">Shipping & Dispatch Center</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-neutral-200 gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark uppercase tracking-tight flex items-center gap-2">
              <Truck size={24} className="text-brand" /> Seller Shipping & Label Management
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Dispatch orders, assign tracking numbers, and generate printable shipping package labels.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:w-64">
              <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Search AWB, Order #, City..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-dark"
              />
            </div>
            <button
              onClick={loadShipments}
              className="p-2 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-600 cursor-pointer"
              title="Refresh Shipments"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 border-b border-neutral-200 pb-3 mb-6 text-xs font-bold uppercase tracking-wider">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'CONFIRMED', label: 'Ready for Dispatch' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'SHIPPED', label: 'In Transit' },
            { id: 'DELIVERED', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 border whitespace-nowrap cursor-pointer transition-colors",
                activeTab === tab.id
                  ? "bg-dark text-white border-dark"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-dark"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className="py-16 text-center text-sm text-neutral-400 animate-pulse">
            Loading shipments...
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-16 text-center bg-white border border-neutral-200 p-8 shadow-sm">
            <Package size={36} className="mx-auto text-neutral-300 mb-3" />
            <h3 className="text-sm font-bold text-dark uppercase">No Shipments Found</h3>
            <p className="text-xs text-neutral-500 mt-1">There are no orders matching your selected status filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShipments.map((shipment) => (
              <div
                key={shipment._id}
                className="bg-white border border-neutral-200 p-5 shadow-sm-custom flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
              >
                {/* Left Info: Order & Address */}
                <div className="space-y-3 max-w-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-dark">#{shipment.orderNumber}</span>
                    <span className={clsx(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 text-white",
                      shipment.status === 'DELIVERED' && "bg-brand",
                      shipment.status === 'SHIPPED' && "bg-blue-600",
                      shipment.status === 'CONFIRMED' && "bg-amber-600",
                      shipment.status === 'CANCELLED' && "bg-red-500",
                      !['DELIVERED', 'SHIPPED', 'CONFIRMED', 'CANCELLED'].includes(shipment.status) && "bg-neutral-600"
                    )}>
                      {shipment.status.replace('_', ' ')}
                    </span>
                    <span className={clsx(
                      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border",
                      shipment.paymentMethod === 'COD' ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-green-50 text-green-700 border-green-300"
                    )}>
                      {shipment.paymentMethod === 'COD' ? `COD (Collect ₹${shipment.grandTotal})` : 'PREPAID'}
                    </span>
                  </div>

                  {/* Destination Address */}
                  <div className="text-xs text-neutral-600 flex items-start gap-2">
                    <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-dark">{shipment.deliveryAddress.fullName}</strong> — {shipment.deliveryAddress.addressLine1}, {shipment.deliveryAddress.city}, {shipment.deliveryAddress.state} - <strong>{shipment.deliveryAddress.pincode}</strong> (Ph: {shipment.deliveryAddress.phone})
                    </div>
                  </div>

                  {/* Items thumbnails */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {shipment.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-1.5 border border-neutral-100 text-[11px]">
                        <img src={item.thumbnail} alt="" className="w-8 h-8 object-cover border border-neutral-200 bg-white" />
                        <div>
                          <p className="font-semibold text-dark line-clamp-1 max-w-[150px]">{item.title}</p>
                          <p className="text-neutral-400">Qty: {item.quantity} | SKU: {item.sku}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Info: Tracking & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between w-full lg:w-auto border-t lg:border-none pt-4 lg:pt-0 gap-3 shrink-0">
                  <div className="text-left lg:text-right text-xs">
                    {shipment.trackingNumber ? (
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest block font-bold">Carrier & AWB Tracking</span>
                        <span className="font-bold text-dark">{shipment.shippingCarrier || 'Express'}</span>
                        <span className="font-mono text-brand block font-semibold">{shipment.trackingNumber}</span>
                      </div>
                    ) : (
                      <span className="text-amber-600 font-semibold text-xs flex items-center gap-1">
                        <AlertCircle size={13} /> AWB Tracking Not Assigned
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenDispatchModal(shipment)}
                      className="px-3.5 py-2 bg-dark hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Update Tracking
                    </button>

                    <Link
                      href={`/seller/shipping/label/${shipment._id}`}
                      target="_blank"
                      className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer size={14} /> Print Label
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Update Tracking Modal */}
        {selectedShipment && (
          <div className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-neutral-200 max-w-md w-full p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                <h3 className="font-bold text-sm uppercase tracking-wider text-dark flex items-center gap-2">
                  <Truck size={16} className="text-brand" /> Dispatch & Update Tracking
                </h3>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="text-xs font-bold text-neutral-400 hover:text-dark cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateDispatch} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-500 mb-1 uppercase tracking-wider">Order Reference</label>
                  <input
                    type="text"
                    disabled
                    value={`#${selectedShipment.orderNumber} - ${selectedShipment.deliveryAddress.fullName}`}
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
                    <option value="PROCESSING">PROCESSING (Packing in warehouse)</option>
                    <option value="SHIPPED">SHIPPED (Handed over to carrier)</option>
                    <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY (Last mile)</option>
                    <option value="DELIVERED">DELIVERED (Successfully delivered)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setSelectedShipment(null)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-600 font-bold uppercase text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-5 py-2 bg-dark hover:bg-neutral-800 text-white font-bold uppercase text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save & Dispatch'}
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
