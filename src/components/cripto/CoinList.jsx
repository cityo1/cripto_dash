import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';
import useUpbitTickerStore from '../../store/useUpbitTickerStore';
import useTradeStore from '../../store/useTradeStore';

// 금액 포맷팅 유틸리티
const formatKRW = (val) =>
  new Intl.NumberFormat('ko-KR').format(Math.floor(val));

const CoinList = () => {
  const [coinTickers, setCoinTickers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const setSelectedCoin = useTradeStore((state) => state.setSelectedCoin);
  const selectedCoin = useTradeStore((state) => state.selectedCoin);

  // 1. KRW 마켓 전체 가져오기
  const { data: marketsData, isLoading, isError, error } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await axios.get('https://api.upbit.com/v1/market/all');
      return res.data.filter((m) => m.market.startsWith('KRW-'));
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });
  const markets = marketsData ?? [];

  // 2. 티커 REST API (React Query 캐싱 + 폴링)
  const { data: tickerData, isLoading: isTickerLoading } = useQuery({
    queryKey: ['tickers', markets.length],
    queryFn: async () => {
      if (!markets.length) return [];
      const codes = markets.map((m) => m.market).join(',');
      const res = await axios.get(
        `https://api.upbit.com/v1/ticker?markets=${codes}`,
      );
      return [...res.data].sort(
        (a, b) => (b.acc_trade_price_24h ?? 0) - (a.acc_trade_price_24h ?? 0),
      );
    },
    enabled: markets.length > 0,
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });

  // 3. 티커 베이스 + WebSocket 실시간 패치
  const wsMarkets = (() => {
    const base = tickerData ?? coinTickers;
    const top100 = base.slice(0, 100).map((c) => ({ market: c.market }));
    if (top100.length === 0) return [];
    const hasSelected = top100.some((m) => m.market === selectedCoin);
    return hasSelected ? top100 : [...top100, { market: selectedCoin }];
  })();
  useUpbitWebSocket(wsMarkets.length > 0 ? wsMarkets : null);

  const liveTickers = useUpbitTickerStore((s) => s.tickers);

  // ticker REST 데이터 → coinTickers 동기화
  useEffect(() => {
    if (tickerData?.length) setCoinTickers(tickerData);
  }, [tickerData]);

  // 4. REST 폴링 배치 데이터를 coinTickers에 병합
  useEffect(() => {
    if (!coinTickers.length || Object.keys(liveTickers).length === 0) return;
    setCoinTickers((prev) =>
      prev.map((coin) => {
        const live = liveTickers[coin.market];
        if (!live) return coin;
        return {
          ...coin,
          trade_price: live.trade_price,
          signed_change_rate: live.signed_change_rate,
          acc_trade_price_24h: live.acc_trade_price_24h,
        };
      }),
    );
  }, [liveTickers]);

  if (isLoading || (markets.length > 0 && isTickerLoading && !tickerData))
    return (
      <div className="p-4 text-gray-900 dark:text-white bg-white dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800">
        코인 목록 불러오는 중...
      </div>
    );

  if (isError)
    return (
      <div className="p-4 text-red-600 dark:text-red-400 bg-white dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800">
        코인 목록을 불러오지 못했습니다. ({error?.message ?? '네트워크 오류'})
      </div>
    );

  // 검색어로 필터링 (자산명 한글, 영문, 심볼)
  const filteredTickers = coinTickers.filter((coin) => {
    if (!searchQuery.trim()) return true;
    const marketInfo = markets?.find((m) => m.market === coin.market);
    const symbol = coin.market.split('-')[1]?.toLowerCase() ?? '';
    const koreanName = marketInfo?.korean_name?.toLowerCase() ?? '';
    const englishName = marketInfo?.english_name?.toLowerCase() ?? '';
    const query = searchQuery.trim().toLowerCase();
    return (
      symbol.includes(query) ||
      koreanName.includes(query) ||
      englishName.includes(query)
    );
  });

  return (
    <div className="bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* 검색 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <input
          type="text"
          placeholder="자산명/심볼 검색 (예: 비트코인, BTC)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500"
        />
      </div>
      {/* 헤더 */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-100 dark:bg-[#1e1e1e] text-xs font-bold text-gray-500 border-b border-gray-200 dark:border-gray-800">
        <span>자산명</span>
        <span className="text-right">현재가</span>
        <span className="text-right">전일대비</span>
        <span className="text-right">거래대금</span>
      </div>

      {/* 리스트 본문 */}
      <div className="overflow-y-auto max-h-[560px] custom-scrollbar">
        {filteredTickers.map((coin) => {
          const marketInfo = markets?.find((m) => m.market === coin.market);
          const isPositive = coin.signed_change_rate > 0;
          const isNegative = coin.signed_change_rate < 0;

          const priceColor = isPositive
            ? 'text-red-500'
            : isNegative
              ? 'text-blue-500'
              : 'text-gray-600 dark:text-gray-100';

          return (
            <div
              key={coin.market}
              onClick={() => setSelectedCoin(coin.market)} // 클릭 시 전역 상태 변경
              className={`grid grid-cols-4 gap-2 p-4 cursor-pointer border-b border-gray-200 dark:border-gray-900 transition-colors items-center ${
                selectedCoin === coin.market
                  ? 'bg-amber-50 dark:bg-[#2a2a2a] border-l-4 border-l-amber-500 dark:border-l-yellow-500'
                  : 'hover:bg-gray-100 dark:hover:bg-[#222]'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">
                  {marketInfo?.korean_name}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                  {coin.market.split('-')[1]}
                </span>
              </div>

              <div className={`text-right text-sm font-semibold ${priceColor}`}>
                {formatKRW(coin.trade_price)}
              </div>

              <div className={`text-right text-xs font-medium ${priceColor}`}>
                {(coin.signed_change_rate * 100).toFixed(2)}%
              </div>

              <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                {Math.floor(
                  coin.acc_trade_price_24h / 1000000,
                ).toLocaleString()}
                M
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoinList;
