// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
// import { getDatabase, ref, push, update, onValue, onDisconnect, serverTimestamp } from "firebase/database";

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth.js";
import { getDatabase, ref, push, update, onValue, onDisconnect, child, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-database.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMzUbL7uvrafHXNkJRgWie2EMYG0-O_PU",
  authDomain: "chat-videoverse.firebaseapp.com",
  databaseURL: "https://chat-videoverse-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chat-videoverse",
  storageBucket: "chat-videoverse.appspot.com",
  messagingSenderId: "270772103757",
  appId: "1:270772103757:web:fe986a4688bf43a814ca04",
  measurementId: "G-9Z69M4JNSK"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM elements
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const onlineUsersDiv = document.getElementById('online-users');
const chatMessagesDiv = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// Sign up function
const signUp = () => {
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User signed up:", user);
      updateUserStatus(user.uid, 'online');
    })
    .catch((error) => {
      console.error("Error signing up:", error.code, error.message);
    });
};

// Sign in function
const signIn = () => {
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User signed in:", user);
      updateUserStatus(user.uid, 'online');
    })
    .catch((error) => {
      console.error("Error signing in:", error.code, error.message);
    });
};

// Sign out function
const logOut = () => {
  signOut(auth).then(() => {
    console.log("User signed out");
    toggleContainers(false);
  }).catch((error) => {
    console.error("Error signing out:", error);
  });
};

// Toggle containers visibility
const toggleContainers = (isLoggedIn) => {
  if (isLoggedIn) {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'block';
  } else {
    authContainer.style.display = 'block';
    chatContainer.style.display = 'none';
  }
};

// Update user status in the database
const updateUserStatus = (uid, status) => {
  const userStatusRef = ref(database, '/users/' + uid + '/status');
  set(userStatusRef, status);
};

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    toggleContainers(true);
    trackOnlineStatus(user.uid);
    listenForOnlineUsers();
    listenForMessages();
  } else {
    toggleContainers(false);
  }
});

// Track online status
const trackOnlineStatus = (uid) => {
  const userStatusDatabaseRef = ref(database, '/users/' + uid + '/status');
  const connectedRef = ref(database, '.info/connected');

  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    set(userStatusDatabaseRef, 'online').then(() => {
      userStatusDatabaseRef.onDisconnect().set('offline');
    });
  });
};

// Listen for online users
const listenForOnlineUsers = () => {
  const onlineUsersRef = ref(database, '/users');

  onValue(onlineUsersRef, (snapshot) => {
    const users = snapshot.val();
    onlineUsersDiv.innerHTML = '';
    for (let uid in users) {
      if (users[uid].status === 'online') {
        const userDiv = document.createElement('div');
        userDiv.innerText = uid;
        onlineUsersDiv.appendChild(userDiv);
      }
    }
  });
};

// Send message function
const sendMessage = (chatId, message) => {
  const messageId = push(child(ref(database), 'chats/' + chatId + '/messages')).key;
  const updates = {};
  updates['/chats/' + chatId + '/messages/' + messageId] = {
    text: message,
    sender: auth.currentUser.uid,
    timestamp: serverTimestamp(),
    status: 'sent'
  };
  update(ref(database), updates);
};

// Listen for new messages
const listenForMessages = () => {
  const chatId = 'default_chat'; // Replace with dynamic chat ID if needed
  const messagesRef = ref(database, '/chats/' + chatId + '/messages');

  onValue(messagesRef, (snapshot) => {
    const messages = snapshot.val();
    chatMessagesDiv.innerHTML = '';
    for (let msgId in messages) {
      const msg = messages[msgId];
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message');
      messageDiv.innerHTML = `
        <div class="user">${msg.sender}</div>
        <div class="text">${msg.text}</div>
        <div class="status">${msg.status}</div>
      `;
      chatMessagesDiv.appendChild(messageDiv);

      if (msg.sender !== auth.currentUser.uid) {
        updateMessageStatus(chatId, msgId, 'delivered');
      }
    }
  });
};

// Update message status to 'read'
const updateMessageStatus = (chatId, messageId, status) => {
  const messageRef = ref(database, '/chats/' + chatId + '/messages/' + messageId);
  update(messageRef, { status: status });
};

// Event listeners
document.getElementById('signup-form').addEventListener('submit', (e) => {
  e.preventDefault();
  signUp();
});

document.getElementById('signin-form').addEventListener('submit', (e) => {
  e.preventDefault();
  signIn();
});

document.getElementById('logout-button').addEventListener('click', logOut);

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const chatId = 'default_chat'; // Replace with dynamic chat ID if needed
  const message = messageInput.value;
  if (message.trim() !== '') {
    sendMessage(chatId, message);
    messageInput.value = '';
  }
});
