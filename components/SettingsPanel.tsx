/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { LiveMindSettings } from '@/types';

interface SettingsPanelProps {
  settings: LiveMindSettings;
  onUpdate: (updates: Partial<LiveMindSettings>) => void;
  disabled?: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdate, disabled }) => {
  const voices: LiveMindSettings['voiceName'][] = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

  return (
    <div className="glass p-3 rounded-2xl space-y-3">
      <h3 className="text-lg font-semibold border-b border-slate-700 pb-3 text-cyan-400">Settings</h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-200 mb-2">Voice Model</label>
          <select 
            disabled={disabled}
            value={settings.voiceName}
            onChange={(e) => onUpdate({ voiceName: e.target.value as any })}
            className="w-[70%] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          >
            {voices.map(voice => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Camera Feed</span>
          <button
            onClick={() => onUpdate({ isCameraEnabled: !settings.isCameraEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isCameraEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isCameraEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Microphone</span>
          <button
            onClick={() => onUpdate({ isMicEnabled: !settings.isMicEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isMicEnabled ? 'bg-cyan-600' : 'bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isMicEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
