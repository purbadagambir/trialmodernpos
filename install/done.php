<?php 
ob_start();
session_start();
define('START', true);
include ("_init.php");

if (!check_pcode()) {
	if (is_ajax()) {
		$json['redirect'] = root_url().'/install/purchase_code.php';
		echo json_encode($json);
		exit();
	} else {
		redirect('purchase_code.php');
	}
}

if(!checkDBConnection()) {
	if (is_ajax()) {
		$json['redirect'] = root_url().'/install/database.php';
		echo json_encode($json);
		exit();
	} else {
		redirect('database.php');
	}
}

$errors = array();
$success = array();
$info = array();

$errors['timezone'] = null;
$errors['index_validation'] = null;

if($session->data['admin_username'] && $session->data['password']) {

	if ($request->server['REQUEST_METHOD'] == 'POST') {
		$session->destroy();
		header('Location: ../index.php');
	}

} else {
	redirect("site.php");
}
?>

<?php 
$title = 'Done-Modern POS';
include("header.php"); ?>

<?php include '../_inc/template/install/done.php'; ?>

<?php include("footer.php"); ?>
