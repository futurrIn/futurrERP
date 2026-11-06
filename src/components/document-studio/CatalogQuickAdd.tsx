import React from 'react';
import { Plus, Sparkles, Bot, Shirt, Cpu, Users, Wrench } from 'lucide-react';
import { LineItem } from './types';

interface CatalogQuickAddProps {
  onAddItem: (item: Omit<LineItem, 'id'>) => void;
}

const CATALOG_PRESETS: Array<{
  name: string;
  category: string;
  rate: number;
  icon: React.ComponentType<{ size: number; className?: string }>;
}> = [
  {
    name: 'Unitree G1 Humanoid Robot (Rental / Day)',
    category: 'Robot Rental',
    rate: 90000,
    icon: Bot
  },
  {
    name: 'Transformers Bumblebee Suit (Rental / Day)',
    category: 'Costume / Act',
    rate: 28000,
    icon: Shirt
  },
  {
    name: 'Unitree Go2 Quadruped Robot Dog (Rental / Day)',
    category: 'Robot Rental',
    rate: 45000,
    icon: Bot
  },
  {
    name: 'Robotic Stage Deployment & Operator Crew (Per Event)',
    category: 'Crew / Support',
    rate: 35000,
    icon: Users
  },
  {
    name: 'Autonomous AI Vision & Motion Software Suite',
    category: 'Software / AI',
    rate: 65000,
    icon: Cpu
  },
  {
    name: 'Advanced Robotics & AI Bootcamp (Per Batch)',
    category: 'Training',
    rate: 40000,
    icon: Sparkles
  },
  {
    name: 'Quarterly High-Tech Equipment AMC Maintenance',
    category: 'AMC / Service',
    rate: 25000,
    icon: Wrench
  }
];

export const CatalogQuickAdd: React.FC<CatalogQuickAddProps> = ({ onAddItem }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        <Sparkles size={13} className="text-amber-500" />
        <span>Quick Add from Catalog Presets</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATALOG_PRESETS.map((preset, idx) => {
          const Icon = preset.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAddItem({
                name: preset.name,
                category: preset.category,
                quantity: 1,
                rate: preset.rate,
                amount: preset.rate
              })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 hover:text-purple-700 transition-all text-left group"
            >
              <Icon size={12} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              <span>{preset.name.split(' (')[0]}</span>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-500">
                ₹{preset.rate.toLocaleString('en-IN')}
              </span>
              <Plus size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default CatalogQuickAdd;

