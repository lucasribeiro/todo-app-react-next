const STORAGE_KEY = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const errorEl = document.getElementById('todo-error');
    const list = document.getElementById('todo-list');

    let todos = loadTodos();
    render();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        const error = validateTodo(value);

        if (error) {
            errorEl.textContent = error;
            return;
        }

        errorEl.textContent = '';
        todos.push(value);
        saveTodos();
        input.value = '';
        render();
    });

    function validateTodo(text) {
        if (text.length < 3) {
            return 'A tarefa deve ter pelo menos 3 caracteres.';
        }
        if (!/^[A-ZÀ-Ý]/.test(text)) {
            return 'A tarefa deve começar com letra maiúscula.';
        }
        return null;
    }

    function removeTodo(index) {
        todos.splice(index, 1);
        saveTodos();
        render();
    }

    function moveTodo(index, direction) {
        const target = index + direction;
        if (target < 0 || target >= todos.length) return;
        [todos[index], todos[target]] = [todos[target], todos[index]];
        saveTodos();
        render();
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    function loadTodos() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function render() {
        list.innerHTML = '';
        todos.forEach((text, index) => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between align-items-center';

            const span = document.createElement('span');
            span.textContent = text;

            const actions = document.createElement('div');
            actions.className = 'd-flex gap-1';

            const upBtn = createButton('↑', 'btn-outline-secondary', () => moveTodo(index, -1));
            upBtn.disabled = index === 0;

            const downBtn = createButton('↓', 'btn-outline-secondary', () => moveTodo(index, 1));
            downBtn.disabled = index === todos.length - 1;

            const removeBtn = createButton('Remover', 'btn-outline-danger', () => removeTodo(index));

            actions.append(upBtn, downBtn, removeBtn);
            item.append(span, actions);
            list.appendChild(item);
        });
    }

    function createButton(label, className, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.className = `btn btn-sm ${className}`;
        btn.addEventListener('click', onClick);
        return btn;
    }
});