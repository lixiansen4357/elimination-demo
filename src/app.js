/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/


//砖块的长宽
var WIDTH = 6;
var HEIGHT = 6;
//图片像素
var PIC_SIZE = 64;

var PlayScene = cc.Scene.extend({
    elementLayer: null,
    onEnter: function () {
        this._super();
        var ws = cc.winSize;

        var backgroundLayer = new cc.LayerColor(cc.color(255, 100, 100, 128));
        this.addChild(backgroundLayer);
        var titleLayer = new TitleLayer();
        this.addChild(titleLayer);

        var menu = new cc.Menu();
        menu.x = 0;
        menu.y = 0;
        this.addChild(menu);

        var label1 = new cc.LabelTTF("Refresh", "Arial", 30);
        var label2 = new cc.LabelTTF("Tips", "Arial", 30);
        var menuItem1 = new cc.MenuItemLabel(label1, this.onRefreshCallBack, this);
        var menuItem2 = new cc.MenuItemLabel(label2, this.onTipsCallBack, this);
        menuItem1.attr({
            x: ws.width - 50,
            y: 60
        });
        menuItem2.attr({
            x: ws.width - 50,
            y: 120
        });
        menu.addChild(menuItem1);
        menu.addChild(menuItem2);
        var elementLayer = new ElementLayer();
        elementLayer.attr({
            x: ws.width / 2 - WIDTH / 2 * 80,
            y: 0,
            tag: 1000
        });
        // 存起来
        this.elementLayer = elementLayer;
        this.addChild(elementLayer);

    },
    onRefreshCallBack: function () {
        var ws = cc.winSize;
        cc.log('----->Refresh');
        this.removeChildByTag(1000);
        var elementLayer = new ElementLayer();
        elementLayer.attr({
            x: ws.width / 2 - WIDTH / 2 * 80,
            y: 0,
            tag: 1000
        });
        this.elementLayer = elementLayer;
        this.addChild(elementLayer);
    },
    onTipsCallBack: function(){
        var e = this.elementLayer;
        e.getTips();
        cc.log('----->Tips');
    }
});
var TitleLayer = cc.Layer.extend({
    onEnter: function () {
        this._super();
        var ws = cc.winSize;
        var titleLabel = new cc.LabelTTF("Elimination Game Demo", "Arial", 36);
        titleLabel.x = ws.width / 2;
        titleLabel.y = ws.height - 100;
        this.addChild(titleLabel);
    }
});

var ElementLayer = cc.Layer.extend({
    onEnter: function () {
        this._super();
        var ws = cc.winSize;
        /* =====> DONE(10.15)
         * 这里是第一次初始化页面的砖块，我预设了6种不同的砖块，利用random先随机生成一个地图；
         * 主要问题是，初始地图有可能没办法进行消除，（后面的消除算法可以封装起来，在这里先进行
         * 检测，如果没有可以消除的砖块则重新生成？这样有个问题，初始化效率降低，以后可以考虑初
         * 始化算法）后面可以做一个提示的功能，从几个解中挑出一个进行显示。另外是开场动画，预计
         * 是砖块生成之初在空中，执行依次下落的动作。
         *
        ***/
        /** =====> TODO
         * 首次生成地图需要检测该图的点是否有可以消除的部分，调用后面的checkXY方法对每个点遍历，
         * 
         * 
         */
        do{
            this.drawMap();
        }while(!this.checkMap());

        //单次点击事件监听
        var listener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,

            onTouchBegan: function (touch, event) {
                /* =====> DONE(10.14)
                 * 首先获取当前点击的sprite，然后遍历sprites数组查找是否有另外一个被选中的sprite（检查isSelected属性）
                 * 两种情况：1. 不存在另一个被选中的目标，说明当前是第一个被点击的sprite，应该将其变成持续震动的状态（test31有相关动作）
                 * 2.存在另一个目标，此时判断二者是否相邻，是则进行交换
                 * （二者同时移动到对方的位置，此时存在另一个sprite的位置确定问题=》可以提前设置一个位置和坐标的对应表？）
                 * 
                ***/
                var target = event.getCurrentTarget();
                var locationInNode = target.convertToNodeSpace(touch.getLocation());
                //获取当前sprite
                var tag = this.whichSprite(locationInNode);
                if (tag == -1) {
                    return false;
                }
                var sprite = this.getChildByTag(tag);

                if (this._lastTag) {
                    var sprite_last = this.getChildByTag(this._lastTag);
                    sprite_last.stopActionByTag(1000);
                    sprite_last.rotation = 0;
                    if (this._lastTag != tag && ((Math.abs(this._lastTag - tag) == 1 || Math.abs(this._lastTag - tag) == 6))) {
                        // 能否只使用一个交换函数，发现不能交换就修改回去？或者说能否在action执行过程中修改这个action的目的地 
                        this.clear(sprite, sprite_last);
                    }
                    this._lastTag = undefined;
                } else {
                    this._lastTag = sprite.tag;
                    var seq = cc.sequence(cc.rotateBy(0.3, 20), cc.rotateBy(0.3, -20)).repeatForever();
                    seq.tag = 1000;
                    sprite.runAction(seq);
                }
                return true;
            }.bind(this),

            onTouchMoved: function (touch, event) {
                // cc.log("Touch Moved!");
            }.bind(this),

            onTouchEnded: function (touch, event) {
                // cc.log("Touch End!");
            }.bind(this)
        });

        cc.eventManager.addListener(listener, this);
    },
    // k指向下的偏移量
    createSprite: function (i, j , k) {
        k = k || 0;
        let act = cc.moveTo(0.2 * (j + 1), cc.p(j * 80 + PIC_SIZE / 2, (i - k) * 80 + PIC_SIZE / 2));
        let num = Math.floor(Math.random() * 10);
        let png = 'res/images/img_' + num + '.png';
        const sprite = new cc.Sprite(png);
        sprite.attr({
            x: j * 80 + PIC_SIZE / 2,
            y: (i - k) * 80 + PIC_SIZE,
            posX: j + 1,
            posY: (i - k) + 1,
            isSelected: 0,
            opacity: 160,
            tag: ((i - k) * 6) + (j + 1),
            num: num
        })
        this.addChild(sprite);
        sprite.runAction(act);
    },
    // s--count-->s
    moveSprite: function(s,count){
        let act = cc.moveTo(0.2 * s.posX , cc.p(s.x, s.y - count * 80));
        s.runAction(act);
        s.attr({
           posY: s.posY - count,
           isSelected: 0,
           opacity: 160,
           tag: s.tag - WIDTH*count
        })
    },
    /** 
     * 画地图模块，生成地图、清除地图、生成提示
     */
    drawMap: function () {
        // 非首次加载
        if (this.getChildByTag(1)) {
            // 先让之前的每个sprite离场，再生成一张新的地图
            for (let i = 1; i <= HEIGHT * WIDTH; ++i) {
                let s = this.getChildByTag(i);
                let act = cc.moveTo(0.3, cc.p(s.x, s.y - 80 * HEIGHT));
                s.runAction(act);
                this.removeChildByTag(i);
            }
        }
        for (let i = 0; i < HEIGHT; ++i) {
            for (let j = 0; j < WIDTH; ++j) {
                this.createSprite(i, j, 0);
            }
        }
    },
    removeMap: function(){
        for (let i = 1; i <= HEIGHT * WIDTH; ++i) {
            this.removeChildByTag(i);
        }
    },
    getTips: function(){
        var s;
        // 放大后缩回来
        var seq = cc.sequence(cc.scaleBy(0.2,1.5),cc.scaleBy(0.2,1/1.5));
        for(let i = 0;i < WIDTH*HEIGHT; ++i){
            s = this.getChildByTag(i+1);
            if(this.checkX(s)+this.checkY(s)>0){
                break;
            }
        }
        for(let i = 0;i < WIDTH*HEIGHT; ++i){
            s = this.getChildByTag(i+1);
            if(s.isSelected){
                // 透明度改变，闪一下
                s.runAction(seq.clone());
                // 清空一下状态
                s.isSelected = false;
            }
        }
    },
    /**
     *  ====> DONE(10.16)
     *  这里是将两个sprite在图中交换的函数，分成两种动画，
     * 一种直接交换，另一种需要交换回去。这里有个大坑，就
     * 是不能把两个sprite的所有信息全部换掉，那样等于没有换，
     * 因为我要判断的是类型，因此sprite的num属性要保留
     * @param {标志是否需要交换回去} flag 
     */
    exChange: function (s1, s2, flag) {
        var act1 = cc.moveTo(0.3, cc.p(s2.x, s2.y));
        var act2 = cc.moveTo(0.3, cc.p(s1.x, s1.y));
        if (flag) {
            s1.runAction(act1);
            s2.runAction(act2);
        } else {
            s1.runAction(cc.sequence(cc.delayTime(0.3), act2));
            s2.runAction(cc.sequence(cc.delayTime(0.3), act1));
        }
        var temp = {
            posX: s1.posX,
            posY: s1.posY,
            isSelected: s1.isSelected,
            tag: s1.tag
        };
        s1.attr({
            posX: s2.posX,
            posY: s2.posY,
            isSelected: s2.isSelected,
            tag: s2.tag
        });
        s2.attr({
            posX: temp.posX,
            posY: temp.posY,
            isSelected: temp.isSelected,
            tag: temp.tag
        });
    },
    whichSprite: function(point) {
        var tag = -1;
        var x = Math.floor(point.x / 80);
        var y = Math.floor(point.y / 80);
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
            tag = (x + 1) + y * 6;
        }
        return tag;
    },
    /** =====> DONE(10.19)
     * 两砖块可以交换之后就开始执行消除，这里分成多个步骤：
     * 1.横向和纵向分别判断两个点的周边，如果有就把这个点标志出来
     * 2.判断完成后如果可以消除就遍历整个图，把标志位置去掉增加新的砖块
     */
    clear: function (s1, s2) {
        this.exChange(s1, s2, true);

        // 坑点：js或运算左边true则不执行右边的表达式
        if (this.checkX(s1) + this.checkX(s2) + this.checkY(s1) + this.checkY(s2) > 0) {
            // for (let i = 0; i < WIDTH * HEIGHT; ++i) {
            //     let s = this.getChildByTag(i + 1);
            //     cc.log(s.isSelected);
            //     if (s.isSelected > 0) {
            //         s.opacity = 255;
            //     }
            // }
            /**
             * DONE(10.19) 开始执行消除动作
             * 预期是扫描每一列：从下往上，如果当前位置的砖块有砖块，则判断是否标记为true，
             * 是则取出其上面一个（直接把上面那个移动过来，tag也同时改变），否则生成一个砖
             * 块替换当前位置；如果当前位置没有砖块则在当前位置放一个砖块
             * 
             * 坑：这里判断比较复杂，但是运行速度很快
             */
            for (let i = 0; i < WIDTH; ++i) {
                let flag = false,count=0,j;
                for (j = 0; j < HEIGHT; ++j) {
                    let s  = this.getChildByTag(j * WIDTH + i + 1);
                    if(s.isSelected){
                        if(!flag){
                            flag = true;
                        }
                        s.opacity = 0;
                        count++;
                    }else{
                        if(flag){
                            break;
                        }
                    }
                }
                for(let k = j;k<HEIGHT+count;++k){
                    if(this.getChildByTag((k-count)*WIDTH+i+1))
                        this.removeChildByTag((k-count)*WIDTH+i+1);
                    if(k < HEIGHT){
                        let s = this.getChildByTag(k * WIDTH + i + 1);
                        // cc.log('----->s.tag=',s.tag);
                        this.moveSprite(s,count);
                    }else{
                        this.createSprite(k,i,count);
                    }
                }
            }

            cc.log("----->clear success!");
        } else {
            cc.log("----->clear failed!");
            this.exChange(s1, s2, false);
        }

    },
    /**
     * =====> 检测地图是否存在解
     * 遍历每一个点位，使用checkXY
     */
    checkMap: function(){
        var flag = false;
        for(let i = 0;i < HEIGHT*WIDTH;++i){
            let s = this.getChildByTag(i+1);
            if(this.checkX(s)+this.checkY(s)>0){
                cc.log('----->map is ok');
                flag = true;
                break;
            }
        }
        // 消除状态
        for(let i = 0;i < HEIGHT*WIDTH;++i){
            this.getChildByTag(i+1).isSelected = false;
        }
        return flag;
    },

    /**
     * ====>DONE(10.16)
     * 我采用的方法是分别检测两个被点击位置的x和y方向，
     * 用两个for循环向改该点的左右/上下遍历，如果可以
     * 加入就把标志位置true，count++，count超过三个
     * 返回true，否则将标志位重置。
     *  
     * 坑点: (10.15)因为每次检查横纵坐标是独立的，因此有可能在
     * check(a)时c点可消除，但是check(b)时c不可消除
     * ，这个时候会把c的状态清空，所以仅有两个状态是不够
     * 的，可以每次判定c点能被消除的时候就自增，超过1说
     * 明c已经被标记为可消除了
     * (10.16)上述方法是有问题的，应该修正为判断初始就检测是否已经被标记
     */
    checkX: function (s) {
        // count超过3表示可以消除，返回true
        var count = 0;

        for (let i = s.posY * WIDTH - WIDTH + 1; i <= s.posY * WIDTH; ++i) {
            this.getChildByTag(i).isSelected > 0 ? this.getChildByTag(i).isSelected = 2 : true;
        }
        for (let i = s.tag; i > s.posY * WIDTH - WIDTH; --i) {
            let _s = this.getChildByTag(i);
            if (_s.num == s.num) {
                _s.isSelected > 0 ? _s.isSelected = 2 : _s.isSelected = 1;
                count++;
            } else {
                break;
            }
        }
        for (let i = s.tag + 1; i <= s.posY * WIDTH; ++i) {
            let _s = this.getChildByTag(i);
            if (_s.num == s.num) {
                _s.isSelected > 0 ? _s.isSelected = 2 : _s.isSelected = 1;
                count++;
            } else {
                break;
            }
        }
        // cc.log("----->count=", count);
        if (count >= 3) {
            for (let i = s.posY * WIDTH - WIDTH + 1; i <= s.posY * WIDTH; ++i) {
                this.getChildByTag(i).isSelected = this.getChildByTag(i).isSelected > 1 ? 1 : this.getChildByTag(i).isSelected;
            }
            return 1;
        } else {
            // 再把被选中的状态修改回来
            for (let i = s.posY * WIDTH - WIDTH + 1; i <= s.posY * WIDTH; ++i) {
                this.getChildByTag(i).isSelected = this.getChildByTag(i).isSelected > 1 ? 1 : 0;

            }
            return 0;
        }
    },
    checkY: function (s) {
        var count = 0;
        for (let i = s.posX; i <= (HEIGHT - 1) * WIDTH + s.posX; i += WIDTH) {
            this.getChildByTag(i).isSelected > 0 ? this.getChildByTag(i).isSelected = 2 : true;
        }
        for (let i = s.tag; i >= s.posX; i -= WIDTH) {
            let _s = this.getChildByTag(i);
            if (_s.num == s.num) {
                _s.isSelected = _s.isSelected > 0 ? 2 : 1;
                count++;
            } else {
                break;
            }
        }
        for (let i = s.tag + WIDTH; i <= (HEIGHT - 1) * WIDTH + s.posX; i += WIDTH) {
            let _s = this.getChildByTag(i);
            if (_s.num == s.num) {
                _s.isSelected = _s.isSelected > 0 ? 2 : 1;
                count++;
            } else {
                break;
            }
        }
        if (count >= 3) {
            for (let i = s.posX; i <= (HEIGHT - 1) * WIDTH + s.posX; i += WIDTH) {
                this.getChildByTag(i).isSelected = this.getChildByTag(i).isSelected > 1 ? 1 : this.getChildByTag(i).isSelected;
            }
            return 1;
        } else {
            for (let i = s.posX; i <= (HEIGHT - 1) * WIDTH + s.posX; i += WIDTH) {
                this.getChildByTag(i).isSelected = this.getChildByTag(i).isSelected > 1 ? 1 : 0;

            }
            return 0;
        }
    }
});


