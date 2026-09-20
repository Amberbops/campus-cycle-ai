import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  ArrowLeft,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fetchDemand, createDemand, type DemandItem } from '../lib/api';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'electronics', label: '⚡ Electronics' },
  { id: 'books', label: '📚 Books & Notes' },
  { id: 'furniture', label: '🪑 Furniture' },
  { id: 'kitchen', label: '☕ Kitchen & Appliances' },
  { id: 'misc', label: '📦 Misc' },
];

const HOSTELS = [
  'All Hostels',
  'Hostel 1 (Yamuna)',
  'Hostel 2 (Ganga)',
  'Hostel 3 (Narmada)',
  'Hostel 4 (Godavari)',
  'Hostel 7 (Kaveri)',
  'PG / Research Hostel',
];

export function DemandPage() {
  const [demands, setDemands] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHostel, setSelectedHostel] = useState('All Hostels');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // New demand form state
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('electronics');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [alias, setAlias] = useState('');
  const [hostel, setHostel] = useState('Hostel 4 (Godavari)');
  const [room, setRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDemands = async () => {
    setLoading(true);
    const data = await fetchDemand(
      selectedCategory === 'all' ? undefined : selectedCategory,
      selectedHostel === 'All Hostels' ? undefined : selectedHostel
    );
    setDemands(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDemands();
  }, [selectedCategory, selectedHostel]);

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !alias.trim()) return;

    setSubmitting(true);
    const keywords = itemName
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((w) => w.length > 2);

    await createDemand({
      requester_alias: alias,
      category,
      keywords: keywords.length > 0 ? keywords : [itemName],
      hostel,
      block: room ? `Room ${room}` : undefined,
      urgency,
    });

    setSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setShowPostModal(false);
      setItemName('');
      setAlias('');
      setRoom('');
      loadDemands();
    }, 1200);
  };

  const filteredDemands = demands.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = item.keywords.some((k) => k.toLowerCase().includes(q));
    const matchAlias = item.requester_alias.toLowerCase().includes(q);
    const matchHostel = item.hostel.toLowerCase().includes(q);
    return matchName || matchAlias || matchHostel;
  });

  return (
    <div className="min-h-screen bg-slate-900 pt-16 pb-20 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <Button
            variant="primary"
            className="gap-2 shadow-lg shadow-teal-500/20"
            onClick={() => setShowPostModal(true)}
          >
            <Plus className="h-4 w-4" />
            Post What You Need
          </Button>
        </div>

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 p-8 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Campus Circular Wishlist
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              I Need Something
            </h1>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Don't buy brand new! Tell your campus peers what you're looking for. Whenever a student scans an item matching your wishlist, our AI connects you immediately.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search requests (e.g. fan, calculator, kettle, lamp)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
              <select
                value={selectedHostel}
                onChange={(e) => setSelectedHostel(e.target.value)}
                aria-label="Filter by hostel"
                className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                {HOSTELS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20 font-semibold'
                      : 'border border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demands Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 animate-pulse"
                />
              ))}
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-500 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">
                No active requests found
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                No students currently requested this item. Be the first to post what you need!
              </p>
              <Button
                variant="primary"
                className="mt-5 gap-2"
                onClick={() => setShowPostModal(true)}
              >
                <Plus className="h-4 w-4" />
                Post Request
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDemands.map((item) => {
                const urgencyColor =
                  item.urgency === 'high'
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : item.urgency === 'low'
                    ? 'border-slate-600/30 bg-slate-800/40 text-slate-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300';

                return (
                  <motion.div
                    key={item.request_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 p-5 shadow-lg backdrop-blur-sm hover:border-teal-500/40 transition-all group"
                  >
                    <div>
                      {/* Top Requester Row */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-300 ring-1 ring-teal-500/30">
                            {item.requester_alias
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200 leading-tight">
                              {item.requester_alias}
                            </p>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {item.hostel} {item.block ? `· ${item.block}` : ''}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${urgencyColor}`}
                        >
                          {item.urgency || 'medium'} urgency
                        </span>
                      </div>

                      {/* Request Title / Keywords */}
                      <h2 className="text-base font-bold text-white capitalize group-hover:text-teal-300 transition-colors">
                        {item.keywords.join(', ') || 'Item request'}
                      </h2>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-400">
                          #{item.category}
                        </span>
                        {item.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] text-teal-300 border border-teal-500/20"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3.5">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>

                      <Link to="/scan">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-1.5 text-xs text-teal-300 border-teal-500/30 hover:border-teal-400"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          I Have This
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Post Request Modal */}
        <AnimatePresence>
          {showPostModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg rounded-3xl border border-teal-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl"
              >
                <button
                  onClick={() => setShowPostModal(false)}
                  className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">
                    Post a Campus Request
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    What item are you looking for? Fellow students scanning items will be notified to share or donate.
                  </p>
                </div>

                {submitSuccess ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-teal-400 mb-2 animate-bounce" />
                    <p className="text-base font-semibold text-white">
                      Request posted successfully!
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Our scout AI will match you as soon as someone scans this item.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateDemand} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Item you need *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Table fan, scientific calculator fx-991, study lamp"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        >
                          <option value="electronics">Electronics</option>
                          <option value="books">Books & Notes</option>
                          <option value="furniture">Furniture</option>
                          <option value="kitchen">Kitchen Appliances</option>
                          <option value="misc">Miscellaneous</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Urgency
                        </label>
                        <select
                          value={urgency}
                          onChange={(e) => setUrgency(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        >
                          <option value="low">Low (Next few weeks)</option>
                          <option value="medium">Medium (This week)</option>
                          <option value="high">High (Urgent / Need today)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Hostel / Residence
                        </label>
                        <select
                          value={hostel}
                          onChange={(e) => setHostel(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
                        >
                          {HOSTELS.filter((h) => h !== 'All Hostels').map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Room / Wing
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Block C, Room 214"
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                        >
                        </input>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Your Name or Student Alias *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Priya S."
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                      />
                    </div>

                    <div className="pt-3 flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowPostModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                        className="gap-1.5"
                      >
                        {submitting ? 'Publishing...' : 'Publish Request'}
                      </Button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
