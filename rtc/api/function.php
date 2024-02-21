<?php
require './dbcon.php';

function GetUserlist(){
    global $conn;
    $query = "SELECT * FROM users";

    $query_run = mysqli_query($conn,$query);

    if($query_run){
        if(mysqli_num_rows($query_run)>0){

            $res = mysqli_fetch_all($query_run,MYSQLI_ASSOC);
            $data =[
                'status'=>200,
                'msg'=>$res
            ];
            header("HTTP/1.0 200 user found");
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

GetUserlist();

?>