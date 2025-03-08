document.addEventListener('DOMContentLoaded', () => {
  const newTaskInput = document.getElementById('newTask');
  const addTaskButton = document.getElementById('addTask');
  const taskList = document.getElementById('taskList');
  const completedList = document.getElementById('completedList');

  // 加载保存的便签
  loadTasks();

  // 添加新便签
  addTaskButton.addEventListener('click', addTask);
  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  function addTask() {
    const text = newTaskInput.value.trim();
    if (text) {
      const task = {
        id: Date.now(),
        text: text,
        completed: false,
        completedDate: null
      };
      
      // 如果是第一个任务，清除空状态提示
      if (taskList.querySelector('.empty-state')) {
        taskList.innerHTML = '';
      }
      
      saveTasks([task]);
      renderTask(task, taskList);
      newTaskInput.value = '';
    }
  }

  function renderTask(task, container) {
    const li = document.createElement('li');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = task.completed;
    
    const span = document.createElement('span');
    span.textContent = task.text;
    if (task.completed) span.className = 'completed';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.className = 'delete-btn';
    
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    container.appendChild(li);

    // 事件处理
    checkbox.addEventListener('change', () => toggleTask(task, li));
    deleteBtn.addEventListener('click', () => deleteTask(task, li));
  }

  function toggleTask(task, li) {
    task.completed = !task.completed;
    task.completedDate = task.completed ? new Date().toISOString() : null;
    
    updateTask(task);
    li.remove();
    
    const targetList = task.completed ? completedList : taskList;
    const sourceList = task.completed ? taskList : completedList;
    
    // 检查源列表是否为空
    if (sourceList.children.length === 0) {
      sourceList.innerHTML = `<li class="empty-state">${
        task.completed ? '还没有待办事项...' : '还没有完成的事项...'
      }</li>`;
    }
    
    // 如果目标列表显示着空状态提示，先清除
    if (targetList.querySelector('.empty-state')) {
      targetList.innerHTML = '';
    }
    
    renderTask(task, targetList);
  }

  function deleteTask(task, li) {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const newTasks = tasks.filter(t => t.id !== task.id);
      chrome.storage.local.set({ tasks: newTasks });
      
      li.remove();
      
      // 检查删除后列表是否为空
      const list = task.completed ? completedList : taskList;
      if (list.children.length === 0) {
        list.innerHTML = `<li class="empty-state">${
          task.completed ? '还没有完成的事项...' : '还没有待办事项...'
        }</li>`;
      }
    });
  }

  function loadTasks() {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      
      // 分类并排序任务
      const activeTasks = tasks.filter(t => !t.completed);
      const completedTasks = tasks.filter(t => t.completed)
        .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));
      
      // 清空现有列表
      taskList.innerHTML = '';
      completedList.innerHTML = '';
      
      // 显示空状态或任务列表
      if (activeTasks.length === 0) {
        taskList.innerHTML = '<li class="empty-state">还没有待办事项...</li>';
      } else {
        activeTasks.forEach(task => renderTask(task, taskList));
      }
      
      if (completedTasks.length === 0) {
        completedList.innerHTML = '<li class="empty-state">还没有完成的事项...</li>';
      } else {
        completedTasks.forEach(task => renderTask(task, completedList));
      }
    });
  }

  function saveTasks(newTasks) {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      chrome.storage.local.set({ tasks: [...tasks, ...newTasks] });
    });
  }

  function updateTask(updatedTask) {
    chrome.storage.local.get(['tasks'], (result) => {
      const tasks = result.tasks || [];
      const newTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      chrome.storage.local.set({ tasks: newTasks });
    });
  }

  // 读取展示的提醒信息
  fetch('remindInfo.json')
  .then(response => response.json())
  .then(data => {
    // 随机选择一个对象
    const randomBook = data[Math.floor(Math.random() * data.length)];
    
    // 从选中对象的contents中随机选择一条内容
    const randomContent = randomBook.contents[Math.floor(Math.random() * randomBook.contents.length)];
    
    // 更新DOM元素
    document.getElementById('header-content').textContent = randomContent;
    document.getElementById('header-book-name').textContent = "--《"+randomBook.book_name+"》";
  })
  .catch(error => {
    console.error('加载数据失败:', error);
  });
}); 