var userId = "";//Hold the ID of the logged in user
var accountId = "";
var userSecurityToken = "";//Holds the Security Code for the user once it has been verified
var accountsArray = [];

// watcher function
// Wires up all our on change events once the page loads
$(document).ready(function(){
  //Start by initializing our Type menu and Company names
  GetAccounts();//Company=Account -- It's a Salesforce thing
});
// end watching

//Display Error/Success Messages
function ShowModalMessage(title, message){
  $("#modal-title").text(title);
  $("#modal-text").text(message);
  $('#statusMessageModal').foundation('reveal', 'open');
}

//grabs all the Accounts available in Salesforce
//Used to build Company name list. Anonymous service called on page load
function GetAccounts(){
var typeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowsaccounts";
  $.ajax({
    url: typeURL,
    dataType: "jsonp",
    success: function(data){
      var i = 0;// creates a double array with the Account names and their associated Ids
      while(i < data.length) {
        var newEntry = [data[i].Name, data[i].Id];
        accountsArray.push(newEntry);
        i++;
      }
      addAccountstoSelect();
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error.", "Error getting a list of available companies");
    },
    fail: function(){
        ShowModalMessage("Error.", "Error getting a list of available companies");
    }
  });
}

//Add the company names to the drop-down menu.
//We set the company name as the Text, the Id as the value to 
//simplify lookups later
function addAccountstoSelect(){
  var selectMenu = $("#CompanySearchSelect");
  //Start with a blank option to force the user to select something
  var blankOption = document.createElement("option");
  blankOption.text = "";
  blankOption.value = "";
  selectMenu[0].appendChild(blankOption);
  var i = 0;
  while(i < accountsArray.length) {
    var newOption = document.createElement("option");
    newOption.text = accountsArray[i][0];
    newOption.value= accountsArray[i][1];
    selectMenu[0].appendChild(newOption);
    i++;
  }
	$('#CompanySearchSelect').selectize({
	create: false,
	sortField: {
		field: 'text',
		direction: 'asc'
	}});
}

//Step 1 of login. Once the user selects a company, we grab all the linked
//Contacts for that company.
function GetContactsForAccount(){
  accountId = $("#CompanySearchSelect").val();
  accountName = $("#CompanySearchSelect option:selected").text();
  var accountContactsURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowscontacts";
  $.ajax({
    url: accountContactsURL,
    data: {account:accountId},//Selected company is saved when selected from dropdown
    dataType: "jsonp",
    success: function(data){
      $("#ContactList").empty();//First empty our existing list
      $(' <thead><tr><td>Name</td><td>Link</td></tr></thead>').appendTo($("#ContactList"));
      var i = 0;
      while(i < data.length) {
        //Add a button for each contact, with Id pre-populated into the SendAccessCode() function call
        $('<tr  id="UserRow' + data[i].Id + '"><td class="ContactRow"><label class="ContactName">' + data[i].Name + '</label></td><td><button class="GetCodeButton" style="display: none" onclick=SendAccessCode("' + data[i].Id + '") id="GetCodeButton">Get Code</button>'
        + '<button class="SelectUserButton" onclick=SelectUser("' + data[i].Id + '") id="SelectUserButton">Login</button></td></tr>').appendTo($("#ContactList"));
        i++;
      }
      
      $("#SelectContactSection").fadeIn("slow");
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error!", "We were unable to find a list of Contacts for this Company.");
    },
    fail: function(){
      ShowModalMessage("Error!", "We were unable to find a list of Contacts for this Company.");
    }
  });
}

//Set 2A of the login process. The user clicks on the button for their
//matching contact entry. Sets the contactId and displays the PIN section.
//If they need a new PIN, we continue to 2B.
function SelectUser(contactId){
  userId = contactId;
  var idTag = "UserRow" + userId;
  var userRow = $("#"+ idTag);
  var userTable = $("#ContactList").find("tr");
  for(var i=0; i<userTable.length; i++){
    var element = userTable.eq(i);
    element.find("#SelectUserButton").show('fast');
    element.find("#GetCodeButton").hide('fast');
  }
  userRow.find("#SelectUserButton").hide('fast');
  userRow.find("#GetCodeButton").show('fast');
  $("#EnterCodeSection").fadeIn("slow");
}

//Step 2B of the login process. The user clicks on the button for their
//matching contact entry. Salesforce generates and emails a code to the
//users email address. We set the contactId to reference later.
function SendAccessCode(contactId){
  userId = contactId;//Set the global userId to the selected Id number
  var sendCodeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowssendcode";
    $.ajax({
    url: sendCodeURL,
    data: {id:contactId},
    dataType: "jsonp",
    success: function(data){
      $("#ContactList").find('button').attr("disabled", "disabled");
      $("#EnterCodeSection").fadeIn("slow");
      ShowModalMessage("Success!", "A new security code has been emailed to you. It may take a few moments before arriving in your inbox.");
    },
    error: function (xhr, ajaxOptions, thrownError) {
       ShowModalMessage("Error!", "We were unable to send you a new Security Code.");
    },
    fail: function(){
      ShowModalMessage("Error!", "We were unable to send you a new Security Code.");
    }
  });
}

//Step 3 of the login process. The user enters the security key that Salesforce
//email to them. We upload that key to Salesforce along with the User ID. 
//Salesforce compares to the key stored and tells us if there's a match.
//We store the Security code so that we can reuse for all web services that require
//authentication.
function VerifyCode(){
  var validation = $('#EnterCodeSection').parsley().validate("login");
  
  if (validation){
    var goodCode = false;
    var securityCode = $("#CodeInput").val();
    
    var sendCodeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowsverifycode";
    $.ajax({
      url: sendCodeURL,
      data: {code:securityCode, id:userId},
      dataType: "jsonp",
      success: function(data){
        goodCode = data[0].Access_Code__c;//Hacky web service re-writes the Access_Code__c value to true or false on eval
          if (goodCode == 'true'){
            //If the code checks out, store it and switch to the create screen
            userSecurityToken = securityCode;
            GetClosuresForAccount();
            GetAccountDetails();
            GetContactDetails();
            $("#LoginPage").fadeOut("fast");
            $("#AccountContactHeader").fadeIn("slow");
            $("#AccountOverview").fadeIn("slow");
            $("#NewContactLink").attr('href', 'newcontact.html?acc=' + accountId + '&name=' + accountName + '&user=' + userId + '&token=' + securityCode);
          }
          else{
            ShowModalMessage("Error!", "Sorry, but your Security Code was not correct. You can use the Get Code button to have a new code emailed to you.");
          }
      },
      error: function (xhr, ajaxOptions, thrownError) {
        ShowModalMessage("Error!", "Sorry, but your Security Code was not correct. You can use the Get Code button to have a new code emailed to you.");
      },
      fail: function(){
        ShowModalMessage("Error!", "Sorry, but your Security Code was not correct. You can use the Get Code button to have a new code emailed to you.");
      }
    });
  }
}

function GetAccountDetails(){
  var sendCodeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlaccountdetails";
  $.ajax({
    url: sendCodeURL,
    data: {token:userSecurityToken, user:userId, acc:accountId},
    dataType: "jsonp",
    success: function(data){
        $("#DisplayCompanyName").text(data.Name);
        $("#DisplayCompanyWeb").text(data.Website);
        $("#DisplayCompanyPhone").text(data.Phone);
        $("#DisplayCompanyFax").text(data.Fax);
        $("#DisplayCompanyAddress").text(data.BillingAddress.street);
        $("#DisplayCompanyCity").text(data.BillingAddress.city);
        $("#DisplayCompanyState").text(data.BillingAddress.state);
        $("#DisplayCompanyZip").text(data.BillingAddress.postalCode);
        $("#CompanyName").val(data.Name);
        $("#CompanyWeb").val(data.Website);
        $("#CompanyPhone").val(data.Phone);
        $("#CompanyFax").val(data.Fax);
        $("#CompanyAddress").val(data.BillingAddress.street);
        $("#CompanyCity").val(data.BillingAddress.city);
        $("#CompanyState").val(data.BillingAddress.state);
        $("#CompanyZip").val(data.BillingAddress.postalCode);
        var companyDetailsStatus = data.Account_Status__c;
        
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error!", "We were unable to get company detail information.");
    },
    fail: function(){
      ShowModalMessage("Error!", "We were unable to get company detail information.");
    }
  });
}

function GetContactDetails(){
      var sendCodeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlcontactdetails";
  $.ajax({
    url: sendCodeURL,
    data: {token:userSecurityToken, user:userId, acc:accountId},
    dataType: "jsonp",
    success: function(data){
        $("#DisplayUserName").text(data.Name);
        $("#DisplayUserEmail").text(data.Email);
        $("#DisplayUserPhone").text(data.Phone);
        $("#UserName").val(data.Name);
        $("#UserEmail").val(data.Email);
        $("#UserPhone").val(data.Phone);
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error!", "We were unable to get your account detail information.");
    },
    fail: function(){
      ShowModalMessage("Error!", "We were unable to get your account detail information.");
    }
  });
}
  
function GetClosuresForAccount(){
  //Start by clearing our Events table
  $("#ClosureTable").empty();
  GetContactsForAccount(); // grab a list of contacts
  var accountID = $("#CompanySearchSelect").val(); // .val grabs the accountID associated with the name
  var accountEventsURL = "https://oit-phl-oit-sandbox.cs17.force.com/streets/services/apexrest/streetsclosuresbyacc";
  var securityCode = $("#CodeInput").val();
  
  $.ajax({
    url: accountEventsURL,
    data: {account:accountID, token:securityCode, user:userId},//Selected company is saved when selected from dropdown
    dataType: "jsonp",
    success: function(data){
      $("#AccountList").empty();//First empty our existing Account list
        var i = 0;
        while(i < data.length) {
          //a row for each Event of this account
          AddClosureRowforAccount(data[i]);
          i++;
        }
    }
  });
}

function AddClosureRowforAccount(closureDetail){
    if (closureDetail.Closure_Status__c != "Cancellation Requested"){
    var newRow = $(
    '<div class="large-12 columns">' +
    '<div class="ClosureRow panel" id="Closure' + closureDetail.Id + '">' +
        '<h3 class="ClosureName"></h3>' +
        '<h4 class="alternate">Purpose</h4><p class="ClosurePurpose"></p>' +
        '<h4 class="alternate">Location</h4><p class="ClosureLocation"></p>' +
        '<h4 class="alternate">Start Date</h4><p class="ClosureStartDate"></p>' +
        '<h4 class="alternate">End Date</h4><p class="ClosureEndDate"></p>' +
        '<h4 class="alternate">Event Status</h4> <p class="ClosureStatus"></p>' +
        '<button class="RequestCancellationButton" onclick=CancelEvent("' + closureDetail.Id + '")>Request Cancellation</button>' + // update button class
    '</div></div>').appendTo($("#ClosureTable"));  
    newRow.find(".ClosureName").text(closureDetail.Name);
    newRow.find(".ClosurePurpose").text(closureDetail.Purpose__c);
    newRow.find(".ClosureAddress").text(closureDetail.Location__c);
    newRow.find(".ClosureStartDate").text(closureDetail.Effective_Date__c);
    newRow.find(".ClosureEndDate").text(closureDetail.Expiration_Date__c);
    newRow.find(".ClosureStatus").text(closureDetail.Closure_Status__c);
  }
}