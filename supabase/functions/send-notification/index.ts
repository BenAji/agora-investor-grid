import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  notificationType: 'email' | 'sms' | 'desktop' | 'mobile';
  events: Array<{
    eventID: string;
    eventName: string;
    eventType: string;
    hostCompany: string;
    startDate: string;
    endDate?: string;
    location: string;
    description?: string;
  }>;
  userProfile: {
    first_name?: string;
    last_name?: string;
    user_id: string;
  };
  frequencyDays: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const sendEmail = async (notification: NotificationRequest) => {
  console.log('📧 Sending email notification...');
  
  const userName = `${notification.userProfile.first_name || ''} ${notification.userProfile.last_name || ''}`.trim() || 'User';
  
  const eventListHtml = notification.events.map(event => `
    <div style="border: 1px solid #333; margin: 10px 0; padding: 15px; background-color: #1a1a1a; border-radius: 4px;">
      <h3 style="color: #B8860B; margin: 0 0 10px 0;">${event.eventName}</h3>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Company:</strong> ${event.hostCompany}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Type:</strong> ${event.eventType.replace(/_/g, ' ')}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}</p>
      <p style="color: #cccccc; margin: 5px 0;"><strong>Location:</strong> ${event.location}</p>
      ${event.description ? `<p style="color: #cccccc; margin: 10px 0 0 0;">${event.description}</p>` : ''}
    </div>
  `).join('');

  const htmlContent = `
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
          You have ${notification.events.length} upcoming ${notification.events.length === 1 ? 'event' : 'events'} 
          in the next ${notification.frequencyDays} ${notification.frequencyDays === 1 ? 'day' : 'days'} based on your notification preferences:
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

  // Use SendGrid for email sending
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
  if (!sendGridApiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sendGridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: notification.userProfile.user_id }], // In production, use actual email
        subject: `AGORA: ${notification.events.length} Upcoming Event${notification.events.length > 1 ? 's' : ''} in ${notification.frequencyDays} Day${notification.frequencyDays > 1 ? 's' : ''}`
      }],
      from: { email: 'notifications@agora-platform.com', name: 'AGORA Platform' },
      content: [{ type: 'text/html', value: htmlContent }]
    })
  });

  if (!response.ok) {
    throw new Error(`SendGrid API error: ${response.status}`);
  }

  return { success: true, messageId: response.headers.get('X-Message-Id') };
};

const sendSMS = async (notification: NotificationRequest) => {
  console.log('📱 Sending SMS notification...');
  
  const userName = `${notification.userProfile.first_name || ''} ${notification.userProfile.last_name || ''}`.trim() || 'User';
  const eventsList = notification.events.map(event => 
    `• ${event.eventName} - ${event.hostCompany} (${new Date(event.startDate).toLocaleDateString()})`
  ).join('\n');

  const message = `AGORA Alert: Hi ${userName}, you have ${notification.events.length} upcoming event${notification.events.length > 1 ? 's' : ''} in ${notification.frequencyDays} day${notification.frequencyDays > 1 ? 's' : ''}:\n\n${eventsList}\n\nCheck your AGORA dashboard for details.`;

  // Use Twilio for SMS sending
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: twilioPhoneNumber,
      To: notification.userProfile.user_id, // In production, use actual phone number
      Body: message
    })
  });

  if (!response.ok) {
    throw new Error(`Twilio API error: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, messageId: data.sid };
};

const logNotification = async (
  userId: string,
  notificationType: string,
  eventIds: string[],
  status: string,
  messageId?: string,
  errorMessage?: string
) => {
  const { error } = await supabase
    .from('notification_logs')
    .insert({
      user_id: userId,
      notification_type: notificationType,
      event_ids: eventIds,
      status,
      message_id: messageId,
      error_message: errorMessage
    });

  if (error) {
    console.error('Error logging notification:', error);
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationRequest = await req.json();
    console.log(`🔔 Processing ${notification.notificationType} notification for user ${notification.userId}`);

    let result;
    let messageId;

    if (notification.notificationType === 'email') {
      result = await sendEmail(notification);
      messageId = result.messageId;
    } else if (notification.notificationType === 'sms') {
      result = await sendSMS(notification);
      messageId = result.messageId;
    } else if (notification.notificationType === 'desktop') {
      // Desktop notifications would be handled by the frontend
      console.log(`🖥️ Desktop notification queued for user ${notification.userId}`);
      result = { success: true, messageId: `desktop-${Date.now()}` };
    } else if (notification.notificationType === 'mobile') {
      // Mobile push notifications would be handled by a push service
      console.log(`📱 Mobile notification queued for user ${notification.userId}`);
      result = { success: true, messageId: `mobile-${Date.now()}` };
    } else {
      throw new Error(`Unsupported notification type: ${notification.notificationType}`);
    }

    // Log the notification
    await logNotification(
      notification.userId,
      notification.notificationType,
      notification.events.map(e => e.eventID),
      'sent',
      messageId
    );

    console.log(`✅ ${notification.notificationType} notification sent successfully`);

    return new Response(JSON.stringify({ success: true, messageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);

    // Try to log the error if we have enough information
    try {
      const body = await req.clone().json();
      if (body.userId && body.notificationType) {
        await logNotification(
          body.userId,
          body.notificationType,
          body.events?.map((e: any) => e.eventID) || [],
          'failed',
          undefined,
          error.message
        );
      }
    } catch (logError) {
      console.error('Could not log notification error:', logError);
    }

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