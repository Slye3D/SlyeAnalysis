/**
 *    _____ __
 *   / ___// /_  _____
 *   \__ \/ / / / / _ \
 *  ___/ / / /_/ /  __/
 * /____/_/\__, /\___/
 *       /____/
 *       Copyright 2017 Slye Development Team. All Rights Reserved.
 *       Licence: MIT License
 */

const versions  = {
    0: require('./versions/json')
}

// CV: Current Versions
const CV    = 0

module.exports = {
     encode(report, writableStream){
         // writableStream.write(JSON.stringify(report, null, 4))
         b = Buffer.alloc(1)
         b[0] = CV
         writableStream.write(b)
         setTimeout(versions[CV].encode, 0, ...arguments)
     },
     decode(readableStream){
         return new Promise((resolve, reject) => {
             setTimeout(function(){
                 let a = readableStream.read(1)
                 versions[a[0]].decode(resolve, reject)(...arguments)
             },100, ...arguments)
         })
     }
}
