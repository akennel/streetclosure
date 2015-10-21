var accountId = "";
var accountName = "";
var userId = "";
var securityToken = "";

$(document).ready(function(){
    accountId = getUrlVars()['acc'];
    userId = getUrlVars()['user'];
    securityToken = getUrlVars()['token'];
    accountName = getUrlVars()['name'];
    accountName = accountName.replace("%20", " ");
    $("#CompanyName").text("New contact for " + accountName);
});

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,    
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
}

function RequestContact(accountId){
      $.ajax({
      url: "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlchangerequest",
      data: {fname:$("#FirstName").val(), lname:$("#LastName").val(), email:$("#UserEmail").val(), uphone:$("#UserPhone").val(),
             app:"ROWS", objtype:"Contact", chgtype:"New", acc:accountId, token:securityToken, user: userId, name: accountName},
      dataType: "jsonp",
      success: function(data){
        ShowModalMessage("Success", "The request for a new contact has been received. You should receive an email confirmation shortly. Please allow 24-72 hours for approval.");
        $("#UserDetailsEdit").hide('slow');     
        $("#AccountDetails").show('fast');     
      },
      error: function(error){
        
      }
    });
}