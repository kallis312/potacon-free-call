var name;
var connectedUser;
var sendMailUser;
var offerData;
var offerName;
var callingNumber = "not given";
var callForName = "";

var callThisUserNumber;
var jacosUserIdForSend = "not given";

var userCallReq = "notGiven";

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');
//var localAudio = document.querySelector('#localAudio');
var remoteAudio = document.querySelector('#remoteAudio');
var remoteAudio2 = document.querySelector('#remoteAudio2');
var userInACall = 5;

var yourConn;
var yourConnRemote;
var stream;

var mailCallTrack = 2;
var reloadSocketTag = 10;
var reloadTag = 10;

var reloadFunction = 1;

//test data strat from here ..............................
var potaconFreeCallUsers = [];
var conn;
var userNumberToCall;
var audioOutputSelect = document.querySelector('select#audioOutput');
var selectors = [audioOutputSelect];

let userInCall = false;
var goingToCall;
var userMee;
var hangUpTrack;

var apiUrl = "https://webtel.jacos-cloud.com:3000";
// var apiUrl ="http://192.168.0.109:3000";
// var apiUrl ="http://192.168.150.174:3000";

var selected_contact_name;
var selected_contact_number;
var selected_contact_id;
var reload_status = false;

var allUsers = JSON.parse(localStorage.getItem("usersOFPotacon"));
var reconnectionText = 10;
var urlParam = function (name, w) {
    w = w || window;
    var rx = new RegExp('[\&|\?]' + name + '=([^\&\#]+)'),
        val = w.location.search.match(rx);
    return !val ? '' : val[1];
};
if (allUsers === null) {
    getAllUsersFunction();
} else {
    getAllUser(allUsers);
    getAllUsersFunction();
}

var configuration = {
    "iceServers": [{
        'urls': 'stun:stun.l.google.com:19302'
    },
    {
        urls: "turn:webtel.dev.jacos.jp",
        username: "username1",
        credential: "password1"
    }

    ]
};

// oni
let user_is_online = false;

if ('serviceWorker' in navigator) {
    let swPath = '../sw.js';
    const currentUrl = window.location.href;
    const baseUrl = currentUrl.split('?')[0];
    console.log('baseUrl', baseUrl);
    if (baseUrl === 'https://webtel.dev.jacos.jp/rtc/index.html') {
        swPath = 'sw.js'; // Update the service worker path for 'index.html'
    } else {
        swPath = '../sw.js';
    }
    navigator.serviceWorker
        .register(swPath)
        .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
            registration.update();
            console.log('Registration Update')

        })
        .catch(function (error) {
            console.log('Service worker registration failed, error:', error);
        });
    caches.keys().then(function (cacheNames) {
        cacheNames.forEach(function (cacheName) {
            console.log(cacheName)
            caches.delete(cacheName);
            location.reload(true);
        });
    });
}

// oni
//
if (!localStorage.getItem("my_number_clear")) {
    localStorage.clear()
    localStorage.setItem("my_number_clear", JSON.stringify(1))
    location.href = 'index.html';
    if (window.location.href.indexOf("view") > -1) {
        location.href = './../index.html';
    } else {
        location.href = 'index.html';
    }
}

//

function getAllUsersFunction() {
    //var myID = urlParam('user_mobile_number');
    /*var myID = localStorage.getItem('auth_id');
    if (myID != null){
        $.get(`${apiUrl}/get_all_users/` + myID, {}, function (data) {

            var a = data;
            potaconFreeCallUsers = a;

            if (allUsers === null) {
                getAllUser(a);
            }

            localStorage.setItem("usersOFPotacon", JSON.stringify(a));

        });
    }*/
}

function addUsers(numberUser, userName) {

    var singleUser = ' <div class="col s6 m6 l6 center"><a onclick="openMOdalMakeCall(\'' + numberUser + '\')" id=' + numberUser + '  class="callBtns waves-effect waves-light btn-large">' + userName + '</a></div>'
    $("#divForAllValues").append(singleUser);
}

function getAllUser(potaconFreeCallUsersList) {
    potaconFreeCallUsersList.forEach(function (singleUserInfo) {
        addUsers(singleUserInfo["mobile_number"], singleUserInfo["name"]);
    });
}


function hasUserMedia() {
    //check if the browser supports the WebRTC
    return !!(navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia);
}

//connecting to our signaling server
reloadSocketConnection();

function reloadSocketConnection() {
    conn = new WebSocket('wss://webtel.dev.jacos.jp:9090');

    conn.onopen = function () {

        setTimeout(logInUser, 10);
        console.log("Connected to the signaling server");

        try {
            //$('#noInternet').modal('close');
        } catch (err) {

        }

        reloadFunction = 1;
        reloadSocketTag = 10;
        reloadTag = 10;

    };


    conn.onclose = function () {
        console.log("model calleddddd test");
        if (reconnectionText === 15) {
            console.log("******called****");
            var audio112 = new Audio('reconnect.wav');
            audio112.play();
            document.getElementById("reConnectTextChange").innerHTML = "インターネット接続を<br>変更しています。<br>しばらくお待ち下さい。";
        } else {
            document.getElementById("reConnectTextChange").innerHTML = "接続確認中です。<br>しばらくお待ち下さい。";

        }

        if (reloadTag != 12) {

            // $('#noInternet').modal();
            // $('#noInternet').modal('open');
            reloadFunction = 5;

            reloadTag = 12;

        }

        /*var r = confirm("通話接続が切断されました。 ");
          if (r == true) {
                location.reload(true);;

            } else {
              location.reload(true);;
            }*/
    };


    //when we got a message from a signaling server
    conn.onmessage = function (msg) {
        console.log("Got message", msg.data);

        try {
            var data = JSON.parse(msg.data);

            switch (data.type) {
                case "login":
                    //  handleLogin(data.success);
                    var needToCall = urlParam('Use_Id');
                    var makeCall = urlParam('makeCall');
                    var myID = urlParam('user_mobile_number');
                    if (needToCall != '' && makeCall != 1) {
                        makeCallRootFunction(needToCall);
                    }
                    if (makeCall == 1) {
                        makeCall22(needToCall, myID);
                    }
                    break;

                case "requestCall":
                    userInCall = true;
                    ring();

                    //var result22 = potaconFreeCallUsers.filter(function(obj) { return obj.mobile_number == data.requesterMobile; });
                    var nameOfCaller = data.requesterName;
                    goingToCall = data.requesterMobile;
                    userMee = data.name;
                    displayNotification(goingToCall + ' 呼び出し中', 'ポタコン')

                    showAlert(nameOfCaller, data.requesterMobile, data.name);
                    send({
                        auth_id: localStorage.getItem("auth_id"),
                        type: "okBoss",
                        name: data.requesterMobile

                    });

                    //callUser(data.requesterMobile ) ;


                    break;
                //when somebody wants to call us
                case "offer":


                    handleOffer(data.offer, data.name);
                    reconnectionText = 15;

                    /* ring();
                     offerData = data.offer;
                     offerName = data.name;

                     setTimeout(rcvCall, 500);*/
                    remoteAudio2.pause();
                    break;


                case "newUser":


                    //   getOnlineUsers();

                    break;

                case "userNotFound":

                    // $('#modalUserUserNotFound').modal();
                    callThisUserNumber = data.name;
                    callThisUser();
                    // var result111 = potaconFreeCallUsers.filter(function(obj) { return obj.mobile_number == data.name; });
                    //    var userName = result111[0].name;

                    // var mes = userName + "さんは現在<br>ワイファイ（wifi）圏外ですが<br>つなぎますか？";
                    // document.getElementById("modalUserUserNotFoundHead").innerHTML = mes;


                    //$('#modalUserUserNotFound').modal('open');
                    try {
                        document.getElementById("statusDiv").style.display = "none";


                    } catch (errr) {
                    }


                    //  connectedText.style.display = "none";


                    break;

                case "onlineCheck":
                    userOnlineCheck(data.answer);
                    break;
                case "answer":

                    handleAnswer(data.answer);
                    reconnectionText = 15;
                    remoteAudio2.pause();
                    break;
                //when a remote peer sends an ice candidate to us
                case "candidate":
                    handleCandidate(data.candidate);
                    break;

                case "userStatus":
                    remoteAudio2.pause();
                    var result111 = potaconFreeCallUsers.filter(function (obj) {
                        return obj.mobile_number == data.name;
                    });
                    // var userName = result111[0].name;
                    var userName;
                    if (result111.length > 0) {
                        userName = result111[0].name;
                    } else {
                        userName = data.name;
                    }
                    //   connectedText.style.display = "none";
                    try {
                        document.getElementById("statusDiv").style.display = "none";
                    } catch (errr) {
                    }

                    let audio = new Audio('beep.wav');
                    audio.play()

                    setTimeout(function () {
                        alert("申し訳ございません。" + "\n" + "後にしてください。" + "\n \n" + userName + " より");
                        location.reload(true);;
                    }, 100)
                    break;
                case "ringing":
                    console.log('ringing')
                    user_is_online = true
                    userInCall = true;
                    remoteAudio2.src = "ringing.mp3";
                    remoteAudio2.play();

                    // if (reconnectionText != 15){
                    //     setTimeout(function () {
                    //         hangUpBtn.click()
                    //     },30000)
                    // }
                    break;
                case "leave":
                    // lastCallDuration();
                    userInCall = false;
                    remoteAudio2.pause();
                    location.reload(true);
                    hangUpBtn.click()
                    break;
                case "share":
                    document.getElementById("iconP").style.display = "block";
                default:
                    break;
            }
        } catch (error) {
        }

    };

    conn.onerror = function (err) {
        console.log("Got error", err);
        reloadSocketTag = 10;
        reloadFunction = 5;
    };


}


function ring() {

    var modeCheck = localStorage.getItem("userModeCheck");
    if (!modeCheck || modeCheck === "11") {
        remoteAudio2.src = "baby.mp3";
        remoteAudio2.play();

    } else {
        vib();
    }


}

function vib() {
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {

        navigator.vibrate([500, 250, 500, 250, 500, 250, 500, 250, 500, 250, 500]);
        // vibration API supported
    } else {
    }

}

function rcvCall() {
    remoteAudio2.pause();
    //<p>失礼いたします。' + offerName + 'です。 <br>今から電話してよろしいでしょうか。 <br>よろしくお願いいたします。  </p>


    /* if (confirm("失礼いたします。" + nameOfCaller + "です。今から電話してよろしいでしょうか。よろしくお願いいたします。 ")) {
         // code here for save then leave (Yes)
        ansCall(nameOfCaller);
     } else {
         userBusy(offerName);
         //code here for no save but leave (No)
     }*/
}

function ansCall(number) {

    remoteAudio2.pause();

    setTimeout(remoteAudio.play(), 2000);
    remoteAudio2.currentTime = 0;
    handleOffer(offerData, offerName);
}


function userBusy(number) {
    userInCall = false;
    remoteAudio2.pause();
    remoteAudio2.currentTime = 0;

    send({
        auth_id: localStorage.getItem("auth_id"),
        type: "userStatus",
        name: number

    });
}

function showAlert(name, number, third) {
    swal("失礼いたします。" + name + "です。今から電話してよろしいでしょうか。よろしくお願いいたします。 ", {
        buttons: {

            catch: {
                text: "今すぐOK",
                value: "catch",
            },

            catch121: {
                text: "後にしてください。",
                value: "catch11",
            },


        },
        allowOutsideClick: false,
        closeOnClickOutside: false
    })
        .then((value) => {
            switch (value) {
                case "catch":
                    makeCall22(number, third);

                    break;
                case "catch11":

                    userBusy(number);
                    break;

            }
        });

}

/*function userOnlineCheck(a) {
    console.log("user not found  " + a);
    document.getElementById("usernotOnline").innerHTML = a + "様が無料エリアではありません";
//    openModal();

    alert("Sorry this number is not online");


}*/


//alias for sending JSON encoded messages
function send(message) {

    //attach the other peer username to our messages
    if (connectedUser) {
        message.name = connectedUser;
    }

    if (selected_contact_id) {
        message.contact_id = selected_contact_id;
    }
    message.senderNumber = jacosUserIdForSend;
    conn.send(JSON.stringify(message));
}

var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 0,
    iceRestart: true
};

function retryCall() {

}



setInterval(function () {

    if (!userInCall) {
        reloadSocketConnection();
    }
}, 30000)

setInterval(function () {
    if (typeof selected_contact_number == 'undefined' && !userInCall && !reload_status) {
        location.reload(true);
    }
}, 40000)

function handleLogin(success) {

    console.log("rtc initalized");
    yourConn = new RTCPeerConnection(configuration);
    yourConn.onicecandidate = function (event) {

        if (event.candidate) {
            console.log("event candidate");
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    };
    yourConn.oniceconnectionstatechange = function (e) {
        // onIceStateChange(pc1, e);
        console.log("state: " + yourConn.iceConnectionState);

        if (yourConn.iceConnectionState === "disconnected" || yourConn.iceConnectionState === "new") {
            console.log("########: close called");
            if (hangUpTrack != 22) {
                // if (goingToCall != null) {
                //     var url = "https://webtel.dev.jacos.jp/rtc/index.html?Use_Id=" + goingToCall + "&user_mobile_number=" + userMee;
                //     window.open(url, "_self");
                //     goingToCall = null;

                // } else {
                //     location.reload(true);;
                // }
                // hangUpTrack = null;
                location.reload(true);;

            } else {

            }


            //logInUser();
        }

    };


    yourConn.ontrack = function (e) {

        userInACall = 9;


        try {
            console.log(" yourConn.ontrack track selected");
            remoteAudio.srcObject = e.streams[0];
        } catch (err) {
            alert(err);
        }
        var whomIcall = potaconFreeCallUsers.filter(function (obj) {
            return obj.mobile_number == connectedUser;
        });
        //  var namewhomIcall = whomIcall[0].name;

        var namewhomIcall;
        if (whomIcall.length > 0) {
            namewhomIcall = whomIcall[0].name;
        } else {
            namewhomIcall = connectedUser;
        }

        // showStatusText(namewhomIcall + "<br>さんと<br>通話中です。");
        showStatusText(namewhomIcall + "<br><span style='font-size: 25px'>接続中です。お待ち下さい。</span>");
        setInterval(setTime, 1000);
        //  connectedText.innerHTML = "接続できました。お話ください。"
        // connectedText.style.display = "block";
        console.log("checking timee");


    };


}

let totalSeconds = 0;

function setTime() {
    ++totalSeconds;
    let secondsLabel = pad(totalSeconds % 60);
    let minutesLabel = pad(parseInt(totalSeconds / 60));
    let houreLabel = pad(parseInt(minutesLabel / 60));
    var callDuration = document.getElementById("callDuration");
    callDuration.innerHTML = houreLabel + ' : ' + minutesLabel + ' : ' + secondsLabel
}

function lastCallDuration() {
    let secondsLabel = pad(totalSeconds % 60);
    let minutesLabel = pad(parseInt(totalSeconds / 60));
    let houreLabel = pad(parseInt(minutesLabel / 60));
    var callDuration = document.getElementById("callDuration");
    alert(houreLabel + ' : ' + minutesLabel + ' : ' + secondsLabel)
}

function pad(val) {
    var valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}


function callUser(numberToCall) {
    //   closeModelMakeCall();
    var callToUsername = numberToCall;

    if (callToUsername.length > 0) {
        connectedUser = localStorage.getItem("jacosUserId");

        // create an offer
        yourConn.createOffer().then(function (offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function (error) {
            alert("Error when creating an offer");
        });
    }
}


function displayNotification(body = 'WEE', title = 'ER') {
    Notification.requestPermission().then(function (permission) {
        // If the user accepts, let's create a notification
        let icon = '';
        if (window.location.href.indexOf("view") > -1) {
            icon = 'rsc/pwa-icon/512.png';
        } else {
            icon = 'view/rsc/pwa-icon/512.png';
        }
        if (Notification.permission == 'granted') {
            navigator.serviceWorker.getRegistration().then(function (reg) {
                var options = {
                    body: body,
                    icon: icon,
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: 1
                    },
                    actions: [
                        { action: 'explore', title: 'Explore' },
                        { action: 'close', title: '戻る' },
                    ]
                };
                reg.showNotification(title, options);
            });
        }
    });

}

async function getContacts() {
    if ("contacts" in navigator &&
        "select" in navigator.contacts &&
        "getProperties" in navigator.contacts) {
        try {
            const availableProperties = await navigator.contacts.getProperties();

            if (availableProperties.includes("address")) {
                const contactProperties = ['name', 'tel'];

                const contacts = await navigator
                    .contacts
                    .select(
                        contactProperties,
                        { multiple: true }
                    );

                alert("Your first contact: " + contacts[0].name + " " + contacts[0].tel + " ");
            } else {
                console.log("Contact Picker API on your device doesn't support address property");
            }
        } catch (e) {
            alert(e.message)
            console.log("Unexpected error happened in Contact Picker API");
        }
    } else {
        console.log("Your browser doesn't support Contact Picker API");
    }
}

function requestCall() {
    user_is_online = false;
    userInCall = true;
    //neeed to show the view for connecting...
    //need to set text....
    // connectedText.innerHTML = "接続中です、お待ち下さい。"

    // connectedText.style.display = "block";

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(function (a) {
                closeModelMakeCall();

                if (userInACall != 9) {
                    handleLogin(true);
                    showStatusText("接続中です。<br>お待ち下さい。");
                    var myMobileNumber = localStorage.getItem("jacosUserId");
                    var result22 = potaconFreeCallUsers.filter(function (obj) {
                        return obj.mobile_number == myMobileNumber;
                    });
                    var nameOfRequester;
                    if (result22.length > 0) {
                        nameOfRequester = result22[0].name;
                    } else {
                        nameOfRequester = myMobileNumber;
                    }


                    var callToUsername = callingNumber;
                    callToUsername = callToUsername.replace(/[^\w\s]/gi, '')

                    send({
                        auth_id: localStorage.getItem("auth_id"),
                        type: "requestCall",
                        name: callToUsername,
                        requesterMobile: myMobileNumber,
                        requesterName: nameOfRequester,
                        call_for_name: callForName,
                    });
                    userInACall = 9;

                    setTimeout(function () {
                        if (!user_is_online) {
                            swal("通話相手はインターネットに接続されていません", {
                                buttons: {
                                    catch: {
                                        text: "通常通話",
                                        value: "catch",
                                    },
                                    catch121: {
                                        text: "いいえ。",
                                        value: "catch11",
                                    },

                                },
                                allowOutsideClick: false,
                                closeOnClickOutside: false
                            })
                                .then((value) => {
                                    switch (value) {
                                        case "catch":
                                            // $('#create-call').href = ;
                                            hangUpBtn.click()
                                            window.location.href = 'tel:' + callingNumber
                                            console.log('call to mobile!!' + callingNumber)
                                            break;
                                        case "catch11":
                                            swal.close();
                                            location.reload(true);
                                            break;

                                    }
                                });
                        }
                    }, 5000)
                }
                else {
                    console.log("you are in a call****");
                }

            })
            .catch(function (err) {
                closeModelMakeCall();

                // alert("許可のため、通話を中止しました。");
                alert(err.message);
                location.reload(true);;
            });

    } else {
        closeModelMakeCall();
        if (getMobileOperatingSystem() == "iOS") {
            alert("サファリブラウザをご利用ください。");
        } else {
            alert("メディアストリーミング許可エラー。");
        }


        location.reload(true);;
    }


}

function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

//when somebody sends us an offer
function handleOffer(offer, name) {

    connectedUser = name;
    yourConn.setRemoteDescription(offer).then(function () {
        return navigator.mediaDevices.getUserMedia(mediaConstraints);
    })
        .then(function (stream) {
            //  remoteAudio.srcObject = stream;

            stream.getTracks().forEach(track => yourConn.addTrack(track, stream));
        }).then(function () {
            //create an answer to an offer
            yourConn.createAnswer().then(function (answer) {
                yourConn.setLocalDescription(answer).then(function () {
                    send({
                        type: "answer",
                        answer: answer
                    });

                });
                // console.log("ice ans 2 :"+yourConn.signalingState);


            }, function (error) {
                alert("Error when creating an answer:  " + error);
            });

        });


}

var mediaConstraints = {
    audio: true, // We want an audio track
    video: false // ...and we want a video track
};

//when we got an answer from a remote user
function handleAnswer(answer) {

    yourConn.setRemoteDescription(answer).then();
}

//when we got an ice candidate from a remote user
function handleCandidate(candidate) {

    // oni
    user_is_online = true;
    console.log(user_is_online)
    // oni

    console.log("ice second Called");
    yourConn.addIceCandidate(candidate).catch(e => {
        console.log("Failure during addIceCandidate(): " + e.name);
    });
}

//hang up
hangUpBtn.addEventListener("click", function () {
    userInCall = false;
    send({
        call_duration: totalSeconds,
        auth_id: localStorage.getItem("auth_id"),
        name: callingNumber,
        type: "leave"
    });

    var promise1 = new Promise(function (resolve, reject) {
        handleLeave(0);
        resolve();
    });


    promise1.then(goToLast);
});

function handleLeave(a) {
    hangUpTrack = 22;
    reconnectionText = 10;
    userInACall = 5;

    try {

        connectedUser = null;
        remoteAudio.src = null;
        yourConn.close();
        yourConn.onicecandidate = null;
        yourConn.onaddstream = null;
        // handleLogin(true);
        //  connectedText.innerHTML = "通話が完全に終了しました。";
        var audio = new Audio('beep.wav');
        audio.play()

        if (a === 1) {
            showStatusText("ネットワーク問題が発生されたので切断された。");
            setTimeout(function () {
                document.getElementById("statusDiv").style.display = "none";
            }, 10000);

        } else {
            showStatusText("通話が終了しました。");
            setTimeout(function () {
                document.getElementById("statusDiv").style.display = "none";
            }, 4000);

        }
        setTimeout(function () {
            location.reload(true);;
        }, 5000);


    } catch (error) {

    }

    try {
        remoteAudio2.pause();
        remoteAudio2.currentTime = 0;

        swal.close();
    } catch (error) {

    }


}

function handleLeaveee() {

    try {

        connectedUser = null;
        remoteAudio.src = null;
        yourConn.close();
        yourConn.onicecandidate = null;
        yourConn.onaddstream = null;
        //  connectedText.innerHTML = "通話が完全に終了しました。";
        var audio = new Audio('beep.wav');
        audio.play();

    } catch (error) {

    }


};


/*function useloginCheck() {

    var jacosUserId = localStorage.getItem("jacosUserId");
    if (jacosUserId != null) {
        console.log(jacosUserId)
        //  document.getElementById("userIdText").innerHTML = "あなたのIDは : " + jacosUserId;

// alert(jacosUserId);
        send({
            type: "login",
            name: jacosUserId
        });

    }

}


setTimeout(function () {
    //your code here
    useloginCheck();


}, 500);*/


function makeCall() {

    setTimeout(makeCallRootFunction, 1500);


}


function makeCallRootFunction(useId) {

    var userStatus = urlParam('Me');

    var jacosUserId = localStorage.getItem("jacosUserId");


    if (jacosUserId != null && userStatus !== 'busy') {
        if (useId === undefined || useId === null) {

        } else {
            if (useId.length > 0) {
                connectedUser = useId;
                openMOdalMakeCall(connectedUser);
            }
        }
    }

    if (jacosUserId != null && userStatus === 'busy') {
        send({
            type: "userStatus",
            name: useId

        });


    }
    window.history.replaceState(null, null, "https://webtel.dev.jacos.jp/rtc/index.html?user_mobile_number=" + jacosUserId);


}


const offerOptionsFinal = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: false,
    voiceActivityDetection: false
};


function makeCall22(reqUser, myNumber) {
    handleLogin(true);
    yourConn.onnegotiationneeded = function () {
        var useId = reqUser;
        var userStatus = "working";

        var jacosUserId = myNumber;
        console.log("testooop  2");
        if (jacosUserId != null && userStatus !== 'busy') {
            if (useId === undefined || useId === null) {

                alert("busy 3");


            } else {

                if (useId.length > 0) {
                    remoteAudio2.pause();

                    remoteAudio.play();
                    remoteAudio2.currentTime = 0;
                    connectedUser = useId;

                    // create an offer
                    yourConn.createOffer().then(function (offer) {

                        yourConn.setLocalDescription(offer).then(function () {
                            send({
                                type: "offer",
                                offer: offer
                            });
                        });

                    }, function (error) {
                        alert("busy a");
                        alert("Error when creating an offer");
                    });

                } else {
                    alert("busy 2");
                }
            }
        } else {
            alert("busy");
        }

        // Setup ice handling


    };
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
    }).then(function (stream) {


        // setup stream listening
        // yourConn.addStream(stream);
        //   remoteAudio.srcObject = stream;
        stream.getTracks().forEach(function (track) {
            console.log("tracks ooo");
            yourConn.addTrack(track, stream);

        });


    }).catch(function (error) {
        console.log(error);
        userBusy(reqUser);

        alert("許可のため、通話を中止しました。");
        location.reload(true);;

    });


}


/*
function logOut() {
    handleLeaveee();
    localStorage.removeItem('jacosUserId');


    location.reload(true);;
}
*/


function goToLast() {
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) {
        return p.toString() === "[object SafariRemoteNotification]";
    })(!window['safari'] || safari.pushNotification);
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/ false || !!document.documentMode;
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    if (isChrome || isFirefox) {
        window.history.back();
    } else {
        javascript: window.open('', '_self').close();
    }
}


/*$(document).ready(function () {

    try {
        logInUser();
    } catch (error) {
    alert("error happne")
    }


});*/


function openModal() {
    $('#modal111').modal('open');
}

function closeModalForOnline() {
    $('#modal111').modal('close');
}

function sendMail() {
    // console.log("mail send");
    var myMobileNumber = localStorage.getItem("jacosUserId");

    send({
        type: "sendMail",
        mail: sendMailUser,
        name: userNumberToCall,
        requesterMobile: myMobileNumber
    });

    closeModalOfflineUser();
    var user = potaconFreeCallUsers.filter(function (obj) {
        return obj.mobile_number == userNumberToCall;
    });
    // var nameOfCaller = user[0].name;
    var nameOfCaller;
    if (user.length > 0) {
        nameOfCaller = user[0].name;
    } else {
        nameOfCaller = userNumberToCall;
    }

    showStatusText(nameOfCaller + "さんは「webtel」の中にいません。メールが送信されます。 しばらくお待ちください。");
    setTimeout(function () {
        document.getElementById("statusDiv").style.display = "none";
    }, 7000);


}

function settingModal(trackModal) {

    if (trackModal === 1) {
        $('#settingsModal').modal();
        $('#settingsModal').modal('open');
    } else {
        $('#settingsModal').modal('close');
    }
}


function logInUser() {
    nameeadee = urlParam('user_mobile_number');
    if (nameeadee.length > 0) {
        jacosUserIdForSend = nameeadee;

        localStorage.setItem("jacosUserId", nameeadee);

        send({
            type: "login",
            name: nameeadee
        });

        //  document.getElementById("userIdText").innerHTML = "あなたのIDは : " + name;

        //makeCall();
    }
}


//setTimeout(getOnlineUsers, 1500);


function getOnlineUsers() {
    $.get('https://webtel.dev.jacos.jp:9090/data', {}, function (data) {
        console.log("checking:   " + data);
        var a = data;
        a = a.replace(/'/g, '"');
        a = JSON.parse(a);


        document.getElementById("09088772581").style.backgroundColor = "#26a69a";
        document.getElementById("09042471470").style.backgroundColor = "#26a69a";
        document.getElementById("09044594679").style.backgroundColor = "#26a69a";
        document.getElementById("09065247478").style.backgroundColor = "#26a69a";
        document.getElementById("09065680562").style.backgroundColor = "#26a69a";
        document.getElementById("01851115865").style.backgroundColor = "#26a69a";
        document.getElementById("01822274799").style.backgroundColor = "#26a69a";
        document.getElementById("01713084549").style.backgroundColor = "#26a69a";

        try {
            for (var i = 0; i < a.length; i++) {
                try {
                    document.getElementById(a[i]).style.backgroundColor = "red";
                } catch (error) {
                    console.log("checking:  exception eee " + error);
                }

            }

        } catch (error) {
            console.log("checking:  exception " + error);

        }

    });
}

function directMakeCall(number) {


    if (userInACall != 9) {

        var user = urlParam('user_mobile_number');


        if (user === number) {
            swal("私の番号です。");
        } else {

            var val = document.getElementById(number).innerText;
            document.getElementById("modalMakeCallHead").innerHTML = val + "さんに<br>発信しますか？";
            // $('#modalMakeCall').modal();
            //
            // $('#modalMakeCall').modal('open');


            callingNumber = number;

            // requestCall()
            // $.get('https://webtel.dev.jacos.jp:9090/data', {}, function(data) {
            //     console.log("checking:   " + data);
            //     var a = data;
            //     a = a.replace(/'/g, '"');
            //     a = JSON.parse(a);

            //     var check = a.includes(number);
            //     var checkSecond = a.includes(number + "app");

            //     if (check || checkSecond) {
            //         document.getElementById("modalMakeCallHead").innerHTML = val + "さんに<br>発信しますか？";
            //         $('#modalMakeCall').modal();

            //         $('#modalMakeCall').modal('open');


            //         callingNumber = number;
            //     } else {


            //         var result = potaconFreeCallUsers.filter(function(obj) { return obj.mobile_number == number; });
            //         sendMailUser = result[0].mail;
            //         userNumberToCall = number;

            //         document.getElementById("offlineModalHead").innerHTML = val + "さんに<br>発信しますか？";
            //         openModalOfflineUser();


            //     }

            // });


        }

    } else {

    }


}

function openMOdalMakeCall(number) {


    if (userInACall != 9) {

        var user = urlParam('user_mobile_number');


        if (user === number) {
            swal("私の番号です。");
        } else {

            var val = document.getElementById(number).innerText;
            document.getElementById("modalMakeCallHead").innerHTML = val + "さんに<br>発信しますか？";
            $('#modalMakeCall').modal();

            $('#modalMakeCall').modal('open');


            callingNumber = number;
            // $.get('https://webtel.dev.jacos.jp:9090/data', {}, function(data) {
            //     console.log("checking:   " + data);
            //     var a = data;
            //     a = a.replace(/'/g, '"');
            //     a = JSON.parse(a);

            //     var check = a.includes(number);
            //     var checkSecond = a.includes(number + "app");

            //     if (check || checkSecond) {
            //         document.getElementById("modalMakeCallHead").innerHTML = val + "さんに<br>発信しますか？";
            //         $('#modalMakeCall').modal();

            //         $('#modalMakeCall').modal('open');


            //         callingNumber = number;
            //     } else {


            //         var result = potaconFreeCallUsers.filter(function(obj) { return obj.mobile_number == number; });
            //         sendMailUser = result[0].mail;
            //         userNumberToCall = number;

            //         document.getElementById("offlineModalHead").innerHTML = val + "さんに<br>発信しますか？";
            //         openModalOfflineUser();


            //     }

            // });


        }

    } else {

    }


}


function closeModelMakeCall() {
    $('#modalMakeCall').modal('close');
}


function openModalOfflineUser() {
    $('#modalOfflineUser').modal();
    $('#modalOfflineUser').modal('open');
}

function closeModalOfflineUser() {
    $('#modalOfflineUser').modal('close');
}


function openModalRcvCall() {
    $('#modalReceiveCall').modal();
    $('#modalReceiveCall').modal('open');
}

function closeModalRcvCall() {
    $('#modalReceiveCall').modal('close');
}


function closeModalForOnline() {
    $('#modal111').modal('close');
}


/*navigator.serviceWorker && navigator.serviceWorker.register('./sw.js').then(function(registration) {
  console.log('Rasel, registered with scope: ', registration.scope);
});*/

function showRingToneSettingAlert() {
    settingModal(252);

    swal("このリンク「chrome://flags/#autoplay-policy」をコピーしてChromeによる開いてください。その後画面のAutoplay policy のDefaultを触ってください。「No User gesture is required」を選択してください。その後右下の「RELAUNCH NOW」ボタンを押してください。")

}


function vibSetting() {
    settingModal(252);


    var modeCheck = localStorage.getItem("userModeCheck");
    var userMannerModeStas = "not recognize"

    if (!modeCheck || modeCheck === "11") {
        userMannerModeStas = "現在有音モードです。\n無音モードに変更しますか？";

    } else {
        userMannerModeStas = "現在無音モードです。\n有音モードに変更しますか？";
    }

    swal({
        title: "マナーモード設定....",
        text: userMannerModeStas,

        buttons: true,

    })
        .then((willDelete) => {
            if (willDelete) {


                var modeCheck = localStorage.getItem("userModeCheck");

                if (!modeCheck || modeCheck === "11") {

                    localStorage.setItem("userModeCheck", "0");
                } else {

                    localStorage.setItem("userModeCheck", "11");

                }

                // var win = window.open("chrome://flags/#autoplay-policy", '_blank');

            } else {
                //swal("Your imaginary file is safe!");
            }
        });
    // body...
}


setInterval(function () {


    if (navigator.onLine) {

    } else {
        if (reloadTag != 12) {

            // $('#noInternet').modal();
            // $('#noInternet').modal('open');
            reloadTag = 12;
            reloadFunction = 5;
        }

    }
    if (reloadFunction === 5) {
        reload();
    }


}, 5000);


function reload() {
    // $('#noInternet').modal('close');

    //  location.reload(true);;
    console.log("function reload called....");

    if (reloadSocketTag === 10) {
        reloadSocketConnection();
        reloadSocketTag = 12;
    }


}


document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        console.log("Browser tab is hidden")
        // location.reload(true);
    } else {
        var user = urlParam('user_mobile_number');


        $.get('https://webtel.dev.jacos.jp:9090/data', {}, function (data) {

            var a = data;
            a = a.replace(/'/g, '"');
            a = JSON.parse(a);

            if (a.includes(user)) {

            } else {
                reloadTag = 10;
                location.reload(true);;
            }


        });

    }
});

function closeUserNotFound() {
    $('#modalUserUserNotFound').modal('close');
}

var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

function callThisUser() {
    // window.open('tel:' + callThisUserNumber);
    if (isMobile.any()) {
        document.location.href = "tel:" + callThisUserNumber;

    } else {
        swal("ユーザーはインターネットに接続されていません");


    }

}


function addSingleUserDB(userName, userNumber) {
    $.ajax({

        type: "POST",
        url: `${apiUrl}/addUser`,
        dataType: 'text',
        contentType: "application/x-www-form-urlencoded",
        data: {

            name: userName,
            mobile_number: userNumber,


        },
        success: function (res) {
            let res_data = JSON.parse(res)
            localStorage.setItem("auth_id", res_data.auth_id);
            document.getElementById("userNameToAdd").value = "";

            document.getElementById("userNumberToAdd").value = "";
            $("#divForAllValues").empty();
            allUsers = null;
            getAllUsersFunction();
            $('#mymodal33').modal('close');


        },


        error: function (errordata) {
            alert('failure');
        }


    });
}


function showModalForAddUser() {
    $('#mymodal33').modal();
    $('#mymodal33').modal('open');
}

function closeModalForAddUser() {

    $('#mymodal33').modal('close');
}


function addUserToDbVerify() {
    var name = document.getElementById("userNameToAdd").value;
    var number = document.getElementById("userNumberToAdd").value;
    if (name === "" || number === "") {
        swal("お名前と電話番号を\n入力してください。");
    } else {
        addSingleUserDB(name, number);
    }

}

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function (select) {
        return select.value;
    });
    selectors.forEach(function (select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {


            option.text = deviceInfo.label ||
                'microphone ' + (audioInputSelect.length + 1);


            audioOutputSelect.appendChild(option);
        } else {
            // alert(deviceInfo.kind);
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach(function (select, selectorIndex) {
        if (Array.prototype.slice.call(select.childNodes).some(function (n) {
            return n.value === values[selectorIndex];
        })) {
            select.value = values[selectorIndex];
        }
    });
}

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}


function start() {
    /* if (window.stream) {
         window.stream.getTracks().forEach(function(track) {
             track.stop();
         });
     }*/


}

function gotStream() {
    window.stream = stream; // make stream available to console

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

start();
audioOutputSelect.onchange = start;

var aTrack = 1;

function selectOption() {

    if (aTrack === 1) {
        document.getElementById("audioOutput").options.selectedIndex = 2;

        start();
        aTrack = 2;

    }

}

function switchSpeakers() {
    var a = document.getElementById("spekerbtn").text;
    if (a === "スピーカーOFF") {

        document.getElementById("audioOutput").options.selectedIndex = 1;

        start();
        document.getElementById("spekerbtn").text = "スピーカーON"
    } else {

        document.getElementById("audioOutput").options.selectedIndex = 2;

        start();
        document.getElementById("spekerbtn").text = "スピーカーOFF"
    }

}

/*setInterval(function() {
    console.log("oka..check");
}, 5000);*/


function showStatusText(text) {
    var x = document.getElementById("statusDiv");
    console.log(x)
    if (x) {
        var textStatus = document.getElementById("statusText");
        if (x.style.display === "none") {
            x.style.display = "block";
        }
        textStatus.innerHTML = text;
    }

}

function userShare() {
    $('#waiting').show();
    $('#shareSubmit').prop('disabled', true);
    let name = document.getElementById('name').value;
    let phone = document.getElementById('phone').value;
    let code = document.getElementById('4digit').value;
    let auth_id = localStorage.getItem("auth_id");

    $.ajax({
        type: "POST",
        url: `${apiUrl}/shareUser`,
        dataType: 'text',
        contentType: "application/x-www-form-urlencoded",
        data: {
            auth_id: auth_id,
            name: name,
            mobile_number: phone,
            code: code
        },
        success: function (res) {
            let res_data = JSON.parse(res);
            send({
                auth_id: res_data.target_user_id,
                type: "share",
                name: phone

            });
            window.location.href = `${window.location.origin}/rtc`
        },
        error: function (errordata) {
            alert('failure');
        }

    });
}
