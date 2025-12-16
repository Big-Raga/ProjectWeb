import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNotification } from '../hooks';
import '../styles/Todos.css';

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, priority, dueDate
  
  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await api.get('/todos');
      setTodos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching todos:', error);
      showNotification('Failed to fetch todos', 'error');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showNotification('Title is required', 'error');
      return;
    }

    try {
      if (editingTodo) {
        // Update existing todo
        const response = await api.put(`/todos/${editingTodo._id}`, formData);
        setTodos(todos.map(todo => todo._id === editingTodo._id ? response.data : todo));
        showNotification('Todo updated successfully', 'success');
      } else {
        // Create new todo
        const response = await api.post('/todos', formData);
        setTodos([response.data, ...todos]);
        showNotification('Todo created successfully', 'success');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving todo:', error);
      showNotification('Failed to save todo', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;

    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      showNotification('Todo deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting todo:', error);
      showNotification('Failed to delete todo', 'error');
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const response = await api.patch(`/todos/${id}/toggle`);
      setTodos(todos.map(todo => todo._id === id ? response.data : todo));
    } catch (error) {
      console.error('Error toggling todo:', error);
      showNotification('Failed to update todo', 'error');
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    });
    setEditingTodo(null);
    setShowAddModal(false);
  };

  const getFilteredTodos = () => {
    let filtered = [...todos];

    // Apply filter
    if (filter === 'active') {
      filtered = filtered.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(todo => todo.completed);
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      } else if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const filteredTodos = getFilteredTodos();
  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length
  };

  if (loading) {
    return (
      <div className="todos-page">
        <div className="todos-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading todos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="todos-page">
      <div className="todos-container">
        <div className="todos-header">
          <h1 className="todos-title">My Tasks</h1>
          <p className="todos-subtitle">Stay organized and productive</p>
          
          <div className="todos-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        <div className="todos-controls">
          <button 
            className="btn btn-primary add-todo-btn"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Task
          </button>

          <div className="filter-sort-controls">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button 
                className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>

            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Sort by Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
            </select>
          </div>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No tasks found</h3>
            <p>
              {filter === 'completed' 
                ? 'You haven\'t completed any tasks yet.' 
                : filter === 'active'
                ? 'Great! You have no pending tasks.'
                : 'Start by adding a new task above.'}
            </p>
          </div>
        ) : (
          <div className="todos-list">
            {filteredTodos.map(todo => (
              <div 
                key={todo._id} 
                className={`todo-card ${todo.completed ? 'completed' : ''} ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}`}
              >
                <div className="todo-checkbox-section">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo._id)}
                    className="todo-checkbox"
                  />
                </div>

                <div className="todo-content">
                  <div className="todo-header-section">
                    <h3 className="todo-title">{todo.title}</h3>
                    <div className="todo-badges">
                      <span className={`priority-badge priority-${todo.priority}`}>
                        {getPriorityIcon(todo.priority)} {todo.priority}
                      </span>
                      {todo.dueDate && (
                        <span className={`due-date-badge ${isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''}`}>
                          📅 {formatDate(todo.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {todo.description && (
                    <p className="todo-description">{todo.description}</p>
                  )}
                </div>

                <div className="todo-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(todo)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(todo._id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTodo ? 'Edit Task' : 'Add New Task'}</h2>
              <button className="close-modal-btn" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="todo-form">
              <div className="form-group">
                <label htmlFor="title">Task Title *</label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this task..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTodo ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Todos;
