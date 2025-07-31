import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, TestTube } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { sendTestNotification } from '@/utils/emailNotifications';

export const NotificationTestButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleTestNotification = async () => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to test notifications",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      await sendTestNotification(profile.id);
      toast({
        title: "Test Notification Sent",
        description: "Test notification sent successfully! Check your email/SMS for the notification.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Button 
      onClick={handleTestNotification}
      disabled={testing || !profile}
      variant="outline"
      size="sm"
      className="border-gold text-gold hover:bg-gold hover:text-background"
    >
      <TestTube className="mr-2 h-4 w-4" />
      {testing ? 'Sending...' : 'Test Notifications'}
    </Button>
  );
};

export default NotificationTestButton; 