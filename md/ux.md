# User Experience
here is a list of things we do uniquely for user experience

1. on login, when the username input field's text is green, teh digest has been cached for validation'
    a) this means, when, in the password input box, the correct password is typed, the window will automatically redirect to window.location.href = "/base" 

## it works like this

```javascript
document.body.querySelector("input[type='text']").addEventListener("blur", (event) => {
    fetch('/api/'+event.target.value, {
      method: "get",
       headers: {
        "content-type": "application/json"
       } 
    }).then((res) => res.json())
        .then((data) => {
          console.log('digest', data)
          window.sessionStorage.setItem('digest')
          window.sessionStorage.setItem('pw_length', event.target.value.length)
        })
})
document.body.querySelector("input[type='password']").addEventListener('input', (event) => {
  console.log("event,"event)
  /* hash the document.body.querySelector("input[type='password']").value */
  let password_hash = digest(event.target.value)
  let digest = window.sessionStorage.getItem('digest')
  if (digest === password_hash) {
    window.location.href = "/base"
  }
})
```
