import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import ReactQuill, { ReactQuillProps } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './quill-styles.css';

interface CustomQuillEditorProps extends Omit<ReactQuillProps, 'onChange'> {
  label?: string;
  error?: string;
  required?: boolean;
  minHeight?: number;
  maxHeight?: number;
  variant?: 'default' | 'compact' | 'minimal' | 'seamless' | 'minimal-border';
  showToolbar?: boolean;
  className?: string;
  insideCard?: boolean;
  wrapperClassName?: string;
  toolbarSize?: 'small' | 'medium' | 'large';
  showCharacterCount?: boolean;
  maxCharacters?: number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

const CustomQuillEditor = React.forwardRef<ReactQuill, CustomQuillEditorProps>(
  ({ 
    label, 
    error, 
    required, 
    minHeight = 0,
    maxHeight,
    variant = 'default',
    showToolbar = true,
    insideCard = false,
    toolbarSize = 'medium',
    showCharacterCount = true,
    maxCharacters,
    className,
    wrapperClassName,
    value = '',
    onChange,
    onBlur,
    ...props 
  }, ref) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const quillRef = useRef<ReactQuill>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Calculate character count
    useEffect(() => {
      if (!value) {
        setCharCount(0);
        return;
      }
      
      // Strip HTML tags and calculate length
      const text = String(value)
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
      
      setCharCount(text.length);
    }, [value]);
    
    // Dark mode detection with better performance
    useEffect(() => {
      setIsMounted(true);
      
      const checkDarkMode = () => {
        if (document.documentElement.classList.contains('dark')) {
          setIsDarkMode(true);
          return;
        }
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
      };
      
      checkDarkMode();
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => checkDarkMode();
      
      mediaQuery.addEventListener('change', handleChange);
      
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        observer.disconnect();
      };
    }, []);
    
    // Initialize Quill properly after mount
    useEffect(() => {
      if (!isMounted || !quillRef.current) return;
      
      const timer = setTimeout(() => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
          // Force proper initialization
          editor.enable(true);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }, [isMounted]);
    
    // Enhanced modules configuration
    const modules = useMemo(() => ({
      toolbar: showToolbar ? {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'direction': 'rtl' }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video'],
          ['clean']
        ],
        handlers: {
          // Custom image handler example
          image: () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            
            input.onchange = async () => {
              if (input.files && input.files[0]) {
                const file = input.files[0];
                // Here you would upload the file and get URL
                // For now, create a placeholder
                const editor = quillRef.current?.getEditor();
                if (editor) {
                  const range = editor.getSelection();
                  editor.insertEmbed(range?.index || 0, 'image', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
                }
              }
            };
          }
        }
      } : false,
      clipboard: {
        matchVisual: false,
      },
      history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true
      },
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: function() {
              return true; // Allow tab to work normally
            }
          }
        }
      }
    }), [showToolbar]);

    const formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike',
      'list', 'bullet', 'indent',
      'script', 'direction',
      'color', 'background', 'align',
      'link', 'image', 'video',
      'blockquote', 'code-block'
    ];

    // Enhanced variant classes
    const getVariantClasses = () => {
      const baseClasses = ['custom-quill-editor'];
      
      if (insideCard) {
        baseClasses.push('inside-card');
      }
      
      switch (variant) {
        case 'compact':
          baseClasses.push('ql-compact');
          break;
        case 'minimal':
          baseClasses.push('ql-minimal');
          break;
        case 'seamless':
          baseClasses.push('seamless');
          break;
        case 'minimal-border':
          baseClasses.push('minimal-border');

          break;
        default:
          break;
      }
      
      if (error) {
        baseClasses.push('ql-error');
      }
      
      if (isFocused) {
        baseClasses.push('ql-focused');
      }
      
      switch (toolbarSize) {
        case 'large':
          baseClasses.push('ql-toolbar-large');
          break;
        case 'small':
          baseClasses.push('ql-toolbar-small');
          break;
        default:
          break;
      }
      
      return baseClasses.join(' ');
    };

    const getContainerClasses = () => {
      const classes = ['relative transition-all duration-200'];
      
      if (variant === 'seamless' || insideCard) {
        classes.push('seamless-container');
      } else if (variant === 'minimal') {
        classes.push('rounded-lg border border-input/50 bg-transparent');
      } else if (variant === 'minimal-border') {
        classes.push('rounded-lg border border-input/30 bg-transparent');
      } else {
        // default
        classes.push('rounded-lg border border-input bg-background shadow-sm hover:border-input/80');
      }
      
      // if (isFocused && variant !== 'seamless') {
      //   classes.push('ring-1 ring-primary/10 border-primary');
      // }
      
      if (error) {
        classes.push('border-destructive');
      }
      
      return classes.join(' ');
    };

    const handleChange = useCallback((content: string) => {
      if (onChange) {
        onChange(content);
      }
    }, [onChange]);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      if (onBlur) {
        onBlur();
      }
    }, [onBlur]);

    // Character count color based on limit
    const getCharacterCountColor = () => {
      if (!maxCharacters) return 'text-muted-foreground';
      if (charCount > maxCharacters) return 'text-destructive font-semibold';
      if (charCount > maxCharacters * 0.9) return 'text-amber-600';
      return 'text-muted-foreground';
    };

    if (!isMounted) {
      return (
        <div className={`space-y-2 ${wrapperClassName || ''}`}>
          {label && (
            <label className="text-sm font-medium leading-none">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}
          <div 
            className={`rounded-lg border border-input bg-background shadow-sm ${className || ''}`}
            style={{ 
              minHeight: `${Math.max(minHeight, 100)}px`,
              ...(maxHeight && { maxHeight: `${maxHeight}px` })
            }}
          >
            <div className="flex items-center justify-center h-full p-4 text-muted-foreground text-sm">
              <div className="animate-pulse">Loading editor...</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-2 w-full ${wrapperClassName || ''}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
              {label}
              {required && <span className="text-destructive">*</span>}
            </label>
            {showCharacterCount && value && maxCharacters && (
              <div className={`text-xs ${getCharacterCountColor()}`}>
                {charCount} / {maxCharacters}
              </div>
            )}
          </div>
        )}
        
        <div 
          ref={containerRef}
          className={`${getContainerClasses()} ${className || ''}`}
          data-theme={isDarkMode ? 'dark' : 'light'}
          data-variant={variant}
        >
          <ReactQuill
            ref={(el) => {
              if (ref) {
                if (typeof ref === 'function') {
                  ref(el);
                } else {
                  (ref as React.MutableRefObject<ReactQuill | null>).current = el;
                }
              }
              quillRef.current = el;
            }}
            theme="snow"
            modules={modules}
            formats={formats}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={getVariantClasses()}
            style={{ 
              minHeight: `${Math.max(minHeight, 100)}px`,
              ...(maxHeight && { maxHeight: `${maxHeight}px` }),
              width: '100%',
            }}
            {...props}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {error ? (
              <div className="flex items-center gap-2 text-sm font-medium text-destructive animate-in fade-in-50">
                <svg 
                  className="h-4 w-4 flex-shrink-0" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <span>{error}</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground opacity-60">
                Supports rich text formatting with images and links
              </div>
            )}
          </div>
          
          {showCharacterCount && value && !maxCharacters && (
            <div className={`text-xs ${getCharacterCountColor()} opacity-70`}>
              {charCount} characters
            </div>
          )}
        </div>
      </div>
    );
  }
);

CustomQuillEditor.displayName = 'CustomQuillEditor';

export { CustomQuillEditor };