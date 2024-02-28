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
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt'),
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


//all connected to the server users
var users = {};
var onlineUsers = [];


//send users to client
app.use(express.static(__dirname));

app.get('/*', function (req, res) {
    res.sendFile('index.html');
});

const httpsServerNext = https.createServer(serverConfig, app);

const wss = new WebSocketServer({
    server: httpsServerNext
});

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Jacos@Cloud',
    database: 'free_call',
    timezone: 'utc'

});


db.connect((err) => {
    if (err) {
        throw err;
    }
    logger.info('mysql connected....');
});

httpsServerNext.listen(443, () => {
    logger.info('server started at port 443');
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
                if (data.contact_id)
                    callHistoryCountIncrement(data.contact_id)
                logger.info("going to call: " + data.name);
                historyStore(2, data.auth_id, data.name, '', data.call_for_name);
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
                historyStore(1, data.auth_id, data.name, '', '');
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
                historyStore(4, data.auth_id, data.name, '', '');
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

                historyStore(5, data.auth_id, data.name, data.call_duration, '');
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
                    if (data.name == "not given") {
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
            case "share":
                //  clearTimeout(userIsBusy);
                logger.info("share ok to: " + data.name);

                connection.name = data.name;

                var connShare = users[data.name];
                if (connShare != null) {

                    sendTo(connShare, {
                        type: "share"
                    });
                }
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


const callHistoryCountIncrement = (contact_id) => {
    logger.info(`contacts id: ${contact_id} Call history count +1 updating...`);
    let sql = "UPDATE contacts SET call_count = call_count + 1 WHERE id = ?";
    db.query(sql, [contact_id], function (error, results) {
        if (error) throw error;
        logger.info("contacts Call history count +1 updated");
    });
}

function historyStore(type, auth_id, friend_number, call_duration, call_for_name = "") {
    logger.info("history adding");

    // store call history in database

    try {
        let find_sql = 'SELECT * FROM users WHERE mobile_number = ? LIMIT 1';
        db.query(find_sql, friend_number, function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                checkWithStoreHistoryData(type, auth_id, call_duration, results[0].idusers);
            } else {
                let post = {
                    name: call_for_name,
                    mobile_number: friend_number,
                    mail: "jacos.hr@gmail.com"
                };
                let sql = 'INSERT INTO users SET ?';
                db.query(sql, post, function (error, results) {
                    if (error) throw error;
                    checkWithStoreHistoryData(type, auth_id, call_duration, results.insertId);
                });

            }
        });
    } catch (error) {
        logger.info("error: " + error);
    }
}

function checkWithStoreHistoryData(type, auth_id, call_duration, idusers) {
    var datetime = new Date();
    var dateTime = datetime.getFullYear() + "-" + (datetime.getMonth() + 1) + "-" + datetime.getDate() + " " + datetime.getHours() + ":" + datetime.getMinutes() + ":" + datetime.getSeconds();
    if (type == 4) {
        // history update
        let dateTimePlus30Seconds = new Date(datetime.getTime() - 30 * 1000);
        dateTimePlus30Seconds = dateTimePlus30Seconds.getFullYear() + "-" + (dateTimePlus30Seconds.getMonth() + 1) + "-" + dateTimePlus30Seconds.getDate() + " " + dateTimePlus30Seconds.getHours() + ":" + dateTimePlus30Seconds.getMinutes() + ":" + dateTimePlus30Seconds.getSeconds();

        let update_sql = 'UPDATE histories SET type = ? WHERE user_id = ? AND start_time >= ?';
        db.query(update_sql, [type, idusers, dateTimePlus30Seconds], function (error, results) {
            if (error) throw error;
        });
    } else if (type == 5) {
        let update_sql = 'UPDATE histories SET duration = ? WHERE user_id = ? ORDER BY start_time DESC LIMIT 1';
        db.query(update_sql, [call_duration, idusers], function (error, results) {
            if (error) throw error;
            logger.info("Call duration added on call history");
        });
    }
    else {
        let insert_sql = 'INSERT INTO histories (user_id, friend_id, start_time, type) VALUES (?, ?, ?, ?)';
        db.query(insert_sql, [auth_id, idusers, dateTime, type], function (error, results) {
            if (error) throw error;
            logger.info("history stored");
        });
    }
}

app.get('/call-history/:auth_id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("call-history request owner: " + req.params.auth_id);

    try {
        // get call history from database with user id, name, mobile number, start time, duration, type
        let sql = 'SELECT users.name, users.mobile_number, histories.id, histories.start_time, histories.duration, histories.type FROM users INNER JOIN histories ON users.idusers = histories.friend_id WHERE histories.user_id = ? ORDER BY histories.start_time DESC';
        // let sql = 'SELECT users.name, users.mobile_number, MAX(histories.start_time) AS start_time, histories.duration,histories.type, COUNT(users.mobile_number) AS countnumber FROM users INNER JOIN histories ON users.idusers = histories.friend_id WHERE histories.user_id = ? GROUP BY users.name, users.mobile_number, histories.duration, histories.type ORDER BY countnumber DESC;'
        db.query(sql, req.params.auth_id, function (error, results) {
            if (error) throw error;
            res.send({
                message: "OK",
                histories: results
            });

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});

app.get('/delete-call-history/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("call-history request owner: " + req.params.id);

    try {
        //delete single call history
        let sql = 'DELETE FROM histories WHERE histories.id = ? ';
        db.query(sql, req.params.id, function (error, results) {
            if (error) throw error;
            res.send({
                message: "OK",
                histories: results
            });

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});



/**
 * update contacts by auth id
 */
app.post('/user-update/:idusers', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("update_id request owner: " + req.params.idusers);
    try {
        // update user
        let sql = "UPDATE users SET mail = ? WHERE idusers = ?";
        let values = [req.body.mail, req.params.idusers];
        db.query(sql, values, function (err, result) {
            if (err) throw err;
            res.send({
                message: "User updated successfully",
                data: result
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});
/**
 * update contacts by auth id
 */
app.post('/contact-add/:idusers', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("update_id request owner: " + req.params.idusers);
    try {
        // update user
        let insert_sql = 'INSERT INTO contacts (contact_name, contact_telnum, contact_group_flag, contact_owner) VALUES (?, ?, ?, ?)';
        db.query(insert_sql, [req.body.contact_name, req.body.contact_telnum, req.body.contact_group_flag, req.params.idusers], function (error, results) {
            if (error) throw error;
            res.send({
                message: "contact add successfully",
                data: results
            });
        })
    }
    catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});

app.post('/update-contact/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("update-contact id: " + req.params.id);
    try {
        // update user
        let sql = "UPDATE contacts SET contact_name = ?, contact_telnum = ?, contact_mail = ?, contact_memo = ? WHERE id = ?";
        let values = [req.body.name, req.body.phone, req.body.mail, req.body.memo, req.params.id];
        db.query(sql, values, function (err, result) {
            if (err) throw err;
            res.send({
                message: "Contact updated successfully",
                data: result,
                status: "success"
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});

app.post('/update_contact/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("update contact id: " + req.params.id);
    try {
        // update user
        let sql = "UPDATE contacts SET contact_group_flag = ? WHERE id = ?";
        let values = [req.body.flag, req.params.id];
        db.query(sql, values, function (err, result) {
            if (err) throw err;
            res.send({
                message: "Contact updated successfully",
                data: result
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});
app.get('/get_all_users/:contacts_owner/:type', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("get_all_users request owner: " + req.params.contacts_owner);
    logger.info("get_all_users request type: " + req.params.type);

    if (req.params.type == 3) {
        let search_text = req.query.search_text;
        console.log(search_text, 'search_text')

        //sql query with like searching
        let sql = `SELECT id, contact_name as name, contact_mail as mail, REPLACE(contact_telnum, "-", "") as mobile_number FROM contacts WHERE contact_owner=? and  contact_name LIKE '%${search_text}%' ORDER BY call_count DESC, updated_time DESC`;

        // let sql = 'select `contact_name` as `name`, `contact_mail` as `mail`, REPLACE(contact_telnum, "-", "") as mobile_number from `contacts` where `contact_owner` = ? and `contact_name` = ?';
        //let sql = 'SELECT * FROM free_call.users UNION SELECT id As idusers, contact_name As name, REPLACE(contact_telnum,"-","") As mobile_number,contact_mail As mail FROM free_call.contacts where contact_owner=?';
        db.query(sql, req.params.contacts_owner, function (error, results) {
            if (error) throw error;
            potaconFreeCallUsers = results;
            res.send(results);

        });
    } else {
        let sql = 'select id, `contact_name` as `name`, `contact_mail` as `mail`, REPLACE(contact_telnum, "-", "") as mobile_number from `contacts` where `contact_owner` = ? AND `contact_group_flag` = ? ORDER BY call_count DESC, updated_time DESC';
        //let sql = 'SELECT * FROM free_call.users UNION SELECT id As idusers, contact_name As name, REPLACE(contact_telnum,"-","") As mobile_number,contact_mail As mail FROM free_call.contacts where contact_owner=?';
        db.query(sql, [req.params.contacts_owner, req.params.type], function (error, results) {
            if (error) throw error;
            potaconFreeCallUsers = results;
            res.send(results);

        });
    }

});

app.get('/call-history-all/:contacts_owner', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // logger.info("call-history-all request owner: " + req.params.contacts_owner);

    try {
        // get call history from database with user id, name, mobile number, start time, duration, type
        let sql = 'SELECT users.name,users.idusers, users.mobile_number, MAX(histories.start_time) AS start_time, histories.duration,histories.type, COUNT(users.mobile_number) AS countnumber FROM users INNER JOIN histories ON users.idusers = histories.friend_id WHERE histories.user_id = ? GROUP BY users.name,users.idusers,users.mobile_number, histories.duration, histories.type ORDER BY countnumber DESC;'
        db.query(sql, req.params.contacts_owner, function (error, results) {
            if (error) throw error;
            res.send({
                message: "OK",
                histories: results
            });

        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});



app.post('/addUser', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    console.log("check it .." + JSON.stringify(req.body));
    let post = {
        name: req.body["name"],
        mobile_number: req.body["mobile_number"],
        mail: "jacos.hr@gmail.com"
    };
    let find_sql = 'SELECT * FROM users WHERE mobile_number = ? LIMIT 1';
    db.query(find_sql, post.mobile_number, function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
            res.send({
                message: "updated",
                auth_id: results[0].idusers,
                name: post.name,
                mobile_number: results[0].mobile_number,
                mail: results[0].mail
            });
        } else {
            let sql = 'INSERT INTO users SET ?';
            db.query(sql, post, function (error, results) {
                if (error) throw error;
                res.send({
                    message: "inserted",
                    auth_id: results.insertId,
                    name: post.name,
                    mobile_number: post.mobile_number,
                    mail: post.mail
                });
            });
        }
    });


});

const smsApiUrl = 'http://66.45.237.70'
const smsUserName = 'dhakajacos'
const smsPassword = 'T4U82J73'

app.post('/sms-share', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    let name = req.body["name"];
    let phone = req.body["phone"];
    let code = req.body["code"];

    let site_url = 'https://webtel.dev.jacos.jp';
    let message1 = `クリックしてポタコンアイコン表示してください： ${site_url}/rtc`
    let message2 = ` これがあなたの暗証番号です： ${code}`
    //let message = `${message1}%0a${message2}`
    let message = `${message1} ${message2}`

    var request = require('request');
    var options = {
        'method': 'POST',
        'url': 'https://api.smslink.jp/api/v1/delivery',
        'headers': {
            'Accept': 'application/json',
            'token': '8fa682a5-2cd3-4562-aaff-fbdd04902ac3',
            'Content-Type': 'application/json'
        },
        body: {
            "contacts": [
                {
                    "phone_number": phone
                }
            ],
            "text_message": message,
            "reserved_at": "",
            "click_count": true
        }
    };
    res.send({
        result: options,
        message: "Sms Send successfully",
        status: 'success'
    })
    /* request(options, function (error, response) {
         if (error) throw new Error(error);
         res.send({
             result : response.body,
             message: "Sms Send successfully",
             status : 'success'
         })
     });*/


    /*var request = require('request');
    var options = {
        'method': 'POST',
        'url': `${smsApiUrl}/api.php?username=${smsUserName}&password=${smsPassword}&number=88${phone}&message=${message}`,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        res.send({
            result : response,
            message: "Sms Send successfully",
            status : 'success'
        })
    });*/
});

app.post('/add_contacts/:contacts_owner', function (req, res) {

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("add_contacts request owner: " + req.params.contacts_owner);
    // logger.info("add_contacts request body: " + JSON.stringify(req.body));

    try {
        let sql = 'INSERT INTO contacts(contact_owner,contact_name,contact_telnum,contact_group_flag) VALUES ? ON DUPLICATE KEY UPDATE contact_owner=VALUES(contact_owner),contact_telnum=VALUES(contact_telnum),contact_group_flag=VALUES(contact_group_flag)';
        // let sql = 'INSERT INTO contacts(contact_group_flag,contact_id,contact_kana,contact_mail,contact_memo,contact_name,contact_owner,contact_telnum,contact_use_count) VALUES ? ON DUPLICATE KEY UPDATE contact_id=VALUES(contact_id),contact_name=VALUES(contact_name),contact_mail=VALUES(contact_mail),contact_group_flag=VALUES(contact_group_flag),contact_use_count=VALUES(contact_use_count),contact_kana=VALUES(contact_kana),contact_memo=VALUES(contact_memo)';
        db.query(sql, [json2array(req.body)], function (error, results) {
            if (error) res.status(500).json(error);

            res.send({
                message: "Contacts added successfully",
                status: 'success'
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
        //let sql = 'SELECT * FROM contacts WHERE contact_owner = ?';
        let sql = 'select `contact_name` as `name`,  `id` as `id`, `contact_mail` as `mail`, REPLACE(contact_telnum, "-", "") as mobile_number from `contacts` WHERE contact_owner = ? ORDER BY call_count DESC, updated_time DESC';
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





/**
 * get-contact contact by contact id
 */
app.get('/get-contact/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("get-contact request owner: " + req.params.id);
    try {
        let sql = 'SELECT * FROM contacts WHERE id = ?';
        db.query(sql, req.params.id, function (error, results) {
            if (error) throw error;
            res.send({
                data: results[0],
                status: "success",
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            error: error,
            message: "NG"
        });
    }
});
/**
 * delete contact by contact id
 */
app.delete('/delete_contact/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("delete_contact request owner: " + req.params.id);
    try {
        let sql = 'DELETE FROM contacts WHERE id = ?';
        db.query(sql, req.params.id, function (error, results) {
            if (error) throw error;
            res.send({
                message: "Contacts deleted successfully",
                status: "success",
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});
/**
 * delete contacts by auth id
 */
app.delete('/delete_contacts/:auth_id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    logger.info("delete_contacts request owner: " + req.params.auth_id);
    try {
        let sql = 'DELETE FROM contacts WHERE contact_owner = ?';
        db.query(sql, req.params.auth_id, function (error, results) {
            if (error) throw error;
            res.send({
                message: "Contacts deleted successfully",
            });
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            message: "NG"
        });
    }
});


app.post('/shareUser', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //  console.log("check it .."+JSON.stringify(req.body));
    let post = {
        user_id: req.body["auth_id"],
        name: req.body["name"],
        mobile_number: req.body["mobile_number"],
        code: req.body["code"],
    };
    console.log(post);

    let find_target_user = 'SELECT * FROM users WHERE mobile_number = ? LIMIT 1';
    db.query(find_target_user, post.mobile_number, function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
            let target_user_id = results[0].idusers;
            let find_sql = 'SELECT * FROM shares WHERE user_id = ? AND target_user_id = ? LIMIT 1';

            db.query(find_sql, [post.user_id, target_user_id], function (error, results) {
                if (error) throw error;
                post.target_user_id = target_user_id;
                if (results.length > 0) {
                    res.send({
                        message: "updated",
                        target_user_id: target_user_id,
                        status: "success",
                    });
                } else {
                    let sql = 'INSERT INTO shares SET ?';
                    db.query(sql, post, function (error, results) {
                        if (error) throw error;
                        res.send({
                            message: "inserted",
                            target_user_id: target_user_id,
                            status: "success",
                        });
                    });
                }
            });
        }
    });
});

app.get('/get-share/:id', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    try {
        let sql = 'SELECT * FROM shares WHERE target_user_id = ? LIMIT 1';
        db.query(sql, req.params.id, function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                res.send({
                    data: results[0],
                    status: "success",
                });
            } else {
                res.send({
                    error: "Not found",
                    status: "NG"
                });
            }
        });
    } catch (error) {
        logger.info("error: " + error);
        res.send({
            error: error,
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
