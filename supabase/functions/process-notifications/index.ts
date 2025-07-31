import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: 'email' | 'sms' | 'desktop' | 'mobile';
  enabled: boolean;
  frequency_days: number;
  gics_sectors?: string[];
  companies?: string[];
}

interface Event {
  eventID: string;
  eventName: string;
  eventType: string;
  hostCompany: string;
  startDate: string;
  endDate?: string;
  location: string;
  description?: string;
  companyID?: string;
  gicsSector?: string;
  gicsSubSector?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const getUpcomingEvents = async (daysAhead: number): Promise<Event[]> => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('startDate', startDate.toISOString())
    .lte('startDate', endDate.toISOString())
    .order('startDate');

  if (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }

  return data || [];
};

const getUsersWithPreferences = async (): Promise<{ profile: UserProfile, preferences: NotificationPreference[] }[]> => {
  // Get all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError);
    return [];
  }

  const usersWithPreferences = [];

  for (const profile of profiles || []) {
    // Get notification preferences for each user
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', profile.id)
      .eq('enabled', true);

    if (prefsError) {
      console.error(`Error fetching preferences for user ${profile.id}:`, prefsError);
      continue;
    }

    if (preferences && preferences.length > 0) {
      usersWithPreferences.push({ profile, preferences });
    }
  }

  return usersWithPreferences;
};

const filterEventsForUser = (events: Event[], preference: NotificationPreference): Event[] => {
  return events.filter(event => {
    // Check if user wants notifications for this company
    if (preference.companies && preference.companies.length > 0) {
      if (event.companyID && preference.companies.includes(event.companyID)) {
        return true;
      }
      // Also check by company name if companyID is not available
      if (event.hostCompany && preference.companies.some(c => 
        event.hostCompany.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(event.hostCompany.toLowerCase())
      )) {
        return true;
      }
    }

    // Check GICS sectors
    if (preference.gics_sectors && preference.gics_sectors.length > 0) {
      if (event.gicsSector && preference.gics_sectors.includes(event.gicsSector)) {
        return true;
      }
    }

    // If no specific preferences, include all events
    if ((!preference.companies || preference.companies.length === 0) && 
        (!preference.gics_sectors || preference.gics_sectors.length === 0)) {
      return true;
    }

    return false;
  });
};

const sendNotificationToUser = async (
  userProfile: UserProfile,
  preference: NotificationPreference,
  events: Event[]
) => {
  const notificationData = {
    userId: userProfile.id,
    notificationType: preference.notification_type,
    events: events.map(event => ({
      eventID: event.eventID,
      eventName: event.eventName,
      eventType: event.eventType,
      hostCompany: event.hostCompany || '',
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || '',
      description: event.description
    })),
    userProfile: {
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      user_id: userProfile.user_id
    },
    frequencyDays: preference.frequency_days
  };

  // Call the send-notification function
  const { error } = await supabase.functions.invoke('send-notification', {
    body: notificationData
  });

  if (error) {
    console.error(`Error sending ${preference.notification_type} notification to user ${userProfile.id}:`, error);
    throw error;
  }

  console.log(`✅ Sent ${preference.notification_type} notification to user ${userProfile.id} for ${events.length} events`);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Starting notification processing...');

    // Get all users with their notification preferences
    const usersWithPreferences = await getUsersWithPreferences();
    console.log(`📊 Found ${usersWithPreferences.length} users with notification preferences`);

    let totalNotificationsSent = 0;

    for (const { profile, preferences } of usersWithPreferences) {
      console.log(`👤 Processing user ${profile.id} with ${preferences.length} preferences`);

      for (const preference of preferences) {
        try {
          // Get upcoming events based on frequency
          const events = await getUpcomingEvents(preference.frequency_days);
          
          // Filter events based on user preferences
          const relevantEvents = filterEventsForUser(events, preference);

          if (relevantEvents.length === 0) {
            console.log(`📭 No relevant events for user ${profile.id} (${preference.notification_type})`);
            continue;
          }

          // Check if we've already sent a notification recently
          const { data: recentLogs } = await supabase
            .from('notification_logs')
            .select('sent_at')
            .eq('user_id', profile.id)
            .eq('notification_type', preference.notification_type)
            .gte('sent_at', new Date(Date.now() - preference.frequency_days * 24 * 60 * 60 * 1000).toISOString())
            .eq('status', 'sent')
            .order('sent_at', { ascending: false })
            .limit(1);

          if (recentLogs && recentLogs.length > 0) {
            console.log(`⏭️ Skipping user ${profile.id} - notification sent recently`);
            continue;
          }

          // Send notification
          await sendNotificationToUser(profile, preference, relevantEvents);
          totalNotificationsSent++;

        } catch (error) {
          console.error(`❌ Error processing preference for user ${profile.id}:`, error);
          continue;
        }
      }
    }

    console.log(`🎉 Notification processing completed. Sent ${totalNotificationsSent} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        usersProcessed: usersWithPreferences.length,
        notificationsSent: totalNotificationsSent 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Error in notification processing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);