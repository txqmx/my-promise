# Promise实现原理
  * [1 介绍](#1-介绍)
  * [2 promise 构造函数](#2-promise-构造函数)
     * [2.1 基本使用](#21-基本使用)
     * [2.2 实现原理](#22-实现原理)
  * [3. 异步方法](#3-异步方法)
     * [3.1 基本使用](#31-基本使用)
     * [3.2 实现原理](#32-实现原理)
  * [4. 链式调用](#4-链式调用)
     * [4.1 基本使用](#41-基本使用)
     * [4.2 实现原理](#42-实现原理)
  * [5 catch](#5-catch)
     * [5.1 基本使用](#51-基本使用)
     * [5.2 实现原理](#52-实现原理)
  * [6 node api promise](#6-node-api-promise)
  * [7 Promise.all](#7-promiseall)
     * [7.1 基本使用](#71-基本使用)
     * [7.2 实现原理](#72-实现原理)
  * [8 Promise.race](#8-promiserace)
     * [8.1 基本使用](#81-基本使用)
     * [8.2 实现原理](#82-实现原理)
     * [8.3 race应用场景](#83-race应用场景)
  * [9 Promise.resolve](#9-promiseresolve)
     * [9.1 基本使用](#91-基本使用)
     * [9.2 实现原理](#92-实现原理)
  * [10 Promise.reject](#10-promisereject)
     * [10.1 基本使用](#101-基本使用)
     * [10.2 实现原理](#102-实现原理)
  * [11 finally](#11-finally)
     * [11.1 基本使用](#111-基本使用)
     * [11.2 实现原理](#112-实现原理)

## 1 介绍

Promise是ES6中新增加的内置类：目的是为了管理异步操作，异步是指可能比较长时间才有结果的操作，例如网络请求、读取本地文件等

解决的问题
- 回调地狱 (代码不好维护，错误处理非常的麻烦不能统一处理错误)
- 多个请求的并发问题
 
## 2 promise 构造函数

### 2.1 基本使用
- promise是一个构造函数，new Promise()创建类的一个实例，每一个实例都可以管理一个异步操作
- 在new Promise时需要传递一个执行器函数，executor 这个函数默认就会被执行 立即执行
- 每个promise 都有三个状态 pending 等待态 fulfilled 成功态 rejected 失败态
- 默认创建一个promise 是等待态 默认提供给你两个函数 resolve让promise变成成功态,reject让promise变成失败态
- 每个promise的实例都具备一个then方法，then方法中传递两个参数1.成功的回调 2.失败的回调
- 如何让promise变成失败态 1.reject() 2.可以抛出一个错误 
- 如果多次调用成功或者失败 只会执行第一次， 一旦状态变化了 就不能在变成成功或者失败了
 
```js
let promise = new Promise((resolve,reject)=>{

     // reject('reason');
     // resolve('value')
     throw new Error('我失败了');
})
promise.then((success)=>{
    console.log('success',success)
},(err)=>{
    console.log('fail',err)
});
```

### 2.2 实现原理

```js

const PENDING = 'PENDING';// 等待态
const FULFILLED = 'FULFILLED'; // 成功态
const REJECTED = 'REJECTED'; // 失败态

class Promise {
    constructor(executor){
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;

        let resolve = (value) => {
            if(this.status === PENDING){
                this.status = FULFILLED;
                this.value = value
            }
        };
        let reject = (reason) => {
            if(this.status === PENDING){
                this.status = REJECTED;
                this.reason = reason
            }
        };
        // executor 执行的时候 需要传入两个参数，给用户来改变状态的
        try{
            executor(resolve, reject)
        }catch (e) { // 表示当前有异常，那就使用这个异常作为promise失败的原因
            reject(e)
        }

    }
    // 原型上方法
    then(onFulfilled, onRejected){
        if(this.status === FULFILLED){
            onFulfilled(this.value)
        }
        if(this.status === REJECTED){
            onRejected(this.reason)
        }

    }
}

module.exports = Promise

```

## 3. 异步方法
### 3.1 基本使用

```js
let promise = new Promise((resolve,reject)=>{
    setTimeout(() => { // 异步的
        resolve('value') //此时如果调用了resolve 就让刚才存储的成功的回调函数去执行
    }, 1000);
  
})
// 同一个promise实例 可以then多次
// 核心就是发布订阅模式
promise.then((success)=>{ // 如果调用then的时候没有成功也没有失败。我可以先保存成功和失败的回调
    console.log('success',success)
},(err)=>{
    console.log('fail',err)
});
```

### 3.2 实现原理

异步的核心就是发布订阅模式，将`then`中成功与失败的回调函数保存在队列中，带异步函数中调用`resolve()` 执行成功的回调，`reject()`执行失败的回调


```js
let resolve = (value) => {
    if(this.status === PENDING){
        this.status = FULFILLED;
        this.value = value;
        this.onResolvedCallbacks.forEach(fn => fn()); // 发布
    }
};
let reject = (reason) => {
    if(this.status === PENDING){
        this.status = REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
    }
};
```

```js
then(onFulfilled, onRejected){
    if(this.status === FULFILLED){
        onFulfilled(this.value)
    }
    if(this.status === REJECTED){
        onRejected(this.reason)
    }
    if(this.status === PENDING){ // 发布订阅
        this.onResolvedCallbacks.push(()=>{
            onFulfilled(this.value)
        });
        this.onRejectedCallbacks.push(()=>{
            onRejected(this.reason)
        })
    }

}
```

## 4. 链式调用

### 4.1 基本使用
有关联的请求 需要先通过第一个异步操作拿到返回结果，通过这个结果再去执行另一个异步，上一个的输出是下一个的输入，promise 是通过 链式调用的方式解决了这个问题

```js
let fs = require('fs');
function read(...args){
    return new Promise((resolve,reject)=>{
        fs.readFile(...args,function (err,data) {
            if(err){
                reject(err)
            }
            resolve(data);
        })
    })
}
read('name.txt','utf8').then((data)=>{
    return read(data,'utf8')
}).then(data => {
    console.log(data);
})
```
成功的回调和失败的回调都可以返回一个结果
- 情况1：如果返回的是一个promise，那么会让这个promise执行,并且采用他的状态,将成功或失败的结果传递给外层的下一个then中
- 情况2：如果返回的是一个普通值会把这个值作为外层的下一次then的成功的回调中
- 情况3：如果在catch，和then的第二个回调中返回普通值，也会传到下一次then的成功回调中
- 情况4：抛出一个异常，走到下次的then的失败


### 4.2 实现原理
promise的链式调用 返回一个新的promise

```js
then(onFulfilled, onRejected){
    // 参数处理
    onFulfilled  = typeof onFulfilled === 'function'? onFulfilled : val => val;
    onRejected = typeof onRejected === 'function'? onRejected : err=>{throw err}

    let promise2 = new Promise((resolve, reject) => {
        if(this.status === FULFILLED){
            onFulfilled(this.value)
        }
        if(this.status === REJECTED){
            onRejected(this.reason)
        }
        if(this.status === PENDING){ // 发布订阅
            this.onResolvedCallbacks.push(()=>{
                onFulfilled(this.value)
            });
            this.onRejectedCallbacks.push(()=>{
                onRejected(this.reason)
            })
        }
    });
    return promise2;
}
```
> 难点：
> 1. then方法返回一个全新的promise，我们还需要将上一个promise中的状态传到这个新的promise中
> 2. 根据成功失败的回调函数的返回情况，要把值传递到下一个then


```js
then(onFulfilled, onRejected){
    // 参数处理
    onFulfilled  = typeof onFulfilled === 'function'? onFulfilled : val => val;
    onRejected = typeof onRejected === 'function'? onRejected : err=>{throw err}

    let promise2 = new Promise((resolve, reject) => {
        if(this.status === FULFILLED){
            setTimeout(() => { // 异步执行，保证promise2存在
                try {
                    let x = onFulfilled(this.value);
                    resolvePromise(promise2, x, resolve, reject)
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }
        if(this.status === REJECTED){
            setTimeout(() => {
                try {
                    let x = onRejected(this.reason);
                    resolvePromise(promise2, x, resolve, reject)
                } catch (e) {
                    reject(e);
                }
            }, 0);
        }
        if(this.status === PENDING){ // 发布订阅
            this.onResolvedCallbacks.push(() => {
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (e) {
                        reject(e);
                    }
                }, 0)
            });
            this.onRejectedCallbacks.push(() => {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0)
            })
        }
    });
    return promise2;
}
```

使用 resolvePromise 函数 对回调函数的返回结果做一个判断处理


```js
const resolvePromise = (promise2, x, resolve, reject) => {
    // 判断 可能你的promise要和别人的promise来混用
    // 可能不同的promise库之间要相互调用
    if (promise2 === x) { // x 如果和promise2 是同一个人 x 永远不能成功或者失败，所以就卡死了,我们需要直接报错即可
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
    }
    // ------ 我们要判断x的状态  判断x 是不是promise-----
    // 1.先判断他是不是对象或者函数
    if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
        // x 需要是一个对象或者是函数
        let called; // 为了考虑别人promise 不健壮所以我们需要自己去判断一下，如果调用失败不能成功，调用成功不能失败，不能多次调用成功或者失败
        try{
            let then = x.then; // 取出then方法 这个then方法是采用defineProperty来定义的
            if(typeof then === 'function'){
                // 判断then是不是一个函数，如果then 不是一个函数 说明不是promise 
                // 只能认准他是一个promise了 
                then.call(x, y =>{ // 如果x是一个promise 就采用这个promise的返回结果
                    if(called) return;
                    called = true
                    resolvePromise(promise2, y, resolve, reject); // 继续解析成功的值
                },r=>{
                    if(called) return;
                    called = true
                    reject(r); // 直接用r 作为失败的结果
                })
            }else{
                // x={then:'123'}
                resolve(x);
            }
        }catch(e){
            if(called) return;
            called = true
            reject(e); // 去then失败了 直接触发promise2的失败逻辑
        }
    } else {
        // 肯定不是promise
        resolve(x); // 直接成功即可
    }
}
```


## 5 catch
### 5.1 基本使用

catch方法相当于.then(null,rejection)

```javascript
let promise = new Promise((resolve,reject)=>{
    reject('reason');
})
promise.then((success)=>{
    console.log('success',success)
}).catch(e => {
    console.log(e); // resaon
})
```

在链式调用中由reject()或者执行错误引起的状态改变都会被下一个then()的第二个函数或者catch()捕获


```javascript
new Promise((resolve,reject)=>{
        reject(100);
}).then(res=>{

},err=>{
    //捕获被错误，会走到下一个then的成功态，所有就不会传给catch
}).catch(err=>{
    console.log(err); 
})

```

### 5.2 实现原理
catch 是promise类圆形上的方法，就一个then失败状态的语法糖

```js
class Promise {
    constructor(excutorCallBack) {
        //...
    }

    then(fulfilled, rejected) {
        //...
    }

    catch(errCallback){ // 就是一个没有成功的then
        return this.then(null,errCallback)
    }
}
```

## 6 node api promise


```
let fs = require('fs').promises;
```

promise化 把异步的node中的api 转化成 promise方法 只针对node方法

我们可以将node中的api 转换成promise的写法 node中的回调函数有两个参数 一个err，一个是data，只要遵循这个参数合理 就可以将异步方法 转化成promise
```js
let fs = require('fs')

function promisify(fn){
    return function(...args){
        return new Promise((resolve, reject) => {
            fn(...args, function (err, data) {
                if(err) reject();
                resolve(data)
            })
        })
    }
}

let read = promisify(fs.readFile)

read('name.txt', 'utf8').then(data => {
    console.log(data);
})
```

## 7 Promise.all

### 7.1 基本使用
Promise.all 方法表示等待所有的promise全部成功后 才会执行回调，如果有一个promise失败则promise就失败了
```js
let fs = require('fs').promises;

Promise.all([1,2,3,fs.readFile('name.txt','utf8'),fs.readFile('age.txt','utf8')]).then((values)=>{
    console.log(values);
},err=>{
    console.log(err);
});
```

### 7.2 实现原理

Promise.all 是Promise类上的静态方法


```js
const isPromise = value => {
    if((typeof value === 'object' && value !==null) || typeof value === 'function'){
        return typeof value.then === 'function'
    }
    return false
}

Promise.all = function (promises) {
    return new Promise((resolve, reject) => {
        let arr = []; // 返回的数组
        let i = 0;
        let processData = (index,data) => {
            arr[index] = data;
            if(++i === promises.length){
                resolve(arr)
            }
        };
        for(let i = 0; i< promises.length; i++){
            let current = promises[i];
            if(isPromise(current)){
                current.then(data => { // // 如果有任何一个promise失败了 直接让这个promise变成失败态即可
                    processData(i, data) 
                }, reject)
            }else {
                processData(i, current)
            }
        }
    })
};
```

## 8 Promise.race

### 8.1 基本使用
race 就是默认等到最先成功的promise的状态

```js
let p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('hello1');
    }, 1000);
})
let p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('hello');
    }, 1900);
})


Promise.race([p1, p2, p1, p2, p1, p2]).then(data => {
    console.log(data)
}, err => {
    console.log('error' + err)
});
```

### 8.2 实现原理

```js
Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
        for (let i = 0; i < promises.length; i++) {
            let current = promises[i];
            if(isPromise(current)){ // 采用第一个调用resolve 或者 reject的结果
                current.then(resolve, reject)
            }else {
                resolve(current)
            }
        }
    })
};
```
### 8.3 race应用场景
接口超时判断

```js
// 模拟接口请求
let p = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(123);
    }, 1000); // 要等待1s 之后变成成功态
})

function warp(p) {
    let abort;
    let p1 = new Promise((resolve, reject) => {
        abort = reject
    })
     // race 方法 来在内部构构建一个promise 将这个promise和传递promise组成一个race,如果用户调用了p1的abort方法 相当于让p1 失败了 = Promise.race失败了
    let newPromise = Promise.race([p1, p])
    newPromise.abort = abort
    return newPromise
}

let p1 = wrap(p);
p1.then(data => {
    console.log('success', data)
}, err => {
    console.log('error', err)
})
setTimeout(() => {
    p1.abort('超过2s了');
}, 2000);
```

## 9 Promise.resolve

### 9.1 基本使用
Promise.resolve表示一上来就创建成功的promise

会等待里面的promise执行成功
```js
Promise.resolve(new Promise((resolve,reject)=>{
    setTimeout(() => {
        resolve(1000)
    }, 1000)})).then(err=>{
    console.log(err);
})
```

### 9.2 实现原理

```js
Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
        resolve(value); // resolve方法里放一个promise 会等待这个promise执行完成
    })
};
```
resolve方法里放一个promise 会等待这个promise执行完成,所有在resolve方法中需要判断value的类型

```js
let resolve = (value) => {
    if(value instanceof Promise){
        return value.then(resolve, reject)
    }
    if(this.status === PENDING){
        this.status = FULFILLED;
        this.value = value;
        this.onResolvedCallbacks.forEach(fn => fn()); // 发布
    }
};
```



## 10 Promise.reject

### 10.1 基本使用
Promise.reject 表示一上来就创建失败的promise，不会等待参数中的promise执行完毕

### 10.2 实现原理

```js
Promise.reject = function (value) {
    return new Promise((resolve,reject)=>{
        reject(value); // reject 并不会解析promise值
    })
};
```


## 11 finally

### 11.1 基本使用
Promise.prototype.finally 无论如何都执行


```js
Promise.resolve(100).finally(()=>{
    console.log('finally');
    return new Promise((resolve,reject)=>{ // 默认会等待当前finally方法执行完毕，将上一个成功的结果向下传递
        setTimeout(() => {
            resolve('hello');
        }, 1000);
    })
}).then((data)=>{
    console.log('success:'+data)
},(fail)=>{
    console.log('error:'+fail)
})
// finally
// success:100
```

### 11.2 实现原理

原型上的方法

```js
finally(callback){
    return this.then((value) => {
        // 等待finally方法执行完毕后，将上一个成功的结果向下传递
        return Promise.resolve(callback()).then(() => value)
    }, err => {
        return Promise.resolve(callback()).then(() => {throw err})
    })
}
```

