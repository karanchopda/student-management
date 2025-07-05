const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll Number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [5, 'Age must be at least 5'],
    max: [100, 'Age cannot exceed 100']
  },
  standard: {
    type: String,
    required: [true, 'Standard is required'],
    trim: true
  },
  division: {
    type: String,
    required: [true, 'Division is required'],
    trim: true,
    maxlength: [10, 'Division cannot exceed 10 characters']
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);


app.get('/api/students', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      search = '',
      course = ''
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (course) {
      query.course = { $regex: course, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const students = await Student.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Student.countDocuments(query);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalStudents: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, rollNumber, course, age, standard, division } = req.body;

    if (!name || !rollNumber || !course || !age || !standard || !division) {
      return res.status(400).json({ 
        message: 'All fields are required',
        fields: ['name', 'rollNumber', 'course', 'age', 'standard', 'division']
      });
    }

    const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Roll number already exists',
        field: 'rollNumber'
      });
    }

    if (isNaN(age) || age < 5 || age > 100) {
      return res.status(400).json({ 
        message: 'Age must be a number between 5 and 100',
        field: 'age'
      });
    }

    const student = new Student({
      name,
      rollNumber: rollNumber.toUpperCase(),
      course,
      age: parseInt(age),
      standard,
      division
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, rollNumber, course, age, standard, division } = req.body;

    if (!name || !rollNumber || !course || !age || !standard || !division) {
      return res.status(400).json({ 
        message: 'All fields are required',
        fields: ['name', 'rollNumber', 'course', 'age', 'standard', 'division']
      });
    }

    const existingStudent = await Student.findOne({ 
      rollNumber: rollNumber.toUpperCase(),
      _id: { $ne: req.params.id }
    });
    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Roll number already exists',
        field: 'rollNumber'
      });
    }

    if (isNaN(age) || age < 5 || age > 100) {
      return res.status(400).json({ 
        message: 'Age must be a number between 5 and 100',
        field: 'age'
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        rollNumber: rollNumber.toUpperCase(),
        course,
        age: parseInt(age),
        standard,
        division
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/students/roll/:rollNumber', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ 
      rollNumber: req.params.rollNumber.toUpperCase() 
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Student.distinct('course');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;