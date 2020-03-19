const PENDING = 'PENDING';// 等待态
const FULFILLED = 'FULFILLED'; // 成功态
const REJECTED = 'REJECTED'; // 失败态

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
};

class Promise {
    constructor(executor){
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = []; // 存放成功时的回调
        this.onRejectedCallbacks = []; // 存放失败时的回调

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
        let reject = (reason) => {
            if(this.status === PENDING){
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        };
        // executor 执行的时候 需要传入两个参数，给用户来改变状态的
        try{ // try catch 只能捕获同步异常
            executor(resolve, reject)
        }catch (e) { // 表示当前有异常，那就使用这个异常作为promise失败的原因
            reject(e)
        }

    }
    // 原型上方法
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

    catch(errCallback){ // 就是一个没有成功的then
        return this.then(null,errCallback)
    }

    finally(callback){
        return this.then((value) => {
            // 等待finally方法执行完毕后，将上一个成功的结果向下传递
            return Promise.resolve(callback()).then(() => value)
        }, err => {
            return Promise.resolve(callback()).then(() => {throw err})
        })
    }
}

const isPromise = value => {
    if((typeof value === 'object' && value !==null) || typeof value === 'function'){
        return typeof value.then === 'function'
    }
    return false
};

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

Promise.resolve = function (value) {
    return new Promise((resolve, reject) => {
        resolve(value); // resolve方法里放一个promise 会等待这个promise执行完成
    })
};

Promise.reject = function (value) {
    return new Promise((resolve,reject)=>{
        reject(value); // reject 并不会解析promise值
    })
};


module.exports = Promise;
