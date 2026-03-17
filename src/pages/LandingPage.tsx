import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  { image: '/images/slider1.jpg', title: 'Play Cricket, Share Passion', subtitle: 'Join the largest cricket community' },
  { image: '/images/slider2.jpg', title: 'Live Scoring', subtitle: 'Real-time ball-by-ball updates' },
  { image: '/images/slider3.jpg', title: 'Manage Your Team', subtitle: 'Create boards, rosters & tournaments' },
  { image: '/images/slider4.jpg', title: 'Track Your Stats', subtitle: 'Comprehensive player statistics' },
];

const features = [
  { image: '/images/features-a.jpg', title: 'Create Your Board', desc: 'Set up your cricket team or league board and manage everything in one place.' },
  { image: '/images/features-b.jpg', title: 'Live Scoring', desc: 'Ball-by-ball live scoring with real-time updates for all your matches.' },
  { image: '/images/features-c.jpg', title: 'Player Statistics', desc: 'Track batting, bowling and fielding stats across all matches.' },
  { image: '/images/features-d.jpg', title: 'Social Feed', desc: 'Share updates, photos and connect with the cricket community.' },
  { image: '/images/features-e.jpg', title: 'Tournament Management', desc: 'Organize and manage tournaments with schedules and points tables.' },
  { image: '/images/features-f.jpg', title: 'Connect & Network', desc: 'Find players, teams and leagues near you.' },
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/cs-logo.png" alt="CricketSocial" className="h-10" />
              <span className="text-white font-bold text-xl hidden sm:block">CricketSocial</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-white hover:text-brand-light px-4 py-2 text-sm font-medium transition-colors">
                LOGIN
              </Link>
              <Link to="/register" className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-dark transition-colors">
                REGISTER
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
      <section className="relative h-[600px] overflow-hidden pt-16">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl animate-fade-in">
                  <h1 className="text-5xl font-bold text-white mb-4 leading-tight">{slide.title}</h1>
                  <p className="text-xl text-gray-200 mb-8">{slide.subtitle}</p>
                  <Link to="/register" className="bg-brand-green text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-dark transition-colors inline-block">
                    Get Started — It's Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Slider Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-brand-green w-8' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </section>

      {/* Matches Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/images/live-icon.png" alt="" className="w-6 h-6" />
                <h3 className="text-brand-light text-lg font-bold uppercase tracking-wider">Live Matches</h3>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-gray-400">No live matches right now</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/images/complete.png" alt="" className="w-6 h-6" />
                <h3 className="text-yellow-400 text-lg font-bold uppercase tracking-wider">Completed</h3>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-gray-400">No completed matches yet</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src="/images/calIcon.png" alt="" className="w-6 h-6" />
                <h3 className="text-blue-400 text-lg font-bold uppercase tracking-wider">Upcoming</h3>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 min-h-[200px] flex items-center justify-center">
                <p className="text-gray-400">No upcoming matches</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need for Cricket</h2>
            <p className="text-gray-500 mt-3 text-lg">One platform for players, teams, leagues and fans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 bg-brand-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-4xl font-bold">10K+</p>
              <p className="text-green-200 mt-1">Players</p>
            </div>
            <div>
              <p className="text-4xl font-bold">500+</p>
              <p className="text-green-200 mt-1">Teams</p>
            </div>
            <div>
              <p className="text-4xl font-bold">1K+</p>
              <p className="text-green-200 mt-1">Matches</p>
            </div>
            <div>
              <p className="text-4xl font-bold">50+</p>
              <p className="text-green-200 mt-1">Leagues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get CricketSocial on Your Phone</h2>
          <p className="text-gray-400 mb-8 text-lg">Download the app and take cricket with you everywhere</p>
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
              <img src="/images/apple.png" alt="Apple" className="w-8 h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="text-left">
                <p className="text-xs text-gray-500">Download on the</p>
                <p className="font-bold">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors">
              <img src="/images/android.png" alt="Android" className="w-8 h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="text-left">
                <p className="text-xs text-gray-500">Get it on</p>
                <p className="font-bold">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
                <span className="text-white font-bold">CricketSocial</span>
              </div>
              <p className="text-gray-400 text-sm">Connect, Play, Score — The ultimate cricket platform for players, teams, and fans.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-light">About Us</a></li>
                <li><a href="#" className="hover:text-brand-light">Contact</a></li>
                <li><a href="#" className="hover:text-brand-light">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-light">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-brand-light">Live Scoring</a></li>
                <li><a href="#" className="hover:text-brand-light">Team Management</a></li>
                <li><a href="#" className="hover:text-brand-light">Player Stats</a></li>
                <li><a href="#" className="hover:text-brand-light">Tournaments</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-3">
                {[
                  { icon: '/images/facebook.png', label: 'Facebook' },
                  { icon: '/images/twitter.png', label: 'Twitter' },
                  { icon: '/images/linkedin.png', label: 'LinkedIn' },
                  { icon: '/images/youtube.png', label: 'YouTube' },
                ].map((social) => (
                  <a key={social.label} href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-brand-green transition-colors">
                    <img src={social.icon} alt={social.label} className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).parentElement!.textContent = social.label[0]; }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} CricketSocial. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
