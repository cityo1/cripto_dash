import { useState, useEffect, useRef } from 'react';

const useUpbitWebSocket = (targetMarkets) => {
  const [socketData, setSocketData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!targetMarkets || targetMarkets.length === 0) return;

    // 업비트 웹소켓 연결
    socketRef.current = new WebSocket('wss://api.upbit.com/websocket/v1');
    socketRef.current.binaryType = 'arraybuffer'; // 업비트는 데이터를 바이너리 형태로 보냄

    socketRef.current.onopen = () => {
      console.log('업비트 웹소켓 연결 성공');
      // 구독 요청 보내기 (어떤 데이터를 받을지 설정)
      const message = [
        { ticket: 'test-ticket' }, // 식별값
        { type: 'ticker', codes: targetMarkets.map((m) => m.market) }, // 실시간 시세 요청
      ];
      socketRef.current.send(JSON.stringify(message));
    };

    socketRef.current.onmessage = async (event) => {
      // 바이너리 데이터를 텍스트(JSON)로 변환
      const enc = new TextDecoder('utf-8');
      const arr = new Uint8Array(event.data);
      const data = JSON.parse(enc.decode(arr));
      setSocketData(data);
    };

    socketRef.current.onerror = (error) => {
      console.error('소켓 에러:', error);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [targetMarkets]);

  return socketData;
};

export default useUpbitWebSocket;
