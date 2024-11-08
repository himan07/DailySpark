import { useEffect, useCallback, useRef } from 'react';
import { Todo } from '../types';

export function useNotifications(todos: Todo[]) {
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

    const handleClick = async () => {
      try {
        initAudioContext();
        const result = await Notification.requestPermission();
        document.removeEventListener('click', handleClick);
        return result === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    };

    if (Notification.permission !== 'granted') {
      document.addEventListener('click', handleClick, { once: true });
    }

    return Notification.permission === 'granted';
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
    
    if (sentNotifications.current.has(notificationId)) {
      return;
    }

    try {
      if (Notification.permission !== 'granted') {
        await requestNotificationPermission();
        if (Notification.permission !== 'granted') return;
      }

      if (window.navigator.userAgent.includes('Safari') && 
          !window.navigator.userAgent.includes('Chrome')) {
        await initAudioContext()?.resume();
      }

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
  }, [playNotificationSound, requestNotificationPermission, initAudioContext]);

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
    permission: Notification.permission
  };
}