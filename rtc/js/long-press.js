/**
 * Long press event trigger
 */
let onlongtouch;
let timer;
const touchduration = 800; //length of time we want the user to touch before we do something

function touchstart(e) {
    e.preventDefault();
    if (!timer) {
        timer = setTimeout(onlongtouch, touchduration);
    }
}

function touchend() {
    //stops short touches from firing the event
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

onlongtouch = function() {
    timer = null;
    clickOut()
};

document.addEventListener("DOMContentLoaded", function(event) {
    window.addEventListener("touchstart", touchstart, false);
    window.addEventListener("touchend", touchend, false);
});


/**
 * click the tooltip button
 */
$(".tooltipped").click(function () {
    clickOut()
});

/**
 * after 1500 ms hide tooltip text
 */
function clickOut(){
    setTimeout(() => {
        $(".material-tooltip").css({
            "visibility": "hidden",
            "left"      : "249.742px",
            "top"       : "108.703px",
            "transform" : "translateY(0px) translateX(0px)",
            "opacity"   : 0
        });
    }, 1500)
}

// ====================OLD CODE for long press

// listen for long-press events
/*document.addEventListener('long-press', function(e) {
    // e.target.setAttribute('data-editing', 'true');
    let data_id = e.target.getAttribute('data-id');

    if (data_id == '1st') {
        $('.tooltiptext').css({left : '0px',top : '60px'})
        $('.tooltiptext').text('個人•個人用の電話')
    } else if (data_id == '2nd'){
        $('.tooltiptext').text('会社会社用の電話帳')
        $('.tooltiptext').css({left : '70px',top : '60px'})
    } else if (data_id == '3rd'){
        $('.tooltiptext').text('発信*電話をかける')
        $('.tooltiptext').css({left : '160px',top : '60px'})
    } else if (data_id == '4th'){
        $('.tooltiptext').text('雇歴・受発信の履歴')
        $('.tooltiptext').css({left : '225px',top : '60px'})
    } else if (data_id == '5th'){
        $('.tooltiptext').text('新規・新規登録ができます')
        $('.tooltiptext').css({left : '0px',top : '130px'})
    } else if (data_id == '6th'){
        $('.tooltiptext').text('検索・電話帳の検索')
        $('.tooltiptext').css({left : '70px',top : '130px'})
    } else if (data_id == '7th'){
        $('.tooltiptext').text('設定・各種の設定')
        $('.tooltiptext').css({left : '160px',top : '130px'})
    } else if (data_id == '8th'){
        $('.tooltiptext').text('充電・充電残量の確認')
        $('.tooltiptext').css({left : '225px',top : '130px'})
    } else if (data_id == '9th'){
        $('.tooltiptext').text('ポイスメール：留守番電話の確認')
        $('.tooltiptext').css({left : '0px',top : '340px'})
    } else if (data_id == '10th'){
        $('.tooltiptext').text('アプセンス：不在着信電話の確認')
        $('.tooltiptext').css({left : '140px',top : '340px'})
    } else if (data_id == '11th'){
        $('.tooltiptext').text('メール：メール受信の確認')
        $('.tooltiptext').css({left : '225px',top : '340px'})
    } else if (data_id == '12th'){
        $('.tooltiptext').text('メール：メール受信の確認')
        $('.tooltiptext').css({left : '225px',top : '390px'})
    } else if (data_id == '13th'){
        $('.tooltiptext').text('呼きな料や料数を付ち長けにできます。')
        $('.tooltiptext').css({left : '215px',top : '390px'})
    }else if (data_id == '14th'){
        $('.tooltiptext').text('個人。')
        $('.tooltiptext').css({left : '0px',top : '60px'})
    }else if (data_id == '15th'){
        $('.tooltiptext').text('会社。')
        $('.tooltiptext').css({left : '70px',top : '60px'})
    } else if (data_id == '16th'){
        $('.tooltiptext').text('無料。')
        $('.tooltiptext').css({left : '160px',top : '60px'})
    }

    $('.tooltiptext').css({visibility : 'visible'})
    setTimeout(function () {
        $('.tooltiptext').css({visibility : 'hidden'})
    },2000)
});*/

/*!
     * long-press.js
     * Pure JavaScript long-press event
     * https://github.com/john-doherty/long-press
     * @author John Doherty <www.johndoherty.info>
     * @license MIT
     */
//!function(t,e){"use strict";function n(){this.dispatchEvent(new CustomEvent("long-press",{bubbles:!0,cancelable:!0})),clearTimeout(o),console&&console.log&&console.log("long-press fired on "+this.outerHTML)}var o=null,u="ontouchstart"in t||navigator.MaxTouchPoints>0||navigator.msMaxTouchPoints>0,s=u?"touchstart":"mousedown",i=u?"touchcancel":"mouseout",a=u?"touchend":"mouseup",c=u?"touchmove":"mousemove";"initCustomEvent"in e.createEvent("CustomEvent")&&(t.CustomEvent=function(t,n){n=n||{bubbles:!1,cancelable:!1,detail:void 0};var o=e.createEvent("CustomEvent");return o.initCustomEvent(t,n.bubbles,n.cancelable,n.detail),o},t.CustomEvent.prototype=t.Event.prototype),e.addEventListener(s,function(t){var e=t.target,u=parseInt(e.getAttribute("data-long-press-delay")||"1500",10);o=setTimeout(n.bind(e),u)}),e.addEventListener(a,function(t){clearTimeout(o)}),e.addEventListener(i,function(t){clearTimeout(o)}),e.addEventListener(c,function(t){clearTimeout(o)})}(this,document);
