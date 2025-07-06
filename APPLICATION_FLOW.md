# DLV Burundi Driver's License Application System

## Application Flow Documentation

### Overview
This system provides a complete multi-step driver's license application process for DLV Burundi with proper state management, file uploads, and form validation.

### Application Steps

#### 1. License Type Selection (`/apply`)
- Choose between Car, Motorcycle, or Commercial license
- Each type has different age requirements and document needs
- License type determines subsequent requirements

#### 2. Personal Information (`/apply/personal-info`) 
- **Basic Information**: Name, DOB, place of birth, gender
- **Identity & Contact**: Nationality, national ID, phone, email
- **Address**: Province, commune, zone, street
- **Emergency Contact**: Name, relationship, phone number
- **Validation**: Age requirements, email format, phone format, national ID format
- **Age Requirements**:
  - Motorcycle: 16+ years
  - Car: 18+ years 
  - Commercial: 21+ years

#### 3. Document Upload (`/apply/documents`)
- **Required Documents**:
  - National ID Card (both sides)
  - Medical Certificate (within 6 months)
  - Driving School Certificate
  - Passport Photo (white background)
  - Clean Driving Record (commercial license only)
- **File Validation**: Format (PDF, JPG, PNG), size limits, file type verification
- **Upload Features**: Progress tracking, file preview, drag & drop
- **File Limits**: Most documents 5MB max, photos 2MB max

#### 4. Photo & Signature (`/apply/photo`)
- **Profile Photo**: Webcam capture or file upload
- **Digital Signature**: Canvas drawing with mouse/touch support
- **Requirements**: White background, clear visibility, proper lighting
- **Fallback Options**: File upload if camera access denied

#### 5. Review & Submit (`/apply/review`)
- **Application Review**: Complete overview of all submitted information
- **Data Validation**: Final checks before submission
- **Submission Process**: Generate application ID, store data
- **Confirmation**: Success message with next steps and timeline

### Technical Features

#### State Management
- **ApplicationContext**: Centralized state with localStorage persistence
- **Type Safety**: Full TypeScript interfaces for all data structures
- **Data Persistence**: Form data saved across page navigation
- **Step Tracking**: Current step indicator and navigation controls

#### File Handling
- **Multiple Formats**: PDF, JPG, PNG support
- **Size Validation**: Configurable limits per document type
- **Upload Progress**: Real-time progress tracking with visual feedback
- **File Preview**: Click to preview uploaded documents
- **Remove/Replace**: Easy file management with delete and re-upload

#### Form Validation
- **Real-time Validation**: Immediate feedback as user types
- **Required Fields**: Clear indication of mandatory information
- **Format Validation**: Email, phone, national ID format checking
- **Age Verification**: Automatic age calculation with license type requirements
- **Error Display**: Clear error messages with correction guidance

#### User Experience
- **Progress Indicator**: Visual steps showing current position
- **Navigation**: Back/forward buttons with data preservation
- **Loading States**: Spinner components during async operations
- **Responsive Design**: Mobile-friendly layout and interactions
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation

#### Security & Validation
- **Client-side Validation**: Immediate feedback and error prevention
- **File Type Verification**: Actual file content validation beyond extensions
- **Size Limits**: Prevent oversized uploads
- **Required Fields**: Ensure all necessary data is provided
- **Data Sanitization**: Clean input data before processing

### Application Flow Summary

```
Start Application
       ↓
1. Select License Type
       ↓
2. Personal Information
   - Basic details
   - Contact info
   - Address
   - Emergency contact
       ↓
3. Upload Documents
   - National ID
   - Medical certificate
   - Driving school cert
   - Passport photo
   - Additional docs (if needed)
       ↓
4. Photo & Signature
   - Profile photo capture
   - Digital signature
       ↓
5. Review & Submit
   - Final review
   - Submit application
   - Get application ID
       ↓
Application Complete
```

### Next Steps After Submission
1. **Document Verification** (2-3 business days)
2. **Theory Test Scheduling** (notification sent)
3. **Practical Test Scheduling** (after theory test pass)
4. **License Issuance** (after all tests passed)

### Development Status
✅ **Complete**: All core functionality implemented and tested
✅ **State Management**: ApplicationContext with localStorage
✅ **File Uploads**: Complete document upload system
✅ **Form Validation**: Comprehensive validation across all steps
✅ **Photo Capture**: Camera integration with fallback options
✅ **Navigation**: Multi-step flow with data persistence
✅ **Error Handling**: User-friendly error messages and recovery
✅ **Responsive Design**: Mobile and desktop compatibility

### Technical Stack
- **Frontend**: Next.js 15.3.3, React, TypeScript
- **Styling**: Tailwind CSS, FontAwesome icons
- **State**: React Context API with localStorage
- **Validation**: Custom validation with real-time feedback
- **File Handling**: HTML5 File API with drag & drop
- **Camera**: WebRTC getUserMedia API
- **Canvas**: HTML5 Canvas for signature capture
