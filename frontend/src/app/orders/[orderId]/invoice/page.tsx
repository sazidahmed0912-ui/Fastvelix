'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentId: string;
  seller: {
    companyName: string;
    tradeName: string;
    gstin: string;
    pan: string;
    fssaiLicNo: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    supportEmail: string;
    supportPhone: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    slNo: number;
    title: string;
    brand: string;
    sku: string;
    category: string;
    variantInfo: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    grossAmount: number;
    taxableValue: number;
    gstRate: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    totalAmount: number;
  }>;
  summary: {
    subtotal: number;
    taxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalGST: number;
    shippingFee: number;
    couponCode?: string;
    couponDiscount: number;
    grandTotal: number;
  };
}

interface InvoicePageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderInvoicePage({ params }: InvoicePageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((res) => setOrderId(res.orderId));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;

    async function loadInvoice() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; invoice: InvoiceData }>(`/orders/${orderId}/invoice`);
        if (data.success) {
          setInvoice(data.invoice);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [orderId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Convert numbers to Words in INR
  const numberToWords = (num: number): string => {
    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      const digit = n % 10;
      return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
    };

    if (num === 0) return 'Zero';
    const whole = Math.floor(num);
    let str = '';

    const lakh = Math.floor(whole / 100000);
    const thousand = Math.floor((whole % 100000) / 1000);
    const hundred = Math.floor((whole % 1000) / 100);
    const rest = whole % 100;

    if (lakh) str += inWords(lakh) + 'Lakh ';
    if (thousand) str += inWords(thousand) + 'Thousand ';
    if (hundred) str += inWords(hundred) + 'Hundred ';
    if (rest) str += inWords(rest);

    return str.trim() + ' Rupees Only';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col justify-center items-center text-sm font-semibold text-neutral-500 animate-pulse">
        Generating official Tax Invoice...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-neutral-100 p-8 flex flex-col items-center justify-center">
        <div className="bg-white p-8 border border-neutral-200 shadow-sm max-w-md text-center">
          <h2 className="text-lg font-bold text-red-600">Invoice Unavailable</h2>
          <p className="text-xs text-neutral-500 mt-2">{error || 'Could not fetch invoice details.'}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2.5 bg-dark text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800 font-sans print:bg-white print:p-0">
      
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 sm:px-8 py-4 shadow-sm flex items-center justify-between">
        <button
          onClick={() => router.push(`/orders/${orderId}`)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-dark cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} /> Back to Order Details
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-dark hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 cursor-pointer transition-colors"
          >
            <Printer size={15} /> Print Invoice
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 cursor-pointer transition-colors"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* Main Print Container (A4 Canvas) */}
      <main className="max-w-4xl mx-auto my-8 print:my-0 p-6 sm:p-10 bg-white border border-neutral-200 shadow-lg print:shadow-none print:border-none print:max-w-none print:w-full">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-dark pb-6 gap-6">
          <div>
            <div className="flex items-center gap-2 text-dark font-extrabold text-2xl tracking-tighter uppercase">
              <span className="bg-dark text-white px-2 py-0.5 text-lg font-black">FAST</span>
              <span>VELIX</span>
            </div>
            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mt-1">
              Fashion & Cakes & Bakes Omnichannel Store
            </p>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              {invoice.seller.companyName}
              <br />
              {invoice.seller.address}, {invoice.seller.city}, {invoice.seller.state} - {invoice.seller.pincode}
              <br />
              <strong>GSTIN:</strong> {invoice.seller.gstin} | <strong>PAN:</strong> {invoice.seller.pan}
              <br />
              <strong>FSSAI Lic. No:</strong> {invoice.seller.fssaiLicNo}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block bg-dark text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 mb-2">
              TAX INVOICE / BILL OF SUPPLY
            </span>
            <p className="text-xs font-bold text-dark">Invoice #: {invoice.invoiceNumber}</p>
            <p className="text-xs text-neutral-500">Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-xs text-neutral-500">Order #: {invoice.orderNumber}</p>
            <p className="text-xs text-neutral-500">Order Date: {new Date(invoice.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 py-4 border-b border-neutral-200 text-xs">
          
          {/* Billed & Delivery Address */}
          <div className="bg-neutral-50 p-4 border border-neutral-200/80">
            <h4 className="font-extrabold uppercase text-[10px] text-neutral-400 tracking-wider mb-2">
              Billed To & Delivery Address
            </h4>
            <p className="font-bold text-dark text-sm">{invoice.customer.name}</p>
            <p className="text-neutral-600 mt-1">{invoice.customer.addressLine1}</p>
            {invoice.customer.addressLine2 && <p className="text-neutral-600">{invoice.customer.addressLine2}</p>}
            <p className="text-neutral-600">{invoice.customer.city}, {invoice.customer.state} - {invoice.customer.pincode}</p>
            <p className="text-neutral-600 mt-1">Phone: <strong>{invoice.customer.phone}</strong></p>
            {invoice.customer.email && <p className="text-neutral-600">Email: {invoice.customer.email}</p>}
          </div>

          {/* Payment & Order Meta */}
          <div className="bg-neutral-50 p-4 border border-neutral-200/80 space-y-2">
            <h4 className="font-extrabold uppercase text-[10px] text-neutral-400 tracking-wider mb-2">
              Payment & Shipping Mode
            </h4>
            <div className="flex justify-between border-b border-neutral-200/50 pb-1">
              <span className="text-neutral-500">Payment Mode:</span>
              <span className="font-bold text-dark">{invoice.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200/50 pb-1">
              <span className="text-neutral-500">Payment Status:</span>
              <span className="font-bold text-brand uppercase">{invoice.paymentStatus}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-200/50 pb-1">
              <span className="text-neutral-500">Transaction Ref:</span>
              <span className="font-mono text-[11px] text-dark">{invoice.paymentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Supply State:</span>
              <span className="font-bold text-dark">{invoice.seller.state} (29)</span>
            </div>
          </div>

        </div>

        {/* Itemized Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs border-collapse border border-neutral-200">
            <thead>
              <tr className="bg-neutral-100 text-dark font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-2.5 border border-neutral-200 text-center w-10">Sl.</th>
                <th className="p-2.5 border border-neutral-200">Description of Goods</th>
                <th className="p-2.5 border border-neutral-200 text-center">HSN</th>
                <th className="p-2.5 border border-neutral-200 text-center">Qty</th>
                <th className="p-2.5 border border-neutral-200 text-right">Unit Rate (₹)</th>
                <th className="p-2.5 border border-neutral-200 text-right">Taxable (₹)</th>
                <th className="p-2.5 border border-neutral-200 text-right">CGST (2.5%)</th>
                <th className="p-2.5 border border-neutral-200 text-right">SGST (2.5%)</th>
                <th className="p-2.5 border border-neutral-200 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {invoice.items.map((item) => (
                <tr key={item.slNo} className="hover:bg-neutral-50/50">
                  <td className="p-2.5 border border-neutral-200 text-center font-bold text-neutral-500">{item.slNo}</td>
                  <td className="p-2.5 border border-neutral-200">
                    <p className="font-bold text-dark">{item.title}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">SKU: {item.sku} {item.variantInfo && `| ${item.variantInfo}`}</p>
                  </td>
                  <td className="p-2.5 border border-neutral-200 text-center font-mono text-neutral-600">{item.hsnCode}</td>
                  <td className="p-2.5 border border-neutral-200 text-center font-bold text-dark">{item.quantity}</td>
                  <td className="p-2.5 border border-neutral-200 text-right font-medium">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border border-neutral-200 text-right font-medium">₹{item.taxableValue.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border border-neutral-200 text-right text-neutral-600">₹{item.cgstAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border border-neutral-200 text-right text-neutral-600">₹{item.sgstAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 border border-neutral-200 text-right font-bold text-dark">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Totals & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 pt-4 border-t-2 border-neutral-200 text-xs">
          
          {/* Left: Amount in Words & Terms */}
          <div className="space-y-4">
            <div>
              <span className="font-extrabold uppercase text-[10px] text-neutral-400 tracking-wider block mb-1">
                Amount in Words
              </span>
              <p className="font-bold text-dark bg-neutral-50 p-3 border border-neutral-200 italic">
                {numberToWords(invoice.summary.grandTotal)}
              </p>
            </div>

            <div className="text-[10px] text-neutral-500 space-y-1 bg-neutral-50 p-3 border border-neutral-200">
              <p className="font-bold text-dark uppercase">Declaration & Terms:</p>
              <p>1. Goods once sold can be returned within 7 days under standard return policy.</p>
              <p>2. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            </div>
          </div>

          {/* Right: Tax & Charges Calculation Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Total Taxable Value</span>
              <span className="font-semibold text-dark">₹{invoice.summary.taxableValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-500">
              <span>Central Tax (CGST 2.5%)</span>
              <span>₹{invoice.summary.totalCGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-500">
              <span>State Tax (SGST 2.5%)</span>
              <span>₹{invoice.summary.totalSGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100 text-neutral-600 font-medium">
              <span>Total Tax (5% GST)</span>
              <span>₹{invoice.summary.totalGST.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-100">
              <span className="text-neutral-500">Shipping & Handling</span>
              <span className="font-semibold text-dark">
                {invoice.summary.shippingFee === 0 ? <strong className="text-brand">FREE</strong> : `₹${invoice.summary.shippingFee}`}
              </span>
            </div>
            {invoice.summary.couponDiscount > 0 && (
              <div className="flex justify-between py-1 border-b border-neutral-100 text-brand font-semibold">
                <span>Coupon Discount ({invoice.summary.couponCode})</span>
                <span>-₹{invoice.summary.couponDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-dark text-sm font-extrabold text-dark">
              <span>Grand Total Payable</span>
              <span>₹{invoice.summary.grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

        {/* Footer Authorization Section */}
        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
          <div className="space-y-1 text-neutral-500 text-[10px]">
            <p className="flex items-center gap-1 font-bold text-neutral-700">
              <ShieldCheck size={14} className="text-brand" /> FastVelix Verified Digital Tax Invoice
            </p>
            <p>E-Way Bill System Compliant | Invoice Ref: {invoice.invoiceNumber}</p>
            <p>For support, email {invoice.seller.supportEmail} or call {invoice.seller.supportPhone}</p>
          </div>

          <div className="text-center sm:text-right">
            <div className="border border-dashed border-neutral-300 bg-neutral-50 px-6 py-3 mb-1">
              <p className="font-extrabold text-[10px] uppercase text-neutral-400 tracking-wider">For FastVelix Retail Partners India Pvt Ltd</p>
              <p className="font-bold text-dark text-xs mt-3">Authorized Signatory</p>
            </div>
            <p className="text-[9px] text-neutral-400 italic">This is a computer-generated tax invoice and requires no signature.</p>
          </div>
        </div>

      </main>

    </div>
  );
}
