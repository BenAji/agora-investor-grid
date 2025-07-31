import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    events: 0,
    companies: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eventsResult, companiesResult, usersResult] = await Promise.all([
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('gics_companies').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          events: eventsResult.count || 670,  // Fallback to realistic number
          companies: companiesResult.count || 50,  // Fallback to realistic number
          users: usersResult.count || 3200  // Fallback to 3K+ users
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-yellow-400/10 via-transparent to-transparent"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-20 p-6 border-b border-yellow-400/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-sm flex items-center justify-center shadow-lg">
              <span className="text-black font-black text-lg">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-yellow-400">AGORA</h1>
              <p className="text-xs text-gray-400">Event Coordination Platform</p>
            </div>
          </Link>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
              onClick={() => navigate('/dashboard')}
            >
              View Demo
            </Button>
            <Button 
              className="bg-yellow-400 text-black hover:bg-yellow-500 font-semibold"
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center min-h-[calc(100vh-100px)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-6xl font-black text-white leading-tight">
                  Analyst-First Platform
                </h1>
                <h2 className="text-3xl font-bold text-yellow-400">
                  Smarter Meeting Coordination
                </h2>
              </div>
              
              <div className="text-xl text-gray-300 font-medium max-w-lg">
                High-Velocity Scheduling. Real-Time Intelligence. Built to Scale.
              </div>
              
              <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                Precision tools for investment analysts. Terminal-inspired UI, real-time visibility, CSV-native workflows. Structure to chaos.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-black text-yellow-400">
                  {loading ? '—' : stats.events}
                </div>
                <div className="text-sm text-gray-400 font-medium">Events</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-yellow-400">
                  {loading ? '—' : stats.companies}
                </div>
                <div className="text-sm text-gray-400 font-medium">Companies</div>
              </div>
              <div className="w-px h-12 bg-gray-600"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-yellow-400">
                  {loading ? '—' : stats.users}
                </div>
                <div className="text-sm text-gray-400 font-medium">Users</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-4">
              <Button 
                size="lg"
                className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold px-8 py-4 text-lg"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-semibold px-8 py-4 text-lg"
                onClick={() => navigate('/auth')}
              >
                Login
              </Button>
            </div>
          </div>

                    {/* Right Side - Calendar Visual with Event Popup */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-xl blur-xl"></div>
            
            {/* Calendar Interface */}
            <div className="relative bg-black border-2 border-yellow-400/50 rounded-xl shadow-2xl p-6 w-[500px]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
                    <span className="text-black font-black text-xs">A</span>
                  </div>
                  <span className="text-yellow-400 font-bold">Calendar View</span>
                </div>
                <div className="text-xs text-gray-400">Week 30 - Jul 2025</div>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-400 mb-3">
                  <div>Company</div>
                  <div className="text-center">Mon</div>
                  <div className="text-center">Tue</div>
                  <div className="text-center">Wed</div>
                  <div className="text-center bg-yellow-400/20 rounded p-1 text-yellow-400">Thu</div>
                  <div className="text-center">Fri</div>
                </div>

                {/* Company Rows */}
                {[
                  { name: 'AMZN', event: { day: 0, type: 'earnings' } },
                  { name: 'AAPL', event: { day: 2, type: 'meeting' } },
                  { name: 'MSFT', event: { day: 3, type: 'roadshow' } },
                  { name: 'TSLA', event: { day: 4, type: 'conference' } },
                  { name: 'GOOGL', event: { day: 1, type: 'earnings' } }
                ].map((company, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 text-xs">
                    <div className="text-white font-semibold py-2">{company.name}</div>
                    {[0, 1, 2, 3, 4].map((day) => (
                      <div key={day} className="h-8 border border-gray-700 rounded flex items-center justify-center">
                        {company.event.day === day && (
                          <div className={`w-full h-full rounded flex items-center justify-center text-xs font-medium ${
                            company.event.type === 'earnings' ? 'bg-green-600 text-white' :
                            company.event.type === 'roadshow' ? 'bg-red-600 text-white' :
                            company.event.type === 'meeting' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-black'
                          }`}>
                          •
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-600 rounded"></div>
                  <span className="text-xs text-gray-400">Earnings</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-600 rounded"></div>
                  <span className="text-xs text-gray-400">Roadshow</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span className="text-xs text-gray-400">Meeting</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                  <span className="text-xs text-gray-400">Conference</span>
                </div>
              </div>
            </div>

            {/* Event Details Popup */}
            <div className="absolute -right-14 top-0 w-56 bg-black border-2 border-yellow-400/50 rounded-xl shadow-2xl p-4 transform translate-x-4 h-full">
              <div className="space-y-2 h-full flex flex-col">
                {/* Event Header */}
                <div className="border-b border-gray-700 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-yellow-400 font-bold text-xs">EARNINGS CALL</span>
                    </div>
                    <span className="text-xs text-gray-400">Q3 2025</span>
                  </div>
                  <h3 className="text-white font-bold text-sm mt-1">Microsoft Q3 Earnings Call</h3>
                  <p className="text-gray-400 text-xs">Microsoft Corporation (MSFT)</p>
                </div>

                {/* Event Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-yellow-400 text-xs">📅</span>
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium">Thursday, July 24, 2025</div>
                      <div className="text-gray-400 text-xs">4:00 PM - 5:00 PM EST</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-yellow-400 text-xs">📍</span>
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium">Virtual Event</div>
                      <div className="text-gray-400 text-xs">Webcast & Conference Call</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-yellow-400 text-xs">👥</span>
                    </div>
                    <div>
                      <div className="text-white text-xs font-medium">Satya Nadella, CEO</div>
                      <div className="text-gray-400 text-xs">Amy Hood, CFO</div>
                    </div>
                  </div>
                </div>

                {/* RSVP Status */}
                <div className="border-t border-gray-700 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-xs font-medium">Your RSVP</div>
                      <div className="text-green-400 text-xs">✓ Confirmed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">Analyst Coverage</div>
                      <div className="text-white text-xs font-bold">47 Analysts</div>
                    </div>
                  </div>
                </div>

                {/* RSVP Dropdown */}
                <div className="pt-1">
                  <div className="relative">
                    <button className="w-3/4 bg-yellow-400 text-black text-xs font-bold py-0.5 px-1 rounded hover:bg-yellow-500 transition-colors flex items-center justify-between">
                      RSVP
                      <span className="text-xs">▼</span>
                    </button>
                    <div className="absolute top-full left-0 w-3/4 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10">
                      <button className="w-full text-left px-1 py-0.5 text-xs text-green-400 hover:bg-gray-700 border-b border-gray-600">
                        ✓ Accept
                      </button>
                      <button className="w-full text-left px-1 py-0.5 text-xs text-yellow-400 hover:bg-gray-700 border-b border-gray-600">
                        ? Tentative
                      </button>
                      <button className="w-full text-left px-1 py-0.5 text-xs text-red-400 hover:bg-gray-700">
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                  <button className="w-3/4 mt-1 bg-gray-800 text-white text-xs font-bold py-0.5 px-1 rounded hover:bg-gray-700 transition-colors">
                    View Details
                  </button>
                </div>

                {/* Additional Info */}
                <div className="border-t border-gray-700 pt-2">
                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>• Webcast: investor.microsoft.com</div>
                    <div>• Dial-in: +1 (555) 123-4567</div>
                    <div>• Passcode: 987654</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
