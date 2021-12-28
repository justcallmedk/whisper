# About Whisper

## What is Whisper?

Whisper is a micro service for sending secure messages over Socket.IO using E2E encryption.\
It has been developed using React and Node.js

### Demo
https://whisper.sooda.io

## Development

The core logic can be found in:
- src/App.js (frontend / React)
- src/socket.js (backend / Node.js)

### Configuration

In src/config.js, you can configure which port Node.js runs on.
In package.json, under the scripts sections, you can configure which port React runs on.

### `npm run start` ###

Runs the app in the development mode.\
Open [http://localhost:3010](http://localhost:3010) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Deployment

```bash
serve -n -l <port_number> -s ./build/ # React
node src/socket.js --port <port_number> # Node.js
```
In order to prevent any CORS issue, both React and Node.js apps should be serviced by same domain.  
Here's an example of achieving this in Apache configuration.

```bash
<VirtualHost *:80>
  ProxyRequests Off
  <Proxy *>
    Order deny,allow
    Allow from all
  </Proxy>
  
  RewriteEngine     On
  RewriteCond       %{REQUEST_URI}    ^/socket/io            [NC]
  RewriteCond       %{QUERY_STRING}   transport=websocket    [NC]
  RewriteRule       /(.*)             ws://localhost:3011/$1 [P,L]

  ProxyPass         /socket/          http://localhost:3011/socket/ # Node.js app
  ProxyPassReverse  /socket/          http://localhost:3011/socket/
	
  ProxyPass        /                  http://localhost:3010/ #React App
  ProxyPassReverse /                  http://localhost:3010/
</VirtualHost>
```

## Security

The application does have any persistent storage.\
It only uses the in-memory object to hold the set of socket IDs (host and guest) and the room code to bind them.\
This in-memory information is wiped once the creator closes the socket connection.

The messages are never stored/held and the server only receives and sends the pre-encrypted value.\
The client encrypts the message before sending, using AES256 with the secret of receiver's socket ID.\
This effectively prevents sniffing the message as decryption is impossible without knowing the intended receiver's socket id.
