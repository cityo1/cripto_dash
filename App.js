import CoinList from './components/cripto/CoinList';

function App() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-md mx-auto">
        <CoinList onSelectCoin={(code) => console.log(code)} />
      </div>
    </div>
  );
}
