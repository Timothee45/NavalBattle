  // Create an object:
  //var person = {
  //    firstName: "John",
  //    lastName : "Doe",
  //    id       :  5566
  //};

  //var guillaume = {
  //    firstName: "Guillaume",
  //    lastName : "Lalou",
  //    id       :  7654
  //};

  function newPerson(firstName, lastName, id) {
      var data = {
            firstName: prenom,
            lastName : nom,
            id       :  id,
          }
          
      return data;
  }

  // Display some data from the object:
  var result = "";
  var arrayUser = [];
  var person;
  
  arrayUser.push(newPerson("Guillaume", "Lalou", 7654));
  arrayUser.push(newPerson("John", "Doe", 5566));

console.log(arrayUser);

  for (var i=0; i<arrayUser.length; i++) {
      person = arrayUser[i];
      result += "<li>" + person.id + " - " + person.firstName + " " + person.lastName + "</li>";
  };

  document.getElementById("demo").innerHTML = "<ul>" + result + "</ul>";

  //person.firstName + " " + person.lastName + "<br>" +

  //guillaume.firstName + " " + guillaume.lastName;