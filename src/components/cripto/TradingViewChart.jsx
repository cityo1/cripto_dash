import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import axios from 'axios';
import useTradeStore from '../../store/useTradeStore';
import useThemeStore from '../../store/useThemeStore';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';

const TIMEFRAMES = [
  { label: '1분', unit: 1, type: 'minutes' },
  { label: '3분', unit: 3, type: 'minutes' },
  { label: '5분', unit: 5, type: 'minutes' },
  { label: '15분', unit: 15, type: 'minutes' },
  { label: '30분', unit: 30, type: 'minutes' },
  { label: '60분', unit: 60, type: 'minutes' },
  { label: '일봉', unit: null, type: 'days' },
];

const chartThemes = {
  light: {
    background: '#ffffff',
    textColor: '#191919',
    gridColor: '#e5e7eb',
    tooltipBg: 'rgba(255,255,255,0.95)',
    tooltipBorder: '#e5e7eb',
  },
  dark: {
    background: '#1a1a1a',
    textColor: '#d1d4dc',
    gridColor: '#2b2b2b',
    tooltipBg: 'rgba(30,30,30,0.95)',
    tooltipBorder: '#404040',
  },
};

const formatPrice = (n) =>
  typeof n === 'number' ? n.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : '-';
const formatTime = (t) => {
  if (typeof t === 'number') {
    const d = new Date(t * 1000);
    return d.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(t ?? '');
};

const TradingViewChart = () => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();

  const { selectedCoin } = useTradeStore();
  const { theme } = useThemeStore();
  const { data: realTimeData } = useUpbitWebSocket([{ market: selectedCoin }]);

  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [isLoading, setIsLoading] = useState(false);

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
  const chartTheme = isDark ? chartThemes.dark : chartThemes.light;

  // 1. 차트 초기화
  useEffect(() => {
    if (!selectedCoin || !chartContainerRef.current) return;

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

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef5350',
      downColor: '#26a69a',
      borderVisible: false,
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current)
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [selectedCoin]);

  // 2. 테마 변경 시 차트 옵션 업데이트
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
      },
      grid: {
        vertLines: { color: chartTheme.gridColor },
        horzLines: { color: chartTheme.gridColor },
      },
    });
  }, [chartTheme]);

  // 3. 캔들 데이터 로드 (타임프레임 변경 시)
  useEffect(() => {
    const series = seriesRef.current;
    if (!selectedCoin || !series) return;

    const fetchCandles = async () => {
      setIsLoading(true);
      try {
        const url =
          timeframe.type === 'days'
            ? `https://api.upbit.com/v1/candles/days?market=${selectedCoin}&count=200`
            : `https://api.upbit.com/v1/candles/minutes/${timeframe.unit}?market=${selectedCoin}&count=200`;
        const res = await axios.get(url);
        const data = res.data
          .map((c) => ({
            time: Math.floor(
              new Date(c.candle_date_time_kst).getTime() / 1000,
            ),
            open: c.opening_price,
            high: c.high_price,
            low: c.low_price,
            close: c.trade_price,
          }))
          .sort((a, b) => a.time - b.time);
        series.setData(data);
      } catch (err) {
        console.error('차트 데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandles();
  }, [selectedCoin, timeframe]);

  // 4. 호버 툴팁
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = chartContainerRef.current;
    if (!chart || !series || !container) return;

    const toolTip = document.createElement('div');
    toolTip.style.cssText = `
      position: absolute; display: none; padding: 8px 10px; font-size: 12px;
      z-index: 1000; pointer-events: none; border-radius: 6px;
      font-family: system-ui, sans-serif; line-height: 1.5;
      min-width: 120px;
    `;
    toolTip.style.background = chartTheme.tooltipBg;
    toolTip.style.color = chartTheme.textColor;
    toolTip.style.border = `1px solid ${chartTheme.tooltipBorder}`;
    toolTip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    container.style.position = 'relative';
    container.appendChild(toolTip);

    const handler = (param) => {
      if (
        param.point == null ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        toolTip.style.display = 'none';
        return;
      }
      const data = param.seriesData.get(series);
      if (!data || data.close == null) {
        toolTip.style.display = 'none';
        return;
      }
      toolTip.style.display = 'block';
      toolTip.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px;">${formatTime(param.time)}</div>
        <div>시가: ${formatPrice(data.open)}</div>
        <div>고가: <span style="color:#ef5350">${formatPrice(data.high)}</span></div>
        <div>저가: <span style="color:#26a69a">${formatPrice(data.low)}</span></div>
        <div>종가: ${formatPrice(data.close)}</div>
      `;
      let left = param.point.x + 12;
      let top = param.point.y + 12;
      if (left + 130 > container.clientWidth) left = param.point.x - 142;
      if (top + 100 > container.clientHeight) top = param.point.y - 100;
      toolTip.style.left = Math.max(8, left) + 'px';
      toolTip.style.top = Math.max(8, top) + 'px';
    };
    chart.subscribeCrosshairMove(handler);

    return () => {
      chart.unsubscribeCrosshairMove(handler);
      toolTip.remove();
    };
  }, [selectedCoin, timeframe, chartTheme.tooltipBg, chartTheme.tooltipBorder, chartTheme.textColor]);

  // 5. 실시간 데이터 업데이트 (1분봉만 - 다른 타임프레임은 REST로 처리)
  useEffect(() => {
    const series = seriesRef.current;
    if (
      realTimeData &&
      series &&
      realTimeData.code === selectedCoin &&
      timeframe.unit === 1 &&
      timeframe.type === 'minutes'
    ) {
      series.update({
        time: Math.floor(realTimeData.trade_timestamp / 1000),
        open: realTimeData.opening_price,
        high: realTimeData.high_price,
        low: realTimeData.low_price,
        close: realTimeData.trade_price,
      });
    }
  }, [realTimeData, selectedCoin, timeframe]);

  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {selectedCoin} 실시간 차트
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeframe.label === tf.label
                    ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          {isLoading && (
            <span className="text-xs text-gray-500 animate-pulse">
              로딩...
            </span>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default TradingViewChart;
