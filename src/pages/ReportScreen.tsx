import React, { useState } from 'react';
import { AlertTriangle, Camera, MapPin, CheckCircle, Shield } from 'lucide-react';
import { useClimate } from '../context/ClimateContext';
import { IncidentMapPicker } from '../components/IncidentMapPicker';

export const ReportScreen: React.FC = () => {
  const { addReport, setActiveTab } = useClimate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Flood & Clogged Drainage');
  const [severity, setSeverity] = useState<'Low' | 'Moderate' | 'High' | 'Critical'>('Moderate');
  const [barangay, setBarangay] = useState('Barangay Makilas');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [lat, setLat] = useState(14.5995);
  const [lng, setLng] = useState(120.9842);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    addReport({
      title,
      category,
      severity,
      barangay,
      locationText,
      description,
      photoUrl,
      latitude: lat,
      longitude: lng
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveTab('home');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Submit Environmental Hazard Report</h1>
        <p className="text-xs text-slate-400 mt-1">Direct alert dispatch to LGU CENRO inspection and quick response units.</p>
      </div>

      {submitted ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Hazard Report Dispatched!</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your report has been sent to CENRO Triage. You earned <span className="font-bold text-emerald-400">+25 Eco-Points</span>!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Incident Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Clogged Canal Overflow at Purok 2"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Flood & Clogged Drainage">Flood & Clogged Drainage</option>
                <option value="Illegal Solid Waste Dumping">Illegal Solid Waste Dumping</option>
                <option value="River / Water Pollution">River / Water Pollution</option>
                <option value="Fallen Trees & Erosion">Fallen Trees & Erosion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Severity Priority *</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Moderate">Moderate Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical (Immediate Emergency)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Barangay *</label>
              <select
                value={barangay}
                onChange={e => setBarangay(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Barangay Makilas">Barangay Makilas</option>
                <option value="Barangay San Isidro">Barangay San Isidro</option>
                <option value="Barangay Verde Coast">Barangay Verde Coast</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Street / Landmark</label>
              <input
                type="text"
                value={locationText}
                onChange={e => setLocationText(e.target.value)}
                placeholder="e.g. Near Makilas Bridge"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Pin Location on Interactive Map</label>
            <IncidentMapPicker
              interactive={true}
              onSelectLocation={(selectedLat, selectedLng) => {
                setLat(selectedLat);
                setLng(selectedLng);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description & Inspection Details *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the environmental hazard, water level, or urgency..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Attach Photo Evidence</label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-800/30 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {photoUrl ? (
                <div>
                  <img src={photoUrl} alt="Evidence" className="max-h-36 mx-auto rounded-lg border border-emerald-500" />
                  <span className="block text-[10px] text-emerald-400 font-bold mt-2">Click to replace photo</span>
                </div>
              ) : (
                <div>
                  <Camera className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-200">Click to Select / Take Photo</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Attach photo showing the hazard</div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dispatch Incident Report to CENRO Triage</span>
          </button>
        </form>
      )}
    </div>
  );
};
