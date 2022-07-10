<?php
/*
| ----------------------------------------------------------------------------
| PRODUCT NAME:     Modern POS - Point of Sale with Stock Management System
| ----------------------------------------------------------------------------
| AUTHOR:           ITsolution24.com
| ----------------------------------------------------------------------------
| EMAIL:            itsolution24bd@gmail.com
| ----------------------------------------------------------------------------
| COPYRIGHT:        RESERVED BY ITsolution24.com
| ----------------------------------------------------------------------------
| WEBSITE:          http://ITsolution24.com
| ----------------------------------------------------------------------------
*/
class ModelSellreturn extends Model 
{
	public function getInvoices($store_id = null, $limit = 100000) 
	{
		$store_id = $store_id ? $store_id : store_id();
		$statement = $this->db->prepare("SELECT `returns`.* FROM `returns` 
			WHERE `returns`.`store_id` = ? ORDER BY `returns`.`created_at` DESC LIMIT $limit");
		$statement->execute(array($store_id));
		return $statement->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getInvoiceInfo($reference_no, $store_id = null) 
	{
		$store_id = $store_id ? $store_id : store_id();
		$statement = $this->db->prepare("SELECT * FROM `returns` 
			WHERE `store_id` = ? AND `reference_no` = ?");
		$statement->execute(array($store_id, $reference_no));
		return $statement->fetch(PDO::FETCH_ASSOC);
	}

    public function getRefNoByInvoiceId($invoice_id, $store_id = null) 
    {
        $store_id = $store_id ? $store_id : store_id();
        $statement = $this->db->prepare("SELECT `reference_no` FROM `returns` 
            WHERE `store_id` = ? AND `invoice_id` = ?");
        $statement->execute(array($store_id, $invoice_id));
        $result = $statement->fetch(PDO::FETCH_ASSOC);
        return isset($result['reference_no']) ? $result['reference_no'] : null;
    }

	public function getInvoiceItems($reference_no, $store_id = null) 
	{
		$store_id = $store_id ? $store_id : store_id();
		$statement = $this->db->prepare("SELECT * FROM `return_items` WHERE `store_id` = ? AND `reference_no` = ?");
		$statement->execute(array($store_id, $reference_no));
		return $statement->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getInvoiceItemsHTML($reference_no, $store_id = null)
    {
        $store_id = $store_id ? $store_id : store_id();
        $statement = $this->db->prepare("SELECT A.*,B.unit_name FROM `return_items`  A LEFT JOIN units B on A.return_unit_id=B.unit_id WHERE A.store_id = ? AND A.reference_no = ?");
        $statement->execute(array($store_id, $reference_no));
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        $i = 0;
        $html = '<table class="table table-bordered mb-0">';
        $html .= '<thead>';
        $html .= '<tr class="bg-gray">';
        $html .= '<td class="text-center" style="padding:0 2px;">Name</td>';
        $html .= '<td class="text-right" style="padding:0 2px;">Price</td>';
        $html .= '<td class="text-center" style="padding:0 2px;">Qty.</td>';
        $html .= '<td class="text-right" style="padding:0 2px;">Subtotal</td>';
        $html .= '</tr>';
        $html .= '</thead>';
        $sell = 0;
        $qty = 0;
        $total = 0;
        foreach ($rows as $row) {
            $html .= '<tr class="bg-success">';
            $html .= '<td class="text-center" style="padding:0 2px;">' . $row['item_name'] . '</td>';
            $html .= '<td class="text-right" style="padding:0 2px;">' . currency_format($row['item_price']) . '</td>';
            $html .= '<td class="text-center" style="padding:0 2px;">' . currency_format($row['item_quantity']) . ' ' . $row['unit_name'] . '</td>';
            $html .= '<td class="text-right" style="padding:0 2px;">' . currency_format($row['item_total']) . '</td>';
            $html .= '</tr>';
            $sell += $row['item_price'];
            $qty += $row['item_quantity'];
            $total += $row['item_total'];
        }
        $html .= '<tr class="bg-warning">';
        $html .= '<td class="text-right" style="padding:0 2px;">Total</td>';
        $html .= '<td class="text-right" style="padding:0 2px;">' . currency_format($sell) . '</td>';
        $html .= '<td class="text-center" style="padding:0 2px;">' . currency_format($qty) . '</td>';
        $html .= '<td class="text-right" style="padding:0 2px;">' . currency_format($total) . '</td>';
        $html .= '</tr>';
        $html .= '</table>';
        return $html;
    }
}