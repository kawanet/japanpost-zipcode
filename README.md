# Japan Post Zipcode

[![Node.js CI](https://github.com/kawanet/japanpost-zipcode/workflows/Node.js%20CI/badge.svg?branch=main)](https://github.com/kawanet/japanpost-zipcode/actions/)
[![npm version](https://badge.fury.io/js/japanpost-zipcode.svg)](https://badge.fury.io/js/japanpost-zipcode)

### Synopsis

```js
const KenAll = require("japanpost-zipcode").KenAll;

KenAll.readAll().then(function(data) {
    data.slice(0, 10).forEach(function(row) {
        process.stdout.write([row[2], row[6], row[7], row[8]].join(" ") + "\n");
    });
});
```

### TypeScript

```typescript
import {KenAll, KenAllColumns as C, KenAllRow} from "japanpost-zipcode";

(async () => {
    const data: KenAllRow[] = await KenAll.readAll({logger: console});
    data.slice(0, 10).forEach((row: KenAllRow) => {
        process.stdout.write([row[C.郵便番号], row[C.都道府県名], row[C.市区町村名], row[C.町域名]].join(" ") + "\n");
    });
})();
```

### GitHub

- [https://github.com/kawanet/japanpost-zipcode](https://github.com/kawanet/japanpost-zipcode)

### See Also

- [https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html](https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html)
- [https://github.com/kawanet/jp-zipcode-lookup](https://github.com/kawanet/jp-zipcode-lookup)

### The MIT License (MIT)

Copyright (c) 2017-2018 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
