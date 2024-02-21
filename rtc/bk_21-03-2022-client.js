const HTTPS_PORT = 9090;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const JSON = require('circular-json');
const mysql = require('mysql');
const winston = require('winston');
var cors = require('cors');
const WebSocketServer = WebSocket.Server;
var admin = require('firebase-admin');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'potaconfreecall@gmail.com',
        pass: 'jacos6571'
    }
});
var logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSSZZ'
        }),
        winston.format.printf((info) => {
            return JSON.stringify(info.timestamp + " " + info.message);
        })
    ),
    transports: [
        new winston.transports.Console({
            timestamp: true
        }),
        new winston.transports.File({
            filename: 'combined.log',
            timestamp: true
        })
    ]
});

var bodyParser = require('body-parser');


// Yes, TLS is required
const serverConfig = {
    key: fs.readFileSync('/etc/letsencrypt/live/webtel.dev.jacos.jp/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/webtel.dev.jacos.jp/fullchain.pem'),
};

var serviceAccount = require("/var/www/html/rtc/firebase.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://jacosphone.firebaseio.com"
});
var userIsBusy;


var potaconFreeCallUsers = [];


// Create a server for the client html page
const handleRequest = function (request, response) {
    // Render the single client html file for any request the HTTP server receives
    logger.info('request received: ' + request.url);

    if (request.url === '/') {
        response.writeHead(200, {
            'Content-Type': 'text/html'
        });
        response.end(fs.readFileSync('index.html'));
    } else if (request.url === 'client11.js') {
        response.writeHead(200, {
            'Content-Type': 'application/javascript'
        });
        response.end(fs.readFileSync('client11.js'));
    } else if (request.url === "/data") {

        response.writeHead(200, {
            "Access-Control-Allow-Origin": "*"
        });

        response.end(JSON.stringify(onlineUsers));
    }
};


const httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({
    server: httpsServer
});

//all connected to the server users
var users = {};
var onlineUsers = [];


//send users to client


const httpsServerNext = https.createServer(serverConfig, app);



const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Rasel#22386779',
    database: 'free_call',
    timezone: 'utc'

});


db.connect((err) => {
    if (err) {
        throw err;
    }
    logger.info('mysql connected....');
});

httpsServerNext.listen(3000, () => {
    logger.info('server started at port 3000');
});

//when a user connects to our sever
wss.on('connection', function (connection) {

    logger.info("User connected");

    //when server gets a message from a connected user
    connection.on('message', function (message) {

        var data;

        //accepting only JSON messages
        try {
            data = JSON.parse(message);
            logger.info("check Data : " + message);
        } catch (e) {
            logger.info("Invalid JSON : " + message);
            data = {};
        }

        logger.info("type: " + data.type);

        //switching type of the user message
        switch (data.type) {
            //when a user tries to login
            case "login":
                logger.info("User logged " + data.name);

                //if anyone is logged in with this username then refuse
                /*   if (users[data.name]) {
                       sendTo(connection, {
                           type: "login",
                           success: false
                       });
                   } else {*/
                //save user connection on the server
                connection.name = data.name;
                users[data.name] = connection;


                if (onlineUsers.includes(data.name)) {

                } else {
                    onlineUsers.push(data.name);
                }



                sendTo(connection, {
                    type: "login",
                    success: true
                });
                /* for (var ie = 0; ie < onlineUsers.length; ie++) {
                     sendTo(users[onlineUsers[ie]], {
                         type: "newUser"

                     });
                 }*/


                /*}*/

                break;

            case "requestCall":

                logger.info("going to call: " + data.name);

                var conn = users[data.name];
                if (conn != null) {
                    sendTo(conn, {
                        type: "requestCall",
                        name: data.name,
                        requesterMobile: data.requesterMobile,
                        requesterName: data.requesterName
                    });

                } else {

                }
                logger.info("send ringing push : " + data.name);
                //fcm start
                var options = {
                    priority: 'high',
                    timeToLive: 60 * 1
                };
                var messageFCM = {
                    data: {
                        text: "text",
                        title: "",
                        priority: "high",
                        type: "ringing",
                        callername: data.requesterName,
                        callernumber: data.requesterMobile,
                        mynumber: data.name
                    }
                };

                admin.messaging().sendToTopic(data.name, messageFCM, options)
                    .then((response) => {
                        // Response is a message ID string.
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                    });

                //fcm end

                //send app to notify...

                // var conn = users[data.name + "app"];
                // var reqNameget = getUserNameByNumber(data.requesterMobile);
                // if (conn != null) {
                //     sendTo(conn, {
                //         type: "notifyMe",
                //         name: data.name,
                //         requesterMobile: data.requesterMobile,
                //         reqName: reqNameget

                //     });

                //     var backToUSer = users[data.requesterMobile];

                //     userIsBusy = setTimeout(function() {
                //         sendTo(backToUSer, {
                //             type: "userNotFound",

                //             name: data.name,
                //             requesterMobile: data.requesterMobile
                //         });
                //     }, 4000);



                // } else {
                //     logger.info("not an app user");
                // }



                break;

            case "okBoss":
              //  clearTimeout(userIsBusy);
                logger.info("ringing ok sendTo: " + data.name);

                var connRing = users[data.name];
                if (connRing != null) {

                    sendTo(connRing, {
                        type: "ringing",
                        name: "ringing OK"
                    });
                }

                break;


            case "offer":
                //for ex. UserA wants to call UserB
                logger.info("Sending offer to: " + data.name);

                //if UserB exists then send him offer details
                var conn = users[data.name];
                var conn2 = users[data.name + "app"];

                if (conn != null || conn2 != null) {

                    logger.info('connection not null, offer send is ok');

                    if (conn != null) {
                        //setting that UserA connected with UserB
                        connection.otherName = data.name;

                        sendTo(conn, {
                            type: "offer",
                            offer: data.offer,
                            name: connection.name
                        });

                    } else {

                        //setting that UserA connected with UserB
                        connection.otherName = data.name;

                        sendTo(conn2, {
                            type: "offer",
                            offer: data.offer,
                            name: connection.name
                        });

                    }




                } else {
                    logger.info("user is not found live: " + connection.name);

                    var conn = users[connection.name];

                    if (conn != null) {
                        connection.otherName = connection.name;
                        sendTo(conn, {
                            type: "onlineCheck",
                            answer: data.name
                        });
                    }

                }

                try {

                    var conn = users[connection.name + "app"];
                    logger.info("off ringtone " + connection.name);

                    if (conn != null) {

                        sendTo(conn, {
                            type: "offRingTone",
                            answer: data.name
                        });
                    }

                } catch (error) {
                    logger.info("off ringtone error..");

                }




                break;

            case "answer":
                logger.info("Sending answer to: " + data.name);
                //for ex. UserB answers UserA
                var conn = users[data.name];

                if (conn != null) {
                    connection.otherName = data.name;
                    sendTo(conn, {
                        type: "answer",
                        answer: data.answer
                    });
                }

                break;


            case "sendMail":

                sendMailToUser(data.mail, connection.name);

                //send app to notify...
                // var conn = users[data.name + "app"];
                // var reqNameget = getUserNameByNumber(data.requesterMobile);
                // if (conn != null) {
                //     sendTo(conn, {
                //         type: "notifyMe",

                //         name: data.name,
                //         requesterMobile: data.requesterMobile,
                //         reqName: reqNameget
                //     });

                // } else {
                //     console.log("problem found");
                // }
                // var backToUSer = users[data.requesterMobile + "app"];

                // var backToUserWeb = users[data.requesterMobile];

                // if (backToUSer != null) {
                //     userIsBusy = setTimeout(function() {
                //         sendTo(backToUSer, {
                //             type: "userNotFound121",

                //             name: data.name,
                //             requesterMobile: data.requesterMobile
                //         });
                //     }, 4000);


                // } else {

                //      userIsBusy = setTimeout(function() {
                //         sendTo(backToUserWeb, {
                //             type: "userNotFound",

                //             name: data.name,
                //             requesterMobile: data.requesterMobile
                //         });
                //     }, 4000);

                // }







                break;


            case "userStatus":

                logger.info("userStatus sendTo: " + data.name);

                var conn = users[data.name];
                if (conn != null) {

                    sendTo(conn, {
                        type: "userStatus",
                        name: connection.name
                    });
                }


                try {

                    // var conn = users[connection.name + "app"];
                    // logger.info("off ringtone " + connection.name);

                    // if (conn != null) {

                    //     sendTo(conn, {
                    //         type: "offRingTone",
                    //         answer: data.name
                    //     });
                    // }


                } catch (error) {
                    logger.info("off ringtone error..");

                }




                break;


            case "candidate":
                logger.info("Sending candidate to: " + data.name);
                var conn = users[data.name];

                if (conn != null) {
                    sendTo(conn, {
                        type: "candidate",
                        candidate: data.candidate
                    });
                    logger.info("Sending candidate to: conection OK :" + data.name);
                } else {
                    var conn = users[data.name + "app"];
                    sendTo(conn, {
                        type: "candidate",
                        candidate: data.candidate
                    });

                }

                break;

            case "leave":


                try {
                    logger.info("Disconnecting from  " + data.name);
                    var conn = users[data.name];
                    conn.otherName = null;


                } catch (error) {

                }

                //notify the other user so he can disconnect his peer connection
                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    });
                }


                try {
                    if(data.name=="not given"){
                        break;
                    }

                    logger.info("send ringingCancel push : " + data.name);
                    //fcm start
                    var optionsOff = {
                        priority: 'high',
                        timeToLive: 60 * 1
                    };
                    var messageFCMOff = {
                        data: {
                            text: "text",
                            title: "",
                            priority: "high",
                            type: "cancelRing",
                            callername: "",
                            callernumber: "",
                            mynumber: data.name
                        }
                    };

                    admin.messaging().sendToTopic(data.name, messageFCMOff, optionsOff)
                        .then((response) => {
                            // Response is a message ID string.
                            console.log('Successfully sent message:', response);
                        })
                        .catch((error) => {
                            console.log('Error sending message:', error);
                        });

                    //fcm end

                } catch (error) {
                    logger.info("off ringtone error..");

                }



                break;
            case "pong":


                break;

            default:
                sendTo(connection, {
                    type: "error",
                    message: "Command not found: " + data.type
                });

                break;
        }
    });

    //when user exits, for example closes a browser window
    //this may help if we are still in "offer","answer" or "candidate" state
    connection.on("error", function (error) {
        logger.info(error);
    });

    connection.on("close", function () {
        logger.info("Close is called from " + connection.name);

        if (connection.name) {
            delete users[connection.name];
            remove(onlineUsers, connection.name);


            if (connection.otherName) {

                try {
                    logger.info("Disconnecting from " + connection.otherName);
                    var conn = users[connection.otherName];
                    conn.otherName = null;
                } catch (error) {

                }


                if (conn != null) {
                    sendTo(conn, {
                        type: "leave"
                    });
                }
            }

            /* for (var ie = 0; ie < onlineUsers.length; ie++) {
                 sendTo(users[onlineUsers[ie]], {
                     type: "newUser"

                 });
             }*/

        }
    });

    //connection.send("Hello world");



});

// setInterval(function () {
//     for (var ie = 0; ie < onlineUsers.length; ie++) {
//         sendTo(users[onlineUsers[ie]], {
//             type: "ping"

//         });
//     }
// }, 6000000);

function sendTo(connection, message) {
    try {
        connection.send(JSON.stringify(message));
    } catch (error) {

    }

}

function remove(array, element) {
    const index = array.indexOf(element);

    if (index != -1) {

        array.splice(index, 1);
    }

}



function getUserNameByNumber(number) {
    var userNamee = "nameNotFound";
    try {

        var result = potaconFreeCallUsers.filter(function (obj) {

            return obj.mobile_number == number;

        });
        userNamee = result[0].name;
        logger.info("reqName : " + userNamee);
    } catch (err) {
        logger.info("reqName : " + err);
    }
    return userNamee;
}

//send user mail

function sendMailToUser(mail, name) {
    var userNamee = "nameNotFound";
    var datetime = new Date();
    var senderNumber = "notgiven";


    try {

        var result = potaconFreeCallUsers.filter(function (obj) {

            return obj.mobile_number == name;

        });
        userNamee = result[0].name;

    } catch (err) {

    }

    try {

        var resultee = potaconFreeCallUsers.filter(function (obj) {

            return obj.mail == mail;

        });
        senderNumber = resultee[0].mobile_number;

    } catch (err) {

    }


    transporter.sendMail({
        from: 'ポタコン無料通話<jacosrasel@gmail.com>',
        to: mail,
        subject: userNamee + 'さんがあなたに電話しています ' + datetime.getHours() + ":" + (datetime.getMinutes() < 10 ? '0' : '') + datetime.getMinutes(),
        //text: 'please log in to https://dhakajacos.tk:8081/call/ your friend '+connection.name +" is waiting.."
        html: '<body><div class="col s12 m3"><div><div style=" border-radius: 10px; border: 2px solid black; background-color: #fff; padding: 10px; color: black margin: auto; width: 50%; padding: 10px;"> <p>失礼いたします。' + userNamee + 'さんです。 <br>今から電話してよろしいでしょうか。<br><b>IOSの場合は、<br>「Safariブラウザ」を使用してください。</b><br>よろしくお願いいたします。  </p>  <a href="https://webtel.dev.jacos.jp/rtc/index.html?Use_Id=' + name + '&user_mobile_number=' + senderNumber + '" target="_blank" style=" margin-right: 8px; text-decoration: none !important; border-radius: 8px; border: 2px solid blue;  background-color: #b3ffb3;  padding: 10px 10px !important;        color: #000;        line-height: 30px;  letter-spacing: 0;">いますぐＯＫ     </a>     <a  href="https://webtel.dev.jacos.jp/rtc/index.html?Use_Id=' + name + '&Me=busy' + '&user_mobile_number=' + senderNumber + '" target="_blank" style="  background-color: #fdeada; text-decoration: none !important;   border-radius: 8px;     border: 2px solid blue;         color: #000;      line-height: 30px;        padding: 10px 10px !important;    letter-spacing: 0;">後にしてください</a>     </div> <div style="height: 20px;width: 100%"></div></div> </div> </body>'
    });
    logger.info("mail sent to :" + mail);


}

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cors());


// app.get('/get_all_users/:contacts_owner', function (req, res) {
//
//
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     logger.info("get_all_users request owner: " + req.params.contacts_owner);
//
//     let sql = 'SELECT * FROM free_call.users UNION SELECT id As idusers, contact_name As name, REPLACE(contact_telnum,"-","") As mobile_number,contact_mail As mail FROM free_call.contacts where contact_owner=?';
//     db.query(sql, req.params.contacts_owner,function (error, results) {
//         if (error) throw error;
//         potaconFreeCallUsers = results;
//         res.send(results);
//
//     });
// });

app.post('/addUser', function (req, res) {


    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //  console.log("check it .."+JSON.stringify(req.body));
    let post = {
        name: req.body["name"],
        mobile_number: req.body["mobile_number"],
        mail: "jacos.hr@gmail.com"
    };
    let sql = 'INSERT INTO users SET ?';
    db.query(sql, post, function (error, results) {
        if (error) throw error;

        res.send("ok");

    });



});

app.post('/add_contacts/:contacts_owner', function (req, res) {


    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("add_contacts request owner: " + req.params.contacts_owner);
   // logger.info("add_contacts request body: " + JSON.stringify(req.body));

    try {
        let sql = 'INSERT INTO contacts(contact_group_flag,contact_id,contact_kana,contact_mail,contact_memo,contact_name,contact_owner,contact_telnum,contact_use_count) VALUES ? ON DUPLICATE KEY UPDATE contact_id=VALUES(contact_id),contact_name=VALUES(contact_name),contact_mail=VALUES(contact_mail),contact_group_flag=VALUES(contact_group_flag),contact_use_count=VALUES(contact_use_count),contact_kana=VALUES(contact_kana),contact_memo=VALUES(contact_memo)';
        db.query(sql, [json2array(req.body)], function (error, results) {
            if (error) throw error;

            res.send({
                message: "OK"
            });

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }


});
app.get('/get_last_updated_time/:contacts_owner', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("get_last_updated_time request owner: " + req.params.contacts_owner);
    try {
        let sql = 'SELECT * FROM contacts WHERE contact_owner = ? ORDER BY updated_time DESC LIMIT 1';
        db.query(sql, req.params.contacts_owner, function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                res.send({
                    updated_time: results[0]["updated_time"]
                });
            } else {
                res.send({
                    updated_time: "NG"
                });
            }

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            updated_time: "NG"
        });
    }
});
app.get('/get_all_contacts/:contacts_owner', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("get_all_contacs request owner: " + req.params.contacts_owner);

    try {
        let sql = 'SELECT * FROM contacts WHERE contact_owner = ?';
        db.query(sql, req.params.contacts_owner, function (error, results) {
            if (error) throw error;
            res.send({
                message: "OK",
                contacts: results
            });

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }


});



function json2array(json) {
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function (key) {
        result.push(json2array2nd(json[key]));
    });
    return result;
}

function json2array2nd(json) {
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function (key) {
        result.push(json[key]);
    });
    return result;
}
