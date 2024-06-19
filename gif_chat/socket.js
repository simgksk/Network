//웹 소켓 통신 내용 (서버 쪽 코드)

const webSocket = require('ws');
module.exports = (server)=>{
    const wss = new webSocket.Server({server});

    //클라이언트가 서버와 연결될 때 실행
    wss.on('connection', (ws, req)=>{
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        console.log('새로운 클라이언트 접속', ip);

        //클라로부터 메세지 수신 시
        ws.on('message', (message)=>{
            console.log(message.toString());
        });

        //에러 발생 시
        ws.on('error', (error)=>{
            console.error(error);
        })
    
        //클라 연결 종료 시
        ws.on('close', ()=>{
            console.log('클라이언트 접속 해제',ip)
        })
    
        //클라한테 메시지 전송
        ws.interval = setInterval(()=>{
            if(ws.readyState === ws.OPEN){
                ws.send('서버: 000');
            }
        })
    });
}