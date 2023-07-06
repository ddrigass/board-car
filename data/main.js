console.log('HELLO WORLD!')
let websocket, state, gateway, move = {
    vertical: 1,
    horizontal: 1,
};

function main() {
    // const gateway = `ws://${window.location.hostname}/ws`;
    gateway = `ws://192.168.4.1/ws`;
    window.addEventListener('load', onLoad);
}

main();


  function initWebSocket() {
    console.log('Trying to open a WebSocket connection...');
    websocket = new WebSocket(gateway);
    websocket.onopen    = onOpen;
    websocket.onclose   = onClose;
    websocket.onmessage = onMessage; // <-- add this line
  }
  function onOpen(event) {
    console.log('Connection opened');
  }
  function onClose(event) {
    console.log('Connection closed');
    setTimeout(initWebSocket, 2000);
  }
  function onMessage(event) {
    if (event.data == "1"){
      state = "ON";
    }
    else{
      state = "OFF";
    }
    document.getElementById('state').innerHTML = state;
  }
  function onLoad(event) {
    initWebSocket();
    initButtons();
  }
  function initButtons() {

    document.querySelectorAll('.button-area').forEach(button => {
        button.addEventListener('touchstart', (event) => {
            const classList = event.target.closest('.button-area').classList;
            if (classList.contains('to-right')) {
                move.horizontal = 2;
            }
            if (classList.contains('to-left')) {
                move.horizontal = 0;
            }
            if (classList.contains('to-top')) {
                move.vertical = 2;
            }
            if (classList.contains('to-bottom')) {
                move.vertical = 0;
            }
            send();
        })

        button.addEventListener('touchend', (event) => {
            const classList = event.target.closest('.button-area').classList;
            if (classList.contains('to-right') || classList.contains('to-left')) {
                move.horizontal = 1;
            }
            if (classList.contains('to-top') || classList.contains('to-bottom')) {
                move.vertical = 1;
            }
            send();
        });

    });
  }
  function send(){
    websocket.send(`${move.vertical}${move.horizontal}`);
  }