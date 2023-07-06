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



function initJoystick() {
  // easal stuff goes hur
  var xCenter = 150;
  var yCenter = 150;
  var stage = new createjs.Stage('joystick');

  var psp = new createjs.Shape();
  psp.graphics.beginFill('#333333').drawCircle(xCenter, yCenter, 50);

  psp.alpha = 0.25;

  var vertical = new createjs.Shape();
  var horizontal = new createjs.Shape();
  vertical.graphics.beginFill('#ff4d4d').drawRect(150, 0, 2, 300);
  horizontal.graphics.beginFill('#ff4d4d').drawRect(0, 150, 300, 2);

  stage.addChild(psp);
  stage.addChild(vertical);
  stage.addChild(horizontal);
  createjs.Ticker.framerate = 60;
  createjs.Ticker.addEventListener('tick', stage);
  stage.update();

  var myElement = $('#joystick')[0];

  // create a simple instance
  // by default, it only adds horizontal recognizers
  var mc = new Hammer(myElement);

  mc.on("panstart", function(ev) {
    var pos = $('#joystick').position();
    xCenter = psp.x;
    yCenter = psp.y;
    psp.alpha = 0.5;
    
    stage.update();
  });
  
  // listen to events...
  mc.on("panmove", function(ev) {
    var pos = $('#joystick').position();

    var x = (ev.center.x - pos.left - 150);
    var y = (ev.center.y - pos.top - 150);
    $('#xVal').text('X: ' + x);
    $('#yVal').text('Y: ' + (-1 * y));
    
    var coords = calculateCoords(ev.angle, ev.distance);
    
    psp.x = coords.x;
    psp.y = coords.y;

    // for moving
    move.horizontal = 180 - Math.round(1.8 * (coords.x + 100) / 2);
    send();

    psp.alpha = 0.5;
    stage.update();
  });
  
  mc.on("panend", function(ev) {
    move.horizontal = 90;
    send();

    psp.alpha = 0.25;
    createjs.Tween.get(psp).to({x:xCenter,y:yCenter},750,createjs.Ease.elasticOut);
  });
}

function calculateCoords(angle, distance) {
  var coords = {};
  distance = Math.min(distance, 100);  
  var rads = (angle * Math.PI) / 180.0;

  coords.x = distance * Math.cos(rads);
  coords.y = distance * Math.sin(rads);
  
  return coords;
}




function initWebSocket() {
  console.log('Trying to open a WebSocket connection...');
  websocket = new WebSocket(gateway);
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
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
  if (event.data == "1") {
    state = "ON";
  }
  else {
    state = "OFF";
  }
  document.getElementById('state').innerHTML = state;
}
function onLoad(event) {
  initWebSocket();
  // initButtons();

  initJoystick();
}
function initButtons() {

  document.querySelectorAll('.button-area').forEach(button => {
    const onStart = (event) => {
      console.log('start');
      const classList = event.target.closest('.button-area').classList;
      if (classList.contains('to-right')) {
        move.horizontal = 180;
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
    };

    const onEnd = (event) => {
      console.log('end');
      const classList = event.target.closest('.button-area').classList;
      if (classList.contains('to-right') || classList.contains('to-left')) {
        move.horizontal = 90;
      }
      if (classList.contains('to-top') || classList.contains('to-bottom')) {
        move.vertical = 1;
      }
      send();
    };

    button.addEventListener('touchstart', onStart)
    button.addEventListener('touchend', onEnd);

    button.addEventListener('mousedown', onStart)
    button.addEventListener('mouseup', onEnd);

  });
}
function send() {
  const res = Object.assign({}, move);
  for (let key in res) {
    if (typeof res[key] === 'number') {
      res[key] = String(res[key]);
    }
  }
  websocket.readyState === WebSocket.OPEN && websocket.send(JSON.stringify(res));
}