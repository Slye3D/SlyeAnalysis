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

function encode(report, writableStream){
    writableStream.write(JSON.stringify(report))
}

function decode(resolve, reject){
    return function (readableStream){
        let b = ''
        let chunk
        while (null !== (chunk = readableStream.read())) {
            b += chunk.toString()
        }
        try{
            let d = JSON.parse(b)
            resolve(d)
        }catch(e){
            reject()
        }
    }
}

module.exports = {
    encode,
    decode
}
