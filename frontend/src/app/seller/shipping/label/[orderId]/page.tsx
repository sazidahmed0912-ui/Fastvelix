'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import clsx from 'clsx';
import { Printer, ArrowLeft, ShieldCheck, QrCode } from 'lucide-react';

interface LabelData {
  labelId: string;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  isCOD: boolean;
  codAmount: number;
  carrier: string;
  awb: string;
  routingHub: string;
  shipFrom: {
    companyName: string;
    contactPerson: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  shipTo: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  packageDetails: {
    totalItems: number;
    weight: string;
    dimensions: string;
    items: Array<{
      title: string;
      sku: string;
      variant: string;
      quantity: number;
    }>;
  };
}

interface LabelPageProps {
  params: Promise<{ orderId: string }>;
}

export default function ShippingLabelPage({ params }: LabelPageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [label, setLabel] = useState<LabelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((res) => setOrderId(res.orderId));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

    async function loadLabel() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; label: LabelData }>(`/seller/shipping/${orderId}/label`);
        if (data.success) {
          setLabel(data.label);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shipping label.');
      } finally {
        setLoading(false);
      }
    }

    loadLabel();
  }, [orderId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center text-sm font-semibold text-neutral-500 animate-pulse">
        Generating package dispatch shipping label...
      </div>
    );
  }

  if (error || !label) {
    return (
      <div className="min-h-screen bg-neutral-100 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 border border-neutral-200 shadow-sm max-w-md text-center">
          <h2 className="text-lg font-bold text-red-600">Label Unavailable</h2>
          <p className="text-xs text-neutral-500 mt-2">{error || 'Could not generate shipping label.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2.5 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Back to Shipping Center
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-dark font-sans print:bg-white print:p-0">
      
      {/* Top Non-Printable Action Bar */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-neutral-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-dark cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} /> Back to Shipping Center
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 cursor-pointer transition-colors shadow-sm"
        >
          <Printer size={16} /> Print Shipping Label (4x6 / A4)
        </button>
      </div>

      {/* Shipping Label Container (Designed to fit 4x6 thermal label or 1/2 A4 page) */}
      <main className="max-w-xl mx-auto my-8 print:my-0 p-6 bg-white border-2 border-dark shadow-xl print:shadow-none print:border-2 print:border-black print:max-w-none print:w-full">
        
        {/* Header Carrier & Hub */}
        <div className="border-b-2 border-dark pb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 font-black text-xl tracking-tighter uppercase text-dark">
              <span className="bg-dark text-white px-2 py-0.5 text-base">FAST</span>
              <span>VELIX</span>
              <span className="text-xs font-bold text-neutral-500 ml-1">EXPRESS</span>
            </div>
            <p className="text-[11px] font-bold text-neutral-600 mt-1 uppercase tracking-wider">
              {label.carrier}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block bg-dark text-white font-mono text-xs font-bold px-2.5 py-1">
              {label.routingHub}
            </span>
            <p className="text-[10px] text-neutral-500 font-mono mt-1">Ref: {label.labelId}</p>
          </div>
        </div>

        {/* Barcode & AWB Section */}
        <div className="my-4 p-4 border border-dark text-center bg-neutral-50/50">
          <div className="flex justify-between items-center px-4">
            <div className="font-mono text-left">
              <p className="text-[9px] uppercase font-bold text-neutral-400">Airway Bill (AWB) #</p>
              <p className="text-lg font-black text-dark tracking-wider">{label.awb}</p>
            </div>
            <div className="font-mono text-right">
              <p className="text-[9px] uppercase font-bold text-neutral-400">Order Number</p>
              <p className="text-sm font-bold text-dark">{label.orderNumber}</p>
            </div>
          </div>

          {/* Visual SVG Barcode Simulation */}
          <div className="my-3 flex justify-center items-center h-12 overflow-hidden px-4">
            <svg className="w-full h-full" viewBox="0 0 300 40">
              <rect x="0" width="3" height="40" fill="#000" />
              <rect x="5" width="2" height="40" fill="#000" />
              <rect x="10" width="5" height="40" fill="#000" />
              <rect x="18" width="2" height="40" fill="#000" />
              <rect x="23" width="4" height="40" fill="#000" />
              <rect x="30" width="6" height="40" fill="#000" />
              <rect x="40" width="2" height="40" fill="#000" />
              <rect x="45" width="3" height="40" fill="#000" />
              <rect x="52" width="5" height="40" fill="#000" />
              <rect x="60" width="2" height="40" fill="#000" />
              <rect x="65" width="4" height="40" fill="#000" />
              <rect x="72" width="6" height="40" fill="#000" />
              <rect x="82" width="3" height="40" fill="#000" />
              <rect x="88" width="2" height="40" fill="#000" />
              <rect x="93" width="5" height="40" fill="#000" />
              <rect x="102" width="2" height="40" fill="#000" />
              <rect x="107" width="4" height="40" fill="#000" />
              <rect x="115" width="6" height="40" fill="#000" />
              <rect x="125" width="3" height="40" fill="#000" />
              <rect x="131" width="2" height="40" fill="#000" />
              <rect x="136" width="5" height="40" fill="#000" />
              <rect x="145" width="2" height="40" fill="#000" />
              <rect x="150" width="4" height="40" fill="#000" />
              <rect x="158" width="6" height="40" fill="#000" />
              <rect x="168" width="3" height="40" fill="#000" />
              <rect x="174" width="2" height="40" fill="#000" />
              <rect x="180" width="5" height="40" fill="#000" />
              <rect x="190" width="2" height="40" fill="#000" />
              <rect x="195" width="4" height="40" fill="#000" />
              <rect x="202" width="6" height="40" fill="#000" />
              <rect x="212" width="3" height="40" fill="#000" />
              <rect x="218" width="2" height="40" fill="#000" />
              <rect x="225" width="5" height="40" fill="#000" />
              <rect x="235" width="2" height="40" fill="#000" />
              <rect x="240" width="4" height="40" fill="#000" />
              <rect x="248" width="6" height="40" fill="#000" />
              <rect x="258" width="3" height="40" fill="#000" />
              <rect x="265" width="2" height="40" fill="#000" />
              <rect x="272" width="5" height="40" fill="#000" />
              <rect x="282" width="2" height="40" fill="#000" />
              <rect x="288" width="4" height="40" fill="#000" />
              <rect x="295" width="5" height="40" fill="#000" />
            </svg>
          </div>
        </div>

        {/* COD / Payment Badge */}
        <div className={clsx(
          "p-4 border-2 my-4 text-center",
          label.isCOD
            ? "border-dark bg-amber-50 text-dark"
            : "border-green-600 bg-green-50 text-green-800"
        )}>
          {label.isCOD ? (
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest block text-amber-800">
                ⚠️ CASH ON DELIVERY (COD) - COLLECT CASH BEFORE HANDOVER
              </span>
              <p className="text-2xl font-black mt-1">₹{label.codAmount.toLocaleString('en-IN')}</p>
            </div>
          ) : (
            <div>
              <span className="text-sm font-black uppercase tracking-widest block">
                ✓ PREPAID ORDER — DO NOT COLLECT CASH FROM CUSTOMER
              </span>
            </div>
          )}
        </div>

        {/* SHIP TO Box (Giant & Prominent for Courier Delivery Agents) */}
        <div className="p-4 border-2 border-dark bg-white my-4 space-y-1 text-xs">
          <span className="bg-dark text-white text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5">
            DELIVER TO / SHIP TO:
          </span>
          <h2 className="text-xl font-black text-dark mt-2">{label.shipTo.name}</h2>
          <p className="font-bold text-sm text-neutral-800">{label.shipTo.addressLine1}</p>
          {label.shipTo.addressLine2 && <p className="font-semibold text-neutral-700">{label.shipTo.addressLine2}</p>}
          <p className="font-extrabold text-base text-dark mt-1">
            {label.shipTo.city}, {label.shipTo.state} — <span className="bg-dark text-white px-2 py-0.5">{label.shipTo.pincode}</span>
          </p>
          <div className="pt-2 border-t border-neutral-200 mt-2 flex justify-between items-center text-sm font-bold">
            <span>Customer Contact: <strong>{label.shipTo.phone}</strong></span>
            <span className="text-xs text-neutral-500 uppercase">{label.shipTo.country}</span>
          </div>
        </div>

        {/* SHIP FROM Box (Return Seller Address) */}
        <div className="p-3 border border-neutral-300 bg-neutral-50 my-4 text-xs">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            RETURN TO / SHIP FROM:
          </span>
          <p className="font-bold text-dark">{label.shipFrom.companyName} ({label.shipFrom.contactPerson})</p>
          <p className="text-neutral-600">{label.shipFrom.address}, {label.shipFrom.city}, {label.shipFrom.state} - <strong>{label.shipFrom.pincode}</strong></p>
          <p className="text-neutral-600 text-[11px] mt-0.5">Seller Phone: {label.shipFrom.phone}</p>
        </div>

        {/* Package Contents Manifest */}
        <div className="p-3 border border-neutral-300 bg-white my-4 text-xs space-y-2">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <span>Package Contents ({label.packageDetails.totalItems} Items)</span>
            <span>Est. Wt: {label.packageDetails.weight}</span>
          </div>

          <div className="divide-y divide-neutral-100 text-[11px]">
            {label.packageDetails.items.map((item, idx) => (
              <div key={idx} className="py-1 flex justify-between gap-2">
                <span className="font-medium text-dark line-clamp-1">{item.title} ({item.variant})</span>
                <span className="font-bold shrink-0">Qty: {item.quantity} | SKU: {item.sku}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Authorization */}
        <div className="pt-3 border-t border-neutral-300 flex justify-between items-center text-[9px] text-neutral-500 font-mono">
          <span>FastVelix Logistics Network</span>
          <span>Security Verified Package</span>
        </div>

      </main>
    </div>
  );
}
