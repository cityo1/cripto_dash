import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';
import useTradeStore from '../../store/useTradeStore';

// 금액 포맷팅 유틸리티
const formatKRW = (val) =>
  new Intl.NumberFormat('ko-KR').format(Math.floor(val));

const CoinList = ({ onSelectCoin }) => {
  const [coinTickers, setCoinTickers] = useState([]);
  const setSelectedCoin = useTradeStore((state) => state.setSelectedCoin);
  const selectedCoin = useTradeStore((state) => state.selectedCoin);

  // 1. KRW 마켓 정보 가져오기
  const { data: markets, isLoading } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await axios.get('https://api.upbit.com/v1/market/all');
      return res.data.filter((m) => m.market.startsWith('KRW-'));
    },
  });

  // 2. 작성하신 커스텀 훅 사용
  const realTimeData = useUpbitWebSocket(markets);

  // 3. 초기 시세 설정 (최초 1회)
  useEffect(() => {
    const fetchInitialTickers = async () => {
      if (!markets) return;
      const codes = markets.map((m) => m.market).join(',');
      const res = await axios.get(
        `https://api.upbit.com/v1/ticker?markets=${codes}`,
      );
      setCoinTickers(res.data);
    };
    fetchInitialTickers();
  }, [markets]);

  // 4. 소켓 데이터가 들어올 때마다 해당 코인 가격만 업데이트
  useEffect(() => {
    if (realTimeData) {
      setCoinTickers((prev) =>
        prev.map((coin) =>
          coin.market === realTimeData.code
            ? {
                ...coin,
                trade_price: realTimeData.trade_price,
                signed_change_rate: realTimeData.signed_change_rate,
                acc_trade_price_24h: realTimeData.acc_trade_price_24h,
              }
            : coin,
        ),
      );
    }
  }, [realTimeData]);

  if (isLoading)
    return (
      <div className="p-4 text-gray-900 dark:text-white">
        코인 목록 불러오는 중...
      </div>
    );

  return (
    <div className="bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* 헤더 */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-100 dark:bg-[#1e1e1e] text-xs font-bold text-gray-500 border-b border-gray-200 dark:border-gray-800">
        <span>자산명</span>
        <span className="text-right">현재가</span>
        <span className="text-right">전일대비</span>
        <span className="text-right">거래대금</span>
      </div>

      {/* 리스트 본문 */}
      <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
        {coinTickers.map((coin) => {
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
