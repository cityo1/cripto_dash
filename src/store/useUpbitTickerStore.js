import { create } from 'zustand';
import axios from 'axios';

const POLL_INTERVAL_MS = 10000; // 업비트 브라우저 Origin 제한: 10초당 1회

const useUpbitTickerStore = create((set, get) => {
  const subscriptions = new Map();
  let pollTimer = null;

  const getEffectiveMarkets = () => {
    const all = new Set();
    subscriptions.forEach((markets) => markets.forEach((m) => all.add(m)));
    return Array.from(all);
  };

  const fetchTickers = async () => {
    const markets = getEffectiveMarkets();
    if (markets.length === 0) return;

    try {
      const codes = markets.join(',');
      const res = await axios.get(
        `https://api.upbit.com/v1/ticker?markets=${codes}`,
      );
      const tickers = {};
      res.data.forEach((t) => {
        tickers[t.market] = { ...t, code: t.market };
      });
      const last = res.data[0];
      set({
        tickers,
        _lastTicker: last ? { ...last, code: last.market } : null,
        status: 'connected',
      });
    } catch (err) {
      console.warn('업비트 시세 조회 실패:', err?.message);
      set({ status: 'disconnected' });
    }
  };

  const startPolling = () => {
    fetchTickers();
    if (!pollTimer) {
      pollTimer = setInterval(fetchTickers, POLL_INTERVAL_MS);
    }
  };

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    set({ tickers: {}, _lastTicker: null, status: 'disconnected' });
  };

  return {
    tickers: {},
    status: 'disconnected',
    _lastTicker: null,
    _effectiveMarkets: [],

    subscribe: (id, markets) => {
      const arr = Array.isArray(markets)
        ? markets
            .map((m) => (typeof m === 'string' ? m : m?.market))
            .filter(Boolean)
        : [];
      subscriptions.set(id, new Set(arr));
      const effective = getEffectiveMarkets();
      set({ _effectiveMarkets: effective });
      if (effective.length > 0) {
        set({ status: 'connecting' });
        startPolling();
      } else {
        stopPolling();
      }
    },

    unsubscribe: (id) => {
      subscriptions.delete(id);
      const effective = getEffectiveMarkets();
      set({ _effectiveMarkets: effective });
      if (effective.length === 0) {
        stopPolling();
      } else {
        startPolling(); // 재시작 (목록 변경 시 즉시 1회 fetch)
      }
    },
  };
});

export default useUpbitTickerStore;
