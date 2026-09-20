import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  Camera,
  ArrowLeft,
  Recycle,
  CheckCircle,
  Clock,
  MapPin,
  Leaf,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fetchCampusItems, type CampusItem } from '../lib/api';

const STATUS_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'available', label: '🟢 Available for Reuse' },
  { id: 'paired', label: '🤝 Paired with Peers' },
  { id: 'recycled', label: '♻️ Recycled / Diverted' },
];

export function MyItemsPage() {
  const [items, setItems] = useState<CampusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [handedOverIds, setHandedOverIds] = useState<Record<string, boolean>>({});

  const loadItems = async () => {
    setLoading(true);
    const data = await fetchCampusItems(
      undefined,
      activeTab === 'all' ? undefined : activeTab
    );
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  const handleMarkHandedOver = (itemId: string) => {
    setHandedOverIds((prev) => ({ ...prev, [itemId]: true }));
  };

  // Stats calculation
  const totalListed = items.length;
  const pairedCount = items.filter((i) => i.status === 'paired').length;
  const recycledCount = items.filter((i) => i.status === 'recycled').length;
  const co2Total = items.reduce((acc, i) => acc + (i.potential_co2_kg || 2.5), 0);

  return (
    <div className="min-h-screen bg-slate-900 pt-16 pb-20 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <Link to="/scan">
            <Button variant="primary" className="gap-2 shadow-lg shadow-teal-500/20">
              <Camera className="h-4 w-4" />
              Scan & List New Item
            </Button>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 p-8 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 mb-4">
              <Package className="h-3.5 w-3.5" />
              Your Personal Circular Scout
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              My Items & Impact
            </h1>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Track items you've scanned and listed for dorm exchange, connect with fellow students who need them, and see your real-time carbon diversion footprint.
            </p>
          </div>
        </div>

        {/* Quick Impact Stats Bar */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Package className="h-4 w-4 text-teal-400" />
              Items Listed
            </div>
            <p className="text-2xl font-bold text-white">{totalListed}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Users className="h-4 w-4 text-teal-400" />
              Peer Matches
            </div>
            <p className="text-2xl font-bold text-teal-300">{pairedCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Recycle className="h-4 w-4 text-teal-400" />
              Diverted from Landfill
            </div>
            <p className="text-2xl font-bold text-teal-300">{recycledCount + pairedCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Leaf className="h-4 w-4 text-emerald-400" />
              Est. CO₂ Diverted
            </div>
            <p className="text-2xl font-bold text-emerald-400">{co2Total.toFixed(1)} kg</p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
                  active
                    ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20 font-semibold'
                    : 'border border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 animate-pulse"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-500 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">
                No items in this tab
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                Scan unwanted or surplus items in your dorm to automatically generate reuse recommendations and match with students nearby.
              </p>
              <Link to="/scan" className="inline-block mt-5">
                <Button variant="primary" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Scan an Item Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((item) => {
                const isHandedOver = handedOverIds[item.item_id];
                const statusBadge =
                  isHandedOver || item.status === 'paired'
                    ? {
                        label: isHandedOver ? 'Reused & Handed Over' : 'Paired with Student',
                        cls: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
                      }
                    : item.status === 'recycled'
                    ? {
                        label: 'E-Waste / Recycled',
                        cls: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
                      }
                    : {
                        label: 'Active Listing',
                        cls: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
                      };

                return (
                  <motion.div
                    key={item.item_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg backdrop-blur-sm hover:border-teal-500/30 transition-all"
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${statusBadge.cls}`}
                        >
                          {statusBadge.label}
                        </span>

                        <span className="text-[11px] text-slate-400 capitalize bg-slate-800/80 px-2 py-0.5 rounded-md">
                          Path: <strong className="text-teal-300">{item.chosen_path}</strong>
                        </span>
                      </div>

                      {/* Item Name */}
                      <h2 className="text-lg font-bold text-white mb-2">
                        {item.item_name}
                      </h2>

                      {/* Item Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                        <span className="rounded-md bg-slate-800/70 px-2 py-0.5 capitalize">
                          Category: {item.category}
                        </span>
                        <span className="rounded-md bg-slate-800/70 px-2 py-0.5 capitalize">
                          Condition: {item.condition}
                        </span>
                        <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5">
                          ~{item.potential_co2_kg || 3.0} kg CO₂ saved
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {item.hostel} {item.block ? `(${item.block})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        Listed {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.status === 'paired' && !isHandedOver ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => handleMarkHandedOver(item.item_id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Mark Handed Over
                          </Button>
                        ) : (
                          <Link to="/demand">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1.5 text-xs text-slate-300 hover:text-white"
                            >
                              <Users className="h-3.5 w-3.5 text-teal-400" />
                              View Wishlist
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
