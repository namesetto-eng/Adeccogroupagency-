import React, { useState, useEffect } from 'react';
import { Star, Quote, MapPin, CheckCircle, ChevronLeft, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { Testimonial } from '../types';

interface TestimonialsSectionProps {
  onOpenAuth?: () => void;
  currentUser?: { name: string; email: string } | null;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  onOpenAuth,
  currentUser,
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // New testimonial form state
  const [newReview, setNewReview] = useState({
    location: '',
    rating: 5,
    review_text: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/testimonials');
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data.testimonials || []);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    if (testimonials.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    if (!newReview.location.trim() || !newReview.review_text.trim()) {
      return;
    }

    setSubmitting(true);
    setSubmitSuccess('');

    try {
      const token = localStorage.getItem('adecco_auth_token');
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_name: currentUser.name,
          location: newReview.location,
          rating: newReview.rating,
          review_text: newReview.review_text,
        }),
      });

      if (res.ok) {
        setSubmitSuccess('Thank you! Your verified story has been published.');
        setNewReview({ location: '', rating: 5, review_text: '' });
        setShowForm(false);
        fetchTestimonials();
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="testimonials" className="py-20 bg-[#080808] border-b border-[#1a1a1a] relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#E30613]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#E30613]/10 text-[#E30613] border border-[#E30613]/20 mb-3">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified Relocation Success Stories
          </span>
          <h2 className="serif text-3xl sm:text-4xl font-normal text-white tracking-tight mb-4">
            Hear From Our <span className="italic text-[#E30613]">Successfully Placed</span> Candidates
          </h2>
          <p className="text-gray-400 text-sm sm:text-base font-normal">
            Real experiences from Kenya to international career destinations in Canada, Australia, UK, USA, Singapore, Kuwait, and local hubs.
          </p>
        </div>

        {/* Carousel / Grid Display */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-[#E30613] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No testimonials available yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((t, idx) => (
              <div
                key={t.id || idx}
                className="glass-card p-6 rounded-xl flex flex-col justify-between border border-[#222] hover:border-[#E30613]/40 transition-all duration-300 relative group"
              >
                <Quote className="w-8 h-8 text-[#E30613]/20 absolute top-4 right-4 group-hover:text-[#E30613]/40 transition-colors" />

                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Quote */}
                  <p className="text-gray-300 text-sm italic leading-relaxed mb-6 font-normal">
                    "{t.review_text}"
                  </p>
                </div>

                {/* Candidate Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#1a1a1a]">
                  {t.avatar_url ? (
                    <img
                      src={t.avatar_url}
                      alt={t.client_name}
                      className="w-10 h-10 rounded-full object-cover border border-[#333]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#E30613]/20 text-[#E30613] font-bold text-sm flex items-center justify-center border border-[#E30613]/30">
                      {t.client_name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h4 className="text-white text-sm font-medium">{t.client_name}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#E30613]" /> {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Story Banner */}
        <div className="glass-card p-6 rounded-xl border border-[#222] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div>
            <h3 className="text-white text-base font-semibold">Have you been placed through Adecco Group Agency?</h3>
            <p className="text-gray-400 text-xs">Share your experience to guide fellow job seekers across Kenya and abroad.</p>
          </div>

          <button
            onClick={() => {
              if (!currentUser) {
                onOpenAuth?.();
              } else {
                setShowForm(!showForm);
              }
            }}
            className="px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] text-white text-xs font-semibold rounded-lg border border-[#333] transition-colors flex items-center gap-2 shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4 text-[#E30613]" />
            {showForm ? 'Close Form' : 'Write a Review'}
          </button>
        </div>

        {/* Add Review Form Modal / Inline */}
        {showForm && (
          <div className="mt-6 glass-card p-6 rounded-xl border border-[#E30613]/30 max-w-2xl mx-auto animate-in fade-in duration-200">
            <h4 className="text-white font-semibold text-sm mb-4">Share Your Placement Testimonial</h4>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Relocation / Placement Path *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nairobi to Vancouver, Canada"
                  value={newReview.location}
                  onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  className="w-full bg-[#050505] border border-[#222] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#E30613]"
                >
                  <option value={5}>5 Stars - Outstanding Experience</option>
                  <option value={4}>4 Stars - Great Support</option>
                  <option value={3}>3 Stars - Satisfactory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Your Story & Experience *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us about your visa processing, deployment, or local placement journey..."
                  value={newReview.review_text}
                  onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                  className="w-full bg-[#050505] border border-[#222] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#E30613]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 bg-[#111] text-gray-300 text-xs rounded-lg border border-[#222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#E30613] hover:bg-[#c00410] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#E30613]/20"
                >
                  {submitting ? 'Publishing...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        )}

        {submitSuccess && (
          <p className="text-center text-emerald-400 text-xs mt-4 font-medium">{submitSuccess}</p>
        )}
      </div>
    </section>
  );
};
