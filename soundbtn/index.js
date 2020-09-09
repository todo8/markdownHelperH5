var GameOption;
$(function () {
    $(".voice-txt").focus();

    var width = $(window).width();
    var height = $(window).height();
    var offsetY = 110; // 116 ;
    GameOptions = {
        width: width  // 800 //游戏屏幕的高度。 
        , height: height //  600 //游戏屏幕的宽度。
        , ground_y: 400 - 65 //地面y坐标
        , fps: 10
        , actorWidth: 57 * 2 * 0.8
        , actorHeight: 61 * 2 * 0.8

        //--hero的行走向量速度。
        , hero_run_x_speed: 15
        , hero_run_y_speed: 30 //hero跳跃时候向上的速度。
    };

    //--虚拟手柄控件。
    function GameJoyPad(parent_container, _opts) {
        var me = this;
        this.settings = {
            //joy_pad_background: "img/Button_normal.png"//摇杆的背景。
            joy_pad_background: "img/joy_bg.png"//摇杆的背景。
            , joy_pad_joystick: "img/Button_active.png" //摇杆正体。
            // , joy_pad_joystick: "img/RadialJoy_Area.png" //摇杆正体。
            , joy_pad_x: 180 //摇杆的坐标
            , joy_pad_y: 280 - offsetY //摇杆的y坐标  
            //--注意，所有缩放的尺寸都是按照unitiy3d获得的这些摇杆素材来设置的，假如替换了texture，请重新设置缩放尺寸。
            , joy_pad_background_scale: {
                x: 0.5
                , y: 0.5
            }//摇杆背景需要缩放的比例，默认是x和y上面都是1
            , joy_pad_joystick_scale: {
                x: 0.6
                , y: 0.6
            }//摇杆主体需要缩放的比例，默认x、y都是1
            , buttons: [
                {
                    button_name: "leftBtn"
                    , normal_texture: "img/left.png"
                    , pressed_texture: "img/left.png"
                    , x: 86 - 181
                    , y: 280 - 280
                    , scale: { x: 0.4, y: 0.4 }
                }
                , {
                    button_name: "rightBtn"
                    , normal_texture: "img/right.png"
                    , pressed_texture: "img/right.png"
                    , x: 274 - 180
                    , y: 280 - 280
                    , scale: { x: 0.4, y: 0.4 }
                }
                , {
                    button_name: "upBtn"
                    , normal_texture: "img/up.png"
                    , pressed_texture: "img/up.png"
                    , x: 178 - 180
                    , y: 187 - 280
                    , scale: { x: 0.4, y: 0.4 }
                }
                , {
                    button_name: "downBtn"
                    , normal_texture: "img/down.png"
                    , pressed_texture: "img/down.png"
                    , x: 179 - 180
                    , y: 374 - 280
                    , scale: { x: 0.4, y: 0.4 }
                }
            ] //虚拟手柄的其他按钮。


            //--摇杆摇动角度变换时候的回调函数。
            , onJoyStickMove: function (now_stick_angle) {

            }
            //--点击了控制按钮的回调事件。
            , onButtonClick: function (event, button_name) {

            }
            , onJoyStickEnd: function (now_stick_angle) {

            }

        };
        $.extend(this.settings, _opts);
        //--基本赋值。
        this.parent_container = parent_container;
        this.joy_pad_container = {};
        this.joy_pad_background = {};
        this.joy_pad_joystick = {};
        this.joy_pad_radius = 0;//这是背景大圈子的半径。
        this.joy_pad_stickRadius = 0;//这是摇杆小圈子的半径。
        //--生成一个随机的joy container id。
        this.joy_pad_container_id = new Date().getTime() + "_" + parseInt(Math.random() * 1000);

        //--好了，加载相关资源
        me.__loadResources(function () {
            me.__init_stick();
            //--新建按钮。
            // for (var i = 0; i < me.settings.buttons.length; i++) {
            //     var buttonItemInfo = me.settings.buttons[i];
            //     me.__createButton(buttonItemInfo);
            // }            
        });
    }
    GameJoyPad.prototype.__loadResources = function (callback) {
        var me = this;
        PIXI.loader.add('joy_pad_background', me.settings.joy_pad_background);
        PIXI.loader.add('joy_pad_joystick', me.settings.joy_pad_joystick);
        PIXI.loader.once('complete', function () {
            if (callback) {
                callback();
            }
        });
        PIXI.loader.load();
    }
    //--初始化摇杆。
    GameJoyPad.prototype.__init_stick = function () {
        var child = this;
        var texture_bg = PIXI.Texture.fromImage(this.settings.joy_pad_background);
        var texture_joystick = PIXI.Texture.fromImage(this.settings.joy_pad_joystick);

        this.joy_pad_container = new PIXI.Container();
        this.joy_pad_background = new PIXI.Sprite(texture_bg);
        this.joy_pad_joystick = new PIXI.Sprite(texture_joystick);
        this.joy_pad_background.scale = this.settings.joy_pad_background_scale;
        this.joy_pad_joystick.scale = this.settings.joy_pad_joystick_scale;
        this.joy_pad_background.anchor = { x: 0.5, y: 0.5 };
        this.joy_pad_joystick.anchor = { x: 0.5, y: 0.5 };
        this.joy_pad_container.anchor = { x: 0.5, y: 0.5 };
        this.joy_pad_container.addChild(this.joy_pad_background);
        for (var i = 0; i < this.settings.buttons.length; i++) {
            var buttonItemInfo = this.settings.buttons[i];
            this.__createButton(buttonItemInfo);
        }
        this.joy_pad_container.addChild(this.joy_pad_joystick);
        this.joy_pad_radius = this.joy_pad_container.width / 2;
        this.joy_pad_stickRadius = this.joy_pad_joystick.width / 2;
        window.joy_container = this.joy_pad_container;
        this.joy_pad_container.position = {
            x: this.settings.joy_pad_x
            , y: this.settings.joy_pad_y
        };
        this.parent_container.addChild(this.joy_pad_container);
        this.joy_pad_container.random_id = this.joy_pad_container_id;
        this.__init_stick_events();
    }
    GameJoyPad.prototype.__init_stick_events = function () {
        var me = this;
        this.joy_pad_container.interactive = true;
        var _on_drag = false;
        var _event_data = {};
        var _touch_event_id = 0;
        /******pixi bug1：当两个手指其中一个，譬如摇杆，另一个手指点击按钮，摇杆会接收到touch end事件。醉了。******/
        function onDragStart(event) {
            //--注意，pc端的identifier是undefined。
            _event_data = event.data;
            var startPosition = _event_data.getLocalPosition(this.parent);
            _touch_event_id = event.data.identifier;
            _on_drag = true;
            me.settings.onJoyStickStart(event);
        }
        function onDragEnd(event) {
            if (_on_drag == false) {
                return;
            }
            if (_touch_event_id != event.data.identifier) {
                return;
            }
            _on_drag = false;
            window.end_event = event;

            var newPosition = _event_data.getLocalPosition(this.parent);
            let { _stick_angle, dis, _center_point } = calc_angle_distance(newPosition);
            me.settings.onJoyStickEnd(_stick_angle, dis, me.joy_pad_joystick.position);
            me.joy_pad_joystick.position = { x: 0, y: 0 };
        }
        function onDragMove(event) {
            if (_touch_event_id != event.data.identifier) return;
            if (_on_drag == false) return;

            var newPosition = _event_data.getLocalPosition(this.parent);
            let { _stick_angle, dis, _center_point } = calc_angle_distance(newPosition);
            if (_stick_angle == null) return;

            me.joy_pad_joystick.position = _center_point;
            me.settings.onJoyStickMove(_stick_angle, dis, _center_point);
        };
        function calc_angle_distance(newPosition) {
            var _side_length_y = newPosition.y - me.settings.joy_pad_y;
            var _side_length_x = newPosition.x - me.settings.joy_pad_x;
            if (_side_length_x == 0 && _side_length_y == 0) return {};
            _side_length_y = Math.ceil(_side_length_y), _side_length_x = Math.ceil(_side_length_x);

            var _center_point = { x: 0, y: 0 };//--中心点。
            var dis = Math.sqrt(Math.pow(_side_length_y, 2) + Math.pow(_side_length_x, 2));
            dis = Math.ceil(dis);

            var _stick_angle = 0; //当前摇杆的角度

            //--好了，现在判断执行计算的半径。
            var _cal_radius = 0;

            if (_side_length_x * _side_length_x + _side_length_y * _side_length_y >= me.joy_pad_radius * me.joy_pad_radius) {
                _cal_radius = me.joy_pad_radius;
                //--假如大于的话，那么就按照圆弧计算坐标。

            }
            else {
                _cal_radius = me.joy_pad_radius - me.joy_pad_stickRadius;
            }


            if (_side_length_x == 0) {
                if (_side_length_y > 0) {
                    _center_point = {
                        x: 0
                        , y: _side_length_y > me.joy_pad_radius ? me.joy_pad_radius : _side_length_y
                    };
                    _stick_angle = 270;//180度。
                }
                else {
                    _center_point = {
                        x: 0
                        , y: -(Math.abs(_side_length_y) > me.joy_pad_radius ? me.joy_pad_radius : Math.abs(_side_length_y))
                    };
                    _stick_angle = 90;//901度
                }
                _stick_angle = Math.ceil(_stick_angle);
                // me.joy_pad_joystick.position = _center_point;
                // me.settings.onJoyStickMove(_stick_angle,_center_point);
                return { _stick_angle, dis, _center_point };
            }
            else if (_side_length_y == 0) {
                if (_side_length_x > 0) {
                    _center_point = {
                        x: (Math.abs(_side_length_x) > me.joy_pad_radius ? me.joy_pad_radius : Math.abs(_side_length_x))
                        , y: 0
                    };
                    _stick_angle = 0;//0度
                }
                else {
                    _center_point = {
                        x: -(Math.abs(_side_length_x) > me.joy_pad_radius ? me.joy_pad_radius : Math.abs(_side_length_x))
                        , y: 0
                    };
                    _stick_angle = 180;//180度
                }
                _stick_angle = Math.ceil(_stick_angle);
                // me.joy_pad_joystick.position = _center_point;
                // me.settings.onJoyStickMove(_stick_angle,_center_point);
                return { _stick_angle, dis, _center_point };
            }
            var _tan_val = Math.abs(_side_length_y / _side_length_x);
            var _radian = Math.atan(_tan_val);
            var _angle = _radian * 180 / Math.PI;
            _stick_angle = _angle;

            //--好了，计算现在摇杆的中心点主坐标了。
            var _center_x = 0;
            var _center_y = 0;
            if (_side_length_x * _side_length_x + _side_length_y * _side_length_y >= me.joy_pad_radius * me.joy_pad_radius) {
                _center_x = me.joy_pad_radius * Math.cos(_radian);
                _center_y = me.joy_pad_radius * Math.sin(_radian);
            }
            else {
                _center_x = Math.abs(_side_length_x) > me.joy_pad_radius ? me.joy_pad_radius : Math.abs(_side_length_x);
                _center_y = Math.abs(_side_length_y) > me.joy_pad_radius ? me.joy_pad_radius : Math.abs(_side_length_y);
            }

            if (_side_length_y < 0) {
                _center_y = -Math.abs(_center_y);
            }
            if (_side_length_x < 0) {
                _center_x = -Math.abs(_center_x);
            }
            if (_side_length_x > 0 && _side_length_y < 0) {
                //--锐角。
            }
            else if (_side_length_x < 0 && _side_length_y < 0) {
                //--好了，钝角。
                _stick_angle = 180 - _stick_angle;
            }
            else if (_side_length_x < 0 && _side_length_y > 0) {
                _stick_angle = _stick_angle + 180;
            }
            else if (_side_length_x > 0 && _side_length_y > 0) {
                _stick_angle = 360 - _stick_angle;
            }
            _center_point = {
                x: _center_x
                , y: _center_y
            };
            _stick_angle = Math.ceil(_stick_angle);
            return { _stick_angle, dis, _center_point };
        }

        // events for drag start
        this.joy_pad_container.on('mousedown', onDragStart)
            .on('touchstart', onDragStart)
            // events for drag end
            .on('mouseup', onDragEnd)
            .on('mouseupoutside', onDragEnd)
            .on('touchend', onDragEnd)
            .on('touchendoutside', onDragEnd)
            // events for drag move
            .on('mousemove', onDragMove)
            .on('touchmove', onDragMove);


    }
    GameJoyPad.prototype.__createButton = function (buttonItemInfo) {
        var me = this;
        var textureButton = PIXI.Texture.fromImage(buttonItemInfo.normal_texture);
        var textureButtonDown = PIXI.Texture.fromImage(buttonItemInfo.pressed_texture);
        var textureButtonOver = PIXI.Texture.fromImage(buttonItemInfo.normal_texture);
        var button = new PIXI.Sprite(textureButton);
        button.buttonMode = true;
        button.anchor.set(0.5);
        button.position.x = buttonItemInfo.x;
        button.position.y = buttonItemInfo.y;
        button.button_name = buttonItemInfo.button_name;

        button.interactive = true;
        if (buttonItemInfo.scale) {
            button.scale = buttonItemInfo.scale;
        }

        var _event_data_identifier = 0;
        function onButtonDown(event) {
            this.isdown = true;
            this.texture = textureButtonDown;
            this.alpha = 1;
            _event_data_identifier = event.data.identifier;

        }

        function onButtonUp(event) {
            if (_event_data_identifier != event.data.identifier) {
                return;
            }
            this.isdown = false;
            if (this.isOver) {
                this.texture = textureButtonOver;
            }
            else {
                this.texture = textureButton;
            }
            console.log('onButtonUp', button.button_name, button);
            if (button.button_name == 'downBtn') sendText({ doEnter: true });
            else if (button.button_name == 'leftBtn') sendText({ text: `\n## ` + $('.voice-txt').val() });
            else if (button.button_name == 'rightBtn') sendText({ text: `\n### ` + $('.voice-txt').val() });
            else if (button.button_name == 'upBtn') {
                // 如果当前输入框里面没有内容，那就删除电脑上的字符
                if (!$('.voice-txt').val().length) sendText({ doDelete: true })
                else deleteInputStr();
            }
        }

        function onButtonOver() {
            this.isOver = true;

            if (this.isdown) {
                return;
            }

            this.texture = textureButtonOver;
        }

        function onButtonOut() {
            this.isOver = false;

            if (this.isdown) {
                return;
            }

            this.texture = textureButton;
        }


        button.on('mousedown', onButtonDown)
            .on('touchstart', onButtonDown)

            // set the mouseup and touchend callback...
            .on('mouseup', onButtonUp)
            .on('touchend', onButtonUp)
            .on('mouseupoutside', onButtonUp)
            .on('touchendoutside', onButtonUp)

            // set the mouseover callback...
            .on('mouseover', onButtonOver)

            // set the mouseout callback...
            .on('mouseout', onButtonOut);


        // you can also listen to click and tap events :
        //.on('click', noop)

        var noop = function (_event) {
            me.settings.onButtonClick(_event, buttonItemInfo.button_name);
        };
        button.tap = noop;
        button.click = noop;
        // this.parent_container.addChild(button);
        this.joy_pad_container.addChild(button);

        return button;
    }


    var game_renderer = PIXI.autoDetectRenderer(GameOptions.width, GameOptions.height, { backgroundColor: 0x1099bb, transparent: !1 });
    //var game_renderer = PIXI.autoDetectRenderer(GameOptions.width, GameOptions.height);
    var game_stage = new PIXI.Container(0x66FF99);
    $("#game").append(game_renderer.view);
    var _joy_pad = new GameJoyPad(game_stage, {
        //--摇杆摇动角度变换时候的回调函数。
        onJoyStickMove: function (now_stick_angle, dis, now_stick_postion) {
            console.log('position:', dis, now_stick_postion);
            _showMsg("摇杆角度为：" + now_stick_angle);
        }
        //--点击了控制按钮的回调事件。
        , onButtonClick: function (event, button_name) {
            _showMsg("点击的按钮名称是：" + button_name);
        },
        onJoyStickEnd: function (now_stick_angle, dis, now_stick_postion) {
            // if ($('.voice-txt').val().length) sendEvent('vibrate', { time: 100 })
            // sendText({ text: $('.voice-txt').val() })
            console.log('onJoyStickEnd', now_stick_angle, dis) // ,now_stick_postion
            handleVoiceUp()
        },
        onJoyStickStart: function (event) {
            // if (!window.Android) { // android app注入对象
            //     var sound = new Howl({ src: ['res/done.mp3'] });
            //     sound.play();
            // }
            // sendEvent('vibrate', { time: 100 })
            // $('.voice-txt').val('');
            console.log('onJoyStickStart', event) // ,now_stick_postion
            handleVoiceDown();
        },
    });
    var style = {
        font: 'bold italic 20px Arial',
        fill: '#F7EDCA',
        stroke: '#4a1850',
        //strokeThickness : 5,
        //dropShadow : true,
        //dropShadowColor : '#000000',
        //dropShadowAngle : Math.PI / 6,
        //dropShadowDistance : 6,
        wordWrap: true,
        wordWrapWidth: 300
    };

    var richText = new PIXI.Text('Rich text with a lot of options and across multiple lines', style);
    richText.x = 0;
    richText.y = 0;

    // game_stage.addChild(richText);
    function game_animate() {

        requestAnimationFrame(game_animate);
        game_renderer.render(game_stage);
    }
    requestAnimationFrame(game_animate);


    function _debug(msg) {
        var _str = richText.text;
        richText.text = _str + "\n" + msg;
    }
    function _showMsg(msg) {
        richText.text = msg;
    }
    let baseUrl = '192.168.1.105:8375';
    let url = `http://${baseUrl}/text/input`; //win10
    async function sendText({ text, doEnter, doDelete } = {}) {
        if ((!text || !text.length) && !doEnter && !doDelete) return;
        if (text) $('.voice-txt').val('');
        // let url = 'http://192.168.1.102:8360/test/input' ; //win7
        let res = await axios.get(url, { params: { text, doEnter, doDelete } }).then(d => d.data).catch(e => { });
        if (!res) new Howl({ src: ['res/fail.wav'] }).play();
        else sendEvent('vibrate', { time: 100 })
        console.log('sendText', text, res);
    }
    function deleteInputStr() {
        let result, temp = $('.voice-txt').val();
        temp = temp.substr(0, temp.length - 2); // 最后1个字符通常都是，或。，避免只删除1个字符。
        let lastIndex, indexLastComma, indexLastEnd;
        indexLastComma = temp.lastIndexOf('，'), indexLastEnd = temp.lastIndexOf('。');
        lastIndex = Math.max(indexLastComma, indexLastEnd);
        if (lastIndex) result = temp.substr(0, lastIndex + 1);
        else result = '';
        $('.voice-txt').val(result)
    }

    // android调用js
    function dispatchEvent(eventName, data) {
        // alert('dispatchEvent:' + eventName);
    }

    // 调用android中的逻辑.
    function sendEvent(eventName, data) {
        try {
            if (typeof data == 'object') data = JSON.stringify(data);
            if (window.Android) window.Android.invoke('sendEvent', eventName, data); //
            else new Howl({ src: ['res/done.mp3'] }).play();
        } catch (e) {
            // alert('dispatchEvent error:' + e.message);
            console.log('dispatchEvent error', e)
        }
    }

    // 语音波动动画
    var siriWave = new SiriWave({
        container: $("#siri-container")[0],
        style: "ios",
        height: 200,
        width: width,
    });
    siriWave.stop()

    function connectWebViewJavascriptBridge(callback) {
        if (window.WebViewJavascriptBridge) {
            callback(WebViewJavascriptBridge)
        } else {
            document.addEventListener('WebViewJavascriptBridgeReady', function () {
                callback(WebViewJavascriptBridge)
            }, false)
        }
    }

    connectWebViewJavascriptBridge(function (bridge) {
        bridge.init(function (message, responseCallback) { })

        // 处理语音结果
        bridge.registerHandler("handleVoiceResult", function (res, responseCallback) {
            res = typeof res == 'string' ? JSON.parse(res) : res
            if (0 == res.return_code) {
                $('.voice-txt').val(res.data)
                // if ($('.voice-txt').val().length) {
                //     sendEvent('vibrate', { time: 100 })
                // }
                // sendText({ text: $('.voice-txt').val() })
            }
        })
    })

    /**
     * 发送处理吐司消息
     * @param {*} msg 
     */
    function launchHandleToast(msg) {
        WebViewJavascriptBridge.callHandler('handleToast', msg)
    }

    /**
     * 处理语音按钮按下
     */
    function handleVoiceDown() {
        try {
            siriWave.start()
            $('#siri-container').show()
            WebViewJavascriptBridge.callHandler('handleVoiceDown', {}, function (res) {
                res = typeof res == 'string' ? JSON.parse(res) : res
                if (0 != res.return_code) {
                    siriWave.stop()
                    $('#siri-container').hide()
                    launchHandleToast('错误代码：' + res.return_code)
                    return
                }
            })
        } catch (e) {
            siriWave.stop()
            console.error(e)
            $('#siri-container').hide()
        }
    }

    /**
     * 处理语音按钮抬起
     */
    function handleVoiceUp() {
        try {
            siriWave.stop()
            $('#siri-container').hide()
            if (!window.WebViewJavascriptBridge) {
                new Howl({ src: ['res/done.mp3'] }).play();
                return
            }
            WebViewJavascriptBridge.callHandler('handleVoiceUp')
        } catch (e) {
            console.error(e)
        }
    }

})