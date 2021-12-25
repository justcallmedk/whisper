import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [codes, setCodes] = useState('');
  const [msg, setMsg] = useState('');
  const [output, setOutput] = useState('');
  const [joined, setJoined] = useState(false);
  const [init, setInit] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('');
  let codeRefs = {};

  useEffect(() => {
    if(!socket) {
      console.log('setting socket');
      const newSocket = io(`http://${window.location.hostname}:3011`);
      setSocket(newSocket);
    }
  }, []);

  useEffect(() => {
    if(!socket) { //this will always run first time, return if socket not ray
      return;
    }

    console.log('registering socket events');
    //socket events
    socket.on('error', handleError);
    socket.on('msg', handleMsg);
    socket.on('created', handleCreated);
    socket.on('joined', handleJoined);

    return () => {
      // before the component is destroyed
      // unbind all event handlers used in this component
      socket.off("created", handleCreated);
    };
  }, [socket]);

  const handleCreated = (msg) => {
    for(let i = 0; i < msg.length; i++) {
      codeRefs[i].value = msg[i];
    }
    setCodes(msg);
    setStatusMsg('waiting ...');
    setInit(true);
  };

  const handleJoined = (msg) => {
    if(msg) { // contains visitor's id
      setStatusMsg('');
      setJoined(true);
    }
    else { // this is the visitor
      setStatusMsg('waiting ...');
      setInit(true);
    }
  };

  const handleMsg = (msg) => {
    setStatusMsg('');
    setOutput(msg);
  };

  const handleError = (msg) => {
    alert(msg);
  };

  const doAction = (action,value) => {
    socket.emit(action,value);
  };

  const inputCode = (pos,value) => {
    if(value === '') return;

    let codes = '';
    for(const code in codeRefs) {
      codes += codeRefs[code].value.toUpperCase();
    }

    if(pos < 5) {
      codeRefs[pos+1].focus();
    }

    if(codes.length >= 6) {
      doAction('join',codes);
    }
  };

  const codeOnFocus = (pos) => {
    if(pos === 0) return;

    if(codeRefs[pos-1].value !== '') return;
    codeRefs[codes.length].focus();
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(function() {
      setCopyButtonText('copied');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  };

  return (
    <div className="App">
      <div className="code">
        {
          Array(6).fill().map((el,i) => {
            return <input key={i}
                          ref={ e => codeRefs[i] = e}
                          autoFocus={ i === 0 }
                          maxLength="1"
                          disabled={ init }
                          onFocus={ () => codeOnFocus(i) }
                          onInput={ e => inputCode(i, e.target.value) }/>
          })
        }
      </div>
      { !init &&
        <div className="action">
          <button onClick={ () => doAction('create') }>
            create
          </button>
        </div>
      }
      { joined &&
        <div className="message">
          <input value={msg}
                 onInput={e => setMsg(e.target.value)}/>
          <button onClick={() => {
            doAction('send', {code: codes, msg: msg});
            setMsg('');
          }}>
            send
          </button>
        </div>
      }
      { output !== '' &&
        <div className="output">
          <div className="inner">
            {output}
          </div>
          <button onClick={copy}>
            {copyButtonText === '' ?  'copy' : copyButtonText}
          </button>
        </div>
      }
      { statusMsg !== '' &&
        <div className="status">
          {statusMsg}
        </div>
      }
    </div>
  );
}

export default App;
