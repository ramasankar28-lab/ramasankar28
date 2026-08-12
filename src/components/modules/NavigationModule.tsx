import { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Clock,
  Search,
  Building2,
  ChevronRight,
  Layers,
  Info,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { HospitalLocation } from '../../types';
import { hospitalService } from '../../services/hospitalService';

export function NavigationModule() {
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<HospitalLocation | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    hospitalService.getLocations().then((locs) => {
      setLocations(locs);
      setSelectedLocation(locs[0] || null);
      setLoading(false);
    });
  }, []);

  const floors = ['ALL', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement 1'];

  const filteredLocations = locations.filter((loc) => {
    const matchesFloor = selectedFloor === 'ALL' || loc.floor === selectedFloor;
    const matchesQuery =
      !searchQuery ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.wing.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Hospital Counter & Department Wayfinder
            </h2>
            <Badge variant="info">Smart Navigation</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eliminating patient attendant confusion. Locate counters, view live queue wait times, and get turn-by-turn steps.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          <Layers className="h-4 w-4 text-slate-500 ml-1" />
          <span className="text-xs font-semibold text-slate-600 mr-1">Floor:</span>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                selectedFloor === floor
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {floor === 'ALL' ? 'All Floors' : floor.replace(' Floor', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Search & Location Cards vs Interactive Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Location List */}
        <div className="space-y-4 lg:col-span-1">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Counter, Pharmacy, Lab, Billing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/80 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/60 px-1.5 py-0.5 rounded-sm">
                        {loc.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{loc.name}</h4>
                      <p className="text-xs text-slate-500">
                        {loc.floor} &bull; {loc.wing}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        Live Wait
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ~{loc.queueWaitMins} mins
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Direction Steps & Interactive Wayfinder Card */}
        <div className="lg:col-span-2 space-y-4">
          {selectedLocation ? (
            <Card className="border-sky-200 shadow-md">
              <CardHeader className="bg-gradient-to-r from-sky-900 to-teal-900 text-white rounded-t-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                      Target Destination Selected
                    </span>
                    <CardTitle className="text-xl text-white mt-0.5">
                      {selectedLocation.name}
                    </CardTitle>
                    <CardDescription className="text-sky-100">
                      {selectedLocation.floor} &bull; {selectedLocation.wing}
                    </CardDescription>
                  </div>

                  <div className="text-left sm:text-right bg-white/10 p-2.5 rounded-lg border border-white/20">
                    <span className="text-[10px] font-bold uppercase text-teal-200 block">
                      Active Counters
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {selectedLocation.activeCounters} Counters Open
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Live Counter Operational Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Current Queue Wait
                    </span>
                    <div className="text-lg font-black text-amber-700">
                      ~{selectedLocation.queueWaitMins} Minutes
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Operating Hours
                    </span>
                    <div className="text-sm font-bold text-slate-800">
                      {selectedLocation.openHours}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Congestion Status
                    </span>
                    <div>
                      <Badge variant={selectedLocation.queueWaitMins > 10 ? 'warning' : 'success'}>
                        {selectedLocation.queueWaitMins > 10 ? 'Moderate Queue' : 'Fast Moving'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Pathway Directions */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                    <Navigation className="h-4 w-4 mr-2 text-sky-600" />
                    Turn-by-Turn Wayfinding Instructions
                  </h4>

                  <div className="space-y-3">
                    {selectedLocation.directionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3 p-3 bg-white border border-slate-200 rounded-lg shadow-2xs"
                      >
                        <div className="h-6 w-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed pt-0.5">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visual Hospital Floorplan Blueprint Sketch */}
                <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-400 flex items-center">
                      <Compass className="h-4 w-4 mr-1.5" />
                      Digital Floor Blueprint Indicator
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {selectedLocation.floor} Map Projection
                    </span>
                  </div>

                  <div className="h-32 bg-slate-950/80 rounded-lg border border-slate-800 p-4 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                    <div className="relative z-10 text-center space-y-2">
                      <div className="inline-flex items-center px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-full text-xs font-bold animate-pulse">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-teal-400" />
                        {selectedLocation.name} ({selectedLocation.wing})
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Follow the illuminated color-coded overhead banners to counter desk.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500">
              Select a location on the left to view wayfinding instructions.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
