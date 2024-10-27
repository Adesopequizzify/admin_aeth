import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, addDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Function to switch between admin pages
function switchAdminPage(pageId) {
  document.querySelectorAll('.page-container').forEach(page => page.classList.add('hidden'));
  document.getElementById(`${pageId}-container`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

  if (pageId === 'users') {
    loadUserData();
  } else if (pageId === 'settings') {
    loadMaintenanceStatus();
  } else if (pageId === 'dashboard') {
    updateDashboardInfo();
  } else if (pageId === 'tasks') {
    loadTasks();
  }
}

// Function to load and display user data
async function loadUserData() {
  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    const usersList = document.querySelector('#users-container .users-list');
    usersList.innerHTML = '';

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const userCard = document.createElement('div');
      userCard.className = 'user-card';
      userCard.innerHTML = `
                <h3>${userData.email}</h3>
                <p><strong>Balance:</strong> ${userData.balance.toFixed(2)} AEC</p>
                <p><strong>Remaining Orders:</strong> ${userData.remainingOrders}</p>
            `;
      usersList.appendChild(userCard);
    });
  } catch (error) {
    console.error('Error loading user data:', error);
    showNotification('Error loading user data');
  }
}

// Function to load maintenance status
async function loadMaintenanceStatus() {
  try {
    const maintenanceRef = doc(db, 'system', 'maintenance');
    const maintenanceSnap = await getDoc(maintenanceRef);

    if (maintenanceSnap.exists()) {
      const { isActive, duration, message } = maintenanceSnap.data();
      document.getElementById('maintenance-toggle').checked = isActive;
      document.getElementById('maintenance-duration').value = duration / 60000; // Convert to minutes
      document.getElementById('maintenance-message').value = message || '';
    }
  } catch (error) {
    console.error('Error loading maintenance status:', error);
    showNotification('Error loading maintenance status');
  }
}

// Function to toggle maintenance mode
async function toggleMaintenanceMode(isActive, duration, message) {
  try {
    const maintenanceRef = doc(db, 'system', 'maintenance');
    await setDoc(maintenanceRef, {
      isActive,
      duration: duration * 60000, // Convert minutes to milliseconds
      message,
      timestamp: new Date().toISOString()
    }, { merge: true });

    showNotification(isActive ? 'Maintenance mode activated' : 'Maintenance mode deactivated');
    updateDashboardInfo();
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    showNotification('Error toggling maintenance mode');
  }
}

// Function to show notification
function showNotification(message) {
  alert(message);
}

// Function to update dashboard info
async function updateDashboardInfo() {
  const totalUsersElement = document.getElementById('total-users');
  const totalTransactionsElement = document.getElementById('total-transactions');
  const systemStatusElement = document.getElementById('system-status');
  const activeTasksElement = document.getElementById('active-tasks');

  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    totalUsersElement.textContent = usersSnapshot.size;

    const transactionsQuery = query(collection(db, 'transactions'));
    const transactionsSnapshot = await getDocs(transactionsQuery);
    totalTransactionsElement.textContent = transactionsSnapshot.size;

    const tasksQuery = query(collection(db, 'tasks'));
    const tasksSnapshot = await getDocs(tasksQuery);
    const activeTasks = tasksSnapshot.docs.filter(doc => !doc.data().completed).length;
    activeTasksElement.textContent = activeTasks;

    const maintenanceRef = doc(db, 'system', 'maintenance');
    const maintenanceSnap = await getDoc(maintenanceRef);

    if (maintenanceSnap.exists() && maintenanceSnap.data().isActive) {
      systemStatusElement.textContent = 'Maintenance';
      systemStatusElement.style.color = 'var(--danger-color)';
    } else {
      systemStatusElement.textContent = 'Online';
      systemStatusElement.style.color = 'var(--success-color)';
    }
  } catch (error) {
    console.error('Error updating dashboard info:', error);
    showNotification('Error updating dashboard info');
  }
}

// Function to load tasks
async function loadTasks() {
  try {
    const tasksQuery = query(collection(db, 'tasks'));
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasksList = document.querySelector('#tasks-container .tasks-list');
    tasksList.innerHTML = '';

    tasksSnapshot.forEach((doc) => {
      const taskData = doc.data();
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card';
      taskCard.innerHTML = `
                <h3>${taskData.title}</h3>
                <p>${taskData.description}</p>
                <p><strong>Reward:</strong> ${taskData.amount} AEC</p>
                <p><strong>Deadline:</strong> ${new Date(taskData.deadline.toDate()).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${taskData.completed ? 'Completed' : 'Active'}</p>
                <p><strong>Link:</strong> <a href="${taskData.link}" target="_blank">Task Link</a></p>
            `;
      tasksList.appendChild(taskCard);
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
    showNotification('Error loading tasks');
  }
}

// Function to create and display the task modal
function showCreateTaskModal() {
  if (document.getElementById('create-task-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'create-task-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Create New Task</h2>
      <form id="create-task-form">
        <label for="task-title">Task Title</label>
        <input type="text" id="task-title" required>

        <label for="task-description">Task Description</label>
        <textarea id="task-description" required></textarea>

        <label for="task-amount">Reward Amount (AEC)</label>
        <input type="number" id="task-amount" min="0" step="0.01" required>

        <label for="task-deadline">Deadline</label>
        <input type="date" id="task-deadline" required>

        <label for="task-link">Task Link</label>
        <input type="url" id="task-link" required>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create Task</button>
          <button type="button" class="btn btn-secondary" id="close-modal">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  modal.classList.remove('hidden');

  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('create-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-description').value,
      amount: parseFloat(document.getElementById('task-amount').value),
      deadline: Timestamp.fromDate(new Date(document.getElementById('task-deadline').value)),
      link: document.getElementById('task-link').value,
    };
    await createTask(taskData);
    closeModal();
  });
}

// Function to close and remove the task modal
function closeModal() {
  const modal = document.getElementById('create-task-modal');
  if (modal) {
    modal.remove();
  }
}

// Function to create a new task
async function createTask(taskData) {
  try {
    const tasksRef = collection(db, 'tasks');
    await addDoc(tasksRef, {
      ...taskData,
      completed: false,
      createdAt: Timestamp.now()
    });
    showNotification('Task created successfully');
    loadTasks();
  } catch (error) {
    console.error('Error creating task:', error);
    showNotification('Error creating task');
  }
}

// Function to initialize admin dashboard
function initAdminDashboard() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const pageId = e.currentTarget.getAttribute('data-page');
      switchAdminPage(pageId);
    });
  });

  document.getElementById('save-maintenance').addEventListener('click', () => {const isActive = document.getElementById('maintenance-toggle').checked;
const duration = parseInt(document.getElementById('maintenance-duration').value, 10);
const message = document.getElementById('maintenance-message').value;
toggleMaintenanceMode(isActive, duration, message);
});

document.getElementById('create-task-button').addEventListener('click', () => {
  showCreateTaskModal();
});

updateDashboardInfo();
}

// Initialize the admin dashboard when the page loads
document.addEventListener('DOMContentLoaded', initAdminDashboard);