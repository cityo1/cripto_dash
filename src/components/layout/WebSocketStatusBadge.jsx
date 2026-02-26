import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';

const WebSocketStatusBadge = () => {
  const { status } = useUpbitWebSocket([{ market: 'KRW-BTC' }]);

  const config = {
    connecting: {
      label: '연결 중',
      icon: Loader2,
      className: 'text-amber-500',
      animate: true,
    },
    connected: {
      label: '10초 갱신',
      icon: Wifi,
      className: 'text-emerald-500',
      animate: false,
    },
    reconnecting: {
      label: '갱신 중',
      icon: Loader2,
      className: 'text-amber-500',
      animate: true,
    },
    disconnected: {
      label: '오프라인',
      icon: WifiOff,
      className: 'text-gray-400 dark:text-gray-500',
      animate: false,
    },
  };

  const { label, icon: Icon, className, animate } = config[status] ?? config.disconnected;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 ${className}`}
      title={`시세: ${label} (REST API 10초 폴링)`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`}
        strokeWidth={2}
      />
      {label}
    </span>
  );
};

export default WebSocketStatusBadge;
