'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api } from '@/utils/api';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Store, ShoppingBag, Undo2, History, ArrowLeft, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  actor: {
    name: string;
    email: string;
  };
  actorRole: string;
  metadata?: Record<string, any>;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const data = await api.get<{ success: boolean; logs: AuditLog[] }>('/admin/audit-logs');
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to load system audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <>
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-dark">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-neutral-100">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">System Audit History</h1>
            <p className="text-sm text-neutral-500 mt-1">Immutable ledger tracking administrative operations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Side Navbar */}
          <aside className="border-r border-neutral-100 pr-0 lg:pr-6 space-y-1">
            <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <LayoutDashboard size={16} /> Overview
            </Link>
            <Link href="/admin/sellers" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Store size={16} /> Seller Applications
            </Link>
            <Link href="/admin/products" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <ShoppingBag size={16} /> Product Approvals
            </Link>
            <Link href="/admin/refunds" className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-dark hover:bg-neutral-50 transition-colors">
              <Undo2 size={16} /> Refund Requests
            </Link>
            <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-dark">
              <History size={16} /> System Audit Logs
            </Link>
          </aside>

          {/* Main Logs Table */}
          <div className="lg:col-span-3">
            {loading ? (
              <p className="text-sm text-neutral-400 animate-pulse">Loading system log files...</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-neutral-500 py-10 text-center bg-white border">No logs recorded yet.</p>
            ) : (
              <div className="border border-neutral-200 bg-white shadow-sm-custom overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 font-extrabold uppercase border-b border-neutral-200">
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Operator</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Target Entity</th>
                      <th className="p-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-4">
                          <span className="font-bold text-dark">{log.action}</span>
                        </td>
                        <td className="p-4 font-semibold text-dark">{log.actor?.name || 'System / Auto'}</td>
                        <td className="p-4 uppercase text-[10px] font-extrabold">{log.actorRole}</td>
                        <td className="p-4">
                          {log.entity} <code className="bg-neutral-100 px-1 py-0.5 text-[9px] rounded-none">{log.entityId?.slice(-6).toUpperCase()}</code>
                        </td>
                        <td className="p-4 truncate max-w-[150px]">
                          {log.metadata?.note || JSON.stringify(log.metadata || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
