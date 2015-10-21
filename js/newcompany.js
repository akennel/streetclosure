function RequestCompany(){
    var accountId = "";
    
    var accountEventsURL = "https://oit-phl-oit-sandbox.cs17.force.com/rows/services/apexrest/phlchangerequest";
  

    $.ajax({
      url: accountEventsURL,
      data: {name:$("#CompanyName").val(), phone:$("#CompanyPhone").val(),
             url:$("#CompanyWeb").val(), fax:$("#CompanyFax").val(), addy:$("#CompanyAddress").val(),
             city:$("#CompanyCity").val(), state:$("#CompanyState").val(), zip:$("#CompanyZip").val(),
             app:"ROWS", objtype:"Company", fname:$("#FirstName").val(), lname:$("#LastName").val(), 
             email:$("#UserEmail").val(), uphone:$("#UserPhone").val(), chgtype:"New", bpl:$("#EIN").val()},
      dataType: "jsonp",
      success: function(data){
        $("#Success").show("fast");
        $("#SuccessMessage").text("The request for a new company and contact has been received. You should receive an email confirmation shortly. Please allow 24-72 hours for approval.");
        $("#AccountDetailsEdit").hide("slow");
        $("#UserDetailsEdit").hide("slow");
      },
      error: function(error){
        
      }
    });
}