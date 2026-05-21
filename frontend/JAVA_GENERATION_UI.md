# Java to Maximo Script Generation - UI Implementation

## Overview
This document describes the frontend UI components implemented for Java class upload and script generation functionality.

## Components Created

### 1. JavaUploadModal (`frontend/components/scripts/JavaUploadModal.tsx`)
A modal component that allows users to upload Java files or paste Java code to generate Maximo automation scripts.

**Features:**
- Drag-and-drop file upload for .java files
- File browser button as alternative upload method
- Textarea for pasting Java code directly
- Dropdown to select target language (Python/JavaScript)
- Checkboxes for generation options:
  - Include explanatory comments
  - Apply Maximo best practices
  - Include necessary imports
- File validation with user-friendly error messages
- Loading state during generation
- Consistent styling with existing modals

**Props:**
- `isOpen`: boolean - Controls modal visibility
- `onClose`: () => void - Close handler
- `onGenerate`: (request: GenerateFromJavaRequest) => Promise<void> - Generation handler
- `generating`: boolean - Loading state

### 2. GeneratedScriptPreview (`frontend/components/scripts/GeneratedScriptPreview.tsx`)
A preview component that displays the generated script with analysis information, warnings, and suggestions.

**Features:**
- Syntax-highlighted code preview (read-only CodeMirror)
- Analysis information display:
  - Original class name
  - Target language
  - Lines of code
  - Issue count (errors/warnings)
- Expandable warnings section with color-coded severity
- Expandable suggestions section
- Conversion notes display
- Font size controls
- Action buttons:
  - Edit in Editor - Opens ScriptEditorModal with generated code
  - Save to Maximo - Directly creates script in Maximo
  - Regenerate - Returns to JavaUploadModal
  - Cancel - Closes preview

**Props:**
- `isOpen`: boolean - Controls modal visibility
- `onClose`: () => void - Close handler
- `generatedScript`: GeneratedScript - The generated script data
- `onEditInEditor`: (script: GeneratedScript) => void - Edit handler
- `onSaveToMaximo`: (script: GeneratedScript) => Promise<void> - Save handler
- `onRegenerate`: () => void - Regenerate handler
- `saving`: boolean - Loading state for save operation

### 3. Updated CreateScriptModal (`frontend/components/scripts/CreateScriptModal.tsx`)
Enhanced the existing modal to integrate Java generation functionality.

**Changes:**
- Added "Generate from Java" button in modal header
- Integrated JavaUploadModal and GeneratedScriptPreview
- Added state management for modal flow
- Implemented handlers for:
  - Opening Java upload modal
  - Processing generated script
  - Editing generated script in editor
  - Saving generated script to Maximo
  - Regenerating script

**User Flow:**
1. User clicks "Create New Script" → CreateScriptModal opens
2. User clicks "Generate from Java" → JavaUploadModal opens
3. User uploads/pastes Java code and configures options
4. User clicks "Generate" → API call with loading state
5. On success → GeneratedScriptPreview shows with results
6. User can:
   - Review warnings and suggestions
   - Click "Edit in Editor" → Pre-fills CreateScriptModal form
   - Click "Save to Maximo" → Directly creates script
   - Click "Regenerate" → Returns to JavaUploadModal

## Hooks Added

### useGenerateFromJava (`frontend/components/scripts/hooks.ts`)
React Query mutation hook for calling the Java generation API.

**Features:**
- Handles API communication with `/api/scripts/generate-from-java`
- Automatic error handling
- Loading state management
- Retry logic (1 retry on failure)

**Usage:**
```typescript
const generateMutation = useGenerateFromJava();

await generateMutation.mutateAsync({
  javaSource: "...",
  options: {
    targetLanguage: "python",
    includeComments: true,
    includeImports: true,
    applyMaximoBestPractices: true,
    generateDescription: true,
  }
});
```

## Types Added (`frontend/components/scripts/types.ts`)

### GenerationOptions
Configuration options for script generation:
- `targetLanguage`: 'python' | 'javascript'
- `includeComments`: boolean
- `includeImports`: boolean
- `applyMaximoBestPractices`: boolean
- `generateDescription`: boolean

### ConversionWarning
Represents warnings or suggestions from the conversion:
- `type`: 'warning' | 'info' | 'error'
- `message`: string
- `line?`: number
- `suggestion?`: string

### GeneratedScript
The complete generated script data:
- `scriptName`: string
- `description`: string
- `scriptLanguage`: 'python' | 'javascript'
- `source`: string
- `warnings`: ConversionWarning[]
- `metadata`: Object with originalClassName, generatedAt, conversionNotes

### Component Props
- `JavaUploadModalProps`
- `GeneratedScriptPreviewProps`
- `GenerateFromJavaRequest`

## Styling & Accessibility

### Styling
- Uses Tailwind CSS classes matching existing components
- Consistent color scheme:
  - Blue for Java-related actions
  - Green for success states
  - Red for errors
  - Yellow for warnings
- Responsive design for mobile and desktop
- Dark theme consistent with application

### Accessibility
- Proper ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Shift+Tab, Escape)
- Focus trap within modals
- Screen reader friendly error messages
- Semantic HTML structure

### Icons (Lucide React)
- `FileCode` - Java generation actions
- `Upload` - File upload
- `AlertCircle` - Warnings and errors
- `CheckCircle` - Success states
- `Info` - Information messages
- `ChevronDown/Up` - Expandable sections
- `Edit` - Edit actions
- `Save` - Save actions
- `RefreshCw` - Loading and regenerate

## Integration Points

### API Endpoint
- `POST /api/scripts/generate-from-java`
- Request body: `GenerateFromJavaRequest`
- Response: `GenerateFromJavaResponse` with `GeneratedScript` data

### Existing Components Used
- `CodeMirror` - Syntax highlighting
- `StatusMessage` - Error display (if needed)
- `ScriptEditorModal` - For editing generated scripts
- React Query - API state management

## File Structure
```
frontend/components/scripts/
├── JavaUploadModal.tsx          (NEW - 378 lines)
├── GeneratedScriptPreview.tsx   (NEW - 485 lines)
├── CreateScriptModal.tsx        (UPDATED - added Java integration)
├── hooks.ts                     (UPDATED - added useGenerateFromJava)
├── types.ts                     (UPDATED - added Java generation types)
└── index.ts                     (UPDATED - exported new components)
```

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] File upload works (drag-and-drop and browse)
- [ ] Java code validation works
- [ ] Generation options are sent correctly
- [ ] API integration works
- [ ] Preview displays correctly
- [ ] Warnings/suggestions display properly
- [ ] Edit in Editor pre-fills form correctly
- [ ] Save to Maximo creates script
- [ ] Regenerate returns to upload modal
- [ ] Keyboard navigation works
- [ ] Mobile responsive layout works
- [ ] Error states display properly

## Future Enhancements

1. **Batch Processing**: Support multiple Java files at once
2. **Template Library**: Pre-built Java templates for common patterns
3. **Diff View**: Show side-by-side comparison of Java and generated code
4. **Export Options**: Download generated script before saving
5. **History**: Keep track of previously generated scripts
6. **Advanced Options**: More granular control over generation
7. **Syntax Validation**: Real-time Java syntax checking
8. **Code Snippets**: Quick insert common Java patterns

## Notes

- All components follow the existing modal pattern in the codebase
- Error handling is consistent with other API calls
- Loading states provide user feedback during async operations
- The implementation is fully typed with TypeScript
- Components are memoized for performance
- Accessibility features match existing components

## Made with Bob