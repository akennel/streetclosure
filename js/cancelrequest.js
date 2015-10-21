function CancelEvent(eventId){
  var cancelEventId = eventId;
  var accountID = $("#CompanySearchSelect").val(); // .val grabs the accountID associated with the name
  var securityCode = $("#CodeInput").val();
  
  var cancelEventURL = "https://oit-phl-oit-sandbox.cs17.force.com/streets/services/apexrest/streetscancelrequest"; // currently not working, believe it's because the buttons don't know the difference from each other
  $.ajax({
    url: cancelEventURL,
    data: {user:userId, token:securityCode, acc:accountID, eid:cancelEventId},//parameters to pass in query
    dataType: "jsonp",
    success: function(data){
      $("#AccountOverview").fadeIn("slow");
      ShowModalMessage("Success", "Your request to cancel this event has been submitted. Please allow 2 to 4 business days for this request to be processed.");
      GetClosuresForAccount(); //Reload event table to clear the removed event
    },
    error: function (xhr, ajaxOptions, thrownError) {
      ShowModalMessage("Error", "Your request to cancel this event has failed.");
    },
    fail: function(){
      ShowModalMessage("Error", "Your request to cancel this event has failed.");
    }
  });
}