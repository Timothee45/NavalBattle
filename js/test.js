<!DOCTYPE html>
<html>
<body>

<h2>JavaScript Objects</h2>

<p>There are two different ways to access an object property.</p>

<p>You can use person.property or person["property"].</p>

<p id="demo"></p>

<form action="/" method="post" id="form-user">
  <label>Prénom : </label>
  <input name="firstName" id="firstName">
  <label>Nom : </label>
  <input name="lastName" id="lastName">
    <input type="button" id="send" value="GO">
</form>

<script>
  var arrayUser = [];
  
  function Sexe(label) {
    this.label = label;
    
    return this;
  }
  
  function Person(firstName, lastName, id, sexe) {
      this.firstName = firstName;
      this.lastName = lastName;
      this.id = id || 1;
      this.sexe = sexe

      return this;
  }
  Person.prototype = {
    sayHello: function() {
      return this.id + " - " + this.firstName + " " + this.lastName;
    },
  }
 
  function InitData() {
    var male = Sexe("Male");
    var female = Sexe("Female");
    
    arrayUser.push(new Person("Guillaume", "Lalou", 7654, male));
    arrayUser.push(new Person("John", "Doe", 5566, male));
    arrayUser.push(new Person("Timothée", "Masurel", 8989, male));
    arrayUser.push(new Person("Laura", "Jojo", 1111, female));
    arrayUser.push(new Person("Sandra", "Loulou", 2134, female));
    arrayUser.push(new Person("Jacques", "Berbe", 2678, male));
    arrayUser.push(new Person("Jean", "Marles", 1439, male));
  }
  
  InitData();
 
  // Display some data from the object:
  var result = "";
  var nbrUsers = arrayUser.length;
  
  for (var i=0; i<nbrUsers; i++) {
      result += "<li>" + arrayUser[i].sayHello() + "</li>";
  };

  document.getElementById("demo").innerHTML = "<ul>" + result + "</ul>";

  document.getElementById("form-user").submit(function(){
console.log("qsdfqsd");
  });


</script>

</body>
</html>
