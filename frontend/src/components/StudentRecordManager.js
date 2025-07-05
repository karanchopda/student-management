import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const StudentRecordManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    course: '',
    age: '',
    standard: '',
    division: ''
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const API_BASE_URL = 'https://student-management-efar.onrender.com';

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder,
        search: searchTerm,
        course: courseFilter
      });

      const response = await fetch(`${API_BASE_URL}/students?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStudents(data.students);
        setTotalPages(data.totalPages);
        setTotalStudents(data.totalStudents);
      } else {
        setMessage(data.message || 'Failed to fetch students');
      }
    } catch (error) {
      setMessage('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      const data = await response.json();
      if (response.ok) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [currentPage, sortBy, sortOrder, searchTerm, courseFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll Number is required';
    if (!formData.course.trim()) newErrors.course = 'Course is required';
    if (!formData.age || isNaN(formData.age) || formData.age < 5 || formData.age > 100) {
      newErrors.age = 'Age must be a number between 5 and 100';
    }
    if (!formData.standard.trim()) newErrors.standard = 'Standard is required';
    if (!formData.division.trim()) newErrors.division = 'Division is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingStudent 
        ? `${API_BASE_URL}/students/${editingStudent._id}`
        : `${API_BASE_URL}/students`;
      
      const method = editingStudent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(editingStudent ? 'Student updated successfully!' : 'Student added successfully!');
        setShowAddForm(false);
        setEditingStudent(null);
        resetForm();
        fetchStudents();
      } else {
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setMessage(data.message || 'Operation failed');
        }
      }
    } catch (error) {
      setMessage('Error connecting to server');
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Student deleted successfully!');
          fetchStudents();
        } else {
          setMessage(data.message || 'Failed to delete student');
        }
      } catch (error) {
        setMessage('Error connecting to server');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      course: student.course,
      age: student.age.toString(),
      standard: student.standard,
      division: student.division
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      course: '',
      age: '',
      standard: '',
      division: ''
    });
    setErrors({});
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Student Record Manager</h1>
            <p className="text-gray-600 mt-1">Manage student records with advanced filtering and sorting</p>
          </div>

          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.includes('successfully') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {courses.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingStudent(null);
                  resetForm();
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.rollNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                  />
                  {errors.rollNumber && <p className="text-red-500 text-sm mt-1">{errors.rollNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.course ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                  />
                  {errors.course && <p className="text-red-500 text-sm mt-1">{errors.course}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.standard ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.standard}
                    onChange={(e) => setFormData({...formData, standard: e.target.value})}
                  />
                  {errors.standard && <p className="text-red-500 text-sm mt-1">{errors.standard}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.division ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.division}
                    onChange={(e) => setFormData({...formData, division: e.target.value})}
                  />
                  {errors.division && <p className="text-red-500 text-sm mt-1">{errors.division}</p>}
                </div>

                <div className="flex gap-2 md:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingStudent ? 'Update Student' : 'Add Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingStudent(null);
                      resetForm();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No students found.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {students.length} of {totalStudents} students
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center gap-1 font-medium text-gray-700 hover:text-blue-600"
                          >
                            Name
                            {getSortIcon('name')}
                          </button>
                        </th>
                        <th className="border border-gray-200 px-4 py-2 text-left">
                          <button
                            onClick={() => handleSort('rollNumber')}
                            className="flex items-center gap-1 font-medium text-gray-700 hover:text-blue-600"
                          >
                            Roll Number
                            {getSortIcon('rollNumber')}
                          </button>
                        </th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Course</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Age</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Standard</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Division</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{student.name}</td>
                          <td className="border border-gray-200 px-4 py-2 font-mono">{student.rollNumber}</td>
                          <td className="border border-gray-200 px-4 py-2">{student.course}</td>
                          <td className="border border-gray-200 px-4 py-2">{student.age}</td>
                          <td className="border border-gray-200 px-4 py-2">{student.standard}</td>
                          <td className="border border-gray-200 px-4 py-2">{student.division}</td>
                          <td className="border border-gray-200 px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student._id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRecordManager;