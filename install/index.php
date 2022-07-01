<?php 
ob_start();
session_start();
define('START', true);
include ("_init.php");

if (defined('INSTALLED')) {
	if (is_ajax()) {
		$json['redirect'] = root_url().'/index.php';
		echo json_encode($json);
		exit();
	} else {
		header('Location: ../index.php');
	}
}

$title = 'Checklist-Modern POS';
include("header.php"); 

$errors = array();
$success = array();

// Check PHP version
if (phpversion() < "7.0") {
	$errors[] = 'You are running PHP old version!';
} else {
	$phpversion = phpversion();
	$success[] = ' You are running PHP '.$phpversion;
}

// Check Mysql PHP extension
if(!extension_loaded('mysqli')) {
	$errors[] = 'Mysqli PHP extension unloaded!';
} else {
	$success[] = 'Mysqli PHP extension loaded.';
}

// Check PDO PHP extension
if (!defined('PDO::ATTR_DRIVER_NAME') || !extension_loaded ('PDO') || !extension_loaded('pdo_mysql')) {
	$errors[] = 'PDO PHP extension is unloaded!';
} else {
	$success[] = 'PDO PHP extension loaded.';
}

// Check MBString PHP extension
if(!extension_loaded('mbstring')) {
	$errors[] = 'MBString PHP extension unloaded!';
} else {
	$success[] = 'MBString PHP extension loaded.';
}

// Check GD PHP extension
if(!extension_loaded('gd')) {
	$errors[] = 'GD PHP extension unloaded!';
} else {
	$success[] = 'GD PHP extension loaded.';
}

// Check CURL PHP extension
if(!extension_loaded('curl')) {
	$errors[] = 'CURL PHP extension unloaded!';
} else {
	$success[] = 'CURL PHP extension loaded.';
}

// Check Openssl PHP extension
if(!extension_loaded('openssl')) {
	$errors[] = 'Openssl PHP extension unloaded!';
} else {
	$success[] = 'Openssl PHP extension loaded.';
}

// Check Internet Connection
if(checkInternetConnection()) {
	$success[] = 'Internet connection OK';
} else {
	$errors[] = 'Internet connection problem!';
}

// Check Validation Server Connection
if(checkValidationServerConnection()) {
	$success[] = 'Validation server OK';
} else {
	$errors[] = 'Validation server connection problem!';
}

// Check Envato Server Connection
if(checkEnvatoServerConnection()) {
	$success[] = 'Envato server OK';
} else {
	$errors[] = 'Envato server connection problem!';
}

include '../_inc/template/install/index.php'; 

include("footer.php");