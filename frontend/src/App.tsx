import React, { useState, useEffect } from 'react';
import './App.css';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  category?: '개인' | '회사';
  createdAt?: string;
  completedAt?: string;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState<'개인' | '회사'>('개인');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'전체' | '개인' | '회사'>('전체');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] = useState<'개인' | '회사'>('개인');

  const API_URL = 'http://127.0.0.1:5000/api/todos';

  // Load todos on mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputValue,
          category: category 
        }),
      });
      const newTodo = await response.json();
      setTodos([...todos, newTodo]);
      setInputValue('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(
          todos.map((todo) =>
            todo.id === id ? updatedTodo : todo
          )
        );
      }
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const startEditing = (id: number, text: string, currentCategory?: '개인' | '회사') => {
    setEditingId(id);
    setEditingText(text);
    if (currentCategory) setEditingCategory(currentCategory);
  };

  const saveEdit = async (id: number) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: editingText,
          category: editingCategory
        }),
      });
      if (response.ok) {
        setTodos(
          todos.map((todo) =>
            todo.id === id ? { ...todo, text: editingText, category: editingCategory } : todo
          )
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTodos(todos.filter((todo) => todo.id !== id));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (index: number) => {
    if (editingId !== null) return; // Prevent drag while editing
    setDraggedItemIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newTodos = [...todos];
    const draggedItem = newTodos[draggedItemIndex];
    newTodos.splice(draggedItemIndex, 1);
    newTodos.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    setTodos(newTodos);
  };

  const onDragEnd = async () => {
    if (draggedItemIndex === null) return;
    setDraggedItemIndex(null);
    // Save new order to backend
    try {
      await fetch(`${API_URL}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todos),
      });
    } catch (error) {
      console.error('Error saving new order:', error);
    }
  };

  const filteredTodos = todos.filter((todo) => {
    const statusMatch = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && !todo.completed) || 
      (statusFilter === 'completed' && todo.completed);
    
    const categoryMatch = 
      categoryFilter === '전체' || 
      todo.category === categoryFilter;

    return statusMatch && categoryMatch;
  });

  return (
    <div className="container">
      <div className="todo-card">
        <h1>TaskFlow</h1>
        <form onSubmit={addTodo} className="input-group">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as '개인' | '회사')}
            className="category-select"
          >
            <option value="개인">개인</option>
            <option value="회사">회사</option>
          </select>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="할 일을 입력하세요..."
          />
          <button type="submit">추가</button>
        </form>

        <div className="filter-section">
          <div className="filter-group">
            <span className="filter-label">📋 상태</span>
            <div className="filters status-filters">
              <button
                className={statusFilter === 'all' ? 'active' : ''}
                onClick={() => setStatusFilter('all')}
              >전체</button>
              <button
                className={statusFilter === 'active' ? 'active' : ''}
                onClick={() => setStatusFilter('active')}
              >진행 중</button>
              <button
                className={statusFilter === 'completed' ? 'active' : ''}
                onClick={() => setStatusFilter('completed')}
              >완료됨</button>
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">🏷️ 분류</span>
            <div className="filters category-filters">
              <button
                className={categoryFilter === '전체' ? 'active' : ''}
                onClick={() => setCategoryFilter('전체')}
              >모두</button>
              <button
                className={categoryFilter === '개인' ? 'active' : ''}
                onClick={() => setCategoryFilter('개인')}
              >🏠 개인</button>
              <button
                className={categoryFilter === '회사' ? 'active' : ''}
                onClick={() => setCategoryFilter('회사')}
              >🏢 회사</button>
            </div>
          </div>
        </div>

        <ul className="todo-list">
          {filteredTodos.map((todo, index) => {
            const actualIndex = todos.findIndex(t => t.id === todo.id);
            const isEditing = editingId === todo.id;
            return (
              <li 
                key={todo.id} 
                className={`${todo.completed ? 'completed' : ''} ${todo.category === '회사' ? 'work' : 'personal'}`}
                draggable={!isEditing}
                onDragStart={() => onDragStart(actualIndex)}
                onDragOver={(e) => onDragOver(e, actualIndex)}
                onDragEnd={onDragEnd}
              >
                <div className="drag-handle">⋮⋮</div>
                <div className="todo-item-content" onClick={() => toggleTodo(todo.id)}>
                  <span className="checkbox">
                    {todo.completed ? '✓' : ''}
                  </span>
                  <div className="text-container">
                    <div className="todo-header">
                      {isEditing ? (
                        <div className="edit-container" onClick={(e) => e.stopPropagation()}>
                          <select 
                            value={editingCategory} 
                            onChange={(e) => setEditingCategory(e.target.value as '개인' | '회사')}
                            className="edit-category-select"
                          >
                            <option value="개인">개인</option>
                            <option value="회사">회사</option>
                          </select>
                          <input
                            type="text"
                            className="edit-input"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(todo.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => saveEdit(todo.id)}>✓</button>
                            <button className="cancel-btn" onClick={() => setEditingId(null)}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div className="view-container" onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditing(todo.id, todo.text, todo.category);
                        }}>
                          <span className="category-badge">{todo.category}</span>
                          <span className="text">{todo.text}</span>
                        </div>
                      )}
                    </div>
                    <div className="date-info">
                      {todo.createdAt && <span>작성: {formatDate(todo.createdAt)}</span>}
                      {todo.completedAt && <span className="completed-date">완료: {formatDate(todo.completedAt)}</span>}
                    </div>
                  </div>
                </div>
                <div className="item-actions">
                  {!isEditing && (
                    <button className="edit-btn" onClick={(e) => {
                      e.stopPropagation();
                      startEditing(todo.id, todo.text, todo.category);
                    }}>
                      수정
                    </button>
                  )}
                  <button className="delete-btn" onClick={(e) => {
                    e.stopPropagation();
                    deleteTodo(todo.id);
                  }}>
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
