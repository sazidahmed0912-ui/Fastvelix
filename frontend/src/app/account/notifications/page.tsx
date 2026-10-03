'use client';

import React, { useEffect, Suspense } from 'react';
import { useStore } from '@/store/useStore';
import { Bell, Check, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function NotificationsContent() {
  const { notifications, fetchNotifications, markNotificationsRead } = useStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead();
    } catch (err) {
      console.error(err);
    }
  };

  const isNotificationsEmpty = notifications.length === 0;

  return (
      <div className="space-y-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider mb-6">
          <span>Home</span>
          <ChevronRight size={12} />
          <span>Account</span>
          <ChevronRight size={12} />
          <span className="text-dark">Notifications</span>
        </div>

        <div className="flex justify-between items-center mb-8 border-b border-neutral-100 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Notification Center</h1>
            <p className="text-sm text-neutral-500 mt-1">Stay updated with your orders and applications.</p>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="h-9 px-4 border border-brand text-brand hover:bg-brand-light font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Check size={14} /> Mark all Read
            </button>
          )}
        </div>

        {isNotificationsEmpty ? (
          <div className="text-center py-20 border border-neutral-100 bg-white shadow-sm-custom flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-neutral-50 rounded-full text-neutral-400">
              <Bell size={40} />
            </div>
            <h2 className="text-sm font-bold text-neutral-500">No notifications yet.</h2>
          </div>
        ) : (
          <div className="border border-neutral-200 bg-white divide-y divide-neutral-100 shadow-sm-custom">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-5 flex gap-4 transition-colors ${notif.isRead ? 'bg-white' : 'bg-neutral-50'}`}
              >
                <div className={`p-2.5 h-10 w-10 flex items-center justify-center shrink-0 rounded-full ${notif.isRead ? 'bg-neutral-50 text-neutral-400' : 'bg-brand-light text-brand'}`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`text-sm ${notif.isRead ? 'font-semibold text-neutral-700' : 'font-extrabold text-dark'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(notif.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-neutral-500 mt-1 leading-relaxed">{notif.message}</p>
                  
                  {notif.deepLink && (
                    <Link
                      href={notif.deepLink}
                      className="mt-3 inline-flex items-center gap-1 font-bold text-brand hover:underline uppercase text-[10px] tracking-wider"
                    >
                      View Details <ChevronRight size={10} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="py-12" />}>
      <NotificationsContent />
    </Suspense>
  );
}
