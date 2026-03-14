'use client';

import React, { useState, useEffect } from 'react';
import ProfileEditor from '@/components/you/ProfileEditor';
import InsulinSettings from '@/components/you/InsulinSettings';
import PainPointManager from '@/components/you/PainPointManager';
import TargetRangeSlider from '@/components/you/TargetRangeSlider';
import DexcomConnect from '@/components/you/DexcomConnect';
import CSVUpload from '@/components/you/CSVUpload';
import DataExport from '@/components/you/DataExport';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-[#8B7EC8]/10 rounded-lg flex items-center justify-center text-[#8B7EC8] shrink-0">
          {icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-[#1A1A2E]">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-[#6B7280] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-4">{children}</div>
      )}
    </div>
  );
}

export default function YouPage() {
  const [units, setUnits] = useState({
    glucose: 'mgdl',
    weight: 'lbs',
    height: 'in',
  });
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState('');
  const [savingAI, setSavingAI] = useState(false);
  const [savingUnits, setSavingUnits] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUnits({
            glucose: data.glucoseUnit || 'mgdl',
            weight: data.weightUnit || 'lbs',
            height: data.heightUnit || 'in',
          });
          setAiEnabled(data.aiEnabled || false);
          setAiApiKey(data.aiApiKey ? '********' : '');
          if (data.aiEnabled) {
            setAiStatus('Active');
          }
        }
      } catch {
        // Use defaults
      }
    }
    fetchProfile();
  }, []);

  const toggleUnit = async (
    key: 'glucose' | 'weight' | 'height',
    newValue: string
  ) => {
    setSavingUnits(true);
    const newUnits = { ...units, [key]: newValue };
    setUnits(newUnits);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glucoseUnit: newUnits.glucose,
          weightUnit: newUnits.weight,
          heightUnit: newUnits.height,
        }),
      });
    } catch {
      // Revert on failure
    } finally {
      setSavingUnits(false);
    }
  };

  const saveAISettings = async () => {
    setSavingAI(true);
    try {
      const body: Record<string, unknown> = { aiEnabled };
      if (aiApiKey && !aiApiKey.startsWith('***')) {
        body.aiApiKey = aiApiKey;
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAiStatus(aiEnabled ? 'Active' : 'Disabled');
      }
    } catch {
      setAiStatus('Error');
    } finally {
      setSavingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">You</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Profile, settings, and data
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Profile */}
        <Section
          title="Profile"
          defaultOpen
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <ProfileEditor />
        </Section>

        {/* Insulin Settings */}
        <Section
          title="Insulin Settings"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        >
          <InsulinSettings />
        </Section>

        {/* Pain Points */}
        <Section
          title="Pain Points"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <PainPointManager />
        </Section>

        {/* Target Range */}
        <Section
          title="Target Range"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        >
          <TargetRangeSlider />
        </Section>

        {/* Data Connection */}
        <Section
          title="Data Connection"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        >
          <DexcomConnect />
        </Section>

        {/* Import Data */}
        <Section
          title="Import Data"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          }
        >
          <CSVUpload />
        </Section>

        {/* Export Data */}
        <Section
          title="Export Data"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
        >
          <DataExport />
        </Section>

        {/* Units */}
        <Section
          title="Units"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        >
          <div className="space-y-4">
            {/* Glucose unit */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-2">
                Glucose Unit
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { value: 'mgdl', label: 'mg/dL' },
                  { value: 'mmol', label: 'mmol/L' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleUnit('glucose', opt.value)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      units.glucose === opt.value
                        ? 'bg-white text-[#8B7EC8] shadow-sm'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight unit */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-2">
                Weight Unit
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { value: 'lbs', label: 'lbs' },
                  { value: 'kg', label: 'kg' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleUnit('weight', opt.value)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      units.weight === opt.value
                        ? 'bg-white text-[#8B7EC8] shadow-sm'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Height unit */}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-2">
                Height Unit
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { value: 'in', label: 'inches' },
                  { value: 'cm', label: 'cm' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleUnit('height', opt.value)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                      units.height === opt.value
                        ? 'bg-white text-[#8B7EC8] shadow-sm'
                        : 'text-[#6B7280]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {savingUnits && (
              <p className="text-xs text-[#6B7280] text-center">Saving...</p>
            )}
          </div>
        </Section>

        {/* AI Settings */}
        <Section
          title="AI Settings"
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l1.954.674a1 1 0 01.09 1.82L11 7.86V10a1 1 0 11-2 0V7.86L6.956 6.817a1 1 0 01.09-1.82L9 4.323V3a1 1 0 011-1zm-5 9a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L6 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L4 12.586V12a1 1 0 011-1zm10 0a1 1 0 011 1v.586l.707-.293a1 1 0 01.828 1.818L16 14.818V16a1 1 0 11-2 0v-1.182l-1.535-.707a1 1 0 01.828-1.818L14 12.586V12a1 1 0 011-1z" />
            </svg>
          }
        >
          <div className="space-y-4">
            {/* AI toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">
                  Enable AI Insights
                </p>
                <p className="text-xs text-[#6B7280]">
                  Get personalized analysis and recommendations
                </p>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  aiEnabled ? 'bg-[#8B7EC8]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    aiEnabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* API key input */}
            {aiEnabled && (
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  API Key (optional)
                </label>
                <input
                  type="password"
                  value={aiApiKey}
                  onChange={(e) => setAiApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
                  placeholder="Enter API key or leave blank for built-in"
                />
              </div>
            )}

            {/* Status */}
            {aiStatus && (
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiStatus === 'Active'
                      ? 'bg-[#4ECDC4]'
                      : aiStatus === 'Error'
                      ? 'bg-[#E76F6F]'
                      : 'bg-gray-300'
                  }`}
                />
                <span className="text-xs text-[#6B7280]">
                  Status: {aiStatus}
                </span>
              </div>
            )}

            {/* Save */}
            <button
              onClick={saveAISettings}
              disabled={savingAI}
              className="w-full py-3 bg-[#8B7EC8] text-white rounded-xl text-sm font-medium hover:bg-[#7A6DB7] transition-colors disabled:opacity-50"
            >
              {savingAI ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </Section>

        {/* App Info */}
        <Section
          title="App Info"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Version</span>
              <span className="text-[#1A1A2E] font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Storage</span>
              <span className="text-[#1A1A2E] font-medium">SQLite (Local)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Framework</span>
              <span className="text-[#1A1A2E] font-medium">Next.js 14</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <p className="text-xs text-[#6B7280] text-center">
                Steadii helps you understand how food, activity, and lifestyle
                affect your blood sugar. All data is stored locally on your
                device.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
