'use client'

import { Save } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">Settings</h1>
          <p className="text-gray-500 mt-2">Manage your store preferences and system configurations.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors shadow-sm">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-foreground">General Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Store Name</label>
              <input type="text" defaultValue="Tujaria" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contact Email</label>
              <input type="email" defaultValue="admin@tujaria.com" className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Store Description</label>
            <textarea rows={4} defaultValue="The premium multi-vendor e-commerce platform." className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors resize-none"></textarea>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-foreground">Localization</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default Currency</label>
              <select className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors bg-white">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SAR">SAR (ر.س)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Default Language</label>
              <select className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 focus:border-primary focus:outline-none transition-colors bg-white">
                <option value="en">English</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
