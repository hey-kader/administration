if you try and use the html files, mainly base.js in chrome, they wont work.<br>
this is for a known reason, that the WebSocket() in chrome does not accept relative urls, while the WebSocket in Safari, on the other hand, does.<br>
this may be the same case for anchors with relative hrefs, as in: 
```html
<a href="..">back (history onpopstate)</a>
<a href="../">[parent dir]</a>
<a href="/base">home</a>

```
and
```javascript

function rec_mesg (event) {
  console.log('message ahoy!',event.data)
}

let window.socket = new WebSocket('/latest')
window.socket.addEventListener("message", rec_mesg)
```
