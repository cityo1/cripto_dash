/**
 * 업비트 시세 훅 (REST API 폴링 방식)
 * - WebSocket 대신 REST API 10초 폴링 사용 (브라우저 Origin 제한 대응)
 * - 기존 useUpbitWebSocket과 동일한 인터페이스 유지
 */
import { useEffect, useRef } from 'react';
import useUpbitTickerStore from '../store/useUpbitTickerStore';

let idCounter = 0;

const useUpbitWebSocket = (targetMarkets) => {
  const idRef = useRef(null);
  if (idRef.current == null) idRef.current = `ticker-${++idCounter}`;
  const id = idRef.current;

  const markets = Array.isArray(targetMarkets)
    ? targetMarkets
        .map((m) => (typeof m === 'string' ? m : m?.market))
        .filter(Boolean)
    : [];

  const codesKey = markets.length > 0 ? [...markets].sort().join(',') : '';

  const primaryMarket = markets[0] ?? null;
  const singleMarket = markets.length === 1;

  const status = useUpbitTickerStore((s) => s.status);
  const tickerForPrimary = useUpbitTickerStore((s) =>
    primaryMarket ? s.tickers[primaryMarket] : null,
  );
  const lastTicker = useUpbitTickerStore((s) => s._lastTicker);

  const data = singleMarket ? tickerForPrimary : lastTicker;

  const prevCodesRef = useRef('__none__');
  useEffect(() => {
    if (!codesKey || codesKey === prevCodesRef.current) return;
    prevCodesRef.current = codesKey;
    const marketList = codesKey.split(',');
    const store = useUpbitTickerStore.getState();
    store.subscribe(id, marketList);
    return () => {
      prevCodesRef.current = '__none__';
      store.unsubscribe(id);
    };
  }, [id, codesKey]);

  return {
    data: data ?? null,
    status,
  };
};

export default useUpbitWebSocket;
