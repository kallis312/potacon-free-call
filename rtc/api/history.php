<?php

header('Access-Control-Allow-Origin:*');
header('Content-Type: application/json');
header('Access-Control-Allow-Method:GET');
header('Access-Control-Allow-Headers:Content-Type,Access-Control-Allow-Headers, Authorization, X-Request-With, , Accept');

$requestMethod = $_SERVER["REQUEST_METHOD"];
require './dbcon.php';

if ($requestMethod == "POST") {
    $inputData = json_decode(file_get_contents("php://input"),true);

    $id =  $inputData['id'];
    global $conn;

    $sql = "SELECT * FROM histories";
    $query_run = $conn->query($sql);

    $res = array();

    while ($row = $query_run->fetch_assoc()) {
        $res[] = $row;
    }
    $data =[
        'status'=>200,
        'msg'=>$res,
    ];
    header("HTTP/1.0 200 ok");
    return json_encode($data);



}else {
    $data =[
        'status'=>405,
        'msg'=>$requestMethod. 'mthod not allow'
    ];
    header("HTTP/1.0 405 Method Not Allow");
    echo json_encode($data);
}

function GetUserlist(){
    global $conn;

    $sql = "SELECT * FROM users";
$query_run = $conn->query($sql);

if ($query_run) {
    // Initialize an empty array to hold the fetched data
    $res = array();

    while ($row = $query_run->fetch_assoc()) {
        $res[] = $row;
    }
    $data =[
        'status'=>200,
        'msg'=>$res,
    ];
    header("HTTP/1.0 200 ok");
    return json_encode($data);
    // return $res;
    // Now $res contains the fetched data as an array of associative arrays
    // print_r($res);
} else {
    echo "Error: " . $conn->error;
}

// Close database connection
$conn->close();


    $query = "SELECT * FROM users";
    $query_run = mysqli_query($conn,$query);
    
    if($query_run){
        if(mysqli_num_rows($query_run)>0){
            
            $res = mysqli_fetch_all($query_run,MYSQLI_ASSOC);
            $data =[
                'status'=>200,
                'msg'=>$res,
            ];
            header("HTTP/1.0 200 ok");
            return json_encode($data);

        }else{
            $data =[
                'status'=>404,
                'msg'=>'user not found',
            ];
            header("HTTP/1.0 404 user not found");
            return json_encode($data);
        }

    }else{
        $data =[
            'status'=>500,
            'msg'=>'Internet server error',
        ];
        header("HTTP/1.0 500 Internet server error");
        return json_encode($data);
    }
}

?>