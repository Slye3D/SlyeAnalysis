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

const cluster   = require('cluster')
const net       = require('net')
const lzma      = require('lzma')
const mkdirp    = require('mkdirp')
const fs        = require('fs')
const path      = require('path')
const baseDir   = '/var/SA'
const CLIENT_PORT   = 9898
const VIEW_PORT     = 9899

const CLIENTS   = {}
const USERS     = []
const Apps      = []

function setUpHTTP(redis, SAD){
    const express   = require('express')
    const app       = express();
    const server    = require('http').Server(app);
    const io        = require('socket.io').listen(server);

    server.listen(VIEW_PORT, function(){
        console.log('WEB interface listens on port ' + VIEW_PORT);
    });

    app.use(express.static(path.resolve('../view')))
    app.use('/packages', express.static(path.resolve('../node_modules')))

    app.all('/apps', function (req, res){
        res.json(Apps)
    })

    app.all('/archives/:app', function(req, res){
        let {app} = req.params
        let re = []
        fs.readdirSync(path.join(baseDir, app)).forEach(file => {
            let stat = fs.lstatSync(path.join(baseDir, app, file))
            if(stat.isFile())
                re.push(file)
        })
        res.json(re)
    })

    function p(type){
        return function(req, res){
            let {app, file} = req.params

            function proc(report){
                let day = parseInt(parseInt(Date.now() / 1000) / (24 * 3600)) * 24 * 3600
                let t = day == parseInt(file) ? 2 * 60 : 20 * 60
                redis.expire('SA:SAD:' + app + ':' + file, t)

                if(type == 'charts'){
                    for(let endpoint in report.data){
                        delete report.data[endpoint].pos
                    }
                    res.json(report)
                }
            }

            redis.get('SA:SAD:' + app + ':' + file, function(err, re){
                if(err)
                    return res.status(500).send('Server error')
                if(re)
                    return proc(JSON.parse(re));
                try{
                    let readableStream = fs.createReadStream(path.join(baseDir, app, file))
                    SAD.decode(readableStream).then(d => {
                        proc(d)
                        redis.set('SA:SAD:' + app + ':' + file, JSON.stringify(d))
                        readableStream.close()
                    })
                }catch(e){
                    res.status(404).send('404')
                }
            })
        }
    }

    app.all('/archives/:app/:file', p('charts'))
    app.all('/archives/:app/:file/pos/:zoom/:center', p('pos'))

    app.get('/*', function(req, res){
        res.sendFile(path.resolve('../view/index.html'))
    })

    io.on('connection', function (socket) {
        let currentApp
        let id
        USERS.push(socket)
        let uId = USERS.length - 1

        socket.on('set_app', function(app){
            if(!CLIENTS[app])
                CLIENTS[app] = []
            if(currentApp){
                CLIENTS[app][id]    = null
            }
            CLIENTS[app].push(socket)
            id = CLIENTS[app].length - 1
            currentApp = app

            let time = parseInt(Date.now() / 1000)
            for(let t = time - 125;t < time + 1;t++){
                let k   = 'SA:WS:' + app + ':' + t
                redis.zrange(k, 0, -1, 'withscores', (err, re) => {
                    // re = [endpoint, val, endpoint, val, ...]
                    for(let j = 0;j < re.length;j += 2){
                        let endpoint    = re[j]
                        let value       = parseInt(re[j + 1])
                        socket.emit('views-' + app, {
                            time    : t,
                            value   : value,
                            endpoint: endpoint
                        })
                    }
                })
            }
        })

        socket.on('disconnect', function(){
            if(currentApp){
                CLIENTS[currentApp][id]    = null
            }
            USERS[uId]  = null
        })
    })


    // setInterval(function(){
    //     let t = Math.floor(Date.now() / 1000)
    //     Apps.map(app => {
    //         let k   = 'SA:WS:' + app + ':' + t
    //         redis.zrange(key, 0, -1, 'withscores', (err, re) => {
    //             // re = [endpoint, val, endpoint, val, ...]
    //             for(let j = 0;j < re.length;j += 2){
    //                 let endpoint    = re[j]
    //                 let value       = parseInt(re[j + 1])
    //                 emitToApp(app, 'views', {
    //                     time    : t,
    //                     value   : value,
    //                     endpoint: endpoint
    //                 })
    //             }
    //         })
    //     })
    // }, 1000)
}

function emitToApp(app, ch, data){
    if(!CLIENTS[app])
        return
    for(let i = 0;i < CLIENTS[app].length;i++){
        if(CLIENTS[app][i]){
            try{
                CLIENTS[app][i].emit(ch, data)
            }catch(e){}
        }
    }
}

function emitToAll(ch, data){
    for(let i = 0;i < USERS.length;i++){
        if(USERS[i]){
            try{
                USERS[i].emit(ch, data)
            }catch(e){}
        }
    }
}

if(cluster.isMaster){
    const redis     = require('redis').createClient()
    const geoip     = require('geoip-lite')
    const SAD       = require('../SAD')
    setUpHTTP(redis, SAD)
    try{
        try{mkdirp.sync(baseDir)}catch(e){}
        fs.readdirSync(baseDir).forEach(file => {
            let stat = fs.lstatSync(path.join(baseDir, file))
            if(stat.isDirectory())
                Apps.push(file)
        })
    }catch(e){
        // I'm not idiot
        throw e
    }
    const commands = {
        views({app, time, data}){
            for(let endpoint in data){
                for(let key in data[endpoint]){
                    let pos = geoip.lookup(data[endpoint][key][0])
                    pos = pos
                        ? pos.ll.map(x => Math.round(x / 10000) * 10000)
                        : null
                    data[endpoint][key][0] = pos
                }
            }
            for(let endpoint in data){
                for(let key in data[endpoint]){
                    let [pos, t, c] = data[endpoint][key]

                    t = t || 0
                    c = c || 1
                    t += time

                    let day         = Math.floor(t / (24 * 3600)) * 24 * 3600
                    let tenMinutes  = Math.floor((t - day) / (10 * 60))
                    let prefix      = 'SA:' + day + ':' + app + ':'
                    // data.views
                    redis.zincrby(prefix + endpoint + ':e', c, tenMinutes)
                    // data.pos
                    if(pos){
                        let [la, lo] = pos
                        redis.zincrby(prefix + endpoint + ':p', c, la + ':' + lo)
                    }

                    // Real time data
                    let k   = 'SA:WS:' + app + ':' + t
                    redis.zincrby(k, c, endpoint, function (err, value) {
                        emitToApp(app, 'views-' + app, {
                            time    : t,
                            value   : value,
                            endpoint: endpoint
                        })
                    })
                    // Keep it just for 15 min
                    redis.expire(k, 15 * 60)
                }
            }
        },
        connect(app){
            if(Apps.indexOf(app) == -1)
                Apps.push(app)
            try{mkdirp.sync(path.join(baseDir, app))}catch(e){}
            redis.sadd('SA:APPS', app)
        }
    }

    function saveReport(app, day, report){
        console.log('Save', app+'@'+day ,'to disk');
        let file        = path.join(baseDir, app, day.toString())
        let writable    = fs.createWriteStream(file)
        SAD.encode(report, writable)
    }

    function saveApp2Disk(app, day){
        return new Promise((resolve, reject) => {
            let prefix  = 'SA:' + day + ':' + app + ':'
            let report  = {
                date: day,
                data: {}
            }
            let tasks   = 0
            tasks++
            redis.keys(prefix + '*' + ':e', (err, keys) => {
                tasks--
                if(err)
                    return reject()
                if(keys.length == 0)
                    return resolve()
                for(let i = 0;i < keys.length;i++){
                    let key         = keys[i]
                    let endpoint    = key.substring(prefix.length, key.length - 2)
                    report.data[endpoint]   = {
                        views   : [],
                        pos     : []
                    }
                    // (24 * 3600) / (10 * 60) + 1 = 145
                    for(let j = 0;j < 145;j++)
                        report.data[endpoint].views.push(0)
                    tasks++
                    redis.zrange(key, 0, -1, 'withscores', (err, re) => {
                        tasks--
                        if(err)
                            return reject()
                        // re = [tenMinutes, val, tenMinutes, val, ...]
                        for(let j = 0;j < re.length;j += 2){
                            report.data[endpoint].views[parseInt(re[j])] = parseInt(re[j + 1])
                        }

                        if(tasks == 0){
                            tasks++
                            redis.keys(prefix + '*' + ':p', (err, keys) => {
                                tasks--
                                if(err)
                                    return reject()
                                if(keys.length == 0){
                                    saveReport(app, day, report)
                                    resolve()
                                }
                                for(let i = 0;i < keys.length;i++){
                                    let key = keys[i]
                                    let endpoint    = key.substr(prefix.length, key.length - 2)
                                    tasks++
                                    redis.zrange(key, 0, -1, 'withscores', (err, re) => {
                                        tasks--
                                        if(err)
                                            return reject()
                                        // re = ['la:lo', val, 'la:lo', val, ...]
                                        for(let j = 0;j < re.length;j += 2){
                                            let pos = re[j]
                                            let val = parseInt(re[j + 1])
                                            let tmp = pos.indexOf(':')
                                            let la  = parseFloat(pos.substr(0, tmp))
                                            let lo  = parseFloat(pos.substr(tmp + 1))
                                            report.data[endpoint].pos.push(
                                                [la, lo, val]
                                            )

                                        }
                                        if(tasks == 0){
                                            // It means now report is ready to save
                                            saveReport(app, day, report)
                                            resolve()
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        })
    }

    let lastDay
    setInterval(function(){
        let day = Math.floor((Date.now() / 1000) / (24 * 3600)) * 24 * 3600
        let i   = -1
        let next= function(){
            i++
            let app = Apps[i]
	    if(!app)
		      return
        if(lastDay && lastDay !== day){
                // Save final results of last day
                saveApp2Disk(app, lastDay).then(function(){
                    // i-- : we should save today's report
                    i--
                    let prefix = 'SA:' + lastDay + ':' + app + ':'
                    redis.keys(prefix + '*', function(err, keys){
                        if(err)
                            return
                        redis.del(...keys)
                    })
                    lastDay = day
                    next()
                }, function(){
                    // We have to make sure we save last day final results
                    // so we try one more time
                    // @todo
                    // It's really a bad idea cause it might cause an infinit
                    // loop, but it works for beta
                    i--
                    next()
                })
            }else{
                // We put this section to an else because running to task
                // at the same time is very heavy
                saveApp2Disk(app, day).then(next, next)
            }
        }
        next()
    }, 3 * 60 * 1000)

    function messageHandler(msg){
        if(msg.cmd && typeof commands[msg.cmd] == 'function'){
            commands[msg.cmd](msg.data)
        }
    }

    function fork(){
        let worker  = cluster.fork()
        worker.on('message', messageHandler);
        // Kill worker after 5 min
        // to clean up memory
        setTimeout(function(){
            worker.kill()
        }, 5 * 60 * 1000)
    }
    const numCPUs   = require('os').cpus().length - 1
    for(let i = 0;i < numCPUs;i++){
        fork()
    }
    cluster.on('exit', function(){
        fork()
    })
}else{
    function processMsg(app_id, data){
        data = data.toString()
        // {
        //     time: 150014545545,
        //     data: {
        //         endpoint: [
        //             ['ip', '[time=0]', '[count=1]']
        //         ]
        //     }
        // }
        try{
            data    = JSON.parse(data)
            data.app= app_id
            process.send({
                cmd : 'views',
                data: data
            })
        }catch(e){}
    }

    let server  = net.createServer(function(socket){
        console.log('Client connected');
        let app_id  = ''
        let message
        let j
        let len
        let queue   = []
        let inProg  = false
        function read(data){
            if(!data || data.length == 0)
                return
            if(len){
                let i = 0
                while((i < data.length) && (j < len)){
                    message[j] = data[i]
                    j++
                    i++
                }
                if(message.length == len){
                    len = null
                    if(app_id){
                        processMsg(app_id, message)
                    }else{
                        app_id = message.toString()
                        process.send({
                            cmd : 'connect',
                            data: app_id
                        })
                    }
                }
                if(i < data.length){
                    // it means there are some other things in `data`
                    read(data.slice(i))
                }
            }else{
                len = parseInt(data.slice(0, 4).toString('hex'), 16)
                message = Buffer.alloc(len)
                j = 0
                read(data.slice(4))
            }
        }

        function r(){
            data = queue[0]
            queue= queue.slice(1)
            inProg  = true
            read(data)
            inProg  = false
            if(queue.length > 0)
                r()
        }

        socket.on('data', function(data){
            queue.push(data)
            if(!inProg){
                r()
            }
        })

        socket.on('close', function(){
            console.log('Client disconnected');
        })
    })
    server.listen(CLIENT_PORT, '0.0.0.0', function(){
        console.log('API listen on 0.0.0.0:' + CLIENT_PORT);
    })
}
