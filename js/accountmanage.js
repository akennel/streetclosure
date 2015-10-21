function CancelEvent(eventId){
  var cancelEventId = eventId;
  var accountID = $("#CompanySearchSelect").val(); // .val grabs the accountID associated with the name
  var securityCode = $("#CodeInput").val();
  
  var cancelEventURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowscancelevent"; // currently not working, believe it's because the buttons don't know the difference from each other
  $.ajax({
    url: cancelEventURL,
    data: {user:userId, token:securityCode, acc:accountID, eid:cancelEventId},//parameters to pass in query
    dataType: "jsonp",
    success: function(data){
      $("#AccountOverview").fadeIn("slow");
      ShowModalMessage("Success", "Your request to cancel this event has been submitted. Please allow 2 to 4 business days for this request to be processed.");
      GetEventsforAccount(); //Reload event table to clear the removed event
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Your request to cancel this event has failed.");
    },
    fail: function(){
      ShowModalMessage("Error", "Your request to cancel this event has failed.");
    }
  });
}

//Add additinal li to our Event list for an Account. These fields are read only followed by a button to request a cancellation
function AddEventRowforAccount(eventDetail){
  if (eventDetail.Event_Status__c != "Cancellation Requested"){
    var newRow = $(
    '<div class="large-12 columns">' +
    '<div class="EventRow panel" id="Event' + eventDetail.Id + '">' +
        '<h3 class="EventName"></h3>' +
        '<h4 class="alternate">Description</h4><p class="EventDesc"></p>' +
        '<h4 class="alternate">Location</h4><p class="EventAddress"></p>' +
        '<h4 class="alternate">Total Cost</h4> <p class="EventTotalCost"></p>' +
        '<h4 class="alternate">Start Date</h4><p class="EventStartDate"></p>' +
        '<h4 class="alternate">End Date</h4><p class="EventEndDate"></p>' +
        '<h4 class="alternate">Event Status</h4> <p class="EventStatus"></p>' +
        '<button class="RequestCancellationButton" onclick=CancelEvent("' + eventDetail.Id + '")>Request Cancellation</button>' + // update button class
    '</div></div>').appendTo($("#EventTable"));  
    newRow.find(".EventName").text(eventDetail.Name);
    newRow.find(".EventDesc").text(eventDetail.Event_Details__c);
    newRow.find(".EventAddress").text(eventDetail.Event_Address__c);
    newRow.find(".EventTotalCost").text('$' + eventDetail.Total_Cost__c);
    newRow.find(".EventStartDate").text(eventDetail.Start_Date__c);
    newRow.find(".EventEndDate").text(eventDetail.End_Date__c);
    newRow.find(".EventStatus").text(eventDetail.Event_Status__c);
  }
}

function ShowSelectedEvents(){
  var statusSelected = $("#EventFilterMenu").val();
  var nodes = $("#EventTable").children();
  for (var i=0; i<nodes.length; i++){
    var currentItem = nodes[i];
    var currentStatus = currentItem.children[0].children[12].innerText;
    if(statusSelected == "All"){
      nodes[i].style.display = "block";
    }
    else if(currentStatus == statusSelected){ 
      nodes[i].style.display = "block";
    }
    else{
      nodes[i].style.display = "none";
    }
  }
}



function ShowAccountContactEdit(changeType){
  if (changeType == "Account"){
    $("#AccountDetails").hide('fast');
    $("#AccountDetailsEdit").show('slow');
  }
  else if (changeType == "Contact"){
    $("#UserDetails").hide('fast');
    $("#UserDetailsEdit").show('slow');
  }
}

function HideAccountContactEdit(changeType){
  if (changeType == "Account"){
    $("#AccountDetailsEdit").hide('fast');
    $("#AccountDetails").show('slow');
  }
  else if (changeType == "Contact"){
    $("#UserDetailsEdit").hide('fast');
    $("#UserDetails").show('slow');
  }
}

function CreateContact(){
  var validation = $('#ContactCreate').parsley().validate("contactCreate");
  if (validation){
    accountId = $("#CompanySearchSelect").val();
    securityToken = $("#CodeInput").val();
    accountName = $("#CompanySearchSelect option:selected").text();
    $.ajax({
      url: "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlchangerequest",
      data: {fname:$("#FirstNameCreate").val(), lname:$("#LastNameCreate").val(), email:$("#UserEmailCreate").val(), uphone:$("#UserPhoneCreate").val(),
             app:"ROWS", objtype:"Contact", chgtype:"New", acc:accountId, token:securityToken, user: userId, name: accountName},
      dataType: "jsonp",
      success: function(data){
        ShowModalMessage("Success", "The request for a new contact has been received. You should receive an email confirmation shortly. Please allow 24-72 hours for approval.");
        HideContactCreate();   
      },
      error: function(error){
        ShowModalMessage("Error", "We encountered an error when trying to create your new contact.");
      }
    });
  }
}

function ShowContactCreate(){
  $("#ContactCreate").show('slow');
  $("#NewContactLink").hide('fast');
}

function HideContactCreate(){
  $("#ContactCreate").hide('fast');
  $("#NewContactLink").show('fast');
}

function SubmitChangeRequest(changeType){// pass two variables, acc/cont and Update/New
  
  var accountID = $("#CompanySearchSelect").val(); // .val grabs the accountID associated with the name
  var securityCode = $("#CodeInput").val();
  var accountEventsURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlchangerequest";
  
  if (changeType == "Account"){
    var validation = $('#AccountDetailsEdit').parsley().validate("accountEdit");
    if (validation){
      $.ajax({
        url: accountEventsURL,
        data: {token:securityCode, user:userId, acc:accountID, name:$("#CompanyName").val(), phone:$("#CompanyPhone").val(),
               url:$("#CompanyWeb").val(), fax:$("#CompanyFax").val(), addy:$("#CompanyAddress").val(), city:$("#CompanyCity").val(),
               state:$("#CompanyState").val(), zip:$("#CompanyZip").val(), app:"ROWS",
               objtype:"Account", chgtype:"Update",objid:accountID},
        dataType: "jsonp",
        success: function(data){
          HideAccountContactEdit("Account");
          $("#NewContactLink").show('fast');
          ShowModalMessage("Success", "Your request to update your Company information has been received. Please allow 2 to 4 business days for the request to be approved.");
        },
        error: function(error){
          
        }
      });
    }
  }
  else if (changeType == "Contact"){ // Contacts in Salesforce need to be sent first name (custName) & last name (name)
    var validation = $('#UserDetailsEdit').parsley().validate("contactEdit");
    if (validation){
      $.ajax({
        url: accountEventsURL,
        data: {token:securityCode, user:userId, fname:$("#FirstName").val(), lname:$("#LastName").val(), email:$("#UserEmail").val(), uphone:$("#UserPhone").val(),
               app:"ROWS", objtype:"Contact", chgtype:"Update",objid:userId},
        dataType: "jsonp",
        success: function(data){
          HideAccountContactEdit("Contact");
          ShowModalMessage("Success", "Your request to update your Contact information has been received. Please allow 2 to 4 business days for the request to be approved.");
        },
        error: function(error){
          
        }
      });
    }
  }
}