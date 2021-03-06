var GameOption;

let baseUrl = window.localStorage.baseUrl || '192.168.1.101:8088';
let url = `http://${baseUrl}/text/input`; //win10
let lastText , widthWindow ,heightWindow ;
let isTouchEnd ;
// 语音波动动画
var siriWave  ;
var _joy_pad , game_stage;
let touchX, touchY ;
let progressBar ;
function initUseage( type ){
    // \n当前网络：ip ，wifi : xxx ;
    let dic = { setup : '使用说明：1、电脑下载运行AI麦克风；2、手机App输入提示的电脑IP，进行配对；' 
    , use : '语音自动识别后发到电脑上，代替键盘打字。AI动态修复文字。按住麦克风滑向不同8个方向有不同快捷键。' }
    type = type  || 'setup' ;
    let str = dic[ type ] ;
    $('.voice-txt').attr("placeholder", str );
}

$(function () {
    widthWindow = $(window).width();
    heightWindow = $(window).height();
    // $('#siri-container').show()
    
    var options = {
      id: 'top-progress-bar',
      color: '#F44336',
      height: '2px',
      duration: 60
    }
    progressBar = new ToProgress(options);

    $('.voice-txt').css('border-radius','8px')
    $('.voice-txt').css('margin','8px')
    $('.voice-txt').css('padding','8px')
    $('.voice-txt').width( widthWindow - 36 ); //不知道为什么36，只是界面效果调整

    // $(".voice-txt").focus();
    siriWave = new SiriWave({
        container: $("#siri-container")[0],
        style: "ios",
        height: 200,
        width: widthWindow,
    });
    siriWave.stop()
    initUseage('setup');
    checkAlive(true) ; //检查服务器是否配置成功。

    var offsetY = 110; // 116 ;
    let initJoyX = widthWindow/2 ; // centerX ;
    let initJoyY = heightWindow - 170 - 50  ; // 
    GameOptions = {
        width: widthWindow  // 800 //游戏屏幕的高度。 
        , height: heightWindow //  600 //游戏屏幕的宽度。
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
            , joy_pad_x: initJoyX  // 180 //摇杆的坐标
            , joy_pad_y: initJoyY // 280 - offsetY //摇杆的y坐标  
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
            // var _side_length_y = newPosition.y - me.settings.joy_pad_y;
            // var _side_length_x = newPosition.x - me.settings.joy_pad_x; // 触摸和界面分离
            var _side_length_y = newPosition.y - touchY;
            var _side_length_x = newPosition.x - touchX;

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
            console.log('onButtonDown', button.button_name);
            event.stopPropagation()
        }

        function onButtonUp(event) {
            if (_event_data_identifier != event.data.identifier)  return ;
            this.isdown = false;
            if (this.isOver) this.texture = textureButtonOver;
            else this.texture = textureButton;
            console.log('onButtonUp', button.button_name);
            if (button.button_name == 'downBtn') sendText({ doEnter: true });
            else if (button.button_name == 'leftBtn') sendText({ preEnter:1 ,doEnter : 1,text: `## ` + $('.voice-txt').val() });
            else if (button.button_name == 'rightBtn') sendText({ preEnter:1 ,doEnter : 1,text: `### ` + $('.voice-txt').val() });
            else if (button.button_name == 'upBtn') {
                if ( $('.voice-txt').val().length) deleteInputStr();
                else sendText({ doDelete: 1 }) // 如果当前输入框里面没有内容，那就删除电脑上的字符
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

        // 使用修改定位后就屏蔽了这些逻辑，这里基本无用了。
        // button.on('mousedown', onButtonDown)
        //     .on('touchstart', onButtonDown)

        //     // set the mouseup and touchend callback...
        //     .on('mouseup', onButtonUp)
        //     .on('touchend', onButtonUp)
        //     .on('mouseupoutside', onButtonUp)
        //     .on('touchendoutside', onButtonUp)

        //     // set the mouseover callback...
        //     .on('mouseover', onButtonOver)

        //     // set the mouseout callback...
        //     .on('mouseout', onButtonOut);


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


    var game_renderer = PIXI.autoDetectRenderer(GameOptions.width, GameOptions.height, { backgroundColor: 0x63ADD0, transparent: !1 });
    //var game_renderer = PIXI.autoDetectRenderer(GameOptions.width, GameOptions.height);
    game_stage = new PIXI.Container(0x66FF99);
    $("#game").append(game_renderer.view);
    _joy_pad = new GameJoyPad(game_stage, {
        //--摇杆摇动角度变换时候的回调函数。
        onJoyStickMove: function (now_stick_angle, dis, now_stick_postion) {
            // console.log('position:', dis, now_stick_postion);
            _showMsg("摇杆角度为：" + now_stick_angle);
            handleVoiceMove( now_stick_angle, dis );
        }
        //--点击了控制按钮的回调事件。
        , onButtonClick: function (event, button_name) {
            _showMsg("点击的按钮名称是：" + button_name);
        },
        onJoyStickEnd: function (now_stick_angle, dis, now_stick_postion) {
            console.log('onJoyStickEnd', now_stick_angle, dis , window.end_event ) // ,now_stick_postion
            handleVoiceUp( now_stick_angle, dis )
        },
        onJoyStickStart: function (event) {
            console.log('onJoyStickStart', event) // ,now_stick_postion
            $('.voice-txt').val('')
            handleVoiceDown();
        },
    });
    var style = {
        font: 'bold italic 20px Arial',
        fill: '#000000',
        stroke: '#4a1850',
        //strokeThickness : 5,
        //dropShadow : true,
        //dropShadowColor : '#000000',
        //dropShadowAngle : Math.PI / 6,
        //dropShadowDistance : 6,
        wordWrap: true,
        wordWrapWidth: 300
    };
    var style1 = {
        font: 'bold 20px Arial',
        fill: '#000000',
        stroke: '#4a1850',
        wordWrap: true,
        wordWrapWidth: 300
    };

    var richText = new PIXI.Text('Rich text with a lot of options and across multiple lines', style);
    richText.x = 0;
    richText.y = 0;
    var copyRightText = new PIXI.Text('by 时间清单 ai.7dtime.com',style1);
    copyRightText.x = Math.ceil ( (widthWindow - copyRightText.width) /2 ) , copyRightText.y = heightWindow - 30 ;


    game_stage.interactive = true;
    game_stage.buttonMode = true;
    game_stage.hitArea = new PIXI.Rectangle(0, 80, widthWindow, heightWindow);
    game_stage.on("mousedown", changePostion).on('touchstart',changePostion) ;
    game_stage.on("mouseup", delayResetPostion).on('touchend',delayResetPostion) ;

    // 重新设置手柄位置。
    function changePostion(event) {
        isTouchEnd = false ;
        // console.log('changePostion' , event.data.global );
        // _joy_pad.joy_pad_container.position.x = event.data.global.x ;
        // _joy_pad.joy_pad_container.position.y = event.data.global.y ;
        // _joy_pad.settings.joy_pad_x = event.data.global.x ;
        // _joy_pad.settings.joy_pad_y = event.data.global.y ;
        touchX = event.data.global.x , touchY = event.data.global.y ;
        _joy_pad.joy_pad_container.emit("touchstart",event)
        if( resetId ) clearTimeout(resetId) , resetId = null ; //直接手柄位置复原
        if( warnId ) clearTimeout(warnId) , warnId = null ; //60秒的最后5秒提示。
        warnId = setTimeout( second55_warn , 55000);
        progressBar.reset();
        progressBar.increase(100);
    }
    var resetId , warnId ;
    function delayResetPostion(event){
        isTouchEnd = true ;
        // console.log('delayResetPostion' , event.data.global );
        _joy_pad.joy_pad_container.emit("touchend",event)
        if( resetId ) clearTimeout(resetId) , resetId = null ;
        if( warnId ) clearTimeout(warnId) , warnId = null ;
        resetId = setTimeout( resetPostion , 5000);
        progressBar.reset();
    }
    function second55_warn(){
        new Howl({ src: ['res/warn.mp3']   ,volume: 0.3}).play(); 
    }
    function resetPostion(){
        // console.log('resetPostion' );        
        // _joy_pad.joy_pad_container.position.x = initJoyX ;
        // _joy_pad.joy_pad_container.position.y = initJoyY ;
        // _joy_pad.settings.joy_pad_x = initJoyX ;
        // _joy_pad.settings.joy_pad_y = initJoyY ;
    }


    // game_stage.addChild(richText);
    game_stage.addChild(copyRightText);
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

})

    //检查服务器是否配置成功。
    async function checkAlive( showSuccess ) {
        let res = await axios.get(url, { timeout: 10000 }).then(d => d.data).catch(e => { });
        if( res == null) {
            new Howl({ src: ['res/404.mp3'] }).play(); //无法连接
            setConfigPC()
            $.Toast('请确定已启动电脑端程序:','手机息屏可能自动断开wifi,重连15秒后生效','error', {
                    stack: true,
                    has_icon:true,
                    has_close_btn:true,
                    fullscreen:false,
                    timeout:4000,
                    sticky:false,
                    // has_progress:true,
                    rtl:false,
                })
            return 
        }
        if( showSuccess ) new Howl({ src: ['res/done.mp3'] }).play();
        window.localStorage.baseUrl = baseUrl ;        
        initUseage('use');
        console.log('checkAlive' , !!res )
    }
    function setConfigPC(){
        let tempIP = baseUrl.split(':')[0] ; // baseUrl.substr(0,12) ;
        prompt({
            title: '填入电脑上的ip地址：',
            negative: '取消',
            positive: '确定',
            placeholder: baseUrl , // '192.168.1.105:8088',
            defaultValue: tempIP  , 
            callback: function(input) {
                if( !input ) return console.error('取消了输入') ;
                let [ ip , port ] = input.split(':') ;
                ip = ip || '192.168.1.101' , port = port || '8088' ;
                baseUrl = `${ip.trim()}:${port.trim()}` ;
                url = `http://${baseUrl}/text/input`;
                checkAlive( true );
            }
        });
    }
    async function sendText( sdata , mute) {
        let params , { text , origin , action , doEnter, preEnter ,doDelete , prefix , postfix , wrapper } = sdata || {} ;
        console.warn('sendText in:', text, sdata );
        if( doDelete && text ) {
            $('.voice-txt').val('') , text = null ;
            return ; // 输入框里面有内容，就只是清空输入框。如果输入框里面没内容，在删除电脑上的内容。
        }
        if ((!text || !text.length) && !preEnter && !doEnter && !doDelete && !prefix && !postfix ) return;
        if (text) $('.voice-txt').val('');
        action = action || 'append' , origin = origin || '' ; //默认
        lastText = text , params = { text , origin , action , preEnter, doEnter, doDelete , wrapper , prefix  , postfix } ;
        // let url = 'http://192.168.1.102:8360/test/input' ; //win7
        let res = await axios.get(url, { params  }).then(d => d.data).catch(e => { });
        if(!mute){
            if (!res) new Howl({ src: ['res/fail.mp3'] }).play();
            else sendEvent('vibrate', { time: 100 })
        }
        console.warn('sendText', text, res);
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
                let { data: text , origin , pgs , is_last } = res ;
                let  action = res.pgs == 'rpl' ? 'replace' : 'append' ;
                console.log('handleVoiceResult sendText ' , origin && origin == lastText , origin == lastText , origin , lastText  , text)
                sendVibrate(30)
                if( isTouchEnd && ( is_last || ( origin && origin == lastText ))) { // 追加：识别语音结束且和之前内容相同
                    var immediately = !!is_last ;
                    let ext = soundDic[currSoundId] || {} ;
                    delaySend( Object.assign( { text , origin , action } , ext ) , true , immediately);
                } else $('.voice-txt').val(res.data) , $('.voice-txt').scrollTop( $('.voice-txt')[0].scrollHeight  )  ;
                if( is_last ) currSoundId = null ;
            }
        })
        bridge.registerHandler("handleVoiceEnd", function (res, responseCallback) {
            new Howl({ src: ['res/end.mp3'] }).play();
        })

    })

    /**
     * 发送处理吐司消息
     * @param {*} msg 
     */
    function launchHandleToast(msg) {
        WebViewJavascriptBridge.callHandler('handleToast', msg)
    }
    function sendVibrate(time) {
        try{
            WebViewJavascriptBridge.callHandler('handleVibrate', time || 100)
        }catch(e){}
    }
    var setTimeoutId , delayArr= [] ;
    function delaySend(sdata , mute , immediately ) {
        if( immediately) {
            sendText( sdata , mute )
            clearTimeout(setTimeoutId);
            setTimeoutId = null ;
            delayArr = [];
            return
        }
        delayArr.push( [ sdata , mute ])
        console.warn('delaySend push:' ,  sdata , mute , [].concat(delayArr) );
        if( !setTimeoutId ) setTimeoutId = setTimeout(()=>{
            clearTimeout(setTimeoutId);
            setTimeoutId = null ;
            console.error('delaySend:' , [].concat(delayArr) );
            let [ s , m ] = delayArr.pop() ;
            sendText( s , m )
            delayArr = [];
        } , 600)
    }

    /**
     * 处理语音按钮按下
     */
    function handleVoiceDown() {
        try {
            currSoundId = `soundId_${ new Date().getTime() }` ;
            siriWave.start()
            $('#siri-container').show()
            checkAlive()
            if( !window.WebViewJavascriptBridge) console.error('app初始化失败')  ; // alert('app初始化失败')
            WebViewJavascriptBridge.callHandler('handleVoiceDown', {}, function (res) {
                res = typeof res == 'string' ? JSON.parse(res) : res
                if (0 != res.return_code) {
                    siriWave.stop()
                    $('#siri-container').hide()
                    launchHandleToast('错误代码：' + res.return_code)
                    return
                }
            })
            sendVibrate(150)
        } catch (e) {
            siriWave.stop()
            console.error(e.message)
            $('#siri-container').hide()
        }
    }
    function checkTouchMoveBtn(angle, dis) {
         if( dis == null || dis < 80 ) return ;
         // [0,1,2,3,4,5,6,7].map(i=> 22.5+45*i) 
         if( angle > 337.5 || angle <= 22.5 ) return dis > 220 ?  'rightBtn2' : 'rightBtn'; 
         else if( angle > 292.5 && angle <= 337.5 ) return'downRightBtn';     
         else if( angle > 247.5 && angle <= 292.5 ) return dis > 300 ?  'downBtn2' : 'downBtn';   
         else if( angle > 202.5 && angle <= 247.5 ) return 'downLeftBtn';
         else if( angle > 157.5 && angle <= 202.5 ) return dis > 220 ?  'leftBtn2' : 'leftBtn'; 
         else if( angle > 112.5 && angle <= 157.5 ) return 'upLeftBtn';
         else  if( angle > 67.5 && angle <= 112.5 ) return   'upBtn';
         else return 'upRightBtn';
         
         // if( angle > 45 && angle <= 135 ) return 'upBtn';
         // else if( angle > 135 && angle <= 225 ) return 'leftBtn';
         // else if( angle > 225 && angle <= 315 ) return 'downBtn';
         // else  return 'rightBtn';
    }
    function transParams(btn, dis ){
        let ext = {} ;
        if(!btn) ext = {} ;
        else if( btn == 'upBtn' ) ext = { doDelete : 1} ;
        else if( btn == 'leftBtn' ) ext = { preEnter:1 , prefix : '## ' ,doEnter : 1} ;
        else if( btn == 'leftBtn2' ) ext = { preEnter:1 , prefix : '# ' ,doEnter : 1} ;
        else if( btn == 'downBtn' ) ext = { doEnter : 1 } ;
        else if( btn == 'downBtn2' ) ext = { doEnter : 2 } ;
        else  if( btn == 'upLeftBtn' ) ext = { preEnter:1 , prefix : '- '} ;
        else  if( btn == 'upRightBtn' ) ext = { preEnter:1 , prefix : '- [ ] '} ;
        else  if( btn == 'downLeftBtn' ) ext = { preEnter:1 , prefix : '> '} ;
        else  if( btn == 'downRightBtn' ) ext = ext = { wrapper : '**'} ; // { preEnter:1 , prefix : '---------\n' , doEnter : 1} ;
        else  if( btn == 'rightBtn' )  ext = { preEnter:1 , prefix : '### ' ,doEnter : 1 } ; // right
        else  if( btn == 'rightBtn2' )  ext = { preEnter:1 , prefix : '#### ' ,doEnter : 1 } ; // right
        return ext ;
    }
    let currSoundId , lastBtn = null ;
    let soundDic = {} ;
    function handleVoiceMove( angle, dis ) {
        let btn = checkTouchMoveBtn( angle, dis );
        let ext =  transParams(btn, dis ) ;
        let volume , soundMp3 = 'res/done.mp3' ;   // right = 角度为0，逆时针方向旋转
            
        if( lastBtn != btn ) {
            if( btn == 'upBtn' ) soundMp3 = 'res/upBtn.mp3' ;
            if( btn == 'leftBtn' ) soundMp3 = 'res/leftBtn.mp3' ;
            if( btn == 'downBtn' ) soundMp3 = 'res/downBtn.mp3' ;
            if( btn == 'rightBtn' ) soundMp3 = 'res/rightBtn.mp3' ;
            if( btn == 'upLeftBtn' ) soundMp3 = 'res/ding.mp3' ;
            if( btn == 'downLeftBtn' ) soundMp3 = 'res/ding.mp3' ;
            if( btn == 'downRightBtn' ) soundMp3 = 'res/ding.mp3' ;
            if( btn == 'upRightBtn' ) soundMp3 = 'res/ding.mp3' ;

            if( btn == 'downBtn2') soundMp3 = 'res/enter2.mp3' , volume = 0.4 ; //2个回车的音效。
            if( btn == 'leftBtn2') soundMp3 = 'res/enter2.mp3' , volume = 0.4 ; //2个回车的音效。
            if( btn == 'rightBtn2') soundMp3 = 'res/enter2.mp3' , volume = 0.4 ; //2个回车的音效。

            btn && new Howl({ src: [soundMp3] ,volume: volume || 0.1 }).play();
            sendVibrate(50)
            // console.log('btn' , angle , btn , lastBtn , ext , lastBtn == btn );
        }
        lastBtn = btn ;
    }
    /**
     * 处理语音按钮抬起
     */
    function handleVoiceUp(angle, dis) {
        let btn = checkTouchMoveBtn( angle, dis );
        let ext =  transParams(btn ,dis ) ;
        if( btn ) soundDic[currSoundId] = ext ;
        console.log('btn' , btn , lastBtn , ext , dis );
        lastBtn = null ;
        try {
            siriWave.stop()
            $('#siri-container').hide()
            // sendText({ text: $('.voice-txt').val() })
            delaySend( Object.assign(  { text: $('.voice-txt').val() }  , ext ) ) ;
            if (!window.WebViewJavascriptBridge) {
                new Howl({ src: ['res/done.mp3'] }).play();
                return
            }
            WebViewJavascriptBridge.callHandler('handleVoiceUp')
            sendVibrate(50)
        } catch (e) {
            alert('handleVoiceUp:\n' +e.message)
            console.error(e)
        }
    }