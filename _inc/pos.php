<?php
ob_start();
session_start();
include("../_init.php");

// Check, if user logged in or not
// If user is not logged in then return an alert message
if (!is_loggedin()) {
	header('HTTP/1.1 422 Unprocessable Entity');
	header('Content-Type: application/json; charset=UTF-8');
	echo json_encode(array('errorMsg' => trans('error_login')));
	exit();
}

// Check, if user has reading permission or not
// If user have not reading permission return an alert message
if (user_group_id() != 1 && !has_permission('access', 'create_sell_invoice')) {
	header('HTTP/1.1 422 Unprocessable Entity');
	header('Content-Type: application/json; charset=UTF-8');
	echo json_encode(array('errorMsg' => trans('error_read_permission')));
	exit();
}

$product_model = registry()->get('loader')->model('product');
$store_id = store_id();

// Fetch customer by id
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'CUSTOMER') {
	try {

		// validte customer id
		if (!validateInteger($request->get['customer_id'])) {
			throw new Exception(trans('error_customer_id'));
		}

		$id = $request->get['customer_id'];

		$statement = db()->prepare("SELECT * FROM `customers`  
			LEFT JOIN `customer_to_store` c2s ON (`customers`.`customer_id` = `c2s`.`customer_id`)
			WHERE `c2s`.`store_id` = ? AND `customers`.`customer_id` = ? AND `c2s`.`status` = ?");
		$statement->execute(array(store_id(), $id, 1));
		$the_customer = $statement->fetch(PDO::FETCH_ASSOC);
		$customer = $the_customer ? $the_customer : array();

		header('Content-Type: application/json');
		echo json_encode($customer);
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}


// Fetch customer option
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'CUSTOMEROPTION') {
	try {

		$statement = db()->prepare("SELECT customer_id, customer_name, customer_mobile FROM `customers` LIMIT 10");
		$statement->execute();
		$the_customer = $statement->fetchAll(PDO::FETCH_ASSOC);
		$customer = $the_customer ? $the_customer : array();

		header('Content-Type: application/json');
		echo json_encode($customer);
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}

// Fetch customer list
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'CUSTOMERLIST') {
	try {

		$limit = isset($request->get['limit']) ? (int)$request->get['limit'] : 20;
		/* Update by Henry @ 30-05-2022 */
		/* Script Asli : $field = $request->get['field']; */
		$field = 'customer_mobile';
		$query_string = $request->get['query_string'];
		$statement = db()->prepare("SELECT * FROM `customers` 
			LEFT JOIN `customer_to_store` c2s ON (`customers`.`customer_id` = `c2s`.`customer_id`)
			WHERE UPPER($field) LIKE '" . strtoupper($query_string) . "%' AND `c2s`.`store_id` = ? AND `c2s`.`status` = ? GROUP BY `customers`.`customer_id` ORDER BY `customers`.`customer_id` DESC LIMIT $limit");
		$statement->execute(array(store_id(), 1));
		$customers = $statement->fetchAll(PDO::FETCH_ASSOC);

		$customer_array = array();
		if ($statement->rowCount() > 0) {
			$customer_array = $customers;
		}

		header('Content-Type: application/json');
		echo json_encode($customer_array);
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}

// Fetch a product item
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'PRODUCTITEM') {
	try {

		if (isset($request->get["is_edit_mode"]) && $request->get["is_edit_mode"]) {
			if (user_group_id() != 1 && !has_permission('access', 'add_item_to_invoice')) {
				throw new Exception(trans('error_item_add_permission'));
			}
		}

		// Validate product id
		if (!isset($request->get['p_id'])) {
			throw new Exception(trans('error_product_id'));
		}

		$p_id = $request->get['p_id'];
		$where_query = "`p2s`.`store_id` = ? AND (`p_id` = ? OR `p_code` = ?) AND `p2s`.`status` = ? AND (`p2s`.`quantity_in_stock` > 0 OR `products`.`p_type` = 'service')";
		if (get_preference('expiry_yes')) {
			$where_query .= " AND `p2s`.`e_date` > NOW()";
		}
		$statement = db()->prepare("SELECT *,A.unit_name as uom_medium,B.unit_name as uom_large,C.unit_name as uom_small   FROM `products` LEFT JOIN `product_to_store` p2s ON (`products`.`p_id` = `p2s`.`product_id`)
	  LEFT JOIN units A ON (products.unit_id_medium  = A.unit_id) 
	  LEFT JOIN units B ON (products.unit_id_large  = B.unit_id) 
	  LEFT JOIN units C ON (products.unit_id  = C.unit_id) 
	  WHERE {$where_query}");
		$statement->execute(array(store_id(), $p_id, $p_id, 1));
		$product = $statement->fetch(PDO::FETCH_ASSOC);
		if (!$product) {
			throw new Exception(trans('error_out_of_stock'));
		}
		$product = array_replace($product, array('p_name' => html_entity_decode($product['p_name'])));
		if ($product['taxrate_id']) {
			$product['tax_amount'] = (get_the_taxrate($product['taxrate_id'], 'taxrate') / 100) * $product['sell_price'];
		}
		$product['unit_name'] = get_the_unit($product['unit_id'], 'unit_name');
		$product['unit_name_medium'] = $product['uom_medium'];
		$product['unit_name_large'] = $product['uom_large'];
		$product['unit_name_small'] = $product['uom_small'];
		$product['sell_price'] = $product['sell_price'];
		$product['sell_price_medium'] = $product['sell_price_medium'];
		$product['sell_price_large'] = $product['sell_price_large'];
		$product['sell_discount'] = $product['sell_discount'];

		echo json_encode($product);
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}

// Fetch product list
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'PRODUCTLIST') {
	try {

		if (isset($request->get['query_string'])) {
			$query_string = $request->get['query_string'];
		} else {
			$query_string = '';
		}

		if (isset($request->get['category_id'])) {
			$category_id = $request->get['category_id'];
		} else {
			$category_id = '';
		}

		if (isset($request->get['field'])) {
			$field = $request->get['field'];
		} else {
			$field = 'p_name';
		}

		if (isset($request->get['page'])) {
			$page = $request->get['page'];
		} else {
			$page = 1;
		}

		if (isset($request->get['limit'])) {
			$limit = (int)$request->get['limit'];
		} else {
			$limit = get_preference('pos_product_display_limit') ? (int)get_preference('pos_product_display_limit') : 20;
		}

		$start = ($page - 1) * $limit;

		$data = array(
			'query_string' => $query_string,
			'field' => $field,
			'category_id' => $category_id,
			'start' => $start,
			'limit' => $limit,
		);
		$products = $product_model->getPosProducts($data, $store_id);
		// $data = array(
		// 	'query_string' => $query_string,
		// 	'field' => $field,
		// 	'category_id' => $category_id,
		// );
		// $product_total = count($product_model->getPosProducts($data, $store_id));
		$product_total = count($products);

		// Pagination
		$pagination = new Pagination();
		$pagination->total = $product_total;
		$pagination->page = $page;
		$pagination->limit = $limit;
		$pagination->url = root_url() . '/_inc/pos.php?query_string=' . $query_string . '&category_id=' . $category_id . '&field=' . $field . '&action_type=PRODUCTLIST&page={page}&limit=' . $limit;
		$pagination = $pagination->render();

		header('Content-Type: application/json');
		echo json_encode(array('products' => array_values($products), 'pagination' => $pagination, 'page' => $page + 1));
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}

// UPDATED BY FAHRUR REZA
// Fetch a product unit
if ($request->server['REQUEST_METHOD'] == 'GET' && isset($request->get['action_type']) && $request->get['action_type'] == 'PRODUCTUNIT') {
	echo $request->get['action_type'];
	try {
		// Validate product id
		if (!isset($request->get['p_id'])) {
			throw new Exception(trans('error_product_id'));
		}

		$p_id = $request->get['p_id'];

		$statement = db()->prepare("SELECT * FROM `products` LEFT JOIN `product_to_store` p2s ON (`products`.`p_id` = `p2s`.`product_id`) WHERE {$where_query}");
		$statement->execute(array(store_id(), $p_id, $p_id, 1));
		$product = $statement->fetch(PDO::FETCH_ASSOC);
		if (!$product) {
			throw new Exception(trans('error_out_of_stock'));
		}

		echo json_encode($product);
		exit();
	} catch (Exception $e) {

		header('HTTP/1.1 422 Unprocessable Entity');
		header('Content-Type: application/json; charset=UTF-8');
		echo json_encode(array('errorMsg' => $e->getMessage()));
		exit();
	}
}
