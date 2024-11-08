import { useEffect, useCallback, useRef } from 'react';
import { Todo } from '../types';

export function useNotifications(todos: Todo[]) {
  const sentNotifications = useRef<Set<string>>(new Set());

  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support desktop notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      setTimeout(() => {
        audioContext.close();
      }, 1000);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  const showNotification = useCallback((todo: Todo, minutesUntilDue: number) => {
    const notificationId = `${todo.id}-${minutesUntilDue}`;
    
    if (sentNotifications.current.has(notificationId)) {
      return;
    }

    try {
      playNotificationSound();

      const title = 'Todo Reminder';
      const options: NotificationOptions = {
        body: `Task "${todo.title}" is due in ${minutesUntilDue} minutes!${
          minutesUntilDue <= 5 ? ' ⚠️ Urgent!' : ''
        }`,
        icon: '/notification-icon.png',
        badge: '/notification-icon.png',
        tag: `todo-${todo.id}`,
        requireInteraction: true,
        silent: true
      };
      
      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      sentNotifications.current.add(notificationId);

      setTimeout(() => {
        sentNotifications.current.delete(notificationId);
      }, 60000);

      if (!notification) {
        throw new Error('Failed to create notification');
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      alert(`Todo Reminder: Task "${todo.title}" is due in ${minutesUntilDue} minutes!`);
    }
  }, [playNotificationSound]);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (Notification.permission === 'default') {
        await requestNotificationPermission();
      }
    };

    initializeNotifications();
  }, [requestNotificationPermission]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      todos.forEach((todo) => {
        if (todo.completed) return;

        const dueDate = new Date(todo.dueDate);
        const timeUntilDue = dueDate.getTime() - now.getTime();
        const minutesUntilDue = Math.round(timeUntilDue / 60000);

        const notificationIntervals = [30, 15, 5];
        
        if (timeUntilDue > 0 && notificationIntervals.includes(minutesUntilDue)) {
          showNotification(todo, minutesUntilDue);
        }
      });
    };

    checkReminders();

    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [todos, showNotification]);

  return {
    isSupported: 'Notification' in window,
    permission: Notification.permission
  };
}
