import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AssessmentQuiz from './components/AssessmentQuiz';
import AboutDoctor from './components/AboutDoctor';
import Services from './components/Services';
import BeforeAfterSlider from './components/BeforeAfterSlider';
import Testimonials from './components/Testimonials';
import FAQAccordion from './components/FAQAccordion';
import BookingModal from './components/BookingModal';
import Footer from './components/Footer';
import StaffCRM, { StaffAccess } from './components/StaffCRM';
import { Stethoscope } from 'lucide-react';

export default function App() {
  const path = window.location.pathname;
  const staffAccess = path === '/staff-access';
  const authMatch = path.match(/^\/(patient-login|patient-register|forgot-password)$/);
  const staffMatch = path.match(/^\/staff\/(doctor|reception)\/([^/]+)/);
  if (staffAccess) return <StaffAccess />;
  if (authMatch) return <PatientAccess mode={authMatch[1]} />;
  if (path === '/patient-dashboard' || path === '/my-appointments' || path === '/my-profile') return <PatientDashboard page={path.slice(1)} />;
  if (staffMatch) return <StaffCRM role={staffMatch[1] === 'doctor' ? 'doctor' : 'receptionist'} page={staffMatch[2]} />;
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  const handleOpenBooking = (serviceName = '') => {
    setSelectedService(serviceName);
    setBookingModalOpen(true);
  };

  const handleScrollToAssessment = () => {
    const el = document.getElementById('assessment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F172A] font-sans">
      {/* Sticky Capsule Navigation Bar */}
      <Navbar onBookClick={() => handleOpenBooking()} />

      {/* Main Content Sections */}
      <main>
        <Hero
          onBookClick={() => handleOpenBooking()}
          onQuizClick={handleScrollToAssessment}
        />

        <AssessmentQuiz
          onSelectTreatment={(treatmentName) => handleOpenBooking(treatmentName)}
        />

        <AboutDoctor />

        <Services
          onBookService={(serviceName) => handleOpenBooking(serviceName)}
        />

        <BeforeAfterSlider />

        <Testimonials />

        <FAQAccordion />
      </main>

      {/* Footer */}
      <Footer onBookClick={() => handleOpenBooking()} />

      {/* Booking Modal Window */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        initialService={selectedService}
      />

    </div>
  );
}

function PatientAccess({mode}) {
  const [form,setForm]=useState({name:'',phone:'',email:'',password:''});const[error,setError]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
  const register=mode==='patient-register';const forgot=mode==='forgot-password';
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{if(forgot){const response=await fetch('/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.error);setMessage(data.message);return;}const response=await fetch(register?'/api/auth/register':'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to continue');window.location.assign('/patient-dashboard');}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <main className="staff-login"><form className="staff-login-card" onSubmit={submit}><div className="staff-brand"><Stethoscope/><span>DermaCare <b>Luxe</b></span></div><p className="staff-eyebrow">PATIENT ACCOUNT</p><h1>{register?'Create your account':forgot?'Reset password':'Welcome back'}</h1>{register&&<><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Phone<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label></>}<label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>{!forgot&&<label>Password<input required type="password" minLength={register?10:1} value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>}{error&&<div className="staff-error">{error}</div>}{message&&<div className="crm-notice">{message}</div>}<button className="staff-primary" disabled={busy}>{busy?'Please wait…':forgot?'Send reset instructions':register?'Create account':'Sign in'}</button><a className="staff-back" href={register?'/patient-login':'/patient-register'}>{register?'Already have an account? Sign in':'New to the clinic? Create an account'}</a>{!register&&!forgot&&<a className="staff-back" href="/forgot-password">Forgot password?</a>}<a href="/" className="staff-back">Return to clinic website</a></form></main>;
}

function PatientDashboard({page}) {
  const [user,setUser]=useState(null);const[data,setData]=useState([]);const[error,setError]=useState('');
  React.useEffect(()=>{fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>r.json()).then(x=>{if(!x.success||x.user.role!=='patient')return window.location.assign('/patient-login');setUser(x.user);if(page!=='my-profile')fetch('/api/appointments/mine',{credentials:'same-origin'}).then(r=>r.json()).then(y=>setData(y.data||[]));}).catch(()=>window.location.assign('/patient-login'));},[page]);
  const cancel=async id=>{try{const res=await fetch(`/api/appointments/${id}/cancel`,{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'same-origin'});const out=await res.json();if(!res.ok)throw new Error(out.error);setData(prev=>prev.map(a=>a.id===id?{...a,status:'cancelled'}:a));}catch(e){setError(e.message);}};
  return <div className="crm-layout"><aside className="crm-sidebar"><a className="crm-logo" href="/"><Stethoscope/><span>DermaCare <b>Luxe</b></span></a><div className="crm-role">PATIENT PORTAL</div><nav><a className={page==='patient-dashboard'?'active':''} href="/patient-dashboard">Overview</a><a className={page==='my-appointments'?'active':''} href="/my-appointments">My appointments</a><a className={page==='my-profile'?'active':''} href="/my-profile">My profile</a></nav><button className="crm-logout" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'});window.location.assign('/');}}>Sign out</button></aside><main className="crm-main"><header className="crm-header"><div><div className="crm-breadcrumb">Patient portal</div><h1>{page==='my-profile'?'My profile':page==='my-appointments'?'My appointments':'Welcome back'}</h1></div><span>{user?.name}</span></header>{error&&<div className="staff-error">{error}</div>}{page==='my-profile'?<section className="crm-panel"><h2>Profile details</h2><p>{user?.name}</p><p>{user?.email}</p></section>:<section className="crm-panel"><div className="crm-panel-head"><div><h2>Appointments</h2><p>Your booking requests and visit history</p></div><a href="/">Book an appointment →</a></div>{data.map(a=><article className="crm-notification" key={a.id}><CalendarDays/><div><strong>{a.service} · {new Date(a.starts_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</strong><span className={`crm-status ${a.status}`}>{a.status}</span>{a.status==='pending'&&new Date(a.starts_at)>new Date()&&<button className="crm-actions" onClick={()=>cancel(a.id)}>Cancel request</button>}</div></article>)}{!data.length&&<div className="crm-empty">No appointments yet.</div>}</section>}</main></div>;
}
