import { useEffect, useCallback, useRef, useState } from 'react';
import { Todo } from '../types';

export function useNotifications(todos: Todo[]) {
  const [isPermissionGranted, setIsPermissionGranted] = useState(Notification.permission === 'granted');
  const sentNotifications = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
    return audioContextRef.current;
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setIsPermissionGranted(true);
      return true;
    }

    try {
      initAudioContext();
      const result = await Notification.requestPermission();
      setIsPermissionGranted(result === 'granted');
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [initAudioContext]);

  const playNotificationSound = useCallback(() => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    try {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [initAudioContext]);

  const showNotification = useCallback(async (todo: Todo, minutesUntilDue: number) => {
    const notificationId = `${todo.id}-${minutesUntilDue}`;
    
    if (sentNotifications.current.has(notificationId)) return;

    if (!isPermissionGranted) {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) return;
    }

    try {
      playNotificationSound();
      const options: NotificationOptions = {
        body: `Task "${todo.title}" is due in ${minutesUntilDue} minutes!${
          minutesUntilDue <= 5 ? ' ⚠️ Urgent!' : ''
        }`,
        icon: '/notification-icon.png',
        badge: '/notification-icon.png',
        tag: `todo-${todo.id}-${Date.now()}`,
        requireInteraction: true,
        silent: true
      };

      const notification = new Notification('Todo Reminder', options);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      sentNotifications.current.add(notificationId);

      setTimeout(() => {
        sentNotifications.current.delete(notificationId);
      }, 60000);

    } catch (error) {
      console.error('Error showing notification:', error);
      alert(`Todo Reminder: Task "${todo.title}" is due in ${minutesUntilDue} minutes!`);
    }
  }, [playNotificationSound, requestNotificationPermission, isPermissionGranted]);

  useEffect(() => {
    requestNotificationPermission();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
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
    permission: Notification.permission,
    isPermissionGranted,
  };
}



