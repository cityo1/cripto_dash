import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import axios from 'axios';
import useTradeStore from '../../store/useTradeStore';
import useThemeStore from '../../store/useThemeStore';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';

const chartThemes = {
  light: {
    background: '#ffffff',
    textColor: '#191919',
    gridColor: '#e5e7eb',
  },
  dark: {
    background: '#1a1a1a',
    textColor: '#d1d4dc',
    gridColor: '#2b2b2b',
  },
};

const TradingViewChart = () => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();

  const { selectedCoin } = useTradeStore();
  const { theme } = useThemeStore();
  const realTimeData = useUpbitWebSocket([{ market: selectedCoin }]);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
  const chartTheme = isDark ? chartThemes.dark : chartThemes.light;

  // 1. 차트 초기화 및 과거 데이터 로드
  useEffect(() => {
    if (!selectedCoin) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
      },
      grid: {
        vertLines: { color: chartTheme.gridColor },
        horzLines: { color: chartTheme.gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderVisible: false,
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // 업비트 분봉 API로 과거 데이터 가져오기
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `https://api.upbit.com/v1/candles/minutes/1?market=${selectedCoin}&count=100`,
        );
        const data = res.data
          .map((c) => ({
            time: Math.floor(new Date(c.candle_date_time_kst).getTime() / 1000),
            open: c.opening_price,
            high: c.high_price,
            low: c.low_price,
            close: c.trade_price,
          }))
          .sort((a, b) => a.time - b.time);

        candlestickSeries.setData(data);
      } catch (err) {
        console.error('차트 데이터 로드 실패:', err);
      }
    };

    fetchHistory();

    // 브라우저 리사이즈 대응
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [selectedCoin, chartTheme.background, chartTheme.textColor, chartTheme.gridColor]);

  // 2. 실시간 데이터 업데이트 (웹소켓 연동)
  useEffect(() => {
    if (
      realTimeData &&
      seriesRef.current &&
      realTimeData.code === selectedCoin
    ) {
      seriesRef.current.update({
        time: Math.floor(realTimeData.trade_timestamp / 1000),
        open: realTimeData.opening_price,
        high: realTimeData.high_price,
        low: realTimeData.low_price,
        close: realTimeData.trade_price,
      });
    }
  }, [realTimeData, selectedCoin]);

  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {selectedCoin} 실시간 차트
        </h3>
        <span className="text-xs text-gray-500">1분봉 기준</span>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default TradingViewChart;
