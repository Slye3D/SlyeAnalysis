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
const lzma  = require('lzma')

function encode(report, writableStream){
    lzma.compress(JSON.stringify(report), 5, function(re){
        writableStream.write(Buffer.from(re))
    })
}

function decode(resolve, reject){
    return function (readableStream){
        let bufs    = []
        readableStream.on('data', function(d){ bufs.push(d) })
        readableStream.on('end', function(){
            let b = Buffer.concat(bufs)
            lzma.decompress(b, function(re){
                try{
                    let d = JSON.parse(re)
                    resolve(d)
                }catch(e){
                    reject()
                }
            })
        })
    }
}

module.exports = {
    encode,
    decode
}
