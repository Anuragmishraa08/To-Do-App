// ===== AUTH FUNCTIONS =====

function getCurrentUser() {
  return localStorage.getItem("loggedInUser");
}

function saveUserData(username, tasks) {
  localStorage.setItem(`tasks_${username}`, JSON.stringify(tasks));
}

function getUserData(username) {
  return JSON.parse(localStorage.getItem(`tasks_${username}`)) || [];
}

function signup() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please fill both fields.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username]) {
    alert("User already exists!");
    return;
  }

  users[username] = password;
  localStorage.setItem("users", JSON.stringify(users));
  alert("Signup successful! Now login.");
  clearLoginMsg();
}

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username] === password) {
    localStorage.setItem("loggedInUser", username);
    location.href = "todo.html";
  } else {
    showLoginMsg("Invalid credentials!");
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  location.href = "login.html";
}

function showLoginMsg(msg) {
  const el = document.getElementById("login-msg");
  if (el) el.innerText = msg;
}
function clearLoginMsg() {
  const el = document.getElementById("login-msg");
  if (el) el.innerText = "";
}

// Redirect unauthorized users away from todo page
if (location.pathname.includes("todo.html") && !getCurrentUser()) {
  location.href = "login.html";
}

// ===== THEME TOGGLE =====

function toggleTheme() {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
}

// Load theme on page load
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// ===== TODO APP =====

if (location.pathname.includes("todo.html")) {
  const taskInput = document.getElementById("task-input");
  const dueDateInput = document.getElementById("due-date");
  const addBtn = document.getElementById("add-btn");
  const taskList = document.getElementById("task-list");
  const username = getCurrentUser();
  const searchInput = document.getElementById("search-task");
  const filterButtons = document.querySelectorAll(".filter-btn");
  let currentFilter = "all";

  // Load and render tasks
  window.onload = function () {
    const tasks = getUserData(username);
    // Sort by due date (null or empty dates last)
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    renderTasks(tasks);
    checkDueAlerts(tasks);
  };

  // Add new task
  addBtn.onclick = function () {
    const taskText = taskInput.value.trim();
    const dueDate = dueDateInput.value;

    if (!taskText) {
      alert("Please enter a task.");
      return;
    }

    let tasks = getUserData(username);

    // Create task object
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      dueDate: dueDate || null,
    };

    tasks.push(newTask);
    saveUserData(username, tasks);

    taskInput.value = "";
    dueDateInput.value = "";
    applyFilter(currentFilter);
  };

  // Render tasks helper
  function renderTasks(tasks) {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.dataset.id = task.id;

      if (task.completed) li.classList.add("completed");

      // Task content div with checkbox and text
      const taskContent = document.createElement("div");
      taskContent.className = "task-content";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;

      checkbox.addEventListener("change", () => {
        toggleTaskComplete(task.id);
      });

      const span = document.createElement("span");
      span.textContent = task.text + (task.dueDate ? ` (Due: ${task.dueDate})` : "");

      taskContent.appendChild(checkbox);
      taskContent.appendChild(span);
      li.appendChild(taskContent);

      // Buttons: Edit, Delete
      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "buttons";

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "edit-btn";

      editBtn.onclick = () => editTask(task.id);

      // Delete button
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "delete-btn";

      delBtn.onclick = () => deleteTask(task.id);

      buttonsDiv.appendChild(editBtn);
      buttonsDiv.appendChild(delBtn);
      li.appendChild(buttonsDiv);

      taskList.appendChild(li);
    });
  }

  // Toggle completed
  function toggleTaskComplete(taskId) {
    let tasks = getUserData(username);
    tasks = tasks.map((t) => {
      if (t.id === taskId) t.completed = !t.completed;
      return t;
    });
    saveUserData(username, tasks);
    applyFilter(currentFilter);
  }

  // Edit task inline
  function editTask(taskId) {
    let tasks = getUserData(username);
    const task = tasks.find((t) => t.id === taskId);

    const li = document.querySelector(`li[data-id="${taskId}"]`);
    if (!li) return;

    const taskContent = li.querySelector(".task-content");
    taskContent.innerHTML = "";

    // Create input for editing task text
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.style.flex = "1";
    input.style.padding = "6px";
    input.style.fontSize = "16px";

    // Create input for due date
    const dueInput = document.createElement("input");
    dueInput.type = "date";
    dueInput.value = task.dueDate || "";
    dueInput.style.marginLeft = "10px";

    taskContent.appendChild(input);
    taskContent.appendChild(dueInput);
    input.focus();

    // Change edit button to Save
    const editBtn = li.querySelector(".edit-btn");
    editBtn.textContent = "Save";

    // Disable delete button while editing
    const delBtn = li.querySelector(".delete-btn");
    delBtn.disabled = true;

    editBtn.onclick = () => {
      const newText = input.value.trim();
      const newDueDate = dueInput.value;

      if (!newText) {
        alert("Task cannot be empty");
        return;
      }

      // Update task data
      task.text = newText;
      task.dueDate = newDueDate || null;
      saveUserData(username, tasks);

      // Reset UI
      editBtn.textContent = "Edit";
      delBtn.disabled = false;
      applyFilter(currentFilter);
    };
  }

  // Delete task
  function deleteTask(taskId) {
    if (!confirm("Are you sure to delete this task?")) return;

    let tasks = getUserData(username);
    tasks = tasks.filter((t) => t.id !== taskId);
    saveUserData(username, tasks);
    applyFilter(currentFilter);
  }

  // Filter tasks UI and logic
  function filterTasks(type) {
    currentFilter = type;

    filterButtons.forEach((btn) => {
      btn.classList.toggle("active-filter", btn.textContent.toLowerCase() === type);
    });

    applyFilter(type);
  }

  function applyFilter(type) {
    let tasks = getUserData(username);

    // Filter tasks
    if (type === "completed") {
      tasks = tasks.filter((t) => t.completed);
    } else if (type === "pending") {
      tasks = tasks.filter((t) => !t.completed);
    }

    // Sort by due date
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    renderTasks(tasks);
  }

  // Search live tasks
  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();

    document.querySelectorAll("#task-list li").forEach((li) => {
      const text = li.querySelector(".task-content span")?.innerText.toLowerCase() || "";
      li.style.display = text.includes(keyword) ? "flex" : "none";
    });
  });

  // Due date alert checker (on load and after add)
  function checkDueAlerts(tasks) {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    tasks.forEach((task) => {
      if (task.dueDate === todayStr && !task.completed) {
        if (Notification.permission === "granted") {
          new Notification("⏰ Task Due Today!", {
            body: task.text,
            icon: "https://cdn-icons-png.flaticon.com/512/747/747310.png",
          });
        } else {
          alert(`Reminder: Task "${task.text}" is due today!`);
        }
      }
    });
  }
}
