// 1=========
let Promise = require('./promise')
// let promise = new Promise((resolve,reject)=>{
//
//     // reject('reason');
//     resolve('value')
//     // throw new Error('我失败了');
// })
// promise.then((success)=>{
//     console.log('success',success)
// },(err)=>{
//     console.log('fail',err)
// })


// 2 异步=============
// let promise = new Promise((resolve,reject)=>{
//     setTimeout(() => { // 异步的
//         resolve('value') //此时如果调用了resolve 就让刚才存储的成功的回调函数去执行
//     }, 1000);
//
// });
// // 同一个promise实例 可以then多次
// // 核心就是发布订阅模式
// promise.then((success)=>{ // 如果调用then的时候没有成功也没有失败。我可以先保存成功和失败的回调
//     console.log('success',success)
// },(err)=>{
//     console.log('fail',err)
// });

// 3 链式调用 ============
// let fs = require('fs');
// function read(...args){
//     return new Promise((resolve,reject)=>{
//         fs.readFile(...args,function (err,data) {
//             if(err){
//                 reject(err)
//             }
//             resolve(data);
//         })
//     })
// }
// read('name.txt','utf8').then((data)=>{
//     // return read('age1.txt','utf8')
//     return 111
// }).then(data => {
//     console.log(data);
// })

// 4. catch =============

// let promise = new Promise((resolve,reject)=>{
//     reject('reason');
// })
// promise.then((success)=>{
//     console.log('success',success)
// }).catch(e => {
//     console.log(e);
// })

// 5. promise.all ==============
// let fs = require('fs')
// function promisify(fn){
//     return function(...args){
//         return new Promise((resolve, reject) => {
//             fn(...args, function (err, data) {
//                 if(err) reject();
//                 resolve(data)
//             })
//         })
//     }
// }
//
// let read = promisify(fs.readFile)
//
// read('name.txt', 'utf8').then(data => {
//     console.log(data);
// })

// let fs = require('fs').promises;
//
// Promise.all([1,2,3,fs.readFile('name.txt','utf8'),fs.readFile('age.txt','utf8')]).then((values)=>{
//     console.log(values);
// },err=>{
//     console.log(err);
// });

// 6 race ========
let p1 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('hello1');
    }, 1000);
})
// let p2 = new Promise((resolve, reject) => {
//     setTimeout(() => {
//         reject('hello');
//     }, 1900);
// })
//
//
// Promise.race([p1, p2, p1, p2, p1, p2]).then(data => {
//     console.log(data)
// }, err => {
//     console.log('error' + err)
// });

// function warp(p) {
//     let abort;
//     let p1 = new Promise((resolve, reject) => {
//         abort = reject
//     })
//     let newPromise = Promise.race([p1, p])
//     newPromise.abort = abort
//     return newPromise
// }

// 7 resolve ==========
// Promise.resolve(new Promise((resolve,reject)=>{setTimeout(() => {
//     resolve(1000)
// }, 1000)})).then(err=>{
//     console.log(err);
// })

// 8 reject ========

// 9 finally ======
Promise.resolve(100).finally(()=>{
    console.log('finally');
    return new Promise((resolve,reject)=>{ // 默认会等待当前finally方法执行完毕
        setTimeout(() => {
            resolve('hello');
        }, 1000);
    })
}).then((data)=>{
    console.log('success:'+data)
},(fail)=>{
    console.log('error:'+fail)
})



