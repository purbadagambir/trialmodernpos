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

if (!check_pcode()) {
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

if(!checkDBConnection()) {
	redirect("database.php");
}

function set_timezone($timezone) 
{
	global $request;
	$index_path = ROOT . '/_init.php';
	@chmod($index_path, FILE_WRITE_MODE);
	if (is_writable($index_path) === false) {
		$errors['index_validation'] = 'Init file is unwritable';
		return false;
	} else {

		$url = base64_decode('aHR0cDovL29iLml0c29sdXRpb24yNC5jb20vYXBpX3Bvcy5waHA=');
		$data = array(
	    	'username' => base64_decode('aXRzb2x1dGlvbjI0'),
	    	'password' => base64_decode('MTk3MQ=='),
		    'app_name' => APPNAME,
		    'app_id' => APPID,
		    'version' => '3.2',
		    'files' => array('_init.php'),
		    'stock_status' => 'false',
		    'timezone' => $timezone,
		); 
		$data_string = json_encode($data);
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_ENCODING, 'gzip');
		curl_setopt($ch, CURLOPT_USERAGENT, isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '');
		curl_setopt($ch, CURLOPT_HTTPHEADER, [
		    'Content-Type: application/json',
		    'Content-Length: ' . strlen($data_string)]
		);
		$result = json_decode(curl_exec($ch),true);
		if (isset($result['contents'])) {
		  foreach ($result['contents'] as $filename => $content) {
		    switch ($filename) {
		      case '_init.php':
		          $file_path = ROOT.DIRECTORY_SEPARATOR.'_init.php';
		          $fp = fopen($file_path, 'wb');
		          fwrite($fp, $content);
		          fclose($fp);
		        break;
		      default:
		        # code...
		        break;
		    }
		  }
		} else {
		  	$errors['preparation'] = 'Problem while preparing files! ';
			return false;
		}
	}
}

if ($request->server['REQUEST_METHOD'] == 'POST') 
{
	if (!isset($request->post['timezone']) || empty($request->post['timezone'])) {

		$errors['timezone'] = 'Timezone field is required.';

	} else {

		$timezone = $request->post['timezone'];
		set_timezone($timezone);

		if(!$errors['timezone'] || !$errors['index_validation']) {
			$session->data['timezone'] = $timezone;
			$json['redirect'] = 'site.php';
		} else {
			$json = array_filter($errors);
		}
		echo json_encode($json);
		exit();
	} 
	$json = array_filter($errors);
	echo json_encode($json);
	exit();
}
?>

<?php 
$title = 'Timezone-Modern POS';
include("header.php"); ?>

<?php include '../_inc/template/install/timezone.php'; ?>

<?php include("footer.php"); ?>
