import type { Dispatch } from 'react';
import type { AppAction } from '../context/AppContext';
import type { NotificationType } from '../components/common/NotificationSystem';

export function notify(
  dispatch: Dispatch<AppAction>,
  type: NotificationType,
  title: string,
  message: string,
): void {
  dispatch({
    type: 'ADD_NOTIFICATION',
    payload: {
      id: `notify-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      title,
      message,
      duration: type === 'error' ? 8000 : 5000,
    },
  });
}
