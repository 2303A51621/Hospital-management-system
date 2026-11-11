const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const familyMemberSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    primaryUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dependentId: {
      type: String,
      unique: true,
      default: () => 'DEP-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other Dependent'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'],
      default: 'Unknown',
    },
    phone: String,
    emergencyContact: String,
    knownAllergies: [String],
    existingConditions: [String],
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
