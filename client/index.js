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

const net   = require('net')
const lzma  = require('lzma')

function connect(host, port, app){
    let server
    let timeToWait = 0
    let queue   = []
    function connect(){
        try{
            if(server)
                server.end()
        }catch(e){}
        setTimeout(function(){
            let f = true
            if(timeToWait == 0)
                timeToWait = 500
            try{
                server  = new net.Socket()
                server.connect(port, host, function(){
                    timeToWait  = 0
                    queue.map(x => server.write(x))
                    queue = []

                    // send app name to server
                    let hex = app.length.toString(16)
                    hex     = '0'.repeat(8 - hex.length) + hex
                    let len = Buffer.from(hex, 'hex')
                    server.write(len)
                    server.write(app)
                })
                // Always keep connection alive
                server.on('close', function(){
                    if(f){
                        connect()
                        f = false
                    }
                })
                server.on('error', function(){
                    if(f){
                        connect()
                        f = false
                    }
                })
            }catch(e){
                connect()
            }
        }, timeToWait)
    }
    connect()

    function sendData(data){
        function send(buf){
            try{
                server.write(buf)
            }catch(e){
                queue.push(buf)
            }
        }
        let buf = Buffer.from(data)
        let hex = buf.length.toString(16)
        hex     = '0'.repeat(8 - hex.length) + hex
        let len = Buffer.from(hex, 'hex')
        send(len)
        send(buf)
    }


    let views   = [
        // [time, endpoint, ip]
    ]

    function sendReport(){
        if(views.length > 0){
            let v = views.map(x => x)
            views = []
            let time    = parseInt(Date.now() / 1000)
            let r = {
                data: {}
            }
            for(let i = 0;i < v.length;i++){
                if(time > v[i][0])
                    time = v[i][0]
                r.data[v[i][1]] = []
            }
            r.time = time
            for(let i = 0;i < v.length;i++){
                let view = v[i]
                let ip = view[2]
                let d = [ip]
                if(time - view[0] > 0)
                    d.push(time - view[0])
                r.data[view[1]].push(d)
            }
            sendData(JSON.stringify(r))
        }
    }

    let requests = 0

    setInterval(function(){
        requests = 0
    }, 1100)

    function getSpeed(){
        return requests / 1100 * 1000
    }

    function interval(){
        sendReport()
        let speed   = getSpeed()
        if(speed > 300){
            setTimeout(interval, 1500)
        }else{
            setTimeout(interval, 1000)
        }
    }

    setTimeout(interval, 1000)

    return {
        view(req, endpoint){
            requests++
            // x-real-ip
            // you should set this header on your nginx configs
            // proxy_set_header  X-Real-IP  $remote_addr;
            // we don't trust x-forwarded-for because it's a header and user
            // can set this him/her self
            let ip  = req.headers['x-real-ip'] || req.connection.remoteAddress
            let time= parseInt(Date.now() / 1000)
            views.push([time, endpoint, ip])
        }
    }
}

module.exports  = connect
