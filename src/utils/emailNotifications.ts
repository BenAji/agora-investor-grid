import { supabase } from '@/integrations/supabase/client';

interface NotificationPreference {
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
  endDate: string;
  location: string;
  description: string;
  companyID?: string;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

// Mock email service - in production, this would integrate with SendGrid, Mailgun, etc.
const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  console.log('📧 Email Notification Sent:', { to, subject });
  console.log('Content:', htmlContent);
  
  // In production, you would integrate with an email service:
  // await emailService.send({ to, subject, html: htmlContent });
  
  return { success: true, messageId: `mock-${Date.now()}` };
};

// Mock SMS service - in production, this would integrate with Twilio, AWS SNS, etc.
const sendSMS = async (to: string, message: string) => {
  console.log('📱 SMS Notification Sent:', { to, message });
  
  // In production, you would integrate with an SMS service:
  // await smsService.send({ to, body: message });
  
  return { success: true, messageId: `sms-${Date.now()}` };
};

// Generate HTML email template
const generateEmailTemplate = (events: Event[], userName: string, daysBefore: number) => {
  const eventListHtml = events.map(event => `
    <div style="border: 1px solid #333; margin: 10px 0; padding: 15px; background-color: #1a1a1a; border-radius: 4px;">
              <h3 style="color: #B8860B; margin: 0 0 10px 0;">${event.eventName}</h3>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Company:</strong> ${event.hostCompany}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Type:</strong> ${event.eventType.replace(/_/g, ' ')}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
      ${event.description ? `<p style="color: #cccccc; margin: 10px 0 0 0;">${event.description}</p>` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Upcoming Events - AGORA</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #B8860B; margin-bottom: 5px;">AGORA</h1>
          <p style="color: #cccccc; margin: 0;">Bloomberg-Style IR Platform</p>
        </div>
        
        <h2 style="color: #B8860B;">Hello ${userName},</h2>
        <p style="color: #cccccc; line-height: 1.6;">
          You have ${events.length} upcoming ${events.length === 1 ? 'event' : 'events'} 
          in the next ${daysBefore} ${daysBefore === 1 ? 'day' : 'days'} based on your notification preferences:
        </p>
        
        ${eventListHtml}
        
        <div style="margin-top: 30px; padding: 20px; background-color: #2d2d2d; border-radius: 4px;">
          <p style="color: #cccccc; margin: 0; font-size: 14px;">
            You're receiving this notification because you've subscribed to receive updates about upcoming events.
            You can manage your notification preferences in your AGORA account settings.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #888888; font-size: 12px;">
            © 2024 AGORA - Bloomberg-Style IR Platform
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate SMS message
const generateSMSMessage = (events: Event[], userName: string, daysBefore: number) => {
  const eventsList = events.map(event => 
    `• ${event.eventName} - ${event.hostCompany} (${new Date(event.startDate).toLocaleDateString()})`
  ).join('\n');

  return `AGORA Alert: Hi ${userName}, you have ${events.length} upcoming event${events.length > 1 ? 's' : ''} in ${daysBefore} day${daysBefore > 1 ? 's' : ''}:\n\n${eventsList}\n\nCheck your AGORA dashboard for details.`;
};

// Get events happening in the next N days
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

// Get all users with their profiles
const getUsersWithProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }

  return data || [];
};

// Filter events based on user's notification preferences
const filterEventsForUser = (events: Event[], preferences: NotificationPreference): Event[] => {
  return events.filter(event => {
    // Check if user wants notifications for this company
    if (preferences.companies && preferences.companies.length > 0) {
      if (event.companyID && preferences.companies.includes(event.companyID)) {
        return true;
      }
    }

    // Check GICS sectors (this would require additional logic to map events to GICS)
    // For now, we'll include all events if GICS sectors are specified
    if (preferences.gics_sectors && preferences.gics_sectors.length > 0) {
      // In a real implementation, you'd need to map events to GICS sectors
      return true;
    }

    // If no specific preferences, include all events
    if ((!preferences.companies || preferences.companies.length === 0) && 
        (!preferences.gics_sectors || preferences.gics_sectors.length === 0)) {
      return true;
    }

    return false;
  });
};

// Main function to process and send notifications (now uses database)
export const processEventNotifications = async (): Promise<void> => {
  console.log('🔔 Starting event notification process...');
  console.log('ℹ️ Note: Notification processing is now handled by the process-notifications edge function');
  
  try {
    // Call the edge function to process notifications
    const { data, error } = await supabase.functions.invoke('process-notifications', {
      body: { manual: true }
    });

    if (error) {
      console.error('Error calling process-notifications function:', error);
      throw error;
    }

    console.log('✅ Process-notifications function called successfully:', data);
  } catch (error) {
    console.error('❌ Error in notification process:', error);
    throw error;
  }
};

// Function to schedule notifications (would be called by a cron job or scheduler)
export const scheduleEventNotifications = async (): Promise<void> => {
  console.log('⏰ Scheduling event notifications...');
  
  // In production, this would be called by a scheduler
  // For now, we'll just run it immediately
  await processEventNotifications();
};

// Function to send a test notification (now uses edge function)
export const sendTestNotification = async (userId: string): Promise<void> => {
  console.log(`🧪 Sending test notification to user ${userId}`);
  
  try {
    const events = await getUpcomingEvents(7);
    if (events.length === 0) {
      console.log('No upcoming events found for test notification');
      return;
    }

    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!user) {
      console.log('User not found for test notification');
      return;
    }

    // Call the send-notification edge function for test
    const testNotificationData = {
      userId: user.id,
      notificationType: 'email',
      events: events.slice(0, 3).map(event => ({
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
        first_name: user.first_name,
        last_name: user.last_name,
        user_id: user.user_id
      },
      frequencyDays: 7
    };

    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: testNotificationData
    });

    if (error) {
      console.error('Error calling send-notification function:', error);
      throw error;
    }

    console.log('✅ Test notification sent successfully:', data);
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
    throw error;
  }
};

export default {
  processEventNotifications,
  scheduleEventNotifications,
  sendTestNotification,
}; 