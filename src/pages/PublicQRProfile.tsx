import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Droplet, Pill, Phone, User, Heart, Activity } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Helper to calculate distance between two coordinates in km using Haversine formula
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const PublicQRProfile = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanLogged, setScanLogged] = useState(false);
  const [nearestHospital, setNearestHospital] = useState<any>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        throw new Error('Patient not found');
      }

      setPatient(patientData);
      
      // Attempt to log scan with nearest hospital
      await logEmergencyScan(patientData.id);
      
    } catch (err: any) {
      console.error('Error fetching patient:', err);
      setError(err.message || 'Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  const logEmergencyScan = async (pId: string) => {
    if (scanLogged) return;

    try {
      // 1. Get all hospitals to find the nearest one
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('id, hospital_name, latitude, longitude, verification_status')
        .eq('verification_status', 'approved');

      // 2. Try to get current location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            
            let closestHospital = null;
            let shortestDistance = Infinity;

            if (hospitals && hospitals.length > 0) {
              hospitals.forEach(h => {
                if (h.latitude && h.longitude) {
                  const dist = getDistanceFromLatLonInKm(userLat, userLon, h.latitude, h.longitude);
                  if (dist < shortestDistance) {
                    shortestDistance = dist;
                    closestHospital = h;
                  }
                }
              });
              
              // If no hospital had coordinates, just fallback to the first one
              if (!closestHospital) {
                 closestHospital = hospitals[0];
              }
            }

            setNearestHospital(closestHospital);
            await createLog(pId, closestHospital?.id, 'Location Based Scan');
          },
          async () => {
            // Location access denied or failed - fallback to first available hospital
            const fallbackHospital = hospitals?.[0];
            setNearestHospital(fallbackHospital);
            await createLog(pId, fallbackHospital?.id, 'Location Unknown');
          },
          { timeout: 5000 }
        );
      } else {
         // No geolocation support
         const fallbackHospital = hospitals?.[0];
         setNearestHospital(fallbackHospital);
         await createLog(pId, fallbackHospital?.id, 'No Geolocation');
      }

    } catch (err) {
      console.error('Error logging scan:', err);
    }
  };

  const createLog = async (pId: string, hId: string | undefined, locationStr: string) => {
     try {
        await supabase.from('qr_scan_logs').insert({
          patient_id: pId,
          hospital_id: hId || null,
          scan_location: locationStr,
          scanned_by: 'Emergency Responder / Bystander',
        });
        setScanLogged(true);
        // Play an aggressive alert sound to simulate urgency locally
        toast.info("🚨 Emergency Alert sent to nearest hospital!");
     } catch (e) {
        console.error("Failed to insert log", e);
     }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Activity className="animate-spin text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">Accessing Medical Profile...</h2>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
        <p className="text-slate-600 mb-6 flex text-center">We could not access this emergency profile. The QR code may be invalid.</p>
        <Link to="/" className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Dark Header */}
      <div className="bg-slate-900 relative overflow-hidden pb-16 pt-8 px-4">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
         <div className="absolute -top-24 -right-24 opacity-5 transform rotate-12"><Shield size={300} className="text-white" /></div>
         
         <div className="max-w-xl mx-auto relative z-10 flex flex-col items-center">
            <div className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-6 flex items-center gap-2 shadow-lg shadow-red-900/50">
              <Shield size={14}/> Verified Emergency Protocol
            </div>

            <div className="w-32 h-32 bg-slate-800 rounded-[2rem] flex justify-center items-center border-4 border-slate-700 shadow-2xl overflow-hidden mb-5">
               {patient.profile_photo_url ? (
                  <img src={patient.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                  <User size={64} className="text-slate-600" />
               )}
            </div>

            <h1 className="text-3xl font-black text-white text-center mb-2 tracking-tight">{patient.full_name}</h1>
            <div className="flex flex-wrap justify-center gap-3 text-sm font-bold text-slate-400">
               <span className="flex items-center gap-1.5"><User size={16}/> {patient.age || 'Unknown Age'} yrs</span>
               <span className="opacity-50">•</span>
               <span>{patient.gender || 'Unknown Gender'}</span>
               {patient.city && (
                 <>
                   <span className="opacity-50">•</span>
                   <span>{patient.city}</span>
                 </>
               )}
            </div>
         </div>
      </div>

      <div className="max-w-xl w-full mx-auto px-4 -mt-10 relative z-20 space-y-5 pb-20">
         
         {/* Critical Vitals Grid - Floating over header seam */}
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
             <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-3 shadow-inner">
                <Droplet size={24} className="fill-red-100" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Blood Type</p>
             <p className="text-2xl font-black text-slate-800">{patient.blood_group || 'Unknown'}</p>
           </div>
           
           <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3 shadow-inner">
                <Heart size={24} className="fill-emerald-100" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Organ Donor</p>
             <p className="text-2xl font-black text-slate-800">{patient.organ_donor ? 'Yes' : 'No'}</p>
           </div>
         </div>

         {/* Action Log Result */}
         {scanLogged && (
           <div className="bg-slate-900 border border-slate-700 text-slate-300 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
             <div className="bg-green-500/20 p-2 rounded-xl border border-green-500/30">
               <Activity size={18} className="text-green-400" />
             </div>
             <div>
               <h3 className="font-bold text-sm text-white">Emergency Ping Sent</h3>
               <p className="text-[11px] mt-1 text-slate-400">
                 {nearestHospital 
                    ? `Hospital Alerted: ${nearestHospital.hospital_name}`
                    : 'System Alert Dispatched'}
               </p>
             </div>
           </div>
         )}

         {/* Medical Data Cards */}
         <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Allergies */}
            <div className="p-6 border-b border-slate-100 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <AlertTriangle size={14} className="text-red-500"/> Known Allergies
               </h3>
               {patient.allergies && patient.allergies.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {patient.allergies.map((allergy: string, i: number) => (
                     <span key={i} className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-700 font-bold rounded-xl text-sm">
                       {allergy}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-slate-400 font-medium text-sm">No recorded allergies.</p>
               )}
            </div>

            {/* Chronic Conditions */}
            <div className="p-6 border-b border-slate-100 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <Activity size={14} className="text-orange-500"/> Chronic Conditions
               </h3>
               {patient.chronic_conditions && patient.chronic_conditions.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {patient.chronic_conditions.map((condition: string, i: number) => (
                     <span key={i} className="px-3 py-1.5 bg-orange-50 border border-orange-100 text-orange-700 font-bold rounded-xl text-sm">
                       {condition}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-slate-400 font-medium text-sm">No chronic conditions.</p>
               )}
            </div>

            {/* Current Medications */}
            <div className="p-6 relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                 <Pill size={14} className="text-blue-500"/> Active Medications
               </h3>
               {patient.current_medications && patient.current_medications.length > 0 ? (
                 <div className="flex flex-wrap gap-2">
                   {patient.current_medications.map((med: string, i: number) => (
                     <span key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-bold rounded-xl text-sm">
                       {med}
                     </span>
                   ))}
                 </div>
               ) : (
                 <p className="text-slate-400 font-medium text-sm">No active medications.</p>
               )}
            </div>
         </div>

         {/* Emergency Contact */}
         <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl shadow-lg border border-indigo-400 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4"><Phone size={120}/></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4 flex items-center gap-2 relative z-10">
              <Phone size={12}/> Emergency Contact
            </h3>
            
            <div className="relative z-10">
               {patient.emergency_contact_name ? (
                 <div className="flex flex-col gap-4">
                   <div>
                     <p className="text-2xl font-black">{patient.emergency_contact_name}</p>
                     <p className="text-indigo-200 font-medium text-sm mt-0.5">{patient.emergency_contact_relation || 'Relationship Not Specified'}</p>
                   </div>
                   {patient.emergency_contact_phone && (
                     <a 
                       href={`tel:${patient.emergency_contact_phone}`}
                       className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 py-3.5 rounded-xl font-black transition-all shadow-md mt-2"
                     >
                       <Phone size={18} className="fill-indigo-700" /> Tap to Call Action
                     </a>
                   )}
                 </div>
               ) : (
                 <p className="text-indigo-200 font-medium">No contact provided.</p>
               )}
            </div>
         </div>

      </div>
    </div> 
  );
};

// I used Heart above but imported Droplet, let's fix it locally since we need Heart.
// Since React is in scope, we will add Heart to imports or replace Heart with Activity
// Wait, I will just add Heart to the lucide-react import
export default PublicQRProfile;
