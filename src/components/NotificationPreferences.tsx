import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Smartphone, Monitor, Building2, Globe, Clock, Calendar } from 'lucide-react';
import NotificationTestButton from './NotificationTestButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreference {
  id?: string;
  user_id: string;
  notification_type: 'email' | 'sms' | 'desktop' | 'mobile';
  enabled: boolean;
  frequency_days: number; // How many days before event to notify
  gics_sectors?: string[];
  companies?: string[];
  created_at?: string;
  updated_at?: string;
}

interface Company {
  companyID: string;
  companyName: string;
}

interface GicsCompany {
  gicsSector: string;
  gicsSubCategory: string;
}

const NOTIFICATION_FREQUENCIES = [
  { value: 1, label: '1 day before', description: 'Notify 1 day before events' },
  { value: 2, label: '2 days before', description: 'Notify 2 days before events' },
  { value: 3, label: '3 days before', description: 'Notify 3 days before events' },
  { value: 5, label: '5 days before', description: 'Notify 5 days before events' },
  { value: 7, label: '1 week before', description: 'Notify 1 week before events' },
];

const NOTIFICATION_TYPES = [
  { type: 'email', label: 'Email', icon: Mail, description: 'Receive notifications via email' },
  { type: 'sms', label: 'SMS/Mobile', icon: Smartphone, description: 'Receive text messages on your phone' },
  { type: 'desktop', label: 'Desktop', icon: Monitor, description: 'Show desktop notifications when browsing' },
  { type: 'mobile', label: 'Mobile App', icon: Bell, description: 'Push notifications in mobile app' },
];

export const NotificationPreferences: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [gicsData, setGicsData] = useState<GicsCompany[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedGicsSectors, setSelectedGicsSectors] = useState<string[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Default preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    email: { enabled: true, frequency: 2 },
    sms: { enabled: false, frequency: 1 },
    desktop: { enabled: true, frequency: 1 },
    mobile: { enabled: false, frequency: 2 },
  });

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesResponse, gicsResponse] = await Promise.all([
        // Fetch companies
        supabase
          .from('user_companies')
          .select('companyID, companyName')
          .order('companyName'),
        
        // Fetch GICS data
        supabase
          .from('gics_companies')
          .select('gicsSector, gicsSubCategory')
          .order('gicsSector')
      ]);

      if (companiesResponse.error) throw companiesResponse.error;
      if (gicsResponse.error) throw gicsResponse.error;

      setCompanies(companiesResponse.data || []);
      setGicsData(gicsResponse.data || []);

      // Load preferences from database
      const { data: dbPreferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', profile?.id);

      if (dbPreferences && dbPreferences.length > 0) {
        const typedPreferences = dbPreferences.map(p => ({
          ...p,
          notification_type: p.notification_type as 'email' | 'sms' | 'desktop' | 'mobile'
        }));
        updateSettingsFromPreferences(typedPreferences);
        
        // Collect all companies and sectors from all preferences
        const allCompanies = [...new Set(dbPreferences.flatMap(p => p.companies || []))];
        const allSectors = [...new Set(dbPreferences.flatMap(p => p.gics_sectors || []))];
        
        setSelectedCompanies(allCompanies);
        setSelectedGicsSectors(allSectors);
      }

      // Fetch user's current subscriptions to pre-populate company/GICS selections
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('gicsSector, gicsSubCategory')
        .eq('userID', profile?.id)
        .eq('status', 'ACTIVE');

      if (subscriptions) {
        const sectors = [...new Set(subscriptions.map(s => s.gicsSector).filter(Boolean))];
        setSelectedGicsSectors(sectors);
      }

         } catch (error) {
       console.error('Error fetching notification data:', error);
       toast({
         title: "Error",
         description: "Failed to load notification data",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
  };

  const updateSettingsFromPreferences = (prefs: NotificationPreference[]) => {
    const settings = { ...notificationSettings };
    prefs.forEach(pref => {
      if (settings[pref.notification_type]) {
        settings[pref.notification_type] = {
          enabled: pref.enabled,
          frequency: pref.frequency_days
        };
      }
    });
    setNotificationSettings(settings);
  };

  const handleNotificationToggle = (type: string, enabled: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled }
    }));
  };

  const handleFrequencyChange = (type: string, frequency: number) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], frequency }
    }));
  };

  const handleCompanyToggle = (companyId: string, checked: boolean) => {
    setSelectedCompanies(prev => 
      checked 
        ? [...prev, companyId]
        : prev.filter(id => id !== companyId)
    );
  };

  const handleGicsToggle = (sector: string, checked: boolean) => {
    setSelectedGicsSectors(prev => 
      checked 
        ? [...prev, sector]
        : prev.filter(s => s !== sector)
    );
  };

  const savePreferences = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      // Delete existing preferences for this user
      const { error: deleteError } = await supabase
        .from('notification_preferences')
        .delete()
        .eq('user_id', profile.id);

      if (deleteError) throw deleteError;

      // Create notification preferences array
      const preferencesToSave = Object.entries(notificationSettings).map(([type, settings]) => ({
        user_id: profile.id,
        notification_type: type as 'email' | 'sms' | 'desktop' | 'mobile',
        enabled: settings.enabled,
        frequency_days: settings.frequency,
        gics_sectors: selectedGicsSectors,
        companies: selectedCompanies,
      }));

      // Insert new preferences into database
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert(preferencesToSave);

      if (insertError) throw insertError;

      toast({
        title: "Preferences Saved",
        description: "Your notification preferences have been updated",
      });

    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Get unique GICS sectors
  const uniqueGicsSectors = [...new Set(gicsData.map(item => item.gicsSector))].filter(Boolean);

  if (loading) {
    return (
      <Card className="bg-surface-primary border-border-default">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-gold">Loading notification preferences...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Methods */}
      <Card className="bg-surface-primary border-border-default">
        <CardHeader>
          <CardTitle className="flex items-center text-text-primary">
            <Bell className="mr-2 h-5 w-5 text-gold" />
            Notification Methods
          </CardTitle>
          <p className="text-sm text-text-muted">
            Choose how you want to receive notifications about upcoming events
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {NOTIFICATION_TYPES.map((type) => {
            const Icon = type.icon;
            const settings = notificationSettings[type.type];
            
            return (
              <div key={type.type} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5 text-gold" />
                    <div>
                      <Label className="text-text-primary font-medium">{type.label}</Label>
                      <p className="text-sm text-text-muted">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) => handleNotificationToggle(type.type, checked)}
                  />
                </div>
                
                {settings.enabled && (
                  <div className="ml-8 space-y-2">
                    <Label className="text-sm text-text-secondary">Notification Timing</Label>
                    <Select
                      value={settings.frequency.toString()}
                      onValueChange={(value) => handleFrequencyChange(type.type, parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value.toString()}>
                            <div className="flex flex-col">
                              <span>{freq.label}</span>
                              <span className="text-xs text-text-muted">{freq.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {type.type !== 'desktop' && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Company Preferences */}
      <Card className="bg-surface-primary border-border-default">
        <CardHeader>
          <CardTitle className="flex items-center text-text-primary">
            <Building2 className="mr-2 h-5 w-5 text-gold" />
            Company Notifications
          </CardTitle>
          <p className="text-sm text-text-muted">
            Select specific companies you want to receive event notifications for
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {companies.map((company) => (
              <div key={company.companyID} className="flex items-center space-x-2">
                <Checkbox
                  id={`company-${company.companyID}`}
                  checked={selectedCompanies.includes(company.companyID)}
                  onCheckedChange={(checked) => 
                    handleCompanyToggle(company.companyID, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`company-${company.companyID}`}
                  className="text-sm text-text-primary cursor-pointer"
                >
                  {company.companyName}
                </Label>
              </div>
            ))}
          </div>
          {companies.length === 0 && (
            <p className="text-text-muted text-sm">No companies available</p>
          )}
        </CardContent>
      </Card>

      {/* GICS Sector Preferences */}
      <Card className="bg-surface-primary border-border-default">
        <CardHeader>
          <CardTitle className="flex items-center text-text-primary">
            <Globe className="mr-2 h-5 w-5 text-gold" />
            GICS Sector Notifications
          </CardTitle>
          <p className="text-sm text-text-muted">
            Select GICS sectors you want to receive event notifications for
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {uniqueGicsSectors.map((sector) => (
              <div key={sector} className="flex items-center space-x-2">
                <Checkbox
                  id={`gics-${sector}`}
                  checked={selectedGicsSectors.includes(sector)}
                  onCheckedChange={(checked) => 
                    handleGicsToggle(sector, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`gics-${sector}`}
                  className="text-sm text-text-primary cursor-pointer"
                >
                  {sector}
                </Label>
              </div>
            ))}
          </div>
          {uniqueGicsSectors.length === 0 && (
            <p className="text-text-muted text-sm">No GICS sectors available</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <NotificationTestButton />
        <Button 
          onClick={savePreferences}
          disabled={saving}
          className="bg-gold hover:bg-gold-hover"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences; 