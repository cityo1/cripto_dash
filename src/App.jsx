import React from 'react';
import Header from './components/layout/Header';
import CoinList from './components/cripto/CoinList';
import OrderForm from './components/cripto/OrderForm';
import AssetDashboard from './components/cripto/AssetDashboard';
import TradingViewChart from './components/cripto/TradingViewChart';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      <Header />
      <main className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <CoinList />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <TradingViewChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OrderForm />
              <AssetDashboard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
