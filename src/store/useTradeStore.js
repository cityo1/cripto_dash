import { create } from 'zustand';

const useTradeStore = create((set) => ({
  // 1. 현재 선택된 코인 (기본값: 비트코인)
  selectedCoin: 'KRW-BTC',
  setSelectedCoin: (market) => set({ selectedCoin: market }),

  // 2. 가상 자산 관리
  balance: 10000000, // 초기 자본 1,000만 원
  myAssets: {}, // 예: { 'KRW-BTC': { quantity: 0.5, averagePrice: 60000000 } }

  // 3. 매수 로직
  buyCoin: (market, price, quantity) =>
    set((state) => {
      const totalCost = price * quantity;
      if (state.balance < totalCost) {
        alert('잔액이 부족합니다!');
        return state;
      }

      const currentAsset = state.myAssets[market] || {
        quantity: 0,
        averagePrice: 0,
      };
      const newQuantity = currentAsset.quantity + quantity;
      const newAveragePrice =
        (currentAsset.averagePrice * currentAsset.quantity + totalCost) /
        newQuantity;

      return {
        balance: state.balance - totalCost,
        myAssets: {
          ...state.myAssets,
          [market]: { quantity: newQuantity, averagePrice: newAveragePrice },
        },
      };
    }),

  // 4. 매도 로직
  sellCoin: (market, price, quantity) =>
    set((state) => {
      const currentAsset = state.myAssets[market];
      if (!currentAsset || currentAsset.quantity < quantity) {
        alert('보유 수량이 부족합니다!');
        return state;
      }

      const newQuantity = currentAsset.quantity - quantity;
      const updatedAssets = { ...state.myAssets };

      if (newQuantity === 0) {
        delete updatedAssets[market];
      } else {
        updatedAssets[market] = { ...currentAsset, quantity: newQuantity };
      }

      return {
        balance: state.balance + price * quantity,
        myAssets: updatedAssets,
      };
    }),
}));

export default useTradeStore;
