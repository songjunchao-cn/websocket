/*
 * @Author: sjc
 * @Date: 2020-02-21 23:45:04
 * @LastEditTime: 2020-02-23 00:03:59
 * @Description: websocket封装
 */
class WebSocketClass {
    /**
     * @description: 初始化实例属性，保持参数
     * @param {String} url ws服务接口
     * @param {Function} msgCallback 服务器信息回调函数
     * @param {String} name 可选 用于区分ws 用于debugger
     */
    constructor(url, msgCallback, name = 'defalut') {
        this.url = url
        this.msgCallback = msgCallback
        this.name = name
        this.ws = null
        this.status = null
    }
    /**
     * @description: 初始化或者重新连接websocket
     * @param {*} 可选值 要传的数据
     */
    connect (data) {
        // 初始化websocket实例
        this.ws = new webSocket(this.url)
        // 监听到ws连接成功
        this.ws.onopen = e => {
            this.status = 'open'
            console.log(`${this.name}连接成功`, e)
            this.heartCheck()
            if (data !== undefined) {
                return this.ws.send(data)
            }
        }
        // 监听到服务器返回信息
        this.ws.onmessage = e => {
            if (e.data === 'pong') {
                this.pingPong = 'pong'
            }
            // 把数据传给回调函数 并执行
            return this.msgCallback(e.data)
        }
        // 监听ws关闭
        this.ws.onclose = e => {
            // 判断是否关闭
            this.closeHandle(e)
        }
        this.ws.onerror = e => {
            // 判断是否关闭
            this.closeHandle(e)
        }
    }
    heartCheck() {
        // 心跳设置为10000ms
        this.pingPong = 'ping'
        this.pingInterval = setInterval(() => {
            // 检查ws连接状态
            if (this.ws.readyState === 1) {
                this.ws.send('ping')
            }
        }, 10000);
        this.pongInterval = setInterval(() => {
            // 检查ws连接状态
            if (this.pingPong === 'ping') {
                this.closeHandle('pingPong没有改变为pong'); // 没有返回pong 重启webSocket
            }
            // 重置为ping 若下一次 ping 发送失败 或者pong返回失败(pingPong不会改成pong)，将重启
            console.log('返回pong')
            this.pingPong = 'ping'
        }, 20000);
    }
    closeHandle(e = 'err') {
        // 因为webSocket并不稳定，规定只能手动关闭(调closeMyself方法)，否则就重连
        if (this.status !== 'close') {
            console.log(`${this.name}断开，重连websocket`, e)
            if (this.pingInterval !== undefined && this.pongInterval !== undefined) {
                // 清除定时器
                clearInterval(this.pingInterval);
                clearInterval(this.pongInterval);
            }
            this.connect(); // 重连
        } else {
            console.log(`${this.name}websocket手动关闭`)
        }
    }
    // 手动关闭WebSocket
    closeMyself() {
        console.log(`关闭${this.name}`)
        this.status = 'close';
        return this.ws.close();
    }
}
function someFn(data) {
    console.log('接收服务器消息的回调：', data);
}
const wsValue = new WebSocketClass('wss://echo.websocket.org', someFn, 'wsName'); // 阮一峰老师教程链接
wsValue.connect('立即与服务器通信'); // 连接服务器
setTimeout(() => {
    wsValue.sendHandle('传消息给服务器')
}, 1000);
setTimeout(() => {
    wsValue.closeMyself(); // 关闭ws
}, 10000)