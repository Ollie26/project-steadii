'use client';

import React, { useState, useEffect } from 'react';

interface DexcomStatus {
  connected: boolean;
  lastSync?: string;
  username?: string;
}

export default function DexcomConnect() {
  const [status, setStatus] = useState<DexcomStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/dexcom/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setHasCredentials(data.hasCredentials || false);
        }
      } catch {
        // No credentials available
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/dexcom/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({
          ...prev,
          lastSync: data.lastSync || new Date().toISOString(),
        }));
      }
    } catch {
      console.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/dexcom/disconnect', { method: 'POST' });
      if (res.ok) {
        setStatus({ connected: false });
      }
    } catch {
      console.error('Disconnect failed');
    }
  };

  if (loading) {
    return <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />;
  }

  // No Dexcom credentials configured
  if (!hasCredentials) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-6 h-6 text-[#6B7280]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[#1A1A2E] mb-1">
          Dexcom Integration Coming Soon
        </p>
        <p className="text-xs text-[#6B7280]">
          Automatic CGM data sync will be available when Dexcom API credentials
          are configured. Use CSV import in the meantime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status.connected ? (
        <>
          {/* Connected state */}
          <div className="flex items-center gap-3 bg-[#4ECDC4]/5 border border-[#4ECDC4]/20 rounded-xl px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ECDC4] shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#1A1A2E]">
                Dexcom Connected
              </p>
              {status.username && (
                <p className="text-xs text-[#6B7280]">{status.username}</p>
              )}
            </div>
          </div>

          {/* Last sync */}
          {status.lastSync && (
            <p className="text-xs text-[#6B7280]">
              Last synced:{' '}
              {new Date(status.lastSync).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 py-2.5 bg-[#8B7EC8] text-white rounded-xl text-sm font-medium hover:bg-[#7A6DB7] transition-colors disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={handleDisconnect}
              className="py-2.5 px-4 bg-white border border-gray-200 text-[#E76F6F] rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Disconnected state */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
            <p className="text-sm text-[#6B7280]">
              Dexcom is not connected
            </p>
          </div>
          <a
            href="/api/dexcom/auth"
            className="block w-full py-3 bg-[#8B7EC8] text-white rounded-xl text-sm font-medium text-center hover:bg-[#7A6DB7] transition-colors"
          >
            Connect Dexcom
          </a>
        </>
      )}
    </div>
  );
}
