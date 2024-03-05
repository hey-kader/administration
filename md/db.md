# postgres tables

## posts
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE CURRENT_TIMESTAMP,
  name VARCHAR(128) NOT NULL UNIQUE,
  email VARCHAR 128 NOT NULL UNIQUE
);

CREATE TABLE posts (
  ...
);'
```
## users

### patch mechanism
every time we alter or create a table, we create:
```javascript
if (!fs.existsSync('./db/some-sql.log')) {
...
}
else {
  console.log('patch already applied')
}
module.exports = {
  /* all the functions in db/db.js except !fs.existsSync('./log') else { ... } blocks*/
}
```

then, on boot, all patches will be applied before listening starts
