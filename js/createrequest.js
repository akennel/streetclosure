//Start the Save process for an Event
function SubmitRequest(){
    var validation = $('#AddResourcePage').parsley().validate("eventCreate");
    if (validation){
      $("#AddResourcePage").fadeOut("fast");
      $("#SavingPage").fadeIn("slow");
      CreateRequest();
    }
}

//Used by our date cleanup function to prepend 0 on dates < 10
function pad(s) { return (s < 10) ? '0' + s : s; }
//Salesforce requires dates be in MM/DD/YYYY format
//Strangely enough, it returns dates in MM-DD-YYYY format. Go figure.
function FixDate(matchDate){
    matchDate = matchDate.replace(/-/g, "/");
    var d = new Date(matchDate);
    matchDate = [pad(d.getMonth()+1), pad(d.getDate()), d.getFullYear()].join('/');
    return matchDate;
}

function CreateRequest(){
    var reqID;
    var serviceURL = "https://oit-phl-oit-sandbox.cs17.force.com/streets/services/apexrest/streetscreaterequest";
    var reqPurpose = $("#ReqPurpose").val();
    var reqContact = $("#ReqContact").val();
    var reqLocation = $("#ReqLocation").val();
    var reqPhone = $("#ReqPhone").val();
    var reqEmail = $("#ReqEmail").val();
    var reqStart = $("#ReqStart").val();
    var reqEnd = $("#ReqEnd").val();
    var accID = $("#CompanySearchSelect").val();
    var contID = userId;
    
      $.ajax({
    url: serviceURL,
    data: {purpose:reqPurpose, loc:reqLocation, enddate:FixDate(reqEnd), acc:accID, cont:contID, startdate:FixDate(reqEnd), user:userId, token:userSecurityToken, reqCon:reqContact, reqPhone:reqPhone, reqEmail:reqEmail}, 
    dataType: "jsonp",
    
    success: function(data){
      if (data.validlogin == false){//Security check, if fail, show error
        $('<li>Error with Security Token, please reload page.</li>').appendTo($("#SavingStatusList"));
      }
      else{
        //Get our newly created Event object's ID
        reqID = data.Id;
        $('<li>Created Event: ' + reqID + '</li>').appendTo($("#SavingStatusList"));
        $('<li>The event will take place at: ' + reqStart + '</li>').appendTo($("#SavingStatusList"));
        
        //Finally rebuild the Event List
        GetClosuresForAccount();
      }
      $("#ShowAddResourcePageButton").fadeIn("slow");//Show Add another request button
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Error creating your event.");
    },
    fail: function(){
      ShowModalMessage("Error", "Error creating your event.");
    }
  });
    
}

function CreateEvent(){
  //Create the Event object. This is the top level object that all other object types
  //are linked to. We need to store the event ID so that the Assignment can link back.
  var eventID;
  var typeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowscreateevent";
  var eventName = $("#EventName").val();
  var eventAddy = $("#EventAddress").val();
  var eventDesc = $("#EventDesc").val();
  var eventContact = $("#EventCon").val();
  var eventContactPhone = $("#EventConPhone").val();
  var eventContactEmail =  $("#EventConEmail").val();
  var startDate = $("#ROWStartDate").val();
  var endDate;
  var multiDays = $('#ShowHideBox').val();
  var accID = $("#CompanySearchSelect").val();
  var contID = userId; 
  
  //If the multiDays box is checked, grab the end date, otherwise just use 
  //the start date for both start and end
  if (multiDays == 'on' && $("#ROWEndDate").val() != ""){
    endDate = $("#ROWEndDate").val();
  }
  else{
    endDate = $("#ROWStartDate").val();
  }
  // collecting parameters
  $.ajax({
    url: typeURL,
    data: {name:eventName, addy:eventAddy, desc:eventDesc, enddate:FixDate(endDate), acc:accID, cont:contID, startdate:FixDate(startDate), user:userId, token:userSecurityToken, evtCon:eventContact, evtConPhone:eventContactPhone, evtConEmail:eventContactEmail}, 
    dataType: "jsonp",
    
    success: function(data){
      if (data.validlogin == false){//Security check, if fail, show error
        $('<li>Error with Security Token, please reload page.</li>').appendTo($("#SavingStatusList"));
      }
      else{
        //Get our newly created Event object's ID
        eventID = data.Id;
        $('<li>Created Event with Name: ' + eventName + '</li>').appendTo($("#SavingStatusList"));
        $('<li>The event will take place at: ' + eventAddy + '</li>').appendTo($("#SavingStatusList"));
        
        //Walk through our dates and create and assignment for each day
        var start = new Date(startDate);
        var end = new Date(endDate);
        while(start <= end){
          CreateAssignment(eventID, start.toISOString().substring(0, 10));
           
          var newDate = start.setDate(start.getDate() + 1);//Day++ equivalent
          start = new Date(newDate); 
        }
        //Finally rebuild the Event List
        GetEventsforAccount();
      }
      $("#ShowAddResourcePageButton").fadeIn("slow");//Show Add another request button
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Error creating your event.");
    },
    fail: function(){
      ShowModalMessage("Error", "Error creating your event.");
    }
  });
  return eventID;
}

//Assignments are linked to the Event. We also pass along the date for the 
//current Assignment. 1 Assignment per day
function CreateAssignment(eventId, startDate){
  var typeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowscreateassignment";
  $.ajax({
    url: typeURL,
    data: {event:eventId, date:FixDate(startDate), user:userId, token:userSecurityToken},
    dataType: "jsonp",
    success: function(data){
      if (data.validlogin == false){//Security check, if fail, show error
        $('<li>Error with Security Token, please reload page.</li>').appendTo($("#SavingStatusList"));
      }
      else{
        var assignmentId = data.Id;
        $('<li>Created Assignment Entry for date: ' + FixDate(data.Date__c) + '</li>').appendTo($("#SavingStatusList"));
        //Now that we've created the Assignment entry create
        //matching resources by walking through the resource table
        $(".ResourceRow").each (function(){
          var parentLi = this;//Get a handle on the current row
          CreateResource(assignmentId, parentLi, startDate);
        });
      }
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Error creating your event.");
    },
    fail: function(){
      ShowModalMessage("Error", "Error creating your event.");
    }
  });
}

//Resources are linked back to an Assignment. Here we also pass the current Resource Row
//and the Date of the Assignment.
function CreateResource(assignmentId, parentLi, date){
  var typeURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/rowscreateresource";
  var resourceType = parentLi.getElementsByClassName("typeMenu")[0].value;
  var hoursWorked = parentLi.getElementsByClassName("HoursWorked")[0].value;
  var resourceCount = parentLi.getElementsByClassName("ResourceCount")[0].value;
  var resourceDate = FixDate(date);
  
  $.ajax({
    url: typeURL,
    data: {assignment:assignmentId, type:resourceType, hours:hoursWorked, count:resourceCount, date:resourceDate, user:userId, token:userSecurityToken},
    dataType: "jsonp",
    success: function(data){
      if (data.validlogin == false){//Security check, if fail, show error
        $('<li>Error with Security Token, please reload page.</li>').appendTo($("#SavingStatusList"));
      }
      else{
        var resourceId = data.Id;
         //$('<li>Created Resource "' + resourceType + '" for date: ' + FixDate(data.Date__c) + '</li>').appendTo($("#SavingStatusList")); this gets really messy with multi day/multi resource events
      }
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Error creating your event.");
    },
    fail: function(){
      ShowModalMessage("Error", "Error creating your event.");
    }
  });
}

function AddEncroachment(){
    var newValue = $("#EncroachmentSelect").val();
    var tableRow = $("#EncroachmentTable").length;
    $("#EncroachmentTable").append('<tr id="EncroachmentRow-' + tableRow + '"><td><button onclick="RemoveEncroachment(EncroachmentRow-' + tableRow + ')">Remove</button></td><td>' + newValue + "</td></tr>")
}

function RemoveEncroachment(tableRow){
    $("#EncroachmentRow-" + tableRow).remove();
}