<?php
ob_start();
session_start();
include("../_init.php");

// use PHPMailer\PHPMailer\PHPMailer;
// use PHPMailer\PHPMailer\Exception;

// include('phpmailer/Exception.php');
// include('phpmailer/PHPMailer.php');
// include('phpmailer/SMTP.php');

// Check, if your logged in or not
// If user is not logged in then return an alert message
if (!is_loggedin()) {
  header('HTTP/1.1 422 Unprocessable Entity');
  header('Content-Type: application/json; charset=UTF-8');
  echo json_encode(array('errorMsg' => trans('error_login')));
  exit();
}

// Send email
if ($request->server['REQUEST_METHOD'] == 'POST') {
  try {

    // Check permission
    if (user_group_id() != 1 && !has_permission('access', 'send_email')) {
      throw new Exception(trans('error_email_permission'));
    }

    // Validate email address
    if (!validateEmail($request->post['email'])) {
      throw new Exception(trans('error_email_address'));
    }

    // Validate subject
    if (!validateString($request->post['subject'])) {
      throw new Exception(trans('error_email_subject'));
    }

    // Validate email body
    if (!validateString($request->post['emailbody'])) {
      throw new Exception(trans('error_email_body'));
    }

    $Hooks->do_action('Before_Send_Email', $request);
    $styles = isset($request->post['styles']) ? $request->post['styles'] : '';
    $subject = $request->post['subject'];
    $title = $request->post['title'];
    $body = $request->post['emailbody'];
    $recipient_name = $request->post['recipient_name'];
    $recipient_email = $request->post['email'];
    $template_name = $request->post['template'];

    // DEBUG START

    // $subject = 'text email from pos';
    // $title = 'text email from pos';
    // $body = '<h1>This is email body</h1>';
    // $recipient_name ='techbuzz69@gmail.com';
    // $recipient_email = 'techbuzz69@gmail.com';
    // $template_name = 'default';

    // DEBUG END

    $store_name = store('name');
    $store_address = store('address');
    $from_name = get_preference('email_from');
    $from_address = get_preference('email_address');

    if (!file_exists(DIR_EMAIL_TEMPLATE . $template_name . '.php') || !is_file(DIR_EMAIL_TEMPLATE . $template_name . '.php')) {
      throw new Exception(trans('error_email_template_not_found'));
    }

    ob_start();
    require(DIR_EMAIL_TEMPLATE . $template_name . '.php');
    $body = ob_get_contents();
    ob_end_clean();

    $driver = get_preference('email_driver');
    if ($driver == 'smtp_server') {

      $smtp_host = get_preference('smtp_host');
      //$smtp_username = get_preference('smtp_username');
      $smtp_username = 'noreplay@pondo.co.id';
      $smtp_password = get_preference('smtp_password');
      $smtp_port = get_preference('smtp_port');
      $ssl_tls = get_preference('ssl_tls');

      // require_once(DIR_VENDOR . 'PHPMailer/PHPMailerAutoload.php');
      // $mail = new PHPMailer;
      // if ($driver == 'smtp_server') {
      //     $mail->IsSMTP(); // telling the class to use SMTP
      //     // $mail->SMTPDebug = 3; // Debugging: 1 = errors and messages, 2 = messages only
      //     $mail->SMTPAuth = true; // Enable SMTP authentication
      //     $mail->SMTPSecure = $ssl_tls; // Sets the prefix to the servier
      //     $mail->Host = $smtp_host; // Sets GMAIL as the SMTP server
      //     $mail->Port = $smtp_port; // Set the SMTP port for the GMAIL server
      //     $mail->Username = $smtp_username; // GMAIL username
      //     $mail->Password = $smtp_password; // GMAIL password
      // }
      // $mail->AddAddress($recipient_email, $recipient_name);
      // $mail->SetFrom($smtp_username, $from_name);
      // $mail->Subject = $subject;
      // $mail->IsHTML(true);
      // $mail->Body = $body;

      // Begin : Remark By Henry @30/06/2022
      //=====================================//
      // require_once(DIR_VENDOR . 'PHPMailer/PHPMailerAutoload.php');
      // $mail = new PHPMailer;
      // $mail->CharSet = 'UTF-8';
      // $mail->SMTPDebug = 0;
      // $mail->Timeout = 900;
      // $mail->Host = $smtp_host;
      // $mail->Port = $smtp_port;
      // $mail->Username = $smtp_username;
      // $mail->Password = $smtp_password;
      // $mail->isHTML(true);
      // $mail->SetFrom($smtp_username, $from_name);
      // $mail->AddReplyTo($smtp_username, $from_name);
      // $mail->Subject = $subject;
      // $mail->MsgHTML($body);
      // $mail->AddAddress($recipient_email, $recipient_name);
      // if ($mail->send()) {
      //   $message = trans('text_success_email_sent');
      // } else {
      //   //throw new Exception(trans('error_email_not_sent'));
      //   throw new Exception($recipient_name);
      // }

      // end : Remark 
      //===============================================//

      require_once(DIR_VENDOR . 'PHPMailer/PHPMailerAutoload.php');
      $mail = new PHPMailer;
      $email_pengirim = 'noreplay@pondo.co.id';
      $nama_pengirim = 'Pondo Network';
      $email_penerima = $recipient_name;
      $subjek = 'Your Account in Pondo Network';
      $id_user = $recipient_email;
      $attachment = $_FILES['attachment']['name'];
      //$mail = new PHPMailer;
      $mail->isSMTP(true);
      $mail->Host = 'mail.pondo.co.id';
      $mail->Username = $email_pengirim;
      $mail->Password = 'Pondo@2022';
      $mail->Port = 465;
      $mail->SMTPAuth = true;
      $mail->SMTPSecure = 'ssl';
      $mail->setFrom($email_pengirim, $nama_pengirim);
      $mail->addAddress($email_penerima, '');
      $mail->isHTML(true);
      //ob_start();
      //include "email.php";
      //$content = ob_get_contents();
      //ob_end_clean();
      $mail->Subject = $subjek;
      $mail->Body = $body;
      // $send = $mail->send();
      if ($mail->send()) {
        $message = trans('text_success_email_sent');
      } else {
        throw new Exception(trans('error_email_not_sent'));
      }
    } else {

      $mail = new Email();
      $config['useragent'] = store('name');
      $config['protocol'] = 'mail';
      $config['mailtype'] = "html";
      $config['crlf'] = "\r\n";
      $config['newline'] = "\r\n";
      $mail->initialize($config);
      $mail->from($from_address, $from_name);
      $mail->to($recipient_email);
      $mail->subject($subject);
      $mail->message($body);
      if ($mail->send()) {
        $message = trans('text_success_email_sent') . '. To prevent spam setup your SMTP server.';
      } else {
        throw new Exception($mail->print_debugger(array('headers', 'subject')));
      }
    }

    $Hooks->do_action('After_Sent_Email', $request);

    header('Content-Type: application/json');
    echo json_encode(array('msg' => $message));
    exit();
  } catch (Exception $e) {

    header('HTTP/1.1 422 Unprocessable Entity');
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(array('errorMsg' => $e->getMessage()));
    exit();
  }
}
