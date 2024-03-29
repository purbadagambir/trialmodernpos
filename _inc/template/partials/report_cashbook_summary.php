<div class="table-responsive">
  <table class="table table-bordered table-striped mb-0">
    <tbody>
      <tr>
        <td class="w-50 bg-gray text-right"><?php echo trans('label_opening_balance'); ?></td>
        <td class="w-50 bg-gray text-right">
          <?php 
          $opening_balance = get_opening_balance($from);
          echo number_format($opening_balance);
          ?>
        </td>
      </tr>
      <tr class="bg-blue">
        <td class="w-50 text-right">Total Point</td>
        <td class="w-50 text-right">
        <?php 
          $today_point = get_total_point($from,to());
          echo number_format($today_point);
          ?>
        </td>
      </tr>
      <tr class="bg-yellow">
        <td class="w-50 text-right">Total Credit</td>
        <td class="w-50 text-right">
          <?php 
          $today_credit = get_total_credit($from,to());
          echo number_format($today_credit);
          ?>
        </td>
      </tr>
      <tr>
        <td class="w-50 bg-gray text-right">
           <a style="color:#000;" href="income_monthwise.php?date=<?php echo date('Y-m-d',strtotime($from));?>" title="<?php echo trans('button_details'); ?>">
            <span class="fa fa-link"></span>
          </a>
          <?php echo trans('label_today_income'); ?></td>
        <td class="w-50 bg-gray text-right">
          <?php 
          $today_income = get_total_income($from,to())-$today_point-$today_credit;
          echo number_format($today_income);
          ?>
        </td>
      </tr>
      <tr class="bg-green">
        <td class="w-50 text-right"><?php echo trans('label_total_income'); ?></td>
        <td class="w-50 text-right">
          <?php 
          $total_income = $opening_balance+$today_income;
          echo number_format($total_income);
          ?>
        </td>
      </tr>
      <tr class="bg-red">
        <td class="w-50 text-right">
          <a style="color:#fff;" href="expense_monthwise.php?date=<?php echo date('Y-m-d',strtotime($from));?>" title="<?php echo trans('button_details'); ?>">
            <span class="fa fa-link"></span>
          </a>
          <?php echo trans('label_today_expense'); ?> (-)</td>
        <td class="w-50 text-right">
          <?php 
          $total_expense = get_total_expense($from,to());
          echo number_format($total_expense);
          ?>
        </td>
      </tr>
      <tr class="bg-blue">
        <td class="w-50 text-right"><?php echo trans('label_balance'); ?> / <?php echo trans('label_cash_in_hand'); ?></td>
        <td class="w-50 text-right">
          <?php 
          $cash_in_hand = $total_income-$total_expense+$today_point+$today_credit;
          echo number_format($cash_in_hand);?>
        </td>
      </tr>
      <tr class="bg-yellow">
        <td class="w-50 text-right"><h4><b><?php echo trans('label_today_closing_balance'); ?></b></h4></td>
        <td class="w-50 text-right"><h4><b><?php echo number_format($cash_in_hand);?></b></h4></td>
      </tr>
    </tbody>
  </table>
</div>