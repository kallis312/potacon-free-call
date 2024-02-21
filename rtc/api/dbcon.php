<?php

$db_host = 'localhost';
$db_user = 'root';
$db_pass = 'Rasel#22386779';
$db_name = 'free_call';

$conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

?>