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
import WhatsAppConfigModal from './components/WhatsAppConfigModal';
import Footer from './components/Footer';

export default function App() {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
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
      <Navbar
        onBookClick={() => handleOpenBooking()}
        onAdminClick={() => setAdminModalOpen(true)}
      />

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

      {/* Admin WhatsApp Gateway Configuration Modal */}
      <WhatsAppConfigModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  );
}
