<?php 
ob_start();
session_start();
define('START', true);
include ("_init.php");

$json = array();

if (defined('INSTALLED')) {
	if (is_ajax()) {
		$json['redirect'] = root_url().'/index.php';
		echo json_encode($json);
		exit();
	} else {
		header('Location: ../index.php');
	}
}

if(!checkValidationServerConnection() || !checkEnvatoServerConnection()) {
	if (is_ajax()) {
		$json['redirect'] = root_url().'/install/index.php';
		echo json_encode($json);
		exit();
	} else {
		redirect('index.php');
	}
}

$errors = array();
$success = array();
$info = array();

$errors['internet_connection'] = null;
$errors['purchase_username'] = null;
$errors['purchase_code'] = null;
$errors['config_error'] = null;

$ecnesil_path = DIR_INCLUDE.'config/purchase.php';
$config_path = ROOT . '/config.php';
function purchase_code_validation() 
{
	global $request, $ecnesil_path, $config_path, $errors, $success, $info;

	if (empty($request->post['purchase_username'])) {
		$errors['purchase_username'] = 'Username is required';
		return false;
	}

	if (empty($request->post['purchase_code'])) {
		$errors['purchase_code'] = 'Purchase code is required';
		return false;
	}
	
	if (is_writable($config_path) === false) {
		$errors['config_error'] = 'config.php is not writable!';
		return false;
	}

	if (is_writable($ecnesil_path) === false) {
		$errors['config_error'] = 'File writing permission problem!';
		return false;
	}

	$info['username'] = trim($request->post['purchase_username']);
	$info['purchase_code'] = trim($request->post['purchase_code']);
	$info['action'] = 'validation';
	$apiCall = apiCall($info);
	if (!$apiCall || !is_object($apiCall)) {
		$errors['internet_connection'] = 'An unexpected response from validation server!';
		return false;
	}
    if($apiCall->status === 'error') {
		$errors['purchase_code'] = $apiCall->message;
		return false;
	} else {

		if (generate_ecnesil($request->post['purchase_username'], $request->post['purchase_code'], $ecnesil_path)) {
			return true;
		}
		$errors['preparation'] = 'Problem while generating license!';
		return false;
	}
}

if ($request->server['REQUEST_METHOD'] == 'POST') 
{
	if(!checkInternetConnection()) {
		$errors['internet_connection'] = 'Internet connection problem!';
	}
	if(purchase_code_validation() === true || (!$errors['purchase_username'] && !$errors['purchase_code'] && !$errors['config_error'] && !$errors['internet_connection'])) {
		$json['redirect'] = 'database.php';
	} else {
		$json = array_filter($errors);
	}
	echo json_encode($json);
	exit();
}
?>

<?php 
$title = 'Validation-Modern POS';
include("header.php"); ?>
<?php include '../_inc/template/install/purchase_code.php'; ?>
<?php include("footer.php"); ?>
