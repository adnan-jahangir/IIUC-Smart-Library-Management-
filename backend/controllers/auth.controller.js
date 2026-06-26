const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UNIVERSITY_ID_PREFIXES = {
  C: 'CSE',
  E: 'EEE',
  T: 'ETE',
  CE: 'CCE',
  EL: 'ELL',
  L: 'LAW',
  B: 'BBA',
  P: 'Pharmacy',
};

const parseUniversityId = (universityId, role = '') => {
  const normalized = String(universityId || '').trim().toUpperCase();
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (!normalized) {
    return { error: 'University ID is required' };
  }

  if (normalizedRole === 'teacher' || normalizedRole === 'librarian') {
    return {
      value: normalized,
      department: null,
      prefix: null,
      academicYear: null,
    };
  }

  const matchedPrefix = Object.keys(UNIVERSITY_ID_PREFIXES)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => normalized.startsWith(prefix));

  if (!matchedPrefix) {
    return {
      error: 'University ID must start with a valid department code: C, E, T, CE, EL, L, B, or P.',
    };
  }

  const yearDigits = normalized.slice(matchedPrefix.length, matchedPrefix.length + 2);
  const academicYear = /^\d{2}$/.test(yearDigits) ? `20${yearDigits}` : null;

  return {
    value: normalized,
    department: UNIVERSITY_ID_PREFIXES[matchedPrefix],
    prefix: matchedPrefix,
    academicYear,
  };
};

const normalizeUniversityId = parseUniversityId;

// Generate JWT Link
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecretjwtkey_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, universityId, designation } = req.body;

    if (!name || !email || !password || !role || !universityId) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const universityIdResult = normalizeUniversityId(universityId, role);
    if (universityIdResult.error) {
      return res.status(400).json({ message: universityIdResult.error });
    }

    // Use the department-coded University ID as customId.
    const customId = universityIdResult.value;

    // Calculate priority level
    let priorityLevel = 0;
    if (role === 'Teacher') {
      const designationWeights = {
        'Professor': 1005,
        'Associate Professor': 1004,
        'Assistant Professor': 1003,
        'Lecturer': 1002,
        'Adjunct Lecturer': 1001
      };
      priorityLevel = designationWeights[designation] || 1000;
    } else if (role === 'Student' && universityIdResult.prefix) {
      const idAfterPrefix = customId.substring(universityIdResult.prefix.length);
      const batchCodeMatch = idAfterPrefix.match(/^\d{3}/);
      if (batchCodeMatch) {
        const batchCode = parseInt(batchCodeMatch[0], 10);
        priorityLevel = 1000 - batchCode;
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      customId,
      role, // 'Student', 'Teacher', 'Librarian', 'Admin'
      designation,
      priorityLevel
    });

    if (user) {
      // Create user profile for limits (if Student or Teacher)
      if (role === 'Student' || role === 'Teacher') {
        const limit = role === 'Teacher' ? 7 : 3;
        await UserProfile.create({
          user_id: user._id,
          max_borrow_limit: limit
        });
      }

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        customId: user.customId,
        department: universityIdResult.department,
        academicYear: universityIdResult.academicYear,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if user is active
    if (user && user.status === 'Suspended') {
      return res.status(403).json({ message: 'Your account is suspended. Contact admin.' });
    }

    // Match password
    if (user && (await bcrypt.compare(password, user.password))) {
      const universityIdResult = parseUniversityId(user.customId, user.role);
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        customId: user.customId,
        department: universityIdResult.department,
        academicYear: universityIdResult.academicYear,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      const universityIdResult = parseUniversityId(user.customId, user.role);
      res.json({
        ...user.toObject(),
        department: universityIdResult.department,
        academicYear: universityIdResult.academicYear,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};