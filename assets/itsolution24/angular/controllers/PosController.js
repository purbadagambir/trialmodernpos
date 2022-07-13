window.angularApp.controller("PosController", [
    "$scope",
    "API_URL",
    "window",
    "jQuery",
    "$compile",
    "$uibModal",
    "$http",
    "$sce",
    "ProductCreateModal",
    "CategoryCreateModal",
    "BoxCreateModal",
    "SupplierCreateModal",
    "ProductViewModal",
    "ProductEditModal",
    "CustomerCreateModal",
    "CustomerEditModal",
    "AddInvoiceNoteModal",
    "AddCustomerMobileNumberModal",
    "PaymentFormModal",
    "GiftcardCreateModal",
    "GiftcardViewModal",
    "HoldingOrderModal",
    "HoldingOrderDetailsModal",
    function (
        $scope,
        API_URL,
        window,
        $,
        $compile,
        $uibModal,
        $http,
        $sce,
        ProductCreateModal,
        CategoryCreateModal,
        BoxCreateModal,
        SupplierCreateModal,
        ProductViewModal,
        ProductEditModal,
        CustomerCreateModal,
        CustomerEditModal,
        AddInvoiceNoteModal,
        AddCustomerMobileNumberModal,
        PaymentFormModal,
        GiftcardCreateModal,
        GiftcardViewModal,
        HoldingOrderModal,
        HoldingOrderDetailsModal
    ) {
        "use strict";


        $(".data-field").attr("type", "date");

        $scope._percentage = function (amount, per) {
            if (false === $scope._isNumeric(amount) || false === $scope._isNumeric(per)) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("The discount amount isn't numeric!", "Warning!");
                return 0;
            }
            return (amount / 100) * per;
        };
        $scope._isNumeric = function (val) {
            return !isNaN(parseFloat(val)) && 'undefined' !== typeof val ? parseFloat(val) : false;
        };
        $scope._isInt = function (value) {
            return !isNaN(value) &&
                parseInt(Number(value)) == value &&
                !isNaN(parseInt(value, 10));
        };
        $scope.error = false;
        $scope.isEditMode = false;
        $scope.invoiceId = null;
        $scope.orderData = {};
        $scope.billData = {};
        $scope.orderData.store_name = window.store.name;
        $scope.orderData.header = "\nOrder\n\n";
        $scope.billData.store_name = window.store.name;
        $scope.billData.header = "\nBill\n\n";
        $scope.billData.footer = "\nMerchant Copy\n\n";

        // ===============================================
        // Start Customer dropdown list
        // ===============================================

        $scope.customerName = "";
        $scope.customerMobileNumber = "";
        $scope.dueAmount = 0;
        $scope.hideCustomerDropdown = false;
        $scope.customerArray = [];
        $scope.showCustomerList = function (isClick) {
            if ($scope.isEditMode) { return false; }
            if (isClick) { $scope.customerName = ""; }
            if (window.deviceType == 'computer') {
                $("#customer-name").focus();
            }
            $http({
                url: API_URL + "/_inc/pos.php?query_string=" + $scope.customerName + "&field=customer_name&action_type=CUSTOMERLIST&limit=30",
                method: "GET",
                cache: false,
                processData: false,
                contentType: false,
                dataType: "json"
            }).
                then(function (response) {
                    $scope.hideCustomerDropdown = false;
                    $scope.customerArray = [];
                    window.angular.forEach(response.data, function (customerItem, key) {
                        if (customerItem) {
                            $("#customer-dropdown").scrollTop($("#customer-dropdown").offset().top);
                            $("#customer-dropdown").perfectScrollbar("update");
                            $scope.customerArray.push(customerItem);
                        }
                    });

                }, function (response) {
                    if (window.store.sound_effect == 1) {
                        window.storeApp.playSound("error.mp3");
                    }
                    window.toastr.error(response.data.errorMsg, "Warning!");
                });
        };
        $("#customer-name").on("click", function () {
            $scope.showCustomerList(true);
        });
        $scope.addCustomer = function (customer) {
            if ($scope._isInt(customer)) {
                $http({
                    url: API_URL + "/_inc/pos.php?customer_id=" + customer + "&action_type=CUSTOMER",
                    method: "GET",
                    cache: false,
                    processData: false,
                    contentType: false,
                    dataType: "json"
                }).
                    then(function (response) {
                        if (response.data.customer_id) {
                            $scope.addCustomer(response.data);
                        }
                    }, function (response) {
                        if (window.store.sound_effect == 1) {
                            window.storeApp.playSound("error.mp3");
                        }
                        window.toastr.error(response.data.errorMsg, "Warning!");
                    });
            } else if (customer.customer_id) {
                var contact = customer.customer_mobile || customer.customer_email;
                $scope.customerName = customer.customer_mobile + " (" + customer.customer_name + ")";
                $scope.customerMobileNumber = customer.customer_mobile;
                $scope.customerEmail = customer.customer_email;
                $scope.customerId = customer.customer_id;
                $scope.dueAmount = parseFloat(customer.due);
                $scope.hideCustomerDropdown = true;
                var pos_customer = "C: " + $scope.customerName + "\n";
                var ob_info = pos_customer + "\n";
                $scope.orderData.info = ob_info;
                $scope.billData.info = ob_info;
                $scope._calcTotalPayable();
            } else {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Oops!, Invalid customer", "Warning!");
            }
        };
        if (window.getParameterByName("customer_id")) {
            $scope.addCustomer(window.getParameterByName("customer_id"));
        } else {
            // add walking customer to invoice
            $scope.addCustomer(1);
        }

        // ===============================================
        // End Customer dropdown list
        // ===============================================

        // ===============================================
        // Start Product list
        // ===============================================

        $scope.productName = "";
        $scope.showLoader = !1;
        $scope.showAddProductBtn = !1;
        $scope.totalProduct = 0;
        var page = 1;
        $scope.showProductList = function (page, url) {
            $(".pos-product-pagination").empty();
            page = page ? page : 1;
            $scope.showLoader = 1;
            var productCode = $scope.productName;
            var categoryId = $scope.ProductCategoryID ? $scope.ProductCategoryID : '';
            $http({
                url: url ? url : API_URL + "/_inc/pos.php?action_type=PRODUCTLIST&query_string=" + productCode + "&category_id=" + categoryId + "&field=p_name&page=" + page,
                method: "GET",
                cache: false,
                processData: false,
                contentType: false,
                dataType: "json"
            }).
                then(function (response) {
                    $scope.productArray = [];
                    window.angular.forEach(response.data.products, function (productItem, key) {
                        if (productItem) {
                            var find = window._.find($scope.productArray, function (item) {
                                return item.p_id == productItem.p_id;
                            });
                            if (!find) {
                                $scope.productArray.push(productItem);
                            }
                        }
                    });

                    $("#item-list").perfectScrollbar('update');
                    $scope.totalProduct = parseInt($scope.productArray.length);
                    $scope.showLoader = !1;
                    if ($scope.totalProduct == 1 && productCode) {
                        window.angular.forEach(response.data.products, function (productItem, key) {
                            if (productItem) {
                                $scope.addItemToInvoice(productItem.p_code, productItem.unit_id, productItem.vol_unit_small, productItem.sell_price);
                                $scope.productName = '';
                            }
                        });
                    };
                    setTimeout(function () {
                        $scope.$apply(function () {
                            $scope.showAddProductBtn = !parseInt($scope.totalProduct);
                        });
                    }, 100);
                    $(".pos-product-pagination").html(response.data.pagination);
                }, function (response) {
                    if (window.store.sound_effect == 1) {
                        window.storeApp.playSound("error.mp3");
                    }
                    window.toastr.error(response.data.errorMsg, "Warning!");
                });
        };
        $scope.showProductList();

        $(document).delegate(".pos-product-pagination li > a", "click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var $this = $(this);
            var actionURL = $this.attr("href");
            $scope.showProductList(null, actionURL);
        });

        $scope.CustomerEditModal = function () {
            $scope.customer_name = $scope.customerName;
            $scope.customer_id = $scope.customerId;
            CustomerEditModal($scope);
        };

        $("#category-search-select").on('select2:selecting', function (e) {
            var categoryID = e.params.args.data.id;
            $scope.ProductCategoryID = categoryID;
            $scope.showProductList();
        });

        $("#unit-search-select").on('select2:selecting', function (e) {
            var categoryID = e.params.args.data.id;
            $scope.ProductCategoryID = categoryID;
            $scope.showProductList();
        });

        $("#salesman_id").on('select2:selecting', function (e) {
            var salesmanId = e.params.args.data.id;
            $scope.salesmanId = salesmanId;
        });

        // ===============================================
        // End Product list
        // ===============================================

        // ===============================================
        // Start Invoice Calculation
        // ===============================================

        $scope.itemArray = [];
        $scope.totalItem = 0;
        $scope.totalQuantity = 0;
        $scope.totalAmount = 0;
        $scope.discountAmount = 0;
        $scope.taxAmount = 0;
        $scope.itemTaxAmount = 0;
        $scope.shippingAmount = 0;
        $scope.othersCharge = 0;
        $scope.payable = 0;
        $scope.totalPayable = 0;
        $scope.taxInput = 0;
        $scope.discountInput = 0;
        $scope.shippingInput = 0;
        $scope.othersChargeInput = 0;
        $scope.discountType = 'plain';
        $scope.shippingType = 'plain';

        $scope.isInstallment = window.isInstallment;
        $scope.isInstallmentOrder = 0;
        $scope.installmentDuration = 0;
        $scope.installmentIntervalCount = 30;
        $scope.installmentInterestPercentage = 0;
        $scope.installmentInterestAmount = 0;

        $scope._calcDisAmount = function () {
            if (window._.includes($scope.discountInput, '%')) {
                $scope.discountType = 'percentage';
            } else {
                $scope.discountType = 'plain';
            }
            if ($scope.discountInput < 0) {
                $scope.discountAmount = 0;
                $scope.discountInput = 0;
            } else {
                $scope.discountAmount = parseFloat($scope.discountInput);
            }
            //$scope.discountAmount = parseFloat($('#discount-input')).html();
        };
        $scope._calcTaxAmount = function () {
            if ($scope.taxInput < 0 || $scope.taxInput > 100) {
                $scope.taxAmount = 0;
                $scope.taxInput = 0;
            } else {
                $scope.taxAmount = (parseFloat($scope.taxInput) / 100) * parseFloat($scope.totalAmount - $scope.itemTaxAmount);
            }
        };
        $scope._calcShippingAmount = function () {
            if (window._.includes($scope.shippingInput, '%')) {
                $scope.shippingType = 'percentage';
            } else {
                $scope.shippingType = 'plain';
            }
            if ($scope.shippingInput < 0) {
                $scope.shippingAmount = 0;
                $scope.shippingInput = 0;
            } else {
                $scope.shippingAmount = parseFloat($scope.shippingInput);
            }
        };
        $scope._calcOthersCharge = function () {
            if ($scope.othersChargeInput < 0) {
                $scope.othersCharge = 0;
                $scope.othersChargeInput = 0;
            } else {
                $scope.othersCharge = parseFloat($scope.othersChargeInput);
            }
        };

        $scope._calcTotalPayable = function ($childScope) {
            if ($childScope) {
                $scope.installmentInterestAmount = $childScope.installmentInterestAmount;
            } else {
                $scope.installmentInterestAmount = 0;
            }
            var discountPercentage = 0;
            var shippingPercentage = 0;
            $scope._calcDisAmount();
            $scope._calcTaxAmount();
            $scope._calcShippingAmount();
            $scope._calcOthersCharge();
            $scope.payable = ($scope.totalAmount + $scope.taxAmount);
            if ($scope.payable != 0 && ($scope.discountAmount >= $scope.payable)) {
                $scope.discountAmount = 0;
                $scope.discountInput = 0;
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Discount amount must be less than payable amount", "Warning!");
            }
            if ($scope.payable != 0 && ($scope.shippingAmount >= $scope.payable)) {
                $scope.shippingAmount = 0;
                $scope.shippingInput = 0;
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Shipping amount must be less than payable amount", "Warning!");
            }
            if ($scope.discountType == 'percentage') {
                discountPercentage = parseFloat($scope._percentage($scope.payable, $scope.discountAmount));
            } else {
                discountPercentage = parseFloat($scope.discountAmount);
            }

            if ($scope.shippingType == 'percentage') {
                shippingPercentage = parseFloat($scope._percentage($scope.totalPayable, $scope.shippingAmount));
            } else {
                shippingPercentage = parseFloat($scope.shippingAmount);
            }

            $scope.payable = ($scope.payable + shippingPercentage + $scope.othersCharge + $scope.dueAmount) - discountPercentage;
            $scope.totalPayable = $scope.payable + $scope.installmentInterestAmount;
            $scope.billData.totals = "Grand Total   " + $scope.totalPayable;
        };
        $scope.addDiscount = function () {
            $scope._calcTotalPayable();
        };
        $scope.addTax = function () {
            $scope._calcTotalPayable();
        };
        $scope.addShipping = function () {
            $scope._calcTotalPayable();
        };
        $scope.addOthersCharge = function () {
            $scope._calcTotalPayable();
        };
        $scope.itemQuantity = 0;
        $scope.isPrevQuantityCalcculate = false;
        $scope.prevQuantity = 0;
        $scope.itemListHeight = 0;

        // ===============================================
        // End Invoice Calculation
        // ===============================================


        // ===============================================
        // Start Add Product to Invoice
        // ===============================================

        $scope.addItemToInvoice = function (id, unit_id, vol_unit, sell_price_small, qty, index) {
            var proQty;
            //EDITED BY FAHRUR REZA START
            //let discount = $("#discount_" + id).val();
            let discount = 0;
            let discount_amount = 0;
            let price = $("#price_" + id).html();

            //ENDITED BY FAHRUR REZA END
            var qty = parseFloat(qty);
            if (!qty) {
                qty = 1;
            }
            if (index != null) {
                var selectItem = $("#" + index);
                $("#item-list .item").removeClass("select");
                if (selectItem.length) {
                    selectItem.addClass("select");
                }
            }
            var $queryString = "p_id=" + id + "&action_type=PRODUCTITEM";
            if (window.getParameterByName("invoice_id")) {
                $queryString += "&is_edit_mode=1";
            }
            $http({
                url: API_URL + "/_inc/pos.php?" + $queryString,
                method: "GET",
                cache: false,
                processData: false,
                contentType: false,
                dataType: "json"
            }).
                then(function (response) {
                    if (response.data.p_id) {
                        var find = window._.find($scope.itemArray, function (item) {
                            return item.id == response.data.p_id;
                        });
                        proQty = parseFloat(response.data.quantity_in_stock);

                        qty = proQty > 0 && proQty < 1 ? proQty : qty;
                        if (find) {
                            window._.map($scope.itemArray, function (item) {
                                if (item.id == response.data.p_id) {
                                    if (!$scope.isPrevQuantityCalcculate && window.getParameterByName("customer_id") && window.getParameterByName("invoice_id")) {
                                        $scope.isPrevQuantityCalcculate = true;
                                        $scope.prevQuantity = item.quantity;
                                    }

                                    $scope.itemQuantity = item.quantity - $scope.prevQuantity;
                                    if ((qty > response.data.quantity_in_stock || $scope.itemQuantity >= response.data.quantity_in_stock) && response.data.p_type != 'service') {
                                        if (window.store.sound_effect == 1) {
                                            window.storeApp.playSound("error.mp3");
                                        }
                                        window.toastr.error("This product is out of stock!", "Warning!");
                                        return false;
                                    }

                                    var uom = String($("#unitItem" + id).html());

                                    let small = uom.indexOf((response.data.uom_small));
                                    let medium = uom.indexOf((response.data.uom_medium));
                                    let large = uom.indexOf((response.data.uom_large));

                                    // if(small == 0)
                                    // {
                                    //     let limitStock = response.data.vol_unit_small * item.quantity;
                                    //     if(proQty < limitStock)
                                    //     {
                                    //         if (window.store.sound_effect == 1) {
                                    //             window.storeApp.playSound("error.mp3");
                                    //         }
                                    //         window.toastr.error("This product is out of stock!", "Warning!");
                                    //         document.getElementById("unitItem"+id).innerHTML = item.unitName +" <i class='fa fa-angle-down' ng-click='dropdown(items.id)'></i>";
                                    //         $("#price_"+id).html(parseFloat(item.sell_price));
                                    //         item.quantity = 1;
                                    //         return false;
                                    //     }
                                    // }
                                    if (medium == 0) {
                                        let limitStock = response.data.vol_unit_medium * (item.quantity + 1);
                                        if (proQty < limitStock) {
                                            if (window.store.sound_effect == 1) {
                                                window.storeApp.playSound("error.mp3");
                                            }
                                            window.toastr.error("This product is out of stock!", "Warning!");
                                            document.getElementById("unitItem" + id).innerHTML = item.unitName + " <i class='fa fa-angle-down' ng-click='dropdown(items.id)'></i>";
                                            $("#price_" + id).html(parseFloat(item.sell_price));

                                            return false;
                                        }
                                    }
                                    if (large == 0) {
                                        let limitStock = response.data.vol_unit_large * item.quantity;
                                        if (proQty < limitStock) {
                                            if (window.store.sound_effect == 1) {
                                                window.storeApp.playSound("error.mp3");
                                            }
                                            window.toastr.error("This product is out of stock!", "Warning!");
                                            document.getElementById("unitItem" + id).innerHTML = item.unitName + " <i class='fa fa-angle-down' ng-click='dropdown(items.id)'></i>";
                                            $("#price_" + id).html(parseFloat(item.sell_price));

                                            return false;
                                        }
                                    }

                                    if (window.store.sound_effect == 1) {
                                        window.storeApp.playSound("access.mp3");
                                    }

                                    var taxamount = 0;
                                    if (settings.invoice_view == 'indian_gst') {
                                        taxamount = 0;
                                    } else if (response.data.tax_method == 'exclusive') {
                                        taxamount = parseFloat(response.data.tax_amount);
                                        $scope.itemTaxAmount = taxamount;
                                    }
                                    $("#item_quantity_" + item.id).val(++item.quantity);

                                    if (!price && !discount) {
                                        price = sell_price_small;
                                        discount = 0;
                                    }

                                    //item.discount = sell_discount;
                                    // alert(response.data.sell_discount);
                                    if (response.data.discount_active == 1) {
                                        discount_amount = (response.data.sell_discount / 100) * (parseFloat(price) * item.quantity);
                                        item.discount_amount = discount_amount;
                                    }
                                    $("#item_discount_" + item.id).val(item.discount_amount);

                                    item.subTotal = (parseFloat(price) * item.quantity) + taxamount - discount_amount;
                                    //alert(item.subTotal);
                                    $scope.totalQuantity = $scope.totalQuantity + qty;
                                    $scope.totalAmount = $scope.totalAmount + ((parseFloat(price) * qty - (response.data.sell_discount / 100) * parseFloat(price) * qty)) + taxamount;
                                }
                            });
                        } else {
                            if ((qty > response.data.quantity_in_stock) && response.data.p_type != 'service') {
                                if (window.store.sound_effect == 1) {
                                    window.storeApp.playSound("error.mp3");
                                }
                                window.toastr.error("This product is out of stock!", "Warning!");
                                return false;
                            }
                            if (window.store.sound_effect == 1) {
                                window.storeApp.playSound("access.mp3");
                            }
                            var taxamount = 0;
                            if (response.data.tax_method == 'exclusive') {
                                taxamount = parseFloat(response.data.tax_amount);
                                $scope.itemTaxAmount = taxamount;
                            }
                            var additonalTaxAmount = taxamount;
                            if (settings.invoice_view == 'indian_gst') {
                                additonalTaxAmount = 0;
                            }
                            var item = [];
                            item.id = response.data.p_id;
                            item.pType = response.data.p_type;
                            item.categoryId = response.data.category_id;
                            item.supId = response.data.sup_id;
                            item.name = response.data.p_name;
                            item.unit_id = response.data.unit_id;
                            item.vol_unit = vol_unit;
                            item.unit_id_small = response.data.unit_id;
                            item.unit_id_medium = response.data.unit_id_medium;
                            item.unit_id_large = response.data.unit_id_large;
                            item.unit_name = response.data.unit_name;
                            item.unitName = response.data.unit_name;
                            item.unitName_medium = response.data.uom_medium;
                            item.unitName_large = response.data.uom_large;
                            item.unitName_small = response.data.uom_small;
                            item.vol_medium = response.data.vol_unit_medium;
                            item.vol_large = response.data.vol_unit_large;
                            item.vol_small = response.data.vol_unit_small;
                            item.stock = response.data.quantity_in_stock;
                            item.sell_price = response.data.sell_price;
                            item.sell_price_medium = response.data.sell_price_medium;
                            item.sell_price_large = response.data.sell_price_large;
                            item.taxamount = taxamount;
                            item.price = parseFloat(response.data.sell_price) + additonalTaxAmount;
                            item.quantity = qty;

                            if (response.data.discount_active == 1) {
                                item.sell_discount = response.data.sell_discount;
                                item.discount_amount = (response.data.sell_discount / 100) * response.data.sell_price;
                                item.subTotal = (parseFloat(response.data.sell_price) * qty) - ((response.data.sell_discount / 100) * response.data.sell_price) + additonalTaxAmount;
                            } else {
                                item.sell_discount = 0;
                                item.discount_amount = 0;
                                item.subTotal = (parseFloat(response.data.sell_price) * qty) + additonalTaxAmount;
                            }
                            $scope.itemArray.push(item);

                            // $scope.totalQuantity = $scope.totalQuantity + qty;
                            // $scope.totalAmount = $scope.totalAmount + (parseFloat(response.data.sell_price) * qty) - item.discount_amount + additonalTaxAmount;
                            // $scope.itemArray.push(item);
                        }
                        var total_discount = 0;
                        var total_price = 0;
                        var total_qty = 0;
                        for (let i = 0; i < $scope.itemArray.length; i++) {
                            total_qty += $scope.itemArray[i].quantity;
                            total_discount += $scope.itemArray[i].discount_amount;
                            total_price += $scope.itemArray[i].subTotal;
                        }
                        $scope.totalDiscount = total_discount;
                        $scope.totalQuantity = total_qty;
                        $scope.totalAmount = total_price;

                        $scope.totalItem = window._.size($scope.itemArray);
                        $scope._calcTotalPayable();
                        $scope.productName = '';
                        if (window.deviceType == 'computer') {
                            $("#product-name").focus();
                        }
                        var ele = $("#invoice-item-" + response.data.p_id).parent();
                        if (ele.length) {
                            $scope.itemListHeight = ele.position().top;
                        } else {
                            $scope.itemListHeight += 61;
                        }
                        $("#invoice-item-list").animate({ scrollTop: $scope.itemListHeight }, 1).perfectScrollbar("update");
                        setTimeout(function () {
                            if (!ele.length) {
                                ele = $("#invoice-item-list table tr:last-child");
                            }
                            var flashColor = "#26ff9c";
                            var originalColor = ele.css("backgroundColor");
                            ele.css("backgroundColor", flashColor);
                            setTimeout(function () {
                                ele.css("backgroundColor", originalColor);
                            }, 300);
                        }, 100);
                        $scope.billData.totals += "\n\nItems: " + $scope.totalItem + " (" + $scope.totalQuantity + ")\n";
                        $scope.setBillandOrderItems();
                    }
                    $scope.showLoader = !1;

                    window.onbeforeunload = function () {
                        return "Data will be lost if you leave the page, are you sure?";
                    };

                }, function (response) {
                    if (window.store.sound_effect == 1) {
                        window.storeApp.playSound("error.mp3");
                    }
                    window.toastr.error(response.data.errorMsg, "Warning!");
                    $scope.showLoader = !1;
                });
        };

        // ===============================================
        // End Add Product to Invoice
        // ===============================================


        // ===============================================
        // Start dropdown to Invoice by Fahrur Reza
        // ===============================================
        $scope.dropdown = function (id) {
            $('#myDropdown' + id).addClass('dropdown-content show');
        };
        // ===============================================
        // End dropdown to Invoice by Fahrur Reza
        // ===============================================


        // ===============================================
        // Start UnitList to Invoice by Fahrur Reza
        // ===============================================

        $scope.unitChange = function (id, unit, price, vol, unit_id, qty) {
            $('#myDropdown' + id).removeClass('show');
            $("#price_" + id).html(parseFloat(price));
            $("#item_unit_id_" + id).val(unit_id);

            let discount = $("#discount_" + id).html();
            let quantity = $("#item_quantity_" + id).val();
            let total_quantity = $("#total_quantity").html();
            let discount_amount = 0;

            document.getElementById("unitItem" + id).innerHTML = unit + " <i class='fa fa-angle-down' ng-click='dropdown(items.id)'></i>";

            var qty = parseFloat(qty);
            if (!qty) {
                qty = 1;
            }
            if (id) {
                var find = window._.find($scope.itemArray, function (item) {
                    return item.id == id;
                });
                if (find) {
                    window._.map($scope.itemArray, function (item) {
                        if (item.id == id) {
                            if (parseFloat(item.stock) < (item.quantity * vol)) {
                                if (window.store.sound_effect == 1) {
                                    window.storeApp.playSound("error.mp3");
                                }
                                window.toastr.error("This product is out of stock!", "Warning!");
                                document.getElementById("unitItem" + id).innerHTML = item.unitName + " <i class='fa fa-angle-down' ng-click='dropdown(items.id)'></i>";
                                $("#price_" + id).html(parseFloat(item.sell_price));
                                $("#item_quantity_" + id).val(1);
                                item.quantity = 1;
                                item.subTotal = parseFloat(item.sell_price);
                                item.price = item.sell_price;
                                item.discount = item.sell_discount;
                                $scope.totalAmount = $scope.totalAmount;
                                discount_amount = (price * quantity) * (discount / 100);
                                item.discount_amount = discount_amount;
                                // $("#item_discount_" + id).html(0);
                                $("#item_unit_id_" + id).val(item.unit_id_small);
                                // $("#item_discount_" + id).html(item.discount_amount);
                                $scope.totalQuantity = (total_quantity - quantity) + 1;
                                // console.log(item.discount_amount);
                                // var total_discount = 0;
                                // var total_price = 0;

                                // var i;
                                // for (i = 0; i < $scope.itemArray.length; i++) {
                                //     total_discount += parseInt($("#item_discount_" + $scope.itemArray[i].id).val());
                                //     total_price += parseInt($("#price_" + $scope.itemArray[i].id).html()) * $("#item_quantity_" + $scope.itemArray[i].id).val();
                                //     // total_price += parseFloat($('$subTotal_' + $scope.itemArray[i].id).html());
                                //     // alert(total_price);
                                // }

                                $scope.totalAmount = parseFloat(total_price - total_discount);
                                return false;
                            }
                            item.unit_name = unit;
                            item.unit_id = unit_id;
                            item.vol_unit = vol;
                            item.price = price;
                            discount_amount = (price * quantity) * (discount / 100);
                            item.discount_amount = discount_amount;
                            $("#item_discount_" + id).val(discount_amount);
                            item.subTotal = (price * quantity) - discount_amount;

                            let total_discount = 0;
                            let total_price = 0;
                            let total_qty = 0;
                            for (let i = 0; i < $scope.itemArray.length; i++) {
                                total_qty += $scope.itemArray[i].quantity;
                                total_discount += $scope.itemArray[i].discount_amount;
                                total_price += $scope.itemArray[i].subTotal;
                            }
                            $scope.totalQuantity = total_qty;
                            $scope.totalDiscount = total_discount;
                            $scope.totalAmount = total_price;
                        }

                    });
                }
                $scope.totalItem = window._.size($scope.itemArray);

                $scope._calcTotalPayable();
            }
            // ⛔️ Cannot set properties of null (setting 'innerHTML')
            // document.getElementById('unitItem'+id).innerHTML = '';
        };

        // ===============================================
        // End UnitList to Invoice by Fahrur Reza
        // ===============================================

        $scope.defaultDiscount = function (id) {
            const discount = parseInt($("#item_discount_" + id).html());
            if (isNaN(discount)) {
                $("#item_discount_" + id).val(0);
            }
        };

        // ============================================
        // Start Discount Invoice Item By Fahrur Reza
        // ============================================

        $scope.discountItemToInvoice = function (id, qty) {
            const discount = parseInt($("#item_discount_" + id).val());
            // const amount = parseInt($("#totalAmount").html())
            let price = $("#price_" + id).html();
            let quantity = $("#item_quantity_" + id).val();

            var qty = parseFloat(qty);
            if (!qty) {
                qty = 1;
            }
            if (id) {
                var find = window._.find($scope.itemArray, function (item) {
                    return item.id == id;
                });
                if (find) {
                    window._.map($scope.itemArray, function (item) {
                        if (item.id == id) {
                            if (isNaN(discount)) {
                                var disc = 0;
                            }
                            else {
                                var disc = discount;
                            }
                            if (disc < 0) {
                                if (window.store.sound_effect == 1) {
                                    window.storeApp.playSound("error.mp3");
                                }
                                $("#item_discount_" + id).val(0);
                                var disc = 0;
                                window.toastr.error("Quantity can't be less than 0", "Warning!");
                            }

                            item.subTotal = (price * quantity) - disc;

                        }

                        var total_discount = 0;
                        var total_price = 0;
                        var i;
                        for (i = 0; i < $scope.itemArray.length; i++) {
                            total_discount += parseInt($("#item_discount_" + $scope.itemArray[i].id).val());
                            total_price += parseInt($("#price_" + $scope.itemArray[i].id).html()) * $("#item_quantity_" + $scope.itemArray[i].id).val();
                        }

                        $scope.totalAmount = parseFloat(total_price - total_discount);


                    });
                }
                $scope.totalItem = window._.size($scope.itemArray);

                $scope._calcTotalPayable();
            }
        };

        // ============================================
        // End Discount Invoice Item By Fahrur Reza
        // ============================================

        // ============================================
        // Start Decrease Invoice Item Quantity
        // ============================================

        $scope.DecreaseItemFromInvoice = function (id, qty) {

            let price = $("#price_" + id).html();
            let discount = $("#discount_" + id).html();
            let discount_amount = 0;
            let decrease_amount = 0;
            var qty = parseFloat(qty);

            if (!qty) {
                qty = 1;
            }
            if (id) {
                var find = window._.find($scope.itemArray, function (item) {
                    return item.id == id;
                });
                if (find) {
                    window._.map($scope.itemArray, function (item) {
                        if (item.id == id) {
                            if (item.quantity > 1) {
                                if (window.store.sound_effect == 1) {
                                    window.storeApp.playSound("modify.mp3");
                                }
                                item.quantity = parseFloat(item.quantity) - qty;
                                $("#item_quantity_" + item.id).val(item.quantity);

                                if (parseInt(discount) > 0) {
                                    discount_amount = (discount / 100) * (parseFloat(price) * item.quantity);
                                    item.discount_amount = discount_amount;
                                    decrease_amount = (parseFloat(price) * qty) - discount_amount;
                                    item.subTotal = item.subTotal - decrease_amount;
                                } else {
                                    decrease_amount = parseFloat(price) * item.quantity;
                                    // alert('decrease amount');
                                    item.subTotal = parseFloat(price) * item.quantity;
                                }

                                $("#item_discount_" + item.id).val(discount_amount);

                                // $scope.totalQuantity = $scope.totalQuantity - qty;
                                // $scope.totalAmount = $scope.totalAmount - decrease_amount;
                            } else {
                                if (window.store.sound_effect == 1) {
                                    window.storeApp.playSound("error.mp3");
                                }
                                window.toastr.error("Quantity can't be less than 1", "Warning!");
                            }
                        }
                    });
                }
                //console.log($scope.itemArray);
                //alert('decrease');
                var total_discount = 0;
                var total_price = 0;
                var total_qty = 0;

                for (let i = 0; i < $scope.itemArray.length; i++) {
                    total_qty += $scope.itemArray[i].quantity;
                    total_discount += $scope.itemArray[i].discount_amount;
                    total_price += $scope.itemArray[i].subTotal;
                }
                $scope.totalQuantity = total_qty;
                $scope.totalDiscount = total_discount;
                $scope.totalAmount = total_price;

                $scope.totalItem = window._.size($scope.itemArray);
                $scope._calcTotalPayable();
            }
        };

        // ============================================
        // End Decrease Invoice Item Quantity
        // ============================================


        // ===================================================
        // Start Remove Item from Invoice
        // ===================================================

        $scope.removeItemFromInvoice = function (index, id) {
            if (window.store.sound_effect == 1) {
                window.storeApp.playSound("modify.mp3");
            }
            if ($scope.isEditMode) {
                if ($scope.itemArray.length <= 1) {
                    if (window.store.sound_effect == 1) {
                        window.storeApp.playSound("error.mp3");
                    }
                    window.toastr.error("Last item can not be removed!", "Warning!");
                    return false;
                }
            }

            window._.map($scope.itemArray, function (item, key) {
                if (item.id == id) {
                    $scope.totalQuantity = $scope.totalQuantity - item.quantity;
                    $scope.totalAmount = $scope.totalAmount - parseFloat(item.subTotal);
                    $scope.totalItem = $scope.totalItem - 1;
                }
            });
            $scope._calcTotalPayable();
            $scope.itemArray.splice(index, 1);
            $scope.totalItem = window._.size($scope.itemArray);
            $scope.setBillandOrderItems();
        };

        // if invocie edit mode then disable customer dropdown
        if (window.getParameterByName("customer_id") && window.getParameterByName("invoice_id")) {
            $scope.isEditMode = true;
        }

        // ===================================================
        // End Remove Item from Invoice
        // ===================================================


        // ====================================================
        // Start holding order 
        // ====================================================
        $scope.loadHoldingOrder = function () {
            if (window.getParameterByName("holding_id")) {
                $scope.ref_no = window.getParameterByName("holding_id");
                $http({
                    url: API_URL + "/_inc/holding_order.php?action_type=EDIT&ref_no=" + $scope.ref_no,
                    method: "GET",
                    cache: false,
                    processData: false,
                    contentType: false,
                    dataType: "json"
                }).
                    then(function (response) {
                        var contact = response.data.order.customer_mobile || response.data.order.customer_email;
                        $scope.customerName = response.data.order.customer_name + " (" + contact + ")";
                        $scope.customerMobileNumber = response.data.order.customer_mobile;
                        $("#customer-mobile-number").val($scope.customerMobileNumber);
                        $("#invoice-note").data("note", response.data.order.invoice_note);
                        $scope.customerId = response.data.order.customer_id;
                        $scope.dueAmount = parseFloat(response.data.order.customer.due);
                        $scope.totalPayable = window.getNumber(response.data.order.payable_amount);
                        $scope.totalAmount = window.getNumber(response.data.order.subtotal);
                        $scope.taxInput = (window.getNumber(response.data.order.order_tax) / $scope.totalAmount) * 100;
                        if (response.data.order.discount_type == 'percentage') {
                            $scope.discountType = 'percentage';
                            $scope.discountAmount = (window.getNumber(response.data.order.discount_amount) / $scope.totalAmount) * 100;
                            $scope.discountInput = $scope.discountAmount + '%';
                        } else {
                            $scope.discountType = 'plain';
                            $scope.discountAmount = window.getNumber(response.data.order.discount_amount);
                            $scope.discountInput = $scope.discountAmount;
                        }
                        if (response.data.order.shipping_type == 'percentage') {
                            $scope.shippingType = 'percentage';
                            $scope.shippingAmount = (window.getNumber(response.data.order.shipping_amount) / $scope.totalAmount) * 100;
                            $scope.shippingInput = $scope.shippingAmount + '%';
                        } else {
                            $scope.shippingType = 'plain';
                            $scope.shippingAmount = window.getNumber(response.data.order.shipping_amount);
                            $scope.shippingInput = $scope.shippingAmount;
                        }
                        $scope.taxAmount = response.data.order.order_tax;
                        $scope.othersChargeInput = window.getNumber(response.data.order.others_charge);
                        $scope.othersCharge = response.data.order.others_charge;
                        window.angular.forEach(response.data.items, function (productItem) {
                            if (productItem) {
                                var item = [];
                                item.isSingleProduct = false;
                                item.id = productItem.item_id;
                                item.pType = productItem.p_type;
                                item.categoryId = productItem.category_id;
                                item.supId = productItem.sup_id;
                                item.name = productItem.item_name;
                                item.price = window.getNumber(productItem.item_price);
                                item.quantity = window.getNumber(productItem.item_quantity);
                                item.subTotal = parseFloat(productItem.item_price) * productItem.item_quantity;
                                $scope.totalItem = $scope.totalItem + 1;
                                $scope.totalQuantity = $scope.totalQuantity + parseInt(productItem.item_quantity);
                                $scope.itemArray.unshift(item);
                            }
                        });

                    }, function (response) {
                        if (window.store.sound_effect == 1) {
                            window.storeApp.playSound("error.mp3");
                        }
                        window.toastr.warning(response.data.errorMsg, "Warning!");
                        window.location = window.baseUrl + '/admin/pos.php';
                    });
            }
        }
        $scope.loadHoldingOrder();
        $scope.holdingOrderDetailsModal = function () {
            HoldingOrderDetailsModal($scope);
        }
        // ============================================
        // End Holding Order
        // ============================================


        // ====================================================
        // Start Quotation
        // ====================================================
        $scope.loadQuotationOrder = function () {
            if (window.getParameterByName("qref")) {
                $scope.ref_no = window.getParameterByName("qref");
                $scope.qRef = window.getParameterByName("qref");
                $http({
                    url: window.baseUrl + "/_inc/ajax.php?type=QUOTATIONINFO",
                    dataType: "json",
                    method: "post",
                    data: $.param({
                        ref_no: $scope.ref_no,
                    }),
                }).
                    then(function (response) {
                        var quotation = response.data.quotation;
                        $scope.customerName = quotation.customer_name;
                        $scope.customerMobileNumber = quotation.customer_mobile;
                        $("#customer-mobile-number").val($scope.customerMobileNumber);
                        $("#invoice-note").data("note", quotation.quotation_note);
                        $scope.customerId = quotation.customer_id;
                        $scope.dueAmount = 0;
                        $scope.totalPayable = window.getNumber(quotation.payable_amount);
                        $scope.totalAmount = window.getNumber(quotation.subtotal);
                        $scope.taxInput = window.getNumber(quotation.order_tax);
                        if (quotation.discount_type == 'percentage') {
                            $scope.discountType = 'percentage';
                            $scope.discountAmount = (window.getNumber(quotation.discount_amount) / $scope.totalAmount) * 100;
                            $scope.discountInput = $scope.discountAmount + '%';
                        } else {
                            $scope.discountType = 'plain';
                            $scope.discountAmount = window.getNumber(quotation.discount_amount);
                            $scope.discountInput = $scope.discountAmount;
                        }
                        if (quotation.shipping_type == 'percentage') {
                            $scope.shippingType = 'percentage';
                            $scope.shippingAmount = (window.getNumber(quotation.shipping_amount) / $scope.totalAmount) * 100;
                            $scope.shippingInput = $scope.shippingAmount + '%';
                        } else {
                            $scope.shippingType = 'plain';
                            $scope.shippingAmount = window.getNumber(quotation.shipping_amount);
                            $scope.shippingInput = $scope.shippingAmount;
                        }
                        $scope.taxAmount = quotation.order_tax;
                        $scope.taxAmount = quotation.order_tax;
                        $scope.othersChargeInput = window.getNumber(quotation.others_charge);
                        $scope.othersCharge = quotation.others_charge;
                        window.angular.forEach(quotation.items, function (productItem) {
                            if (productItem) {
                                var item = [];
                                item.isSingleProduct = false;
                                item.qtytype = 'group';
                                if (productItem.item_qty_type == 'group') {
                                    item.id = 0;
                                    item.group_id = productItem.item_id;
                                } else {
                                    item.id = productItem.item_id;
                                    item.group_id = 0;
                                }
                                item.pType = productItem.p_type;
                                item.categoryId = productItem.category_id;
                                item.supId = productItem.sup_id;
                                item.name = productItem.item_name;
                                item.price = window.getNumber(productItem.item_price);
                                item.quantity = window.getNumber(productItem.item_quantity);
                                item.subTotal = parseFloat(productItem.item_price) * productItem.item_quantity;
                                $scope.totalItem = $scope.totalItem + 1;
                                $scope.totalQuantity = $scope.totalQuantity + parseInt(productItem.item_quantity);
                                $scope.itemArray.unshift(item);
                            }
                        });

                    }, function (response) {
                        if (window.store.sound_effect == 1) {
                            window.storeApp.playSound("error.mp3");
                        }
                        window.toastr.warning(response.data.errorMsg, "Warning!");
                        window.location = window.baseUrl + '/admin/pos.php';
                    });
            }
        }
        $scope.loadQuotationOrder();
        // ============================================
        // End Quotation
        // ============================================


        // ============================================
        // Start Reset POS
        // ============================================

        $scope.resetPos = function (force) {
            localStorage.getItem("swal");
            localStorage.setItem("swal", "");
            if (force == 1 && (window.getParameterByName("customer_id") || window.getParameterByName("holding_id") || window.getParameterByName("qref"))) {
                window.location = "pos.php";
            } else {
                $scope.customerArray = [];
                $scope.itemArray = [];
                $scope.invoiceId = "";
                $scope.invoiceNote = "";
                $scope.hideCustomerDropdown = true;
                $scope.taxInput = 0;
                $scope.dueAmount = 0;
                $scope.customerName = "";
                $scope.customerId = "";
                $scope.totalItem = 0;
                $scope.totalQuantity = 0;
                $scope.totalAmount = 0;
                $scope.discountAmount = 0;
                $scope.shippingAmount = 0;
                $scope.othersCharge = 0;
                $scope.payable = 0;
                $scope.totalPayable = 0;
                $scope.discountInput = 0;
                $scope.shippingInput = 0;
                $scope.othersChargeInput = 0;
                $scope.addCustomer(1);
                $("#invoice-note").data("note", "");
                $scope.resetBillandOrderItems();
                $scope.showProductList();
                window.onbeforeunload = null;
            }
        };

        // ============================================
        // End Reset POS
        // ============================================


        // =============================================
        // Start Context Menu by Pay Button Right Click
        // =============================================

        $('#pay-button').contextMenu({
            selector: 'button',
            callback: function (key, options) {
                switch (key) {
                    case "reset":
                        $scope.resetPos(true);
                        break;
                }
            },
            items: {
                "reset": { name: "Reset Invoice", icon: "fa-circle-o" },
            }
        });

        // =============================================
        // End Context Menu by Pay Button Right Click
        // =============================================


        // =============================================
        // Start Print Popup Window
        // =============================================

        $scope.popupWindow = function (data) {
            var mywindow = window.open('', 'pos_print', 'height=500,width=300');
            mywindow.document.write('<html><head><title>Print</title>');
            mywindow.document.write('</head><body >');
            mywindow.document.write(data);
            mywindow.document.write('</body></html>');
            mywindow.print();
            mywindow.close();
            return true;
        };

        // =============================================
        // End Print Popup Window
        // =============================================


        // ============================================
        // Start Bill and Order Items
        // ============================================

        $scope.setBillandOrderItems = function () {
            $scope.orderData.items = '';
            $scope.billData.items = '';
            var billaOrderinc = 1;
            var orderItem = '';
            var billItem = '';
            window._.map($scope.itemArray, function (item, key) {
                if (item.id) {
                    orderItem += "#";
                    orderItem += billaOrderinc;
                    orderItem += " - " + item.name;
                    orderItem += "\n   ";
                    orderItem += '[' + item.quantity + ']';
                    orderItem += "\n\n";
                    billItem += "#";
                    billItem += billaOrderinc;
                    billItem += " - " + item.name;
                    billItem += "\n   ";
                    billItem += item.quantity;
                    billItem += " x " + item.price;
                    billItem += "   " + item.subTotal;
                    billItem += "\n";
                }
                billaOrderinc++;
            });
            $scope.orderData.items = orderItem;
            $scope.billData.items = billItem;
        };

        $scope.resetBillandOrderItems = function () {
            $scope.orderData.header = '';
            $scope.orderData.footer = '';
            $scope.orderData.info = '';
            $scope.orderData.items = {};
            $scope.billData.items = {};
            $scope.orderData.store_name = '';
            $scope.orderData.totals = '';
        };

        // ============================================
        // End Bill and Order Items
        // ============================================


        // =============================================
        // Start Order and Bill Print
        // =============================================

        $scope.printOrder = function () {
            $.each(window.orderPrinters, function () {
                var socket_data = {
                    'printer': this,
                    'logo': '',
                    'text': $scope.orderData
                };
                $.get(window.baseUrl + '_inc/print.php', { data: JSON.stringify(socket_data) });
            });
            return false;
        };

        $scope.printBill = function () {
            var socket_data = {
                'printer': window.printer,
                'logo': '',
                'text': $scope.billData
            };
            $.get(window.baseUrl + '/_inc/print.php', { data: JSON.stringify(socket_data) });
            return false;
        };

        $scope.clickOnPrintOrder = function () {
            if ($scope.itemArray.length <= 0) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Please, select at least one product item", "Warning!");
                return false;
            }
            if (window.store.remote_printing != 1) {
                $scope.printOrder();
            } else {
                $scope.popupWindow($('#order_tbl').html());
            }
        };

        $scope.clickOnPrintBill = function () {
            if ($scope.itemArray.length <= 0) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Please, select at least one product item", "Warning!");
                return false;
            }
            if (window.store.remote_printing != 1) {
                $scope.printBill();
            } else {
                $scope.popupWindow($('#bill_tbl').html());
            }
        };

        // =============================================
        // End Order and Bill Print
        // =============================================


        // =============================================
        // Start Popup Invoice Payment Form
        // =============================================

        $scope.payNow = function () {
            $scope.invoiceNote = $("#invoice-note").data("note");
            if ($scope.itemArray.length <= 0) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Please, select at least one product item", "Warning!");
                return false;
            }
            if (!$scope.customerName) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Please, select a customer", "Warning!");
                return false;
            }
            $scope.customerId = $(document).find("input[name=\"customer-id\"]").val();
            if ($("#customer-mobile-number").val()) {
                $scope.customerMobileNumber = $("#customer-mobile-number").val();
            }
            setTimeout(function () {
                PaymentFormModal($scope);
            }, 300);
        }

        // =============================================
        // End Popup Invoice Payment Form
        // =============================================


        // =============================================
        // Start Input Item Quantity Manually
        // =============================================

        $scope.triggerKeyup = false;
        $(document).delegate(".item_quantity", "keyup", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            var itemid = $(this).data("itemid");
            var itemquantity = $(this).val();
            var discount_amount = 0;
            var totalAmount = 0;
            window._.map($scope.itemArray, function (item) {
                if (item.id == itemid) {
                    item.quantity = itemquantity;
                    discount_amount = (item.sell_discount / 100) * (item.price * item.quantity);
                    item.subTotal = item.price * itemquantity - discount_amount;
                    $scope.$applyAsync(function () {
                        $scope.itemArray = $scope.itemArray;
                    });
                }
                totalAmount += item.subTotal;
                $scope.$applyAsync(function () {
                    $scope.totalAmount = totalAmount;
                    $scope._calcTotalPayable();
                });
            });
            if ($scope.triggerKeyup == false) {
                $scope.error = false;
            } else {
                $scope.triggerKeyup = false;
            }
        });
        $(document).on('click', function (e) {
            if ($scope.error == false) {
                window._.map($scope.itemArray, function (item) {
                    var itemquantity = parseFloat($("#item_quantity_" + item.id).val());
                    var $queryString = "p_id=" + item.id + "&action_type=PRODUCTITEM";
                    $http({
                        url: API_URL + "/_inc/pos.php?" + $queryString,
                        method: "GET",
                        cache: false,
                        processData: false,
                        contentType: false,
                        dataType: "json"
                    }).
                        then(function (response) {
                            if (response.data.p_id) {
                                if ((itemquantity > response.data.quantity_in_stock || $scope.itemQuantity >= response.data.quantity_in_stock) && response.data.p_type != 'service') {
                                    if ($scope.error == false) {
                                        $scope.error = true;
                                        $scope.triggerKeyup = true;
                                        $("#item_quantity_" + item.id).val(response.data.quantity_in_stock).trigger("keyup");
                                        $(document).trigger("click");
                                        if (window.store.sound_effect == 1) {
                                            window.storeApp.playSound("error.mp3");
                                        }
                                        window.toastr.error("This product is out of stock!", "Warning!");
                                    }
                                } else {
                                    $scope.error = true;
                                    $scope.triggerKeyup = true;
                                }
                            }
                        }, function (response) {
                            if (window.store.sound_effect == 1) {
                                window.storeApp.playSound("error.mp3");
                            }
                            window.toastr.error(response.data.errorMsg, "Warning!");
                        });
                });
            }
        });

        // =============================================
        // End Input Item Quantity Manually
        // =============================================    


        // =============================================
        // Start Input Item Price Manually
        // =============================================    

        if (window.settings.change_item_price_while_billing == 1) {
            $(document).delegate(".item_price", "keyup", function (e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                var itemid = $(this).data("itemid");
                var itemprice = $(this).val();
                var totalAmount = 0;
                window._.map($scope.itemArray, function (item) {
                    if (item.id == itemid) {
                        item.price = itemprice;
                        discount_amount = (item.sell_discount / 100) * (item.price * item.quantity);
                        item.subTotal = item.price * itemquantity - discount_amount;
                        console.log(item.subtotal);
                        //item.subTotal = item.quantity * itemprice;
                        $scope.$apply(function () {
                            $scope.itemArray = $scope.itemArray;
                        });
                    }
                    totalAmount += item.subTotal;
                    $scope.$apply(function () {
                        $scope.totalAmount = totalAmount;
                        $scope._calcTotalPayable();
                    });
                });
            });
        }

        // =============================================
        // End Input Item Price Manually
        // =============================================    


        // =============================================
        // Start Popup Customer Mobile Number Edit Modal
        // =============================================

        $(document).delegate("#add-customer-mobile-number-handler", "click", function (e) {
            e.stopPropagation();
            e.preventDefault();
            $scope.customerMobileNumber = $("#customer-mobile-number").val();
            AddCustomerMobileNumberModal($scope);
        })

        // =============================================
        // End Popup Customer Mobile Number Edit Modal
        // =============================================


        // =============================================
        // Start Popup Invoice Note Modal
        // =============================================

        $scope.addInvoiceNote = function () {
            $scope.invoiceNote = $("#invoice-note").data("note");
            AddInvoiceNoteModal($scope);
        };

        // =============================================
        // End Popup Invoice Note Modal
        // =============================================


        // Hold an order
        $scope.HoldingOrderModal = function (orderType) {
            if ($scope.itemArray.length <= 0) {
                if (window.store.sound_effect == 1) {
                    window.storeApp.playSound("error.mp3");
                }
                window.toastr.error("Please, select at least one product item", "Warning!");
                return false;
            }
            if ($("#customer-mobile-number").val()) {
                $scope.customerMobileNumber = $("#customer-mobile-number").val();
            }
            HoldingOrderModal($scope);
        };


        // =============================================
        // Start Custom Command Handler for Context Menu
        // =============================================

        $.contextMenu.types.label = function (item, opt, root) {
            $("<span>Quantity<div>"
                + "<div class=\"input-group input-group-sm\">"
                + "<input class=\"form-control\" type=\"text\" name=\"add-quantity\" value=\"1\" onClick=\"this.select()\" onKeyUp=\"if(this.value<0 || this.value>100000){this.value=1}\">"
                + "<span class=\"input-group-btn\">"
                + "<button class=\"btn btn-default add\" type=\"button\">Add</button>"
                + "</span>"
                + "</div>")
                .appendTo(this)
                .on("click", "button", function () {
                    var itemQuantity = $(this).parent().parent().find("input[name=\"add-quantity\"]").val();
                    if (!itemQuantity || parseFloat(itemQuantity) <= 0) {
                        if (window.store.sound_effect == 1) {
                            window.storeApp.playSound("error.mp3");
                        }
                        window.toastr.error("Quantity must be greater than 0!", "Warning!");
                        return false;
                    }
                    $scope.addItemToInvoice($scope.productItemId, 3, parseFloat(itemQuantity));
                    root.$menu.trigger("contextmenu:hide");
                });
        };

        // =============================================
        // End Custom Command Handler for Context Menu
        // =============================================


        // =============================================
        // Start Product Item Context Menu
        // =============================================

        $("#item-list").contextMenu({
            selector: "div.item",
            callback: function (key, options) {
                var p_id = $(this).find(".item-info").data("id");
                var p_name = $(this).find(".item-info").data("name");
                switch (key) {
                    case "view":
                        ProductViewModal({ p_id: p_id, p_name: p_name });
                        break;
                    case "edit":
                        ProductEditModal({ p_id: p_id, p_name: p_name });
                        break;
                    case "add":
                        $scope.addItemToInvoice(p_id, 3, 1);
                        break;
                }
            },
            items: {
                "add": { name: "Add 1 (one) Item", icon: "fa-plus" },
                "sep1": "---------",
                "add_specific_amount": { name: "Add Specific Quantity", icon: "fa-th", disabled: true },
                "quantity": {
                    type: "label",
                    customName: "Quantity", callback: function () {
                        $scope.productItemId = $(this).find(".item-info").data("id");
                        return false;
                    },
                },
                "view": { name: "View", icon: "fa-eye" },
                "sep2": "---------",
                "edit": { name: "Edit", icon: "fa-pencil" }
            }
        });

        // =============================================
        // End Product Item Context Menu
        // =============================================


        // Purchase Product Start

        $scope.OpenPurchaseProductModal = function () {
            window.location = window.baseUrl + "/admin/purchase.php?box_state=open";
        };
        $scope.ProductCreateModalCallback = function ($scopeData) {
            $scope.product = $scopeData.product;
            OpenPurchaseProductModal();
        };

        // Purchase Product End

        $scope.createNewProduct = function () {
            $scope.hideCategoryAddBtn = true;
            $scope.hideSupAddBtn = true;
            $scope.hideBoxAddBtn = true;
            $scope.hideUnitAddBtn = true;
            $scope.hideTaxrateAddBtn = true;
            $scope.hideBrandAddBtn = true;
            ProductCreateModal($scope);
        };




        $scope.CustomerCreateModalCallback = function (data) {
            $scope.$apply(function () {
                $scope.customerName = data.customerName;
                $scope.customerMobileNumber = data.customerMobileNumber;
                $scope.customerId = data.customerId;
                $scope.dueAmount = data.dueAmount;
            });
        };

        // Create new product
        $scope.createNewCustomer = function () {
            if ($scope.invoiceId) return false;
            $scope.dueAmount = 0;
            $scope.addCustomer(1);
            CustomerCreateModal($scope);
        };

        // Create new category
        $scope.createNewCategory = function () {
            CategoryCreateModal($scope);
        };

        // Create new supplier
        $scope.createNewSupplier = function () {
            SupplierCreateModal($scope);
        };

        // Create new box
        $scope.createNewBox = function () {
            BoxCreateModal($scope);
        };

        // Giftcard callback
        $scope.GiftcardCreateModalCallback = function (giftcard) {
            GiftcardViewModal(giftcard);
        };

        // Giftcard crete modal
        $scope.GiftcardCreateModal = function () {
            GiftcardCreateModal($scope);
        };

        // =============================================
        // Start Keyboard Shortcut
        // =============================================
        $(document).keydown(function (e) {
            if (e.altKey && e.which == 80) { // alt+p
                $("[name=\"product-name\"]").focus().select();
            } else if (e.altKey && e.which == 65) { // alt+a
                $scope.createNewCustomer();
            } else if (e.which != 16 && e.altKey && e.which == 67) { // alt+c
                $("[name=\"customer-name\"]").focus().select();
            } else if (e.altKey && e.which == 73) { // discount field [i]
                $("[name=\"discount-amount\"]").focus().select();
            } else if (e.altKey && e.which == 84) { // tax field [t]
                $("[name=\"tax-amount\"]").focus().select();
            } else if (e.altKey && e.which == 83) { // alt+t
                $("[name=\"shipping-amount\"]").focus().select();
            } else if (e.altKey && e.which == 79) { // alt+o
                $("[name=\"others-charge\"]").focus().select();
            } else if (e.altKey && e.which == 78) { // alt+n
                $scope.addInvoiceNote();
            } else if (e.altKey && e.which == 72) { // alt+h
                $scope.HoldingOrderModal();
            } else if (e.altKey && e.which == 90) { // alt+z
                $scope.payNow();
            }

            // left arrow
            if (e.which == 37) {
                var selectedItem = $("#item-list").find(".select");
                $("#item-list .item").removeClass("select");
                if (selectedItem.length) {
                    var itemId = parseInt(selectedItem.attr("id")) - 1;
                    $("#" + itemId).addClass("select");
                } else {
                    $("#0").addClass("select");
                }
            }

            // Right arrow
            if (e.which == 39) {
                var selectedItem1 = $("#item-list").find(".select");
                $("#item-list .item").removeClass("select");
                if (selectedItem1.length) {
                    var itemId1 = parseInt(selectedItem1.attr("id")) + 1;
                    $("#" + itemId1).addClass("select");
                } else {
                    $("#0").addClass("select");
                }
            }

            // Ading item when press enter key, if selected any
            if (e.which == 13 && !$('.modal').length) {
                var selectedItem2 = $("#item-list").find(".select");
                if (selectedItem2.length) {
                    var itemId2 = selectedItem2.find(".item-info").data("id");
                    $scope.addItemToInvoice(itemId2, 1);
                }
            }
        });
    }]);