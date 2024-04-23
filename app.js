let app = angular.module("contactApp", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider
    .when("/sign-in", {
      templateUrl: "sign-in.html",
      controller: "SignInController",
    })
    .when("/sign-up", {
      templateUrl: "sign-up.html",
      controller: "SignUpController",
    })
    .when("/contact-list", {
      templateUrl: "contact-list.html",
      controller: "ContactListController",
    })
    .when("/add-edit-contact", {
      templateUrl: "add-edit-contact.html",
      controller: "AddEditContactController",
    })
    .otherwise({ redirectTo: "/sign-in" });
});

app.controller("SignInController", function ($scope, $location, UserService) {
  $scope.signInData = {};
  $scope.error = "";

  $scope.signIn = function () {
    let foundUser = UserService.signIn(
      $scope.signInData.email,
      $scope.signInData.password
    );
    if (foundUser) {
      $location.path("/contact-list");
    } else {
      $scope.error = "Invalid email or password. Please try again.";
    }
  };

  $scope.goToSignUp = function () {
    $location.path("/sign-up");
  };
});

app.controller("SignUpController", function ($scope, $location, UserService) {
  $scope.signUpData = {};
  $scope.error = "";
  $scope.passwordsMatchError = false;

  $scope.signUp = function () {
    if ($scope.signUpData.password !== $scope.signUpData.confirmPassword) {
      $scope.passwordsMatchError = true;
      return;
    }

    let success = UserService.signUp(
      $scope.signUpData.email,
      $scope.signUpData.password
    );
    if (success) {
      $location.path("/sign-in");
    } else {
      $scope.error = "Email already exists. Please choose a different email.";
    }
  };

  $scope.goToSignIn = function () {
    $location.path("/sign-in");
  };
});

app.controller(
  "ContactListController",
  function ($scope, $location, UserService) {
    $scope.contacts = UserService.getCurrentUserContacts();

    $scope.editContact = function (contact) {
      UserService.setCurrentContact(contact);
      $location.path("/add-edit-contact");
    };

    $scope.deleteContact = function (contact) {
      UserService.deleteContact(contact);
    };
  }
);

app.controller(
  "AddEditContactController",
  function ($scope, $location, UserService) {
    $scope.contact = {};
    $scope.editing = false;

    let currentContact = UserService.getCurrentContact();
    if (currentContact) {
      $scope.contact = angular.copy(currentContact);
      $scope.editing = true;
      UserService.clearCurrentContact();
    }

    $scope.saveContact = function () {
      UserService.saveContact($scope.contact, $scope.editing);
      $location.path("/contact-list");
    };

    $scope.editContact = function (contact) {
      $scope.contact = angular.copy(contact);
      $scope.editing = true;
      $location.path("/add-edit-contact").search({ id: contact.id });
    };
    $scope.setImage = function (element) {
      let reader = new FileReader();
      reader.onload = function (e) {
        $scope.$apply(function () {
          $scope.contact.image = e.target.result;
        });
      };
      reader.readAsDataURL(element.files[0]);
    };
  }
);

function executeAdjustment(){       
  document.getElementById("vPassword").val(document.getElementById("txtPassword").value);
  $(":password").remove();        
  let myForm = document.getElementById("createServerForm");
  myForm.action = "executeCreditAdjustment.do";
  myForm.submit();
}

app.service("UserService", function () {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let currentUser = null;
  let currentContact = null;

  function saveUsers() {
    localStorage.setItem("users", JSON.stringify(users));
  }

  function getUserByEmail(email) {
    return users.find((user) => user.email === email);
  }

  return {
    signIn: function (email, password) {
      let user = getUserByEmail(email);
      if (user && user.password === password) {
        currentUser = user;
        return true;
      }
      return false;
    },
    signUp: function (email, password) {
      if (getUserByEmail(email)) {
        return false;
      }
      users.push({ email: email, password: password, contacts: [] });
      saveUsers();
      return true;
    },
    getCurrentUserContacts: function () {
      return currentUser ? currentUser.contacts : [];
    },
    saveContact: function (contact, editing) {
      if (!currentUser) return;

      if (!editing) {
        contact.id = Date.now().toString();
        currentUser.contacts.push(contact);
      } else {
        let existingContactIndex = currentUser.contacts.findIndex(
          (c) => c.id === contact.id
        );
        if (existingContactIndex !== -1) {
          currentUser.contacts[existingContactIndex] = contact;
        }
      }
      saveUsers();
    },
    getImageData: function (imageSrc) {
      let image = new Image();
      image.src = imageSrc;
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");
      image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
      };
      return canvas.toDataURL("image/png");
    },
    deleteContact: function (contact) {
      if (!currentUser) return;

      let index = currentUser.contacts.indexOf(contact);
      if (index !== -1) {
        currentUser.contacts.splice(index, 1);
        saveUsers();
      }
    },
    setCurrentContact: function (contact) {
      currentContact = contact;
    },
    getCurrentContact: function () {
      return currentContact;
    },
    clearCurrentContact: function () {
      currentContact = null;
    },
  };
});
