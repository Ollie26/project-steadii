'use client';

import React, { useState, useEffect } from 'react';

interface Profile {
  name: string;
  age: number | '';
  height: number | '';
  weight: number | '';
  gender: string;
  diabetesType: string;
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: '',
    diabetesType: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name || '',
            age: data.age || '',
            height: data.height || '',
            weight: data.weight || '',
            gender: data.gender || '',
            diabetesType: data.diabetesType || '',
          });
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      console.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Profile, value: string | number) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Name
        </label>
        <input
          type="text"
          value={profile.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
          placeholder="Your name"
        />
      </div>

      {/* Age + Gender row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Age
          </label>
          <input
            type="number"
            value={profile.age}
            onChange={(e) =>
              updateField('age', e.target.value ? parseInt(e.target.value) : '')
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
            placeholder="Age"
            min={1}
            max={120}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Gender
          </label>
          <select
            value={profile.gender}
            onChange={(e) => updateField('gender', e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8] appearance-none"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Height + Weight row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Height (in)
          </label>
          <input
            type="number"
            value={profile.height}
            onChange={(e) =>
              updateField(
                'height',
                e.target.value ? parseFloat(e.target.value) : ''
              )
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
            placeholder="Height"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Weight (lbs)
          </label>
          <input
            type="number"
            value={profile.weight}
            onChange={(e) =>
              updateField(
                'weight',
                e.target.value ? parseFloat(e.target.value) : ''
              )
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8]"
            placeholder="Weight"
          />
        </div>
      </div>

      {/* Diabetes type */}
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
          Diabetes Type
        </label>
        <select
          value={profile.diabetesType}
          onChange={(e) => updateField('diabetesType', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#8B7EC8]/30 focus:border-[#8B7EC8] appearance-none"
        >
          <option value="">Select type</option>
          <option value="type1">Type 1</option>
          <option value="type2">Type 2</option>
          <option value="gestational">Gestational</option>
          <option value="prediabetes">Prediabetes</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
          saved
            ? 'bg-[#4ECDC4] text-white'
            : 'bg-[#8B7EC8] text-white hover:bg-[#7A6DB7]'
        } disabled:opacity-50`}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
}
