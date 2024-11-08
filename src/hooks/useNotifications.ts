import { useEffect, useCallback } from 'react';
import { Todo } from '../types';

export function useNotifications(todos: Todo[]) {
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
        return false;
      }

      // Handle Safari's different permission model
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }

      return Notification.permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Lower volume
      
      // Play sound briefly
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // Show notification
      const notification = new Notification(title, {
        body,
        icon: '/notification-icon.png',
        badge: '/notification-icon.png',
        // renotify: true,
        tag: 'todo-reminder',
        requireInteraction: true,
        silent: true // We're handling the sound manually
      });

      // Handle notification interaction
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Fallback for systems where notifications might fail
      if (!notification) {
        console.log('Notification failed, using alert as fallback');
        alert(`${title}\n${body}`);
      }

      // Cleanup: Close the oscillator and audio context after sound completion
      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
      // Fallback to alert if notification fails
      alert(`${title}\n${body}`);
    }
  }, []);

  // Request permission when component mounts
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Check for upcoming todos
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      todos.forEach((todo) => {
        if (todo.completed) return;

        const dueDate = new Date(todo.dueDate);
        const timeUntilDue = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.round(timeUntilDue / 60000);

        // Notify at different intervals: 30 mins, 15 mins, 5 mins
        const notificationIntervals = [30, 15, 5];
        
        if (timeUntilDue > 0 && notificationIntervals.includes(minutesUntilDue)) {
          const title = 'Todo Reminder';
          const body = `Task "${todo.title}" is due in ${minutesUntilDue} minutes!${
            minutesUntilDue <= 5 ? ' ⚠️ Urgent!' : ''
          }`;

          showNotification(title, body);
        }
      });
    };

    // Check more frequently (every 30 seconds) for more accurate notifications
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [todos, showNotification]);

  // Return permission status for UI feedback if needed
  return {
    isSupported: 'Notification' in window,
    permission: Notification.permission
  };
}
