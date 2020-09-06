"use strict";
class IatRecorder {
    constructor(opts = {}) {
        // 服务接口认证信息(语音听写（流式版）WebAPI)
        this.appId = opts.appId || '';
        this.apiKey = opts.apiKey || '';
        this.apiSecret = opts.apiSecret || '';

        // 识别监听方法
        this.onTextChange = opts.onTextChange || Function();
        this.onWillStatusChange = opts.onWillStatusChange || Function();

        // 方言/语种
        this.status = 'null'
        this.language = opts.language || 'zh_cn'
        this.accent = opts.accent || 'mandarin';

        // 记录音频数据
        this.audioData = [];
        // 记录听写结果
        this.resultText = '';
        // wpgs下的听写结果需要中间状态辅助记录
        this.resultTextTemp = '';
        // 音频数据多线程

        this.init();
    };

    // 设置WebSocket请求地址
    getWebSocketUrl() {
        return new Promise((resolve, reject) => {
            // 请求地址根据语种不同变化
            var url = 'wss://iat-api.xfyun.cn/v2/iat'
            var host = 'iat-api.xfyun.cn'
            var date = new Date().toGMTString()
            var algorithm = 'hmac-sha256'
            var headers = 'host date request-line'
            var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
            var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.apiSecret)
            var signature = CryptoJS.enc.Base64.stringify(signatureSha)
            var authorizationOrigin = `api_key="${this.apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
            var authorization = btoa(authorizationOrigin)
            url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
            resolve(url);
        });
    };

    // 操作初始化
    init() {
        var self = this;
        try {
            if (!self.appId || !self.apiKey || !self.apiSecret) {
                alert('请正确配置接口appId,apiKey');
            } else {
                self.webWorker = new Worker('./js/transcode.worker.js');
                self.webWorker.onmessage = function (event) {
                    self.audioData.push(...event.data);
                };
            }
        } catch (error) {
            console.log('init', error)
            alert('对不起：请在服务器环境下运行！');
            console.error('请在服务器如：WAMP、XAMPP、Phpstudy、http-server、WebServer等环境中运行！', error);
        };
        // console.log("%c ❤️使用说明：https://blog.csdn.net/muguli2008/article/details/106734113");
    };

    // 修改录音听写状态
    setStatus(status) {
        this.onWillStatusChange && this.status !== status && this.onWillStatusChange(this.status, status);
        this.status = status;
    };

    // 设置识别结果内容
    setResultText({ resultText, resultTextTemp } = {}) {
        this.onTextChange && this.onTextChange(resultTextTemp || resultText || '');
        resultText !== undefined && (this.resultText = resultText);
        resultTextTemp !== undefined && (this.resultTextTemp = resultTextTemp);
    };

    // 修改听写参数
    setParams({ language, accent } = {}) {
        language && (this.language = language)
        accent && (this.accent = accent)
    };

    // 对处理后的音频数据进行base64编码，
    toBase64(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // 连接WebSocket
    connectWebSocket() {
        return this.getWebSocketUrl().then(url => {
            let iatWS;
            if ('WebSocket' in window) {
                iatWS = new WebSocket(url);
            } else if ('MozWebSocket' in window) {
                iatWS = new MozWebSocket(url);
            } else {
                alert('浏览器不支持WebSocket!');
                return false;
            }
            this.webSocket = iatWS;
            this.setStatus('init');
            iatWS.onopen = e => {
                this.setStatus('ing');
                // 重新开始录音
                setTimeout(() => {
                    this.webSocketSend();
                }, 500);
            };
            iatWS.onmessage = e => {
                this.webSocketRes(e.data);
            };
            iatWS.onerror = e => {
                this.recorderStop(e);
            };
            iatWS.onclose = e => {
                this.recorderStop(e);
            };
            return true ;
        })
    };

    // 初始化浏览器录音
    async recorderInit() {
        // 创建音频环境
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext.resume();
            if (!this.audioContext) {
                alert('浏览器不支持webAudioApi相关接口');
                return false;
            }
        } catch (e) {
            if (!this.audioContext) {
                alert('浏览器不支持webAudioApi相关接口');
                return false;
            }
        };
        // 获取浏览器录音权限成功时回调
        let getMediaSuccess = stream => {
            // 创建一个用于通过JavaScript直接处理音频
            this.scriptProcessor = this.audioContext.createScriptProcessor(0, 1, 1);
            this.scriptProcessor.onaudioprocess = e => {
                if (this.status === 'ing') {
                    // 多线程音频数据处理
                    try {
                        this.webWorker.postMessage(e.inputBuffer.getChannelData(0));
                    } catch (error) {

                    }

                }
            }
            // 创建一个新的MediaStreamAudioSourceNode 对象，使来自MediaStream的音频可以被播放和操作
            this.mediaSource = this.audioContext.createMediaStreamSource(stream);
            this.mediaSource.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);
            this.connectWebSocket();
        };
        // 获取浏览器录音权限失败时回调
        let getMediaFail = (e) => {
            // alert('对不起：录音权限获取失败!');
            this.audioContext && this.audioContext.close();
            this.audioContext = undefined;
            // 关闭websocket
            if (this.webSocket && this.webSocket.readyState === 1) {
                this.webSocket.close();
            }
            return false ;
        };

        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        let device ,  res ;
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) device = navigator.mediaDevices ;
        else if (navigator.getUserMedia) device = navigator ;        
        console.log('getUserMedia device' , device );
        if(device) {
            res = await device.getUserMedia({audio: true,video: false}).catch(e=>{ return {errno:1000,errmsg: '用户未授权'} });
            if(  res.errno ) {
                getMediaFail();
                return res ;
            }
            getMediaSuccess(res)
            console.log('device res' ,res);
            return {errno:0,errmsg:'',data:'成功'} ;
        }else {
            let err ;
            if (navigator.userAgent.toLowerCase().match(/chrome/) && location.origin.indexOf('https://') < 0) {
                console.error('获取浏览器录音功能，因安全性问题，需要在localhost 或 127.0.0.1 或 https 下才能获取权限！');
                err = {errno:1000,errmsg:'localhost 或 127.0.0.1 或 https 下才能获取权限！'}
            } else {
                // alert('对不起：未识别到录音设备!');
                err = {errno:1000,errmsg:'未识别到录音设备'}
            }
            this.audioContext && this.audioContext.close();
            return err;
        };
        return {errno:0,errmsg:'',data:'成功'} ;
    };

    recorderCheck(){
        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) return true ;
        else if (navigator.getUserMedia) return true ;     
        return false ;
    }

    // 向webSocket发送数据(音频二进制数据经过Base64处理)
    webSocketSend() {
        if (this.webSocket.readyState !== 1) {
            return false;
        }
        // 音频数据
        let audioData = this.audioData.splice(0, 1280);
        var params = {
            common: {
                app_id: this.appId,
            },
            business: {
                language: this.language, //小语种可在控制台--语音听写（流式）--方言/语种处添加试用
                domain: 'iat',
                accent: this.accent, //中文方言可在控制台--语音听写（流式）--方言/语种处添加试用
                vad_eos: 5000,
                dwa: 'wpgs' //为使该功能生效，需到控制台开通动态修正功能（该功能免费）
            },
            data: {
                status: 0,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: this.toBase64(audioData)
            }
        };
        // 发送数据
        this.webSocket.send(JSON.stringify(params));

        this.handlerInterval = setInterval(() => {
            // websocket未连接
            if (this.webSocket.readyState !== 1) {
                this.audioData = [];
                clearInterval(this.handlerInterval);
                return false;
            };
            if (this.audioData.length === 0) {
                if (this.status === 'end') {
                    this.webSocket.send(
                        JSON.stringify({
                            data: {
                                status: 2,
                                format: 'audio/L16;rate=16000',
                                encoding: 'raw',
                                audio: ''
                            }
                        })
                    );
                    this.audioData = [];
                    clearInterval(this.handlerInterval);
                }
                return false;
            };
            // 中间帧
            this.webSocket.send(
                JSON.stringify({
                    data: {
                        status: 1,
                        format: 'audio/L16;rate=16000',
                        encoding: 'raw',
                        audio: this.toBase64(this.audioData.splice(0, 1280))
                    }
                })
            );
        }, 40);
    };

    // 识别结束 webSocket返回数据
    webSocketRes(resultData) {
        let jsonData = JSON.parse(resultData);
        if (jsonData.data && jsonData.data.result) {
            let data = jsonData.data.result;
            let str = '';
            let ws = data.ws;
            for (let i = 0; i < ws.length; i++) {
                str = str + ws[i].cw[0].w;
            }
            // 开启wpgs会有此字段(前提：在控制台开通动态修正功能) // "apd" == append ，rpl = replace
            // 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
            if (data.pgs) {
                if (data.pgs === 'apd') { 
                    // 将resultTextTemp同步给resultText
                    this.setResultText({
                        resultText: this.resultTextTemp
                    });
                }
                // 将结果存储在resultTextTemp中
                this.setResultText({
                    resultTextTemp: this.resultText + str
                });
            } else {
                this.setResultText({
                    resultText: this.resultText + str
                });
            }
        }
        if (jsonData.code === 0 && jsonData.data.status === 2) {
            this.webSocket.close();
        }
        if (jsonData.code !== 0) {
            this.webSocket.close();
        }
    };

    // 启动录音
    recorderStart() {
        if (!this.audioContext) {
            return this.recorderInit();
        } else {
            this.audioContext.resume();
            return this.connectWebSocket();
        }
    };

    // 暂停录音
    recorderStop() {
        if (!(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgen))) {

            // safari下suspend后再次resume录音内容将是空白，设置safari下不做suspend
            this.audioContext && this.audioContext.suspend();
        }
        this.setStatus('end');
    };

    // 开始
    start() {
        this.setResultText({ resultText: '', resultTextTemp: '' });
        return this.recorderStart();
    };

    // 停止
    stop() {
        this.recorderStop();
    };
};

window.IatRecorder = IatRecorder;