import React, { useState, useEffect } from 'react';
import useTradeStore from '../../store/useTradeStore';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';

const OrderForm = () => {
  // 1. 전역 상태 가져오기
  const { selectedCoin, balance, myAssets, buyCoin, sellCoin } =
    useTradeStore();

  // 2. 현재 선택된 코인의 실시간 가격 정보 가져오기 (1개 코인만 구독)
  const realTimeData = useUpbitWebSocket([{ market: selectedCoin }]);
  const currentPrice = realTimeData?.trade_price || 0;

  // 3. 로컬 상태 (매수/매도 탭, 입력 수량)
  const [tradeType, setTradeType] = useState('BUY'); // 'BUY' 또는 'SELL'
  const [amount, setAmount] = useState('');

  // 코인이 바뀌면 입력창 초기화
  useEffect(() => {
    setAmount('');
  }, [selectedCoin]);

  const totalPrice = currentPrice * Number(amount);
  const myCoinAmount = myAssets[selectedCoin]?.quantity || 0;

  const handleTrade = () => {
    if (!amount || Number(amount) <= 0) {
      alert('수량을 입력해주세요.');
      return;
    }

    if (tradeType === 'BUY') {
      buyCoin(selectedCoin, currentPrice, Number(amount));
    } else {
      sellCoin(selectedCoin, currentPrice, Number(amount));
    }
    setAmount(''); // 주문 후 입력창 초기화
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl">
      {/* 탭 메뉴 */}
      <div className="flex mb-6 bg-gray-100 dark:bg-[#252525] rounded-md p-1">
        <button
          onClick={() => setTradeType('BUY')}
          className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
            tradeType === 'BUY'
              ? 'bg-red-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          매수
        </button>
        <button
          onClick={() => setTradeType('SELL')}
          className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
            tradeType === 'SELL'
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          매도
        </button>
      </div>

      {/* 정보 요약 */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">주문 가능</span>
          <span className="font-mono">
            {tradeType === 'BUY'
              ? `${balance.toLocaleString()} KRW`
              : `${myCoinAmount.toLocaleString()} ${selectedCoin.split('-')[1]}`}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">현재가</span>
          <span
            className={`font-bold ${tradeType === 'BUY' ? 'text-red-500' : 'text-blue-500'}`}
          >
            {currentPrice.toLocaleString()} KRW
          </span>
        </div>
      </div>

      {/* 입력 필드 */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">주문수량</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-50 dark:bg-[#0d0d0d] border border-gray-300 dark:border-gray-700 rounded p-3 text-right font-mono text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-gray-500"
          />
        </div>

        <div className="bg-gray-100 dark:bg-[#252525] p-3 rounded-md">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>주문총액</span>
          </div>
          <div className="text-right font-bold text-lg">
            {totalPrice.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">KRW</span>
          </div>
        </div>

        <button
          onClick={handleTrade}
          className={`w-full py-4 rounded-md font-bold text-lg shadow-lg transition-transform active:scale-95 text-white ${
            tradeType === 'BUY'
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-blue-600 hover:bg-blue-500'
          }`}
        >
          {tradeType === 'BUY' ? '매수하기' : '매도하기'}
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
