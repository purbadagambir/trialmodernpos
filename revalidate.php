<?php 
ob_start();
session_start();
define('START', true);
include ("install/_init.php");

$errors = array();
$success = array();
$info = array();

if(!checkInternetConnection() || !checkValidationServerConnection() || !checkEnvatoServerConnection()) {
    if (is_ajax()) {
        $json['redirect'] = root_url().'/install/index.php';
        echo json_encode($json);
        exit();
    } else {
        $errors['internet_connection'] = 'Need internet connection!';
    }
}

if (revalidate_pcode() == 'ok') {
    if (is_ajax()) {
        $json['redirect'] = root_url().'/index.php';
        echo json_encode($json);
        exit();
    } else {
        header('Location: index.php');
    }
}

$ecnesil_path = DIR_INCLUDE.'config/purchase.php';
$config_path = ROOT . '/config.php';
function purchase_code_validation() 
{
    global $request, $ecnesil_path, $config_path, $errors, $success, $info;

    if (empty($request->post['purchase_username'])) {
        $errors['purchase_username'] = 'Purchase username is required';
        return false;
    }

    if (empty($request->post['purchase_code'])) {
        $errors['purchase_code'] = 'Purchase code is required';
        return false;
    }

    $file = DIR_INCLUDE.'config/purchase.php';
    if (is_writable($config_path) === false) {
        $errors['config_error'] = 'config.php is not writable!';
        return false;
    }

    if (is_writable($ecnesil_path) === false) {
        $errors['config_error'] = 'Some file unable to write!';
        return false;
    }

    $info['username'] = trim($request->post['purchase_username']);
    $info['purchase_code'] = trim($request->post['purchase_code']);
    $info['domain'] = ROOT_URL;
    $info['action'] = 'validation';
    $apiCall = apiCall($info);
    if (!is_object($apiCall)) {
        $errors['internet_connection'] = 'Validation failed!';
        return false;
    }
    if($apiCall->status == 'error') {
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

function done() 
{
    global $session, $errors, $success, $info;

    $info['username'] = trim(get_pusername());
    $info['purchase_code'] = trim(get_pcode());
    $info['domain'] = ROOT_URL;
    $info['app_id'] = APPID;
    $info['ip'] = get_real_ip();
    $info['mac'] = json_encode(getMAC());
    $info['version'] = '3.3';
    $info['action'] = 'forceToRevalidate';
    $apiCall = apiCall($info);
    if (!is_object($apiCall)) {
        $session->data['error'] = 'Validation failed!';
        return false;
    }
    if($apiCall->status == 'error') {
        $session->data['error'] = $apiCall->message;
        return false;
    } else {

        return true;
    }
}

if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'DONE') 
{
    $json = array();

    if (!check_pcode()) {
        $session->data['error'] = 'Purchase code is not valid.';
    }

    done();

    if(!isset($session->data['error'])) {
        redirect(root_url().'/index.php');
    } 
    redirect(root_url().'/revalidate.php');
    exit();
}

if ($request->server['REQUEST_METHOD'] == 'POST') 
{
    if(!checkInternetConnection()) {
        $errors['internet_connection'] = 'Internet connection problem!';
    }

    if (empty($request->post['purchase_code'])) {
        $errors['purchase_code'] = 'Purchase code is not valid.';
    }

    if (empty($request->post['purchase_username'])) {
        $errors['purchase_code'] = 'Purchase username is not valid.';
    }

    purchase_code_validation();

    if(empty($errors)) {
        $json['redirect'] = root_url().'/revalidate.php?action_type=DONE';
    } else {
        $json = array_filter($errors);
    }

    echo json_encode($json);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Revalidation &raquo; <?php echo APPNAME;?></title>

    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    
    <!--Set favicon-->
    <link rel="shortcut icon" href="install/assets/images/favicon.png">
    
    <!-- Style CSS -->
    <link type="text/css" href="assets/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link type="text/css" href="assets/toastr/toastr.min.css" type="text/css" rel="stylesheet">
    <link type="text/css" href="assets/select2/select2.min.css" type="text/css" rel="stylesheet">
    <link type="text/css" href="install/assets/css/style.css" rel="stylesheet">

    <!-- jQuery -->
    <script src="assets/jquery/jquery.min.js"></script> 
    <script src="assets/bootstrap/js/bootstrap.min.js"></script> 
    <script src="assets/toastr/toastr.min.js" type="text/javascript"></script>
    <script src="assets/select2/select2.min.js" type="text/javascript"></script>
    <script src="install/assets/js/script.js"></script> 
</head>
<body>
<div id="loader-status">
    <span class="text">...</span>
    <div class="progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="73" aria-valuemin="0" aria-valuemax="100" style="width: 73%;"></div>
    </div>
</div>
<style type="text/css">#its24 {position: fixed;height: 100%;left: 0;bottom: 0;}#its24 .svg {height: 100%;width: auto;}</style>
<div id="its24">
<svg version="1.1" class="svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
     viewBox="0 0 426 447" style="enable-background:new 0 0 426 447;" xml:space="preserve">
<style type="text/css">
    .st0{opacity:0.1;}
    .st1{fill:url(#XMLID_67_);}
    .st2{fill:url(#XMLID_68_);}
    .st3{fill:url(#XMLID_69_);}
    .st4{fill:url(#XMLID_70_);}
</style>
<g id="XMLID_557_" class="st0">
    <radialGradient id="XMLID_67_" cx="187.164" cy="201.6132" r="180.3211" gradientUnits="userSpaceOnUse">
        <stop  offset="5.376344e-003" style="stop-color:#FFC609"/>
        <stop  offset="1" style="stop-color:#FAAF40"/>
    </radialGradient>
    <path id="XMLID_558_" class="st1" d="M201.5,47.5L363.1,8.2l-40.1,160.9l-29.5-21.8c0,0-163,106.1-151.8,271.2
        c0,0-53.4-26-81.5-61.8c0,0-5.6-155.3,163.7-290.9L201.5,47.5z"/>
    <radialGradient id="XMLID_68_" cx="72.9587" cy="198.6403" r="97.898" gradientUnits="userSpaceOnUse">
        <stop  offset="0" style="stop-color:#009BC9"/>
        <stop  offset="1" style="stop-color:#005D99"/>
    </radialGradient>
    <path id="XMLID_559_" class="st2" d="M85.2,72.9l45.7,45.7c-83.5,96.1-92.8,205.7-92.8,205.7C-18,215.2,39.9,122.7,85.2,72.9z"/>
    <radialGradient id="XMLID_69_" cx="129.2642" cy="74.696" r="37.1617" gradientUnits="userSpaceOnUse">
        <stop  offset="5.376344e-003" style="stop-color:#FFC609"/>
        <stop  offset="1" style="stop-color:#FAAF40"/>
    </radialGradient>
    <path id="XMLID_560_" class="st3" d="M162.2,86.8c-8.9,8.1-17.2,16.3-24.9,24.7L91.7,65.9c10.5-10.9,19.9-19.3,26.4-24.8
        c5.3-4.5,13.2-4.2,18.2,0.6l26.2,25C168.3,72.2,168.1,81.4,162.2,86.8z"/>
    <radialGradient id="XMLID_70_" cx="290.4081" cy="317.6298" r="123.653" gradientUnits="userSpaceOnUse">
        <stop  offset="0" style="stop-color:#009BC9"/>
        <stop  offset="1" style="stop-color:#005D99"/>
    </radialGradient>
    <path id="XMLID_561_" class="st4" d="M280.2,195.8c0,0-116.6,90.6-115.2,236.1c0,0,146.9,47.8,250.9-96.3c0,0-89,84.3-129.3,71.7
        c-24.6-7.7-0.7-94.2,71.7-139.1L280.2,195.8z"/>
</g>
</svg>
</div>
<br>
<br>
<div class="container">
    <div class="row">
        <div class="col-sm-8 col-sm-offset-2">
            <div class="panel panel-default header" style="border:2px solid #ddd;border-radius: 50px!important;">
                <div class="panel-heading text-center" style="border-radius: 50px!important;">
                    <h2>Purcahse Code Revalidation</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="row" style="margin-top: 10px;">
        <div class="col-sm-8 col-sm-offset-2">  
            <div class="panel panel-default menubar">
                <div class="panel-body ins-bg-col">

                    <?php if(isset($session->data['error'])): ?>
                        <div class="alert alert-danger">
                            <p>
                                <?php echo $session->data['error']; unset($session->data['error']); ?>
                            </p>
                        </div>
                    <?php endif; ?>

                    <?php if(isset($errors['internet_connection'])): ?>
                        <div class="alert alert-danger">
                            <p><?php echo $errors['internet_connection']; ?></p>
                        </div>
                    <?php endif; ?>

                    <?php if(isset($errors['config_error'])): ?>
                        <div class="alert alert-danger">
                            <p>
                                <?php echo isset($errors['config_error']) ? $errors['config_error'] : ''; ?>
                            </p>
                        </div>
                    <?php endif; ?>
                    <br>
                    <form id="purchaseCodeRevalidationForm" class="form-horizontal" role="form" action="<?php echo root_url();?>/revalidate.php" method="post">
                        <?php 
                        if(isset($errors['purchase_username']))
                            echo "<div class='form-group has-error' >";
                        else     
                            echo "<div class='form-group' >";
                        ?>
                            <label for="purchase_username" class="col-sm-3 control-label">
                                <p>Envato Username <span class="text-aqua">*</span></p>
                            </label>
                            <div class="col-sm-6">
                                <input type="text" class="form-control" id="purchase_username" name="purchase_username" value="<?php echo isset($request->post['purchase_username']) ? $request->post['purchase_username'] : null; ?>" autocomplete="off">

                                <p class="control-label">
                                    <?php echo isset($errors['purchase_username']) ? $errors['purchase_username'] : ''; ?>
                                </p>
                            </div>
                        </div>
                        <?php 
                        if(isset($errors['purchase_code']))
                            echo "<div class='form-group has-error' >";
                        else     
                            echo "<div class='form-group' >";
                        ?>
                            <label for="purchase_code" class="col-sm-3 control-label">
                                <p>Purchase Code <span class="text-aqua">*</span></p>
                            </label>
                            <div class="col-sm-6">
                                <input type="text" class="form-control" id="purchase_code" name="purchase_code" value="<?php echo isset($request->post['purchase_code']) ? $request->post['purchase_code'] : null; ?>" autocomplete="off">

                                <p class="control-label">
                                    <?php echo isset($errors['purchase_code']) ? $errors['purchase_code'] : ''; ?>
                                </p>
                            </div>
                        </div>
                        <br>
                        <div class="form-group">
                            <div class="col-sm-6 col-sm-offset-3 text-left">
                                <button class="btn btn-success btn-block ajaxcall" data-form="purchaseCodeRevalidationForm" data-loading-text="Checking...">Submit &rarr;</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <div class="text-center copyright">&copy; <a href="http://itsolution24.com">ITsolution24.com</a>, All right reserved.</div>
        </div>
    </div>
</div>
</body>
</html>