import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, Users, Settings, BarChart3, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
}

const Layout = ({ children, currentPage = 'dashboard' }: LayoutProps) => {
  const { signOut, profile, user } = useAuth();
  
  const navItems = [
    // Only show Dashboard for IR Admins
    ...(profile?.role === 'IR_ADMIN' ? [{ id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' }] : []),
    { id: 'events', label: 'Events', icon: Calendar, path: '/events' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
    { id: 'companies', label: 'Companies', icon: Building2, path: '/companies' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-surface-primary border-b border-border-default">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-gold rounded-sm flex items-center justify-center">
              <span className="text-black font-bold text-xs">A</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gold">AGORA</h1>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <Link key={item.id} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`text-xs ${
                      isActive 
                        ? 'bg-gold text-black font-semibold' 
                        : 'text-text-secondary hover:text-gold hover:bg-surface-secondary'
                    }`}
                  >
                    <Icon className="mr-1 h-3 w-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-text-secondary hover:text-gold hover:bg-surface-secondary flex items-center space-x-1"
              >
                <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-black" />
                </div>
                <span className="hidden sm:inline">
                  {profile?.first_name || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface-primary border-border-default">
              <DropdownMenuLabel className="text-gold font-semibold">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm">
                    {profile?.first_name} {profile?.last_name}
                  </span>
                  <span className="text-xs text-text-secondary font-normal">
                    {user?.email}
                  </span>
                  <span className="text-xs text-text-secondary font-normal capitalize">
                    {profile?.role?.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center space-x-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/users" className="flex items-center space-x-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  <span>Manage Users</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="flex items-center space-x-2 cursor-pointer text-error hover:text-error"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;