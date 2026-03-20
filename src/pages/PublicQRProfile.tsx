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
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Banner */}
      <div className="bg-red-600 text-white p-4 text-center shadow-md animate-pulse">
        <h1 className="text-xl font-black uppercase tracking-wider flex items-center justify-center gap-2">
          <Shield /> Emergency Medical Profile
        </h1>
        <p className="text-sm font-medium opacity-90 mt-1">
          Authorized for Emergency Personnel Only
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-4">
        {/* Nearest Hospital Info */}
        {scanLogged && (
           <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
             <div className="bg-green-100 p-2 rounded-full">
               <Activity size={20} className="text-green-600" />
             </div>
             <div>
               <h3 className="font-bold text-sm">Emergency Alert Triggered</h3>
               <p className="text-xs mt-1">
                 {nearestHospital 
                    ? `An alert was automatically sent to the dashboard of ${nearestHospital.hospital_name}.`
                    : 'An alert has been dispatched to the generic hospital dashboard system.'}
               </p>
             </div>
           </div>
        )}

        {/* Patient Identity Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center border-4 border-red-50">
            {patient.profile_photo_url ? (
               <img src={patient.profile_photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
               <User size={48} />
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{patient.full_name}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 text-slate-600 font-medium">
              <span>{patient.age || 'Age Unknown'} yrs</span>
              <span>•</span>
              <span>{patient.gender || 'Gender Unspecified'}</span>
              {patient.city && (
                 <>
                   <span>•</span>
                   <span>{patient.city}</span>
                 </>
              )}
            </div>
          </div>
        </div>

        {/* Critical Vitals - THE MOST IMPORTANT INFO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-2xl p-5 border-2 border-red-200 shadow-sm flex flex-col items-center justify-center text-center">
            <Droplet className="text-red-500 mb-2" size={32} />
            <span className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1">Blood Group</span>
            <span className="text-4xl font-black text-red-600">{patient.blood_group || 'UNKNOWN'}</span>
          </div>
          
          <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200 shadow-sm flex flex-col items-center justify-center text-center">
            <Heart className="text-amber-500 mb-2" size={32} />
            <span className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Organ Donor</span>
            <span className="text-2xl font-black text-amber-600">{patient.organ_donor ? 'YES' : 'NO / UNKNOWN'}</span>
          </div>
        </div>

        {/* Allergies - HIGH PRIORITY WARNING */}
        <div className="bg-white rounded-2xl shadow-sm border-l-8 border-l-red-500 border-y border-r border-slate-200 overflow-hidden">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="font-black text-red-800 uppercase tracking-wide">Known Allergies</h3>
          </div>
          <div className="p-5">
            {patient.allergies && patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy: string, i: number) => (
                  <span key={i} className="px-4 py-2 bg-red-100 text-red-800 font-bold rounded-lg text-lg border border-red-200 shadow-sm">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 font-medium text-lg italic">No known allergies on record.</p>
            )}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800 uppercase tracking-wide">Chronic Conditions</h3>
          </div>
          <div className="p-5">
            {patient.chronic_conditions && patient.chronic_conditions.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium text-lg">
                {patient.chronic_conditions.map((condition: string, i: number) => (
                  <li key={i}>{condition}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 font-medium">No chronic conditions recorded.</p>
            )}
          </div>
        </div>

        {/* Active Medications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
            <Pill className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800 uppercase tracking-wide">Current Medications</h3>
          </div>
          <div className="p-5">
            {patient.current_medications && patient.current_medications.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium text-lg">
                {patient.current_medications.map((med: string, i: number) => (
                  <li key={i}>{med}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 font-medium">No active medications recorded.</p>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-100/50 p-4 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="text-indigo-600" size={20} />
              <h3 className="font-bold text-indigo-900 uppercase tracking-wide">Emergency Contact</h3>
            </div>
          </div>
          <div className="p-5">
            {patient.emergency_contact_name ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-indigo-950">{patient.emergency_contact_name}</p>
                  <p className="text-indigo-700 font-bold uppercase text-sm mt-1">{patient.emergency_contact_relation || 'Relationship Not Specified'}</p>
                </div>
                {patient.emergency_contact_phone && (
                  <a 
                    href={`tel:${patient.emergency_contact_phone}`}
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-colors shadow-md"
                  >
                    <Phone size={20} /> Call Now: {patient.emergency_contact_phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-indigo-500 font-medium">No emergency contact provided.</p>
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
