import React from 'react';
import useTradeStore from '../../store/useTradeStore';
import useUpbitWebSocket from '../../hooks/useUpbitWebSocket';

const AssetDashboard = () => {
  const { balance, myAssets } = useTradeStore();

  // 1. 보유 중인 코인들의 실시간 시세를 가져오기 위해 마켓 코드 배열 생성
  const myAssetMarkets = Object.keys(myAssets).map((market) => ({ market }));
  const { data: realTimeData } = useUpbitWebSocket(myAssetMarkets);

  // 2. 실시간 총 평가 금액 및 수익률 계산
  let totalEvaluation = 0;
  const assetList = Object.entries(myAssets).map(([market, data]) => {
    // 실시간 시세가 있으면 시세 사용, 없으면 평균 매수가 사용 (초기 로딩 대비)
    const currentPrice =
      realTimeData?.code === market
        ? realTimeData.trade_price
        : data.averagePrice;

    const evaluationPrice = currentPrice * data.quantity;
    totalEvaluation += evaluationPrice;

    const profitLoss = evaluationPrice - data.averagePrice * data.quantity;
    const profitRate = (profitLoss / (data.averagePrice * data.quantity)) * 100;

    return {
      market,
      ...data,
      currentPrice,
      evaluationPrice,
      profitRate,
    };
  });

  const totalAsset = balance + totalEvaluation;
  const totalProfitLoss =
    totalEvaluation -
    assetList.reduce((acc, curr) => acc + curr.averagePrice * curr.quantity, 0);
  const totalProfitRate =
    totalEvaluation > 0 ? (totalProfitLoss / (totalAsset - balance)) * 100 : 0;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-xl h-full">
      <h2 className="text-xl font-bold mb-6">내 자산 현황</h2>

      {/* 총 자산 요약 섹션 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">총 보유 자산</p>
          <p className="text-xl font-bold font-mono">
            {Math.floor(totalAsset).toLocaleString()} KRW
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">총 수익률</p>
          <p
            className={`text-xl font-bold font-mono ${totalProfitRate > 0 ? 'text-red-500' : totalProfitRate < 0 ? 'text-blue-500' : ''}`}
          >
            {totalProfitRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">보유 현금</p>
          <p className="text-lg font-semibold font-mono">
            {Math.floor(balance).toLocaleString()} KRW
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">평가 손익</p>
          <p
            className={`text-lg font-semibold font-mono ${totalProfitLoss > 0 ? 'text-red-500' : 'text-blue-500'}`}
          >
            {Math.floor(totalProfitLoss).toLocaleString()} KRW
          </p>
        </div>
      </div>

      {/* 보유 종목 리스트 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 dark:border-gray-800 border-b border-gray-200">
            <tr>
              <th className="pb-3 font-medium">종목</th>
              <th className="pb-3 font-medium text-right">보유수량/평단가</th>
              <th className="pb-3 font-medium text-right">평가금액/수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {assetList.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-10 text-center text-gray-500 dark:text-gray-400">
                  보유 자산이 없습니다.
                </td>
              </tr>
            ) : (
              assetList.map((asset) => (
                <tr key={asset.market} className="hover:bg-gray-50 dark:hover:bg-[#222]">
                  <td className="py-4">
                    <span className="font-bold">
                      {asset.market.split('-')[1]}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <p className="font-mono">{asset.quantity.toFixed(4)}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {Math.floor(asset.averagePrice).toLocaleString()} KRW
                    </p>
                  </td>
                  <td className="py-4 text-right">
                    <p className="font-mono font-semibold">
                      {Math.floor(asset.evaluationPrice).toLocaleString()} KRW
                    </p>
                    <p
                      className={`text-xs ${asset.profitRate > 0 ? 'text-red-500' : 'text-blue-500'}`}
                    >
                      {asset.profitRate.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetDashboard;
