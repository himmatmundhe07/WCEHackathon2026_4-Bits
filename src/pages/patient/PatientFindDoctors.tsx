import { useEffect, useState } from 'react';
import { usePatientContext } from '@/hooks/usePatientContext';
import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from '@/hooks/useNotifications';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Search, MapPin, Phone, Building2, Bed, Clock, X, Calendar, Stethoscope, Star, Shield, Loader2, ChevronRight, Globe, Pill, Ambulance, Heart } from 'lucide-react';
import { toast } from 'sonner';

const PatientFindDoctors = () => {
  const { patient } = usePatientContext();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('All Areas');
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [uniqueAreas, setUniqueAreas] = useState<string[]>(['All Areas']);

  const fetchHospitals = async () => {
    setLoading(true);
    let q = supabase.from('hospitals').select('*').eq('verification_status', 'Verified');
    
    // First, let's fetch all active verified hospitals to build area filter
    const { data: allData } = await supabase.from('hospitals').select('city, district, state').eq('verification_status', 'Verified');
    if (allData) {
      const areas = Array.from(new Set(allData.flatMap((d: any) => [d.district, d.city, d.state]).filter(Boolean))) as string[];
      setUniqueAreas(['All Areas', ...areas]);
    }

    if (areaFilter !== 'All Areas') {
      q = q.or(`city.eq.${areaFilter},district.eq.${areaFilter},state.eq.${areaFilter}`);
    }
    
    if (search) q = q.or(`city.ilike.%${search}%,hospital_name.ilike.%${search}%,specializations.cs.{${search}}`);
    
    const { data } = await q.limit(20);
    setHospitals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHospitals(); }, [search, areaFilter]);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: '1px solid #E2EEF1' }}>
        <h2 className="text-lg font-bold mb-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
          🏥 Find Hospitals & Doctors
        </h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
            <input className="field-input pl-9" placeholder="Search by hospital name, city, or specialization..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-[180px]">
            <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} className="field-input">
              {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <p className="text-[12px] mt-2" style={{ color: '#94A3B8' }}>
          Showing {hospitals.length} verified hospitals {areaFilter !== 'All Areas' ? `in ${areaFilter}` : ''} {search && `matching "${search}"`}
        </p>
      </div>

      {/* Hospital Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: '#0891B2' }} />
        </div>
      ) : hospitals.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid #E2EEF1' }}>
          <Building2 size={40} className="mx-auto mb-3" style={{ color: '#D1EBF1' }} />
          <p className="text-[14px]" style={{ color: '#94A3B8' }}>No verified hospitals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map(h => (
            <div key={h.id}
              onClick={() => setSelectedHospital(h)}
              className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              style={{ border: '1px solid #E2EEF1' }}>
              <JharokhaArch color="#F59E0B" opacity={0.18} />
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {h.logo_url ? (
                    <img src={h.logo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: '#EBF7FA' }}>
                      <Building2 size={20} style={{ color: '#0891B2' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate group-hover:text-[#0891B2] transition-colors" style={{ color: '#1E293B' }}>{h.hospital_name}</p>
                    <p className="text-[12px]" style={{ color: '#64748B' }}>{h.facility_type}</p>
                    {h.emergency_24x7 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>⚡ 24/7 Emergency</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-[12px]" style={{ color: '#64748B' }}>
                  <p className="flex items-center gap-1"><MapPin size={12} /> {h.city}, {h.state}</p>
                  <p className="flex items-center gap-1"><Bed size={12} /> {h.total_beds || 0} beds · {h.total_doctors || 0} doctors</p>
                </div>

                {h.specializations?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {h.specializations.slice(0, 3).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: '#EBF7FA', color: '#0891B2' }}>{s}</span>
                    ))}
                    {h.specializations.length > 3 && <span className="text-[10px]" style={{ color: '#64748B' }}>+{h.specializations.length - 3}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                  {h.emergency_helpline && (
                    <a href={`tel:${h.emergency_helpline}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-[12px] font-bold" style={{ color: '#EF4444' }}>
                      <Phone size={12} /> {h.emergency_helpline}
                    </a>
                  )}
                  <span className="flex items-center gap-1 text-[12px] font-medium ml-auto" style={{ color: '#0891B2' }}>
                    View Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hospital Detail Modal */}
      {selectedHospital && !showBooking && (
        <HospitalDetailModal
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onBookAppointment={() => setShowBooking(true)}
        />
      )}

      {/* Book Appointment Modal */}
      {selectedHospital && showBooking && (
        <BookAppointmentModal
          hospital={selectedHospital}
          patientId={patient.id}
          patientName={patient.full_name}
          onClose={() => { setShowBooking(false); setSelectedHospital(null); }}
          onBack={() => setShowBooking(false)}
        />
      )}
    </div>
  );
};

/* ====================== HOSPITAL DETAIL MODAL ====================== */
const HospitalDetailModal = ({ hospital: h, onClose, onBookAppointment }: { hospital: any; onClose: () => void; onBookAppointment: () => void }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase.from('hospital_staff').select('id, full_name, specialization, registration_no, shift').eq('hospital_id', h.id).eq('role', 'Doctor');
      setDoctors(data || []);
      setLoadingDoctors(false);
    };
    fetchDoctors();
  }, [h.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[700px] w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              {h.logo_url ? (
                <img src={h.logo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#EBF7FA' }}>
                  <Building2 size={28} style={{ color: '#0891B2' }} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>{h.hospital_name}</h2>
                <p className="text-[13px]" style={{ color: '#64748B' }}>{h.facility_type} {h.year_established ? `· Est. ${h.year_established}` : ''}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {h.emergency_24x7 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#EF4444' }}>⚡ 24/7 Emergency</span>}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F0FDF4', color: '#059669' }}>✅ Verified</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20} style={{ color: '#64748B' }} /></button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-5">
            <button onClick={onBookAppointment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#0891B2' }}>
              <Calendar size={16} /> Book Appointment
            </button>
            {h.emergency_helpline && (
              <a href={`tel:${h.emergency_helpline}`} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold" style={{ border: '1px solid #EF4444', color: '#EF4444' }}>
                <Phone size={14} /> {h.emergency_helpline}
              </a>
            )}
            {h.maps_link && (
              <a href={h.maps_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
                <MapPin size={14} /> View on Maps
              </a>
            )}
            {h.website && (
              <a href={h.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>
                <Globe size={14} /> Website
              </a>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Location */}
            <div className="p-4 rounded-lg" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
              <p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>📍 Location</p>
              <p className="text-[13px] font-medium" style={{ color: '#1E293B' }}>{h.address || 'Address not available'}</p>
              <p className="text-[13px]" style={{ color: '#64748B' }}>{h.city}, {h.state} — {h.pin_code}</p>
              {h.phone && <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>📞 {h.phone}</p>}
              {h.email && <p className="text-[13px]" style={{ color: '#64748B' }}>✉️ {h.email}</p>}
            </div>

            {/* Capacity */}
            <div className="p-4 rounded-lg" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
              <p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>🏥 Capacity</p>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div><span style={{ color: '#64748B' }}>Total Beds:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.total_beds || 0}</span></div>
                <div><span style={{ color: '#64748B' }}>ICU:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.icu_beds || 0}</span></div>
                <div><span style={{ color: '#64748B' }}>General Ward:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.general_ward_beds || 0}</span></div>
                <div><span style={{ color: '#64748B' }}>Private Rooms:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.private_rooms || 0}</span></div>
                <div><span style={{ color: '#64748B' }}>Doctors:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.total_doctors || 0}</span></div>
                <div><span style={{ color: '#64748B' }}>Nurses:</span> <span className="font-semibold" style={{ color: '#1E293B' }}>{h.total_nurses || 0}</span></div>
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="mb-5">
            <p className="text-[13px] font-semibold mb-2" style={{ color: '#64748B' }}>Facilities</p>
            <div className="flex flex-wrap gap-2">
              {h.emergency_24x7 && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: '#FEF2F2', color: '#EF4444' }}><Ambulance size={13} /> 24/7 Emergency</span>}
              {h.blood_bank && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: '#FEF2F2', color: '#DC2626' }}><Heart size={13} /> Blood Bank</span>}
              {h.pharmacy && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: '#EBF7FA', color: '#0891B2' }}><Pill size={13} /> Pharmacy</span>}
              {h.ambulances > 0 && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: '#FFFBEB', color: '#D97706' }}><Ambulance size={13} /> {h.ambulances} Ambulances</span>}
              {h.operation_theatres > 0 && <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ background: '#F1F5F9', color: '#64748B' }}><Shield size={13} /> {h.operation_theatres} OTs</span>}
            </div>
          </div>

          {/* Specializations */}
          {h.specializations?.length > 0 && (
            <div className="mb-5">
              <p className="text-[13px] font-semibold mb-2" style={{ color: '#64748B' }}>Specializations</p>
              <div className="flex flex-wrap gap-1.5">
                {h.specializations.map((s: string) => (
                  <span key={s} className="px-3 py-1 rounded-full text-[12px] font-medium" style={{ background: '#EBF7FA', color: '#0891B2', border: '1px solid #D1EBF1' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Doctors List */}
          <div>
            <p className="text-[13px] font-semibold mb-2" style={{ color: '#64748B' }}>🩺 Doctors at this Hospital</p>
            {loadingDoctors ? (
              <p className="text-[12px] italic" style={{ color: '#94A3B8' }}>Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="text-[12px] italic" style={{ color: '#94A3B8' }}>No doctors listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {doctors.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: '#0891B2' }}>
                      {d.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1E293B' }}>{d.full_name}</p>
                      <p className="text-[11px]" style={{ color: '#64748B' }}>{d.specialization || 'General'}{d.shift ? ` · ${d.shift}` : ''}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onBookAppointment(); }}
                      className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium text-white" style={{ background: '#0891B2' }}>
                      Book
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #E2EEF1' }}>
            <button onClick={onBookAppointment}
              className="w-full py-3 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #0891B2, #06B6D4)' }}>
              📅 Book an Appointment at {h.hospital_name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ====================== BOOK APPOINTMENT MODAL ====================== */
const BookAppointmentModal = ({ hospital, patientId, patientName, onClose, onBack }: {
  hospital: any; patientId: string; patientName: string; onClose: () => void; onBack: () => void;
}) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({
    doctor_name: '', specialization: '', appointment_date: '', appointment_time: '', reason: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase.from('hospital_staff').select('id, full_name, specialization').eq('hospital_id', hospital.id).eq('role', 'Doctor');
      setDoctors(data || []);
    };
    fetchDoctors();
  }, [hospital.id]);

  const handleBook = async () => {
    if (!form.doctor_name || !form.appointment_date) {
      toast.error('Doctor and date are required');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('patient_appointments').insert({
        patient_id: patientId,
        hospital_id: hospital.id,
        hospital_name: hospital.hospital_name,
        doctor_name: form.doctor_name,
        specialization: form.specialization,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time || null,
        reason: form.reason || null,
        status: 'Upcoming',
        booked_by: 'Patient',
      });
      if (error) throw error;
      // Notify the hospital
      if (hospital.supabase_user_id) {
        await sendNotification({
          recipientUserId: hospital.supabase_user_id,
          recipientType: 'hospital',
          title: '📅 New Appointment Booked',
          body: `${patientName} booked an appointment with ${form.doctor_name} on ${form.appointment_date}${form.appointment_time ? ' at ' + form.appointment_time : ''}.`,
          type: 'appointment',
        });
      }
      setSuccess(true);
      toast.success('Appointment booked successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to book');
    } finally {
      setSaving(false);
    }
  };

  const selectDoctor = (doctorId: string) => {
    const doc = doctors.find(d => d.id === doctorId);
    if (doc) {
      setForm(f => ({ ...f, doctor_name: doc.full_name, specialization: doc.specialization || '' }));
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-xl max-w-[460px] w-full text-center p-8" style={{ border: '1px solid #E2EEF1' }}>
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: '#F0FDF4' }}>
            <Calendar size={32} style={{ color: '#10B981' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Appointment Booked! ✅
          </h3>
          <p className="text-[14px] mb-1" style={{ color: '#64748B' }}>
            Your appointment at <strong style={{ color: '#1E293B' }}>{hospital.hospital_name}</strong> has been confirmed.
          </p>
          <div className="p-4 rounded-lg my-4" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
            <p className="text-[13px]" style={{ color: '#1E293B' }}>🩺 <strong>{form.doctor_name}</strong></p>
            <p className="text-[13px]" style={{ color: '#64748B' }}>📅 {form.appointment_date} {form.appointment_time ? `at ${form.appointment_time}` : ''}</p>
            {form.reason && <p className="text-[13px] italic mt-1" style={{ color: '#94A3B8' }}>"{form.reason}"</p>}
          </div>
          <p className="text-[12px] mb-4" style={{ color: '#94A3B8' }}>
            The hospital will see this appointment on their dashboard.
          </p>
          <button onClick={onClose}
            className="w-full py-2.5 rounded-lg text-[14px] font-semibold text-white" style={{ background: '#0891B2' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-[520px] w-full max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <button onClick={onBack} className="text-[13px] font-medium" style={{ color: '#64748B' }}>← Back</button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} style={{ color: '#64748B' }} /></button>
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Book Appointment</h3>
          <p className="text-[13px] mb-5" style={{ color: '#64748B' }}>
            at <strong style={{ color: '#0891B2' }}>{hospital.hospital_name}</strong>, {hospital.city}
          </p>

          <div className="space-y-4">
            {/* Doctor Selection */}
            <div>
              <label className="field-label">Select Doctor *</label>
              {doctors.length > 0 ? (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto mb-2">
                  {doctors.map(d => (
                    <button key={d.id} onClick={() => selectDoctor(d.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: form.doctor_name === d.full_name ? '#EBF7FA' : '#F7FBFC',
                        border: form.doctor_name === d.full_name ? '2px solid #0891B2' : '1px solid #E2EEF1',
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#0891B2' }}>
                        {d.full_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium" style={{ color: '#1E293B' }}>{d.full_name}</p>
                        <p className="text-[11px]" style={{ color: '#64748B' }}>{d.specialization || 'General'}</p>
                      </div>
                      {form.doctor_name === d.full_name && <span className="ml-auto text-[11px] font-bold" style={{ color: '#0891B2' }}>✓</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-2">
                  <input className="field-input" value={form.doctor_name}
                    onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                    placeholder="Enter doctor name" />
                </div>
              )}
              {doctors.length > 0 && (
                <p className="text-[11px] mb-1" style={{ color: '#94A3B8' }}>or type manually:</p>
              )}
              {doctors.length > 0 && (
                <input className="field-input" value={form.doctor_name}
                  onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))}
                  placeholder="Or type doctor name manually" />
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Date *</label>
                <input className="field-input" type="date" value={form.appointment_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Time (optional)</label>
                <input className="field-input" type="time" value={form.appointment_time}
                  onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="field-label">Reason for Visit</label>
              <textarea className="field-input" rows={2} value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Follow-up checkup, Stomach pain" />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 mt-6">
            <button onClick={handleBook} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#0891B2' }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Booking...</> : '📅 Confirm Appointment'}
            </button>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: '1px solid #E2EEF1', color: '#64748B' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientFindDoctors;
