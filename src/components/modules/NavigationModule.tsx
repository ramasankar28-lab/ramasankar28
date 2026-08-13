import { useState, useEffect, useMemo } from 'react';
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
  ArrowUpRight,
  Footprints,
  Stethoscope,
  Users,
  PhoneCall,
  Accessibility,
  Filter,
  Coffee,
  HeartPulse,
  ShieldAlert,
  CreditCard,
  Pill,
  TestTube,
  QrCode,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  UserCheck,
  DoorOpen,
  ArrowUpDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { HospitalLocation } from '../../types';
import { hospitalService } from '../../services/hospitalService';

export function NavigationModule() {
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<string>('loc-1'); // Default: Main Entrance
  const [destinationId, setDestinationId] = useState<string>('loc-4'); // Default: General OPD
  const [activeFloor, setActiveFloor] = useState<string>('Ground Floor');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isAccessibleRoute, setIsAccessibleRoute] = useState<boolean>(false);
  const [selectedLocationForModal, setSelectedLocationForModal] = useState<HospitalLocation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    hospitalService.getLocations().then((locs) => {
      setLocations(locs);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch locations:', err);
      setLoading(false);
    });
  }, []);

  const currentLocation = useMemo(() => {
    return locations.find((l) => l.id === currentLocationId) || locations[0];
  }, [locations, currentLocationId]);

  const destinationLocation = useMemo(() => {
    return locations.find((l) => l.id === destinationId) || locations[1];
  }, [locations, destinationId]);

  // When destination changes, automatically switch map view to destination's floor
  useEffect(() => {
    if (destinationLocation && destinationLocation.floor) {
      setActiveFloor(destinationLocation.floor);
    }
  }, [destinationId, destinationLocation]);

  const floors = ['Ground Floor', '1st Floor', '2nd Floor', 'Basement 1'];

  // Distance & Time Calculation
  const routeMetrics = useMemo(() => {
    if (!currentLocation || !destinationLocation) {
      return { distanceMeters: 50, timeMins: 1, steps: 65, sameFloor: true, floorChange: 0 };
    }

    const startX = currentLocation.x || 20;
    const startY = currentLocation.y || 80;
    const endX = destinationLocation.x || 60;
    const endY = destinationLocation.y || 40;

    const floorOrder: Record<string, number> = {
      'Basement 1': -1,
      'Ground Floor': 0,
      '1st Floor': 1,
      '2nd Floor': 2,
      '3rd Floor': 3
    };

    const startFloorIdx = floorOrder[currentLocation.floor] ?? 0;
    const endFloorIdx = floorOrder[destinationLocation.floor] ?? 0;
    const floorDiff = Math.abs(endFloorIdx - startFloorIdx);

    // Euclidean coordinate distance on 100x100 grid (scaled to meters)
    const dx = endX - startX;
    const dy = endY - startY;
    const planarDistance = Math.sqrt(dx * dx + dy * dy) * 1.5; // ~1.5m per grid unit

    // Floor transition penalty
    const verticalDistance = floorDiff * 35; // 35 meters equivalent for elevator/stairs
    let totalDistance = Math.round(planarDistance + verticalDistance);

    // Minimum distance if same location
    if (currentLocation.id === destinationLocation.id) {
      totalDistance = 0;
    } else {
      totalDistance = Math.max(20, totalDistance);
    }

    // Walking pace (1.2 m/s -> ~72m per min for normal, 0.9 m/s for wheelchair/accessible)
    const speedMetersPerMin = isAccessibleRoute ? 55 : 70;
    let timeMins = Math.ceil(totalDistance / speedMetersPerMin);
    if (totalDistance === 0) timeMins = 0;

    const steps = Math.round(totalDistance * 1.35); // ~1.35 steps per meter

    return {
      distanceMeters: totalDistance,
      timeMins,
      steps,
      sameFloor: floorDiff === 0,
      floorChange: floorDiff
    };
  }, [currentLocation, destinationLocation, isAccessibleRoute]);

  // Dynamic turn-by-turn route step generator
  const generatedRouteSteps = useMemo(() => {
    if (!currentLocation || !destinationLocation) return [];
    if (currentLocation.id === destinationLocation.id) {
      return [`You are currently at ${currentLocation.name}.`];
    }

    const steps: string[] = [];
    steps.push(`Start at ${currentLocation.name} (${currentLocation.wing}, ${currentLocation.floor}).`);

    if (!routeMetrics.sameFloor) {
      if (isAccessibleRoute) {
        steps.push(
          `Take Elevator A or B (Wheelchair Accessible) from ${currentLocation.floor} to ${destinationLocation.floor}.`
        );
      } else {
        steps.push(
          `Head to Central Elevator / Stairwell bank. Proceed from ${currentLocation.floor} up/down to ${destinationLocation.floor}.`
        );
      }
    }

    // Wing-specific direction
    if (destinationLocation.category === 'LABORATORY') {
      steps.push(`On ${destinationLocation.floor}, follow the solid BLUE tactile pathway line on the corridor floor.`);
    } else if (destinationLocation.category === 'EMERGENCY') {
      steps.push(`Follow the continuous RED emergency line straight into the East Emergency Wing.`);
    } else if (destinationLocation.category === 'PHARMACY') {
      steps.push(`Walk towards Block B Exit corridor. Pharmacy counters are on your left.`);
    } else if (destinationLocation.category === 'BILLING') {
      steps.push(`Look for the circular illuminated "Central Billing & Cashier" banner in the Atrium.`);
    } else {
      steps.push(`Walk towards ${destinationLocation.wing}. Look for room signages for ${destinationLocation.name}.`);
    }

    steps.push(
      `Arrive at ${destinationLocation.name} (Counters / Desks 1-${destinationLocation.activeCounters || 3}).`
    );

    return steps;
  }, [currentLocation, destinationLocation, routeMetrics, isAccessibleRoute]);

  // Filtered locations list for search & list view
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesFloor = activeFloor === 'ALL' || loc.floor === activeFloor;

      let matchesCategory = true;
      if (categoryFilter === 'COUNTERS') {
        matchesCategory = ['REGISTRATION', 'BILLING', 'PHARMACY'].includes(loc.category);
      } else if (categoryFilter === 'CLINICAL') {
        matchesCategory = ['OPD', 'LABORATORY', 'EMERGENCY', 'CLINICAL'].includes(loc.category);
      } else if (categoryFilter === 'AMENITIES') {
        matchesCategory = ['AMENITY', 'ENTRY'].includes(loc.category);
      } else if (categoryFilter === 'WARDS') {
        matchesCategory = ['WARD'].includes(loc.category);
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.category.toLowerCase().includes(q) ||
        loc.wing.toLowerCase().includes(q) ||
        loc.floor.toLowerCase().includes(q) ||
        (loc.doctorsList && loc.doctorsList.some((doc) => doc.toLowerCase().includes(q))) ||
        (loc.servicesOffered && loc.servicesOffered.some((s) => s.toLowerCase().includes(q)));

      return matchesFloor && matchesCategory && matchesQuery;
    });
  }, [locations, activeFloor, categoryFilter, searchQuery]);

  // Handle TTS directions audio simulation
  const handleToggleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const text = `Navigating from ${currentLocation.name} to ${destinationLocation.name}. Estimated distance ${routeMetrics.distanceMeters} meters, approximately ${routeMetrics.timeMins} minutes. ${generatedRouteSteps.join(' ')}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    } else {
      alert('Text-to-speech is not supported in this browser preview.');
    }
  };

  const handleSwapStartAndEnd = () => {
    const temp = currentLocationId;
    setCurrentLocationId(destinationId);
    setDestinationId(temp);
  };

  const handleShareDirections = () => {
    const shareText = `Hospital Navigation: ${currentLocation.name} ➔ ${destinationLocation.name} (${routeMetrics.distanceMeters}m, ~${routeMetrics.timeMins} mins). Floor: ${destinationLocation.floor}, ${destinationLocation.wing}.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setShareSuccessMessage('Navigation link & route copied to clipboard!');
      setTimeout(() => setShareSuccessMessage(null), 4000);
    }
  };

  // Helper for category badge styling & icon
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'REGISTRATION':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserCheck, label: 'Registration' };
      case 'OPD':
        return { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Stethoscope, label: 'OPD Consult' };
      case 'LABORATORY':
        return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TestTube, label: 'Lab & Diagnostics' };
      case 'PHARMACY':
        return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Pill, label: 'Pharmacy' };
      case 'BILLING':
        return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: CreditCard, label: 'Billing Desk' };
      case 'EMERGENCY':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: ShieldAlert, label: 'Emergency 24/7' };
      case 'WARD':
        return { color: 'bg-rose-100 text-rose-800 border-rose-200', icon: HeartPulse, label: 'Inpatient Ward' };
      case 'AMENITY':
        return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Coffee, label: 'Amenity' };
      case 'ENTRY':
        return { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: DoorOpen, label: 'Main Entrance' };
      default:
        return { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: MapPin, label: category };
    }
  };

  // Helper for crowd status color
  const getCrowdBadge = (crowd?: string) => {
    switch (crowd) {
      case 'LOW':
        return <Badge variant="success">Low Crowd</Badge>;
      case 'MODERATE':
        return <Badge variant="info">Moderate Crowd</Badge>;
      case 'HIGH':
        return <Badge variant="warning">Busy / High Crowd</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger">Heavy Crowd</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Smart Hospital Indoor Wayfinder & Counter Locator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulated interactive blueprint navigation solving patient & attendant confusion across counters, OPDs, labs, pharmacy, and wards.
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility & Voice Control Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAccessibleRoute(!isAccessibleRoute)}
            className={`px-3 py-1.5 text-xs rounded-xl font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
              isAccessibleRoute
                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Accessibility className="h-4 w-4" />
            <span>{isAccessibleRoute ? 'Wheelchair / Ramp Mode: ON' : 'Wheelchair Route'}</span>
          </button>

          <button
            onClick={handleToggleSpeech}
            className={`px-3 py-1.5 text-xs rounded-xl font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-sky-600 text-white border-sky-700 animate-pulse'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Voice Assistant'}</span>
          </button>

          <button
            onClick={handleShareDirections}
            className="px-3 py-1.5 text-xs rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Route</span>
          </button>
        </div>
      </div>

      {shareSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{shareSuccessMessage}</span>
        </div>
      )}

      {/* Origin & Destination Wayfinding Controls Bar */}
      <Card className="border-sky-200 bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white shadow-md">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Start Location Picker */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-bold text-sky-200 uppercase tracking-wider flex items-center space-x-1">
                <MapPin className="h-3.5 w-3.5 text-teal-400" />
                <span>Current Location (Start Point)</span>
              </label>
              <select
                value={currentLocationId}
                onChange={(e) => setCurrentLocationId(e.target.value)}
                className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-teal-400 focus:outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                    {loc.name} ({loc.floor} - {loc.wing})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center pt-2 md:pt-4">
              <button
                onClick={handleSwapStartAndEnd}
                title="Swap origin and destination"
                className="p-2.5 bg-white/10 hover:bg-white/20 text-teal-300 rounded-full border border-white/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>

            {/* Destination Picker */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-[11px] font-bold text-teal-200 uppercase tracking-wider flex items-center space-x-1">
                <Navigation className="h-3.5 w-3.5 text-amber-400" />
                <span>Target Destination</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-slate-800/90 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-teal-400 focus:outline-none cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-slate-900 text-white">
                    {loc.name} ({loc.floor} - {loc.wing})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-Time Wayfinding Summary Metrics */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Distance</span>
              <div className="text-lg font-black text-white flex items-center space-x-1">
                <span>{routeMetrics.distanceMeters} Meters</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Est. Walking Time</span>
              <div className="text-lg font-black text-teal-300 flex items-center space-x-1">
                <Clock className="h-4 w-4 mr-1 text-teal-400" />
                <span>~{routeMetrics.timeMins} {routeMetrics.timeMins === 1 ? 'Minute' : 'Minutes'}</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Approx. Steps</span>
              <div className="text-lg font-black text-amber-300 flex items-center space-x-1">
                <Footprints className="h-4 w-4 mr-1 text-amber-400" />
                <span>~{routeMetrics.steps} Steps</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Floor Elevation</span>
              <div className="text-xs font-bold text-sky-200 mt-1">
                {routeMetrics.sameFloor ? (
                  <span className="text-emerald-400 font-bold">Same Floor ({currentLocation.floor})</span>
                ) : (
                  <span>
                    {currentLocation.floor} ➔ {destinationLocation.floor}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid Layout: Interactive Blueprint Floor Plan vs Location Search & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Blueprint Indoor Floor Map */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base text-white flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-sky-400" />
                  <span>Interactive Blueprint Floor Map</span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Click markers to view counters, doctors, services & queue status
                </CardDescription>
              </div>

              {/* Floor Switcher */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                {floors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setActiveFloor(floor)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      activeFloor === floor
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {floor.replace(' Floor', '')}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-4 bg-slate-950 relative overflow-hidden">
              {/* Simulated SVG Blueprint Background */}
              <div className="relative min-h-[420px] rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden select-none">
                {/* Blueprint Grid Lines SVG */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Architectural Corridor / Room Outlines */}
                <div className="absolute inset-4 border-2 border-dashed border-slate-800/80 rounded-lg pointer-events-none">
                  {/* Central Atrium Zone */}
                  <div className="absolute left-[20%] top-[40%] w-[60%] h-[35%] border border-sky-900/50 bg-sky-950/20 rounded-md flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-sky-600/60">
                      {activeFloor} - Central Atrium Lobby
                    </span>
                  </div>

                  {/* Block A Corridor */}
                  <div className="absolute left-[5%] top-[10%] w-[40%] h-[25%] border border-slate-800 bg-slate-900/40 rounded-md flex items-center justify-center">
                    <span className="text-[9px] font-mono text-slate-500">Block A (North Corridor)</span>
                  </div>

                  {/* Block B East Wing */}
                  <div className="absolute right-[5%] top-[10%] w-[40%] h-[25%] border border-slate-800 bg-slate-900/40 rounded-md flex items-center justify-center">
                    <span className="text-[9px] font-mono text-slate-500">Block B (East Wing)</span>
                  </div>

                  {/* Elevator & Stairs Hub */}
                  <div className="absolute left-[45%] top-[10%] w-[10%] h-[25%] border border-amber-800/40 bg-amber-950/20 rounded-md flex flex-col items-center justify-center">
                    <Layers className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-[8px] font-mono text-amber-400 mt-0.5">Elevator A/B</span>
                  </div>
                </div>

                {/* Animated Route SVG Line connecting Start and End if on Active Floor */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {currentLocation && destinationLocation && currentLocation.floor === activeFloor && destinationLocation.floor === activeFloor && currentLocation.id !== destinationLocation.id && (
                    <g>
                      <line
                        x1={`${currentLocation.x}%`}
                        y1={`${currentLocation.y}%`}
                        x2={`${destinationLocation.x}%`}
                        y2={`${destinationLocation.y}%`}
                        stroke="#38bdf8"
                        strokeWidth="3"
                        strokeDasharray="6,6"
                        className="animate-pulse"
                      />
                      <line
                        x1={`${currentLocation.x}%`}
                        y1={`${currentLocation.y}%`}
                        x2={`${destinationLocation.x}%`}
                        y2={`${destinationLocation.y}%`}
                        stroke="#2dd4bf"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                    </g>
                  )}
                </svg>

                {/* Clickable Location Markers on Active Floor */}
                {locations
                  .filter((loc) => loc.floor === activeFloor)
                  .map((loc) => {
                    const isStart = currentLocationId === loc.id;
                    const isEnd = destinationId === loc.id;
                    const isSelected = selectedLocationForModal?.id === loc.id;
                    const meta = getCategoryMeta(loc.category);
                    const CategoryIcon = meta.icon;

                    return (
                      <div
                        key={loc.id}
                        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                        onClick={() => {
                          setSelectedLocationForModal(loc);
                          setDestinationId(loc.id);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all cursor-pointer group hover:scale-110`}
                      >
                        {/* Selected pulse animation */}
                        {(isStart || isEnd || isSelected) && (
                          <span
                            className={`absolute inset-0 -m-2 rounded-full animate-ping opacity-75 ${
                              isStart ? 'bg-teal-400' : isEnd ? 'bg-amber-400' : 'bg-sky-400'
                            }`}
                          />
                        )}

                        {/* Pin Marker Button */}
                        <div
                          className={`relative flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-extrabold border shadow-lg ${
                            isStart
                              ? 'bg-teal-500 text-slate-950 border-teal-300 ring-2 ring-teal-400'
                              : isEnd
                              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400'
                              : 'bg-slate-900 text-white border-slate-700 hover:border-sky-400'
                          }`}
                        >
                          <CategoryIcon
                            className={`h-3.5 w-3.5 ${
                              isStart ? 'text-slate-950' : isEnd ? 'text-slate-950' : 'text-sky-400'
                            }`}
                          />
                          <span className="max-w-[100px] truncate">{loc.name.split(' ')[0]}</span>

                          {/* Wait Badge inside pin */}
                          {loc.queueWaitMins > 0 && (
                            <span className="ml-1 px-1 bg-black/40 text-[9px] rounded font-mono text-amber-300">
                              {loc.queueWaitMins}m
                            </span>
                          )}
                        </div>

                        {/* Hover Tooltip Popup */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2.5 bg-slate-900 text-white text-[11px] rounded-xl border border-slate-700 shadow-2xl z-30 pointer-events-none">
                          <div className="font-bold text-sky-300">{loc.name}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {loc.wing} &bull; {loc.activeCounters} Counters
                          </div>
                          {loc.queueWaitMins > 0 && (
                            <div className="text-amber-300 text-[10px] font-bold mt-1">
                              Live Wait: ~{loc.queueWaitMins} mins
                            </div>
                          )}
                          <div className="text-teal-400 text-[9px] mt-1 font-semibold">
                            Click to set as destination
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Map Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 gap-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-400 ring-2 ring-teal-500/50" />
                    <span>Current Origin</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/50" />
                    <span>Target Destination</span>
                  </div>
                </div>

                <div className="text-slate-500 text-[10px]">
                  Showing locations for <strong className="text-sky-300">{activeFloor}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Turn-by-Turn Pathway Wayfinding Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Navigation className="h-4 w-4 text-sky-600" />
                <span>Turn-by-Turn Route Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {generatedRouteSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl transition-all"
                >
                  <div className="h-5 w-5 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Destination Search, Counter Finder & Selected Location Details */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Category Filter */}
          <Card className="border-slate-200 shadow-2xs">
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search location, doctor name, counter, or lab test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'COUNTERS', label: 'Counters' },
                  { id: 'CLINICAL', label: 'OPD & Labs' },
                  { id: 'AMENITIES', label: 'Amenities' },
                  { id: 'WARDS', label: 'Wards' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target Destination Detail View */}
          {destinationLocation && (
            <Card className="border-sky-300 shadow-md">
              <CardHeader className="bg-gradient-to-r from-sky-900 to-teal-900 text-white rounded-t-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                      Selected Target Destination
                    </span>
                    <CardTitle className="text-lg text-white mt-0.5">{destinationLocation.name}</CardTitle>
                    <CardDescription className="text-sky-100 text-xs mt-0.5">
                      {destinationLocation.floor} &bull; {destinationLocation.wing}
                    </CardDescription>
                  </div>

                  <div className="shrink-0 text-right">
                    {getCrowdBadge(destinationLocation.crowdLevel)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Status Bar */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Operating Hours</span>
                    <span className="font-extrabold text-slate-800">{destinationLocation.openHours}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Live Queue Wait</span>
                    <span className="font-extrabold text-amber-700">
                      {destinationLocation.queueWaitMins > 0 ? `~${destinationLocation.queueWaitMins} Minutes` : 'Fast Track / No Wait'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Active Counters</span>
                    <span className="font-extrabold text-slate-800">{destinationLocation.activeCounters} Counters Open</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Phone Extension</span>
                    <span className="font-extrabold text-slate-800">{destinationLocation.contactExt || '1000'}</span>
                  </div>
                </div>

                {/* Description */}
                {destinationLocation.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-2.5 rounded-xl border border-sky-100">
                    {destinationLocation.description}
                  </p>
                )}

                {/* Doctors List if clinical */}
                {destinationLocation.doctorsList && destinationLocation.doctorsList.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center space-x-1">
                      <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Doctors Available On Duty</span>
                    </span>
                    <div className="space-y-1">
                      {destinationLocation.doctorsList.map((doc, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-semibold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between"
                        >
                          <span>{doc}</span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            Consulting
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services Offered */}
                {destinationLocation.servicesOffered && destinationLocation.servicesOffered.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      Services & Facilities Offered
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {destinationLocation.servicesOffered.map((srv, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filtered Locations List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              Matching Locations ({filteredLocations.length})
            </div>

            {filteredLocations.map((loc) => {
              const isSelected = destinationId === loc.id;
              const meta = getCategoryMeta(loc.category);
              const CategoryIcon = meta.icon;

              return (
                <div
                  key={loc.id}
                  onClick={() => setDestinationId(loc.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/80 shadow-2xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <div className={`p-2 rounded-lg border ${meta.color} shrink-0 mt-0.5`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900">{loc.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {loc.floor} &bull; {loc.wing}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ~{loc.queueWaitMins}m wait
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
