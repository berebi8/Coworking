import React, { useState, useEffect } from 'react';
import { Building2, FileText, Calculator, CreditCard, Users, FileX, Settings, Bell, Plus, Calendar, Building, Car, UserCog, Package, LogOut, Database, Users2 } from 'lucide-react';
import { LocationsManagement } from './components/locations/LocationsManagement';
import { UsersManagement } from './components/users/UsersManagement';
import { OfficesManagement } from './components/offices/OfficesManagement';
import { AddonServicesManagement } from './components/services/AddonServicesManagement';
import { ParkingManagement } from './components/parking/ParkingManagement';
import { AgreementsManagement } from './components/agreements/AgreementsManagement';
import { MasterContractData } from './components/contracts/MasterContractData';
import { ClientsManagement } from './components/clients/ClientsManagement';
import { TerminationNoticesManagement } from './components/termination/TerminationNoticesManagement';
import { SignInForm } from './components/auth/SignInForm';
import { supabase, signOut } from './lib/supabase';

function App() {
  const [activeNav, setActiveNav] = useState('agreements');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const metrics = {
    occupancyRate: "85%",
    currentRevenue: "$127,500",
    upcomingTerminations: "3",
    draftContracts: "5"
  };

  const recentActivity = [
    { id: 1, action: "Contract signed", client: "TechStart Inc.", time: "2 hours ago" },
    { id: 2, action: "Termination notice", client: "Design Studio Co.", time: "5 hours ago" },
    { id: 3, action: "New draft agreement", client: "Global Consulting", time: "1 day ago" }
  ];

  const upcomingDates = [
    { id: 1, event: "Contract Start", client: "InnovateLab", date: "Mar 15" },
    { id: 2, event: "Contract End", client: "Design Studio Co.", date: "Mar 20" },
    { id: 3, event: "Agreement Review", client: "TechStart Inc.", date: "Mar 25" }
  ];

  const sideNavItems = [
    { id: 'agreements', icon: FileText, label: 'Agreements & Drafts' },
    { id: 'master-contracts', icon: Database, label: 'Master Contract Data' },
    { id: 'inventory', icon: Building2, label: 'Office Inventory' },
    { id: 'revenue', icon: Calculator, label: 'Revenue Matrix' },
    { id: 'credit', icon: CreditCard, label: 'Credit Matrix' },
    { id: 'clients', icon: Users, label: 'Client Management' },
    { id: 'termination', icon: FileX, label: 'Termination Notices' }
  ];

  const settingsItems = [
    { id: 'users', icon: UserCog, label: 'Users Management' },
    { id: 'clients', icon: Users2, label: 'Clients' },
    { id: 'locations', icon: Building, label: 'Locations Management' },
    { id: 'offices', icon: Package, label: 'Office Properties' },
    { id: 'parking', icon: Car, label: 'Parking' },
    { id: 'services', icon: Settings, label: 'Add-On Services' }
  ];

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    if (!isAuthenticated) {
      return <SignInForm />;
    }

    switch (activeNav) {
      case 'agreements':
        return <AgreementsManagement />;
      case 'master-contracts':
        return <MasterContractData />;
      case 'locations':
        return <LocationsManagement />;
      case 'users':
        return <UsersManagement />;
      case 'offices':
        return <OfficesManagement />;
      case 'parking':
        return <ParkingManagement />;
      case 'services':
        return <AddonServicesManagement />;
      case 'clients':
        return <ClientsManagement />;
      case 'termination':
        return <TerminationNoticesManagement />;
      default:
        return (
          <>
            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="metric-card">
                  <h3 className="text-sm font-medium text-text-secondary capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-text-primary font-numeric">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Recent Activity */}
              <div className="lg:col-span-2 card">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                        <p className="text-sm text-text-secondary">{activity.client}</p>
                      </div>
                      <span className="text-sm text-text-muted font-numeric">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Widget */}
              <div className="card">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Upcoming Dates</h2>
                <div className="space-y-2">
                  {upcomingDates.map((date) => (
                    <div key={date.id} className="activity-item">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-primary mr-3" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{date.event}</p>
                          <p className="text-sm text-text-secondary">{date.client}</p>
                        </div>
                      </div>
                      <span className="text-sm text-text-muted font-numeric">{date.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="fixed bottom-8 right-8 flex space-x-4">
              <button className="action-button bg-primary hover:bg-primary-dark">
                <Plus className="h-5 w-5" />
                <span>Add Agreement</span>
              </button>
              <button className="action-button bg-coral hover:bg-coral-dark">
                <FileX className="h-5 w-5" />
                <span>Record Termination</span>
              </button>
            </div>
          </>
        );
    }
  };

  if (!isAuthenticated) {
    return renderContent();
  }

  return (
    <div className="min-h-screen bg-background-light flex">
      {/* Left Panel */}
      <aside className="w-72 bg-background-card border-r border-gray-100/60 flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-text-primary">Finance Tool</h1>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          <div className="mb-6">
            <h2 className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Main Navigation
            </h2>
            {sideNavItems.map((item) => (
              <button
                key={item.id}
                className={`side-nav-item w-full mb-2 ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mb-6">
            <h2 className="px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Settings
            </h2>
            {settingsItems.map((item) => (
              <button
                key={item.id}
                className={`side-nav-item w-full mb-2 ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-background-card border-b border-gray-100/60 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-end items-center">
              <div className="flex items-center space-x-4">
                <button className="header-button relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="header-button flex items-center space-x-2"
                >
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Profile"
                    className="h-8 w-8 rounded-full ring-2 ring-gray-100/60"
                  />
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-background-card border-t border-gray-100/60 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-text-muted">Version 1.0.0</p>
              <a href="#" className="text-sm text-primary hover:text-primary-dark transition-colors">
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
