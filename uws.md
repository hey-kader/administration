> # uWebSockets.js
> ## (backend architecture)

the repository to uWebSockets, by ab networking [here](https://github.com/abnetworking/uwebsockets.js)

```javascript
// local binary, from the repository, on the binaries branch.
const App = require ("./uws").App
const live = new Set()
App.ws('/ws_route', {
  compressor: uws.SHARED_COMPRESSOR,
  max_size: 1024*8,
  open: (ws) => {
    live.add(ws)
  },
  message: (ws, msg, isBinary) => {
    ws.cork(() => {
      live.forEach((ws) => {
        ws.send(msg, isBinary)
      })
    })
  }
  close: (ws) => {
    live.delete(ws)
  }
})
App.listen(port, ip, (token) => {
  if (token) {
    console.log(`https://${ip}:${port}`)
  }
  else {
    console.log('failed to start')
  }
})
```

