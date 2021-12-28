import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import cryptoJS from 'crypto-js';
import config from './config.js';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [codes, setCodes] = useState('');
  const [msg, setMsg] = useState('');
  const [output, setOutput] = useState('');
  const [joined, setJoined] = useState(false);
  const [init, setInit] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('copy');
  const [createButtonText, setCreateButtonText] = useState('create');
  const [receiver, setReceiver] = useState('');
  const [codeRefs] = useState({});

  useEffect(() => {
    if(!socket) {
      console.log('setting socket');
      const port = window.location.hostname === 'localhost' ? ':' + config.socketPort : '';
      const newSocket = io(`//${window.location.hostname}` + port, {path:'/socket/io'});
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
    if(msg) { // contains receiver's id
      setReceiver(msg);
      setStatusMsg('');
      setJoined(true);
    }
    else { // this is the visitor
      setStatusMsg('waiting ...');
      setInit(true);
    }
  };

  const encrypt = (msg) => {
    return cryptoJS.AES.encrypt(msg, receiver).toString();
  };

  const decrypt = (msg) => {
    const bytes  = cryptoJS.AES.decrypt(msg, socket.id);
    const decrypted = bytes.toString(cryptoJS.enc.Utf8);
    return decrypted;
  }

  const handleMsg = (msg) => {
    setStatusMsg('');
    setOutput(decrypt(msg));
  };

  const handleError = (msg) => {
    alert(msg);
  };

  const doAction = (action,value) => {
    if(action === 'send') {
      value.msg = encrypt(value.msg);
    }
    socket.emit(action,value);
  };

  const inputCode = (pos,value) => {
    let codes = '';
    for(const code in codeRefs) {
      codes += codeRefs[code].value.toUpperCase();
    }
    codes.length > 0 ? setCreateButtonText('...') : setCreateButtonText('create');

    if(value === '') return;

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
          <button disabled={ createButtonText !== 'create' }
                  onClick={ () => doAction('create') }>
            {createButtonText}
          </button>
        </div>
      }
      { joined &&
        <div className="message">
          <input value={msg}
                 onInput={e => setMsg(e.target.value)} />
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
            {output.substring(0,10) + ' ...'}
          </div>
          <button onClick={copy}>
            {copyButtonText}
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
