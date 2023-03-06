sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,MessageBox) {
        "use strict";

        return Controller.extend("com.ncs.porequest.poui.controller.View1", {
            onInit: function () {

                this.PRODUCTS = [
                    {matcode:"D1201",matname:"LED Ligths",matgroup:"Utilities",price:"5000"},
                    {matcode:"D1200",matname:"AC Filters",matgroup:"Retail",price:"1000"},
                    {matcode:"C0012",matname:"Long Wire",matgroup:"Utilities",price:"100"}
                ];


                var oProducts = [
                    {
                        "no":10,
                        "name": "LED Lights",
                        "desc":"D1201",    
                        "matGroup":"Utilities",                
                        "poqty": "20",
                        "netorderprice":"5000",
                        "netorderval": "100000 SGD"
                    },
                    {
                        "no":20,
                        "name": "AC Filters",
                        "desc":"D1200",    
                        "matGroup":"Retail",                
                        "poqty": "20",
                        "netorderprice":"1000",
                        "netorderval": "20000 SGD"
                    }
                ];
    
                // this.getView().setModel(new sap.ui.model.json.JSONModel(oProducts), "products");

                
                var oRequestDetails = {
                    "RequestId": "",
                    "Title": "PO Approval",
                    "Requester": {
                        "Name": "Trim",
                        "UserId": "trim.bandaru@gmail.com",
                        "Comment": "Please review and approve"
                    },
                    "BasicData": {
                        "ponumber": "",
                        "supplier": "Semi Corporation",
                        "vendorcode":"100989",
                        "netValue": 200000
                    },
                    "Receipent": {
                        "cc": "100",
                        "purchGroup": "GRP 001",
                        "purchOrg": "100"
                    },
                    "approvalstep": "LocalManager",
                    products:oProducts
                };
                this.getView().setModel(new sap.ui.model.json.JSONModel(oRequestDetails), "PO");
                this.fetchCSRFToken();
            },
            getModulePath: function(){
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                return jQuery.sap.getModulePath(appPath);
                
            },  

            onAdd:function(){
                var oPOModel = this.getView().getModel("PO");
                var oPOModelData = oPOModel.getData();
                oPOModelData.products.push({
                    "no":oPOModelData.products[oPOModelData.products.length-1].no+10,
                    "name": "",
                    "desc":"",    
                    "matGroup":"",                
                    "poqty": "",
                    "netorderprice":"",
                    "netorderval": ""
                });
                oPOModel.checkUpdate(true);
            },            

            callRESTService : function(sPath, oPayload, sMethod, sCSRFToken,fnSuccess){
                $.ajax({
                    url: sPath,
                    type: sMethod,
                    data: JSON.stringify(oPayload),
                    headers: {
                        "X-CSRF-Token": sCSRFToken,
                        "Content-Type": "application/json"
                    },
                    async: false,
                    success: fnSuccess,
                    error: function (data) {
                         
                    }
                });
            },   
            fetchCSRFToken : function (){
                var appModulePath = this.getModulePath();
                var that = this;
                $.ajax({
                    url: appModulePath + "/bpmworkflowruntime/public/workflow/rest/v1/xsrf-token",
                    async: false, 
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "Fetch"
                    },
                    success: function (result, xhr, data) {
                        this.TOKEN = data.getResponseHeader("X-CSRF-Token");
                        if (this.TOKEN === null) 
                            console.log("ERROR in fetching csrf token");
                    }.bind(this)
                });
            },            

            onChangeMat:function(oEvent){
                
           
                var sMatCode = oEvent.getParameter("selectedItem").getKey();
                var sPath = oEvent.getSource().getBindingContext("PO").getPath();
                var oProduct = this.getView().getModel("PO").getObject(sPath);
                $.each(this.PRODUCTS,function(i,oMat){
                    if(oMat.matname === sMatCode){
                        oProduct.desc = oMat.matcode;
                        oProduct.matGroup =  oMat.matgroup;
                        oProduct.netorderprice =  oMat.price;
                        return false;
                    }
                }.bind(this));
                this.getView().getModel("PO").checkUpdate(true);
            },
            onChangeQty: function(oEvent){
                
                var sPath = oEvent.getSource().getBindingContext("PO").getPath();
                var oProduct = this.getView().getModel("PO").getObject(sPath);
                oProduct.netorderval = (parseInt(oProduct.netorderprice) * parseInt(oEvent.getParameter("value")))+" SGD";

                var aProducts = this.getView().getModel("PO").getData().products;
                var iNetOrderValue = 0;
                $.each(aProducts,function(i,oProduct){
                    iNetOrderValue = iNetOrderValue + (parseInt(oProduct.netorderprice) * parseInt(oProduct.poqty));
                }.bind(this));
                this.getView().getModel("PO").getData().BasicData.netValue = iNetOrderValue;

                this.getView().getModel("PO").checkUpdate(true);                
            },
            onCreate : function(){
                var sPONumber = Math.floor(100000000 + Math.random() * 900000000);
                this.getView().getModel("PO").setProperty("/RequestId",sPONumber);
                this.onStartPress(sPONumber+"");

            },
            onReset : function(){

            },
            onStartPress: function (sPONumber) {
                // create busy dialog

                // var orderBusyDialog = new sap.m.BusyDialog();
                // orderBusyDialog.open();

                // sap.m.MessageBox.information("Workflow started with PO Number: "+sPONumber);

                var startContext = this.getView().getModel("PO").getData();
                startContext.RequestId = sPONumber;
                startContext.BasicData.ponumber = sPONumber;
               
                var workflowStartPayload = {definitionId: "us10.demo-nrdspy5x.purchaseorderprocess.purchaseOrderFlow", context:{input: startContext}}

                var sPath = this.getModulePath()+"/bpmworkflowruntime/public/workflow/rest/v1/workflow-instances";

                
               
                this.callRESTService(sPath, workflowStartPayload, "POST", this.TOKEN, function(){
                    MessageBox.information("Workflow started with PO Number: "+sPONumber);
                });
            
               
            }
        });
    });
