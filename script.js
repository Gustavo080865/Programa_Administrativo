document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDeadline = document.getElementById('taskDeadline');
    const taskPriority = document.getElementById('taskPriority');
    const addTaskButton = document.getElementById('addTaskButton');
    const taskList = document.getElementById('taskList');
    const filterPriority = document.getElementById('filterPriority');
    const sortOrder = document.getElementById('sortOrder');
    const completedTasksCount = document.getElementById('completedTasksCount');
    const pendingTasksCount = document.getElementById('pendingTasksCount');
    const completedTasksHistory = document.getElementById('completedTasksHistory');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let completedHistory = JSON.parse(localStorage.getItem('completedHistory')) || [];

    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('completedHistory', JSON.stringify(completedHistory));
        renderTasks();
        updateProductivityReport();
    };

    const formatDateTime = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    const renderTasks = () => {
        taskList.innerHTML = '';
        completedTasksHistory.innerHTML = '';

        const currentFilterPriority = filterPriority.value;
        const currentSortOrder = sortOrder.value;

        let filteredAndSortedTasks = tasks.filter(task => {
            return (currentFilterPriority === 'todas' || task.priority === currentFilterPriority) && !task.completed;
        });

        filteredAndSortedTasks.sort((a, b) => {
            if (currentSortOrder.includes('deadline')) {
                const dateA = new Date(a.deadline);
                const dateB = new Date(b.deadline);
                return currentSortOrder === 'deadlineAsc' ? dateA - dateB : dateB - dateA;
            } else if (currentSortOrder.includes('priority')) {
                const priorityMap = { 'alta': 3, 'media': 2, 'baja': 1 };
                const priorityA = priorityMap[a.priority];
                const priorityB = priorityMap[b.priority];
                return currentSortOrder === 'priorityAsc' ? priorityB - priorityA : priorityA - priorityB; // High priority first for Asc, Low for Desc
            }
            return 0;
        });


        filteredAndSortedTasks.forEach(task => {
            const li = document.createElement('li');
            const now = new Date();
            const deadlineDate = new Date(task.deadline);
            let isOverdue = !task.completed && deadlineDate < now;

            li.className = task.completed ? 'completed' : '';
            if (isOverdue) {
                li.classList.add('overdue');
            }

            const priorityClass = `priority-${task.priority}`;

            li.innerHTML = `
                <div class="task-details">
                    <span class="task-description">${task.description}</span>
                    <div class="task-meta">
                        <span>Fecha límite: ${formatDateTime(task.deadline)}</span> | 
                        <span class="${priorityClass}">Prioridad: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}" ${task.completed ? 'disabled' : ''}>${task.completed ? 'Completada' : 'Completar'}</button>
                    <button class="delete-btn" data-id="${task.id}">Eliminar</button>
                </div>
            `;
            taskList.appendChild(li);
        });

        // Renderizar historial de tareas completadas
        completedHistory.forEach(task => {
            const li = document.createElement('li');
            li.className = 'completed';
            li.innerHTML = `
                <div class="task-details">
                    <span class="task-description">${task.description}</span>
                    <div class="task-meta">
                        <span>Completada el: ${formatDateTime(task.completedAt)}</span> | 
                        <span>Fecha límite original: ${formatDateTime(task.deadline)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="delete-btn" data-id="${task.id}">Eliminar del historial</button>
                </div>
            `;
            completedTasksHistory.appendChild(li);
        });
    };

    const updateProductivityReport = () => {
        const completedCount = completedHistory.length;
        const pendingCount = tasks.filter(task => !task.completed).length;

        completedTasksCount.textContent = completedCount;
        pendingTasksCount.textContent = pendingCount;
    };

    addTaskButton.addEventListener('click', () => {
        const description = taskInput.value.trim();
        const deadline = taskDeadline.value;
        const priority = taskPriority.value;

        if (description && deadline) {
            const newTask = {
                id: Date.now(),
                description,
                deadline,
                priority,
                completed: false
            };
            tasks.push(newTask);
            saveTasks();
            taskInput.value = '';
            taskDeadline.value = '';
        } else {
            alert('Por favor, ingresa una descripción y una fecha límite para la tarea.');
        }
    });

    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('complete-btn')) {
            const id = parseInt(e.target.dataset.id);
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = true;
                tasks[taskIndex].completedAt = new Date().toISOString();
                completedHistory.push(tasks[taskIndex]);
                tasks.splice(taskIndex, 1); // Remover de tareas activas
                saveTasks();
            }
        }

        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
        }
    });

    completedTasksHistory.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            completedHistory = completedHistory.filter(task => task.id !== id);
            saveTasks();
        }
    });

    filterPriority.addEventListener('change', saveTasks); // Re-render al cambiar filtro
    sortOrder.addEventListener('change', saveTasks); // Re-render al cambiar orden

    // Inicializar al cargar la página
    saveTasks();
});
