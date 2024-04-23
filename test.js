// Define the AngularJS module
let app = angular.module("contactApp", ["ngRoute"]);

// Configure the routes
app.config(function ($routeProvider) {
  $routeProvider
    .when("/sign-in", {
      templateUrl: "sign-in.html",
      controller: "SignInController",
      access: { restricted: false }
    })
    .when("/sign-up", {
      templateUrl: "sign-up.html",
      controller: "SignUpController",
      access: { restricted: false }
    })
    .when("/contact-list", {
      templateUrl: "contact-list.html",
      controller: "ContactListController",
      access: { restricted: true }
    })
    .when("/add-edit-contact", {
      templateUrl: "add-edit-contact.html",
      controller: "AddEditContactController",
      access: { restricted: true }
    })
    .otherwise({ redirectTo: "/sign-in" });
});

// Run block to handle route changes
app.run(function ($rootScope, $location, AuthService) {
  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (next.access && next.access.restricted) {
      if (!AuthService.isAuthenticated()) {
        $location.path("/sign-in");
      }
    }
  });
});

// SignInController
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

// SignUpController
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

// ContactListController
app.controller("ContactListController", function ($scope, $location, UserService) {
  $scope.contacts = UserService.getCurrentUserContacts();

  $scope.editContact = function (contact) {
    UserService.setCurrentContact(contact);
    $location.path("/add-edit-contact");
  };

  $scope.deleteContact = function (contact) {
    UserService.deleteContact(contact);
  };
});

// AddEditContactController
app.controller("AddEditContactController", function ($scope, $location, UserService) {
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
});

// UserService
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

// AuthService
app.service("AuthService", function () {
  this.isAuthenticated = function () {
    // Implement your authentication logic here
    // Return true if authenticated, false otherwise
    const authenticatedUser = JSON.parse(localStorage.getItem("authenticatedUser"));
    return !!authenticatedUser; // Return true if authenticatedUser is not null or undefined
  };

  this.authenticateUser = function (email, password) {
    // Implement your user authentication logic here
    // For simplicity, let's assume hardcoded user credentials
    const hardcodedUsers = [
      { email: "user1@example.com", password: "password1" },
      { email: "user2@example.com", password: "password2" }
    ];

    // Check if the provided email and password match any of the hardcoded user credentials
    const foundUser = hardcodedUsers.find(user => user.email === email && user.password === password);
    if (foundUser) {
      // Store the authenticated user's information in localStorage
      localStorage.setItem("authenticatedUser", JSON.stringify(foundUser));
      return true; // Authentication successful
    }

    return false; // Authentication failed
  };

  this.logout = function () {
    // Clear the authenticated user's information from localStorage
    localStorage.removeItem("authenticatedUser");
  };
});

