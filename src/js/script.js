angular.module('app', ['btford.socket-io'])
  .controller('ChatController', function (Chat, Connection) {
    this.getDialogs = Chat.getDialogs;
    this.openDialog = Chat.openDialog;
    this.createDialog = Chat.createDialog;
    this.getCurrentDialog = Chat.getCurrentDialog;
    this.sendMessage = function () {
      Chat.sendMessage(this.text);
      this.text = '';
    }.bind(this);

    this.login = Connection.login;
    this.logout = Connection.logout;
    this.isLoggedIn = Connection.isLoggedIn;
  })
  .factory('socket', function ($window, socketFactory) {
    return socketFactory({
      prefix: '',
      ioSocket: $window.io.connect('http://192.168.1.34:8080')
    });
  })
  .factory('Connection', function ($q, socket, Chat) {

    function onMessage (message, callback) {
      callback && callback();
      console.log('Received a message');
      var dialogs = Chat.getDialogs();
      var activeUserId;
      dialogs.forEach(function (dialog) {
        if (dialog.active) {
          activeUserId = dialog._id;
        }
      });
      console.log(activeUserId);
      console.log(message);
      if (activeUserId && (message.from === activeUserId || message.to === activeUserId)) {
        console.log('Pushing the message');
        Chat.getCurrentDialog().push(message);
      }
    }

    function login (userId) {
      return $q(function (resolve) {
        socket.emit('login', {id: userId, regId: 'APA91bHpAf7VKBsCrzOtpeRnWuBim3NUgeSb6jYl4zKYDIux5NRWZQdyv8kFyWJm2JquG7LPPcEDk2p_kaX900WqQ8XH3pzys2zCtr4wCDXXqnH8ee8uGzBgE_B0ZekE0apzW4bDVREBaWWUld5DfZQVtsip6Q1zkcQvJCfKy7wKQEC9b58jKVA'}, function () {
          console.log('Logged in as', userId);
          loggedInAs = userId;
          socket.emit('getDialogs', function (dialogs) {
            Chat.setDialogs(dialogs);
            resolve();
          });
          socket.on('message', onMessage);
        });
      });
    }

    socket.on('connect', function () {
      console.log('Connected or reconnected');
      if (loggedInAs) {
        socket.removeListener('message', onMessage);
        Chat.clearDialogs();
        login(loggedInAs)
          .then(function () {
            if (Chat.getCurrentSession()) {
              Chat.openDialog(
                Chat.getDialogs().indexOf(
                  Chat.getDialogs().filter(function (dialog) {
                    return dialog._id === Chat.getCurrentSession();
                  })[0]
                )
              );
            }
          });
      }
    });

    var loggedInAs = null;

    return {
      isLoggedIn: function () {
        return !!loggedInAs;
      },
      login: login,
      logout: function () {
        socket.emit('logout', function () {
          loggedInAs = null;
          socket.removeListener('message', onMessage);
          Chat.clearDialogs();
        });
      }
    }
  })
  .factory('Chat', function (socket) {
    function openDialog(dialog) {
      socket.emit('startSession', dialog._id, function (messages) {
        console.log('Started or restarted session with', dialog._id);
        currentSession = dialog._id;
        currentDialog = messages;
        dialogs.forEach(function (dialog) {
          dialog.active = false;
        });
        dialog.active = true;
      });
    }

    var dialogs = [];

    var currentDialog = [];

    var currentSession = null;

    return {
      getDialogs: function () {
        return dialogs;
      },
      setDialogs: function (newValue) {
        dialogs = newValue;
      },
      openDialog: openDialog,
      createDialog: function () {
        var newUserId = prompt('The name of the user you wish to start a dialog with:');
        if (dialogs.filter(function (dialog) { return dialog._id === newUserId; }).length) {
          alert('User already exists');
        } else {
          var newDialog = {
            _id: newUserId,
            unreadMessageCount: 0
          };
          dialogs.push(newDialog);
          openDialog(newDialog);
        }
      },
      getCurrentSession: function () {
        return currentSession;
      },
      getCurrentDialog: function () {
        return currentDialog;
      },
      clearDialogs: function () {
        dialogs = [];
        currentDialog = [];
      },
      sendMessage: function (text) {
        var to;
        dialogs.forEach(function (dialog) {
          if (dialog.active) {
            to = dialog._id;
          }
        });
        if (to) {
          socket.emit('message', {
            text: text,
            to: to
          });
        }
      }
    };
  });
