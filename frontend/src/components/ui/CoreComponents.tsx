import React from 'react';
import styled from 'styled-components';

// Design tokens
const TOKENS = {
  COLORS: {
    purple: {
      bright: '#8E48FF',
      dark: '#7038E5',
    },
    blue: {
      bright: '#36D0FF',
    },
    pink: {
      bright: '#FF5ACD',
    },
    background: {
      base: '#05070F',
      darker: '#0B0F1A',
    },
    text: {
      primary: '#F8FAFF',
      secondary: 'rgba(248, 250, 255, 0.6)',
    },
    GLOW: {
      purple: '#8E48FF',
    },
  },
  SPACING: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  BORDER_RADIUS: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  MOTION: {
    EASE_OUT: 'cubic-bezier(0.16, 1, 0.3, 1)',
    DURATION_FAST: '150ms',
    DURATION_STANDARD: '200ms',
    DURATION_SLOW: '300ms',
  },
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const ButtonBase = styled.button<{
  variant: string;
  size: string;
  fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: ${TOKENS.BORDER_RADIUS.md};
  font-weight: 600;
  cursor: pointer;
  transition: all ${TOKENS.MOTION.EASE_OUT} ${TOKENS.MOTION.DURATION_STANDARD};
  outline: none;
  width: ${props => (props.fullWidth ? '100%' : 'auto')};

  /* Size variants */
  ${props => {
    const sizes = {
      xs: 'height: 32px; padding: 0 12px; font-size: 12px;',
      sm: 'height: 36px; padding: 0 14px; font-size: 13px;',
      md: 'height: 44px; padding: 0 16px; font-size: 14px;',
      lg: 'height: 52px; padding: 0 20px; font-size: 15px;',
      xl: 'height: 60px; padding: 0 24px; font-size: 16px;',
    };
    return sizes[props.size as keyof typeof sizes];
  }}

  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, ${TOKENS.COLORS.purple.bright}, ${TOKENS.COLORS.purple.dark});
          color: ${TOKENS.COLORS.text.primary};
          box-shadow: 0 0 24px rgba(142, 72, 255, 0.5);
          
          &:hover:not(:disabled) {
            filter: brightness(1.1);
            box-shadow: 0 0 32px rgba(142, 72, 255, 0.7);
          }
          
          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        `;
      case 'secondary':
        return `
          background: transparent;
          border: 1px solid rgba(142, 72, 255, 0.3);
          color: ${TOKENS.COLORS.purple.bright};
          
          &:hover:not(:disabled) {
            border-color: rgba(142, 72, 255, 0.6);
            background: rgba(142, 72, 255, 0.1);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: ${TOKENS.COLORS.blue.bright};
          
          &:hover:not(:disabled) {
            background: rgba(54, 208, 255, 0.1);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #FF1744, #D80040);
          color: ${TOKENS.COLORS.text.primary};
          
          &:hover:not(:disabled) {
            filter: brightness(1.08);
          }
        `;
      default:
        return '';
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${TOKENS.COLORS.blue.bright};
    outline-offset: 2px;
  }
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <ButtonBase
        ref={ref}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={isDisabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Spinner size={size === 'xs' ? '12px' : size === 'sm' ? '14px' : '16px'} />
        )}
        {icon && iconPosition === 'left' && !isLoading && <span>{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && !isLoading && <span>{icon}</span>}
      </ButtonBase>
    );
  }
);

Button.displayName = 'Button';

// Spinner Component
interface SpinnerProps {
  size?: string;
}

const SpinnerContainer = styled.div<{ size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    width: ${props => props.size};
    height: ${props => props.size};
    border: 2px solid rgba(142, 72, 255, 0.3);
    border-top-color: ${TOKENS.COLORS.purple.bright};
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const Spinner: React.FC<SpinnerProps> = ({ size = '16px' }) => (
  <SpinnerContainer size={size} />
);

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${TOKENS.SPACING.sm};
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${TOKENS.COLORS.text.primary};
`;

const InputContainer = styled.div<{ hasError: boolean }>`
  position: relative;
  display: flex;
  align-items: center;

  input {
    width: 100%;
    height: 44px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: ${TOKENS.BORDER_RADIUS.md};
    color: ${TOKENS.COLORS.text.primary};
    font-size: 14px;
    transition: all ${TOKENS.MOTION.EASE_OUT} ${TOKENS.MOTION.DURATION_STANDARD};

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      outline: none;
      border-color: ${props =>
        props.hasError
          ? '#FF1744'
          : `rgba(142, 72, 255, 0.6)`};
      box-shadow: 0 0 16px ${props =>
        props.hasError
          ? 'rgba(255, 23, 68, 0.2)'
          : 'rgba(142, 72, 255, 0.2)'};
      background: rgba(255, 255, 255, 0.08);
    }

    ${props =>
      props.hasError &&
      `
      border-color: #FF1744;
      box-shadow: 0 0 16px rgba(255, 23, 68, 0.2);
    `}

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: rgba(0, 0, 0, 0.2);
    }
  }
`;

const ErrorMessage = styled.span`
  font-size: 12px;
  color: #FF1744;
  margin-top: 4px;
`;

const HelperText = styled.span`
  font-size: 12px;
  color: ${TOKENS.COLORS.text.secondary};
  margin-top: 4px;
`;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error,
      label,
      helperText,
      icon,
      ...props
    },
    ref
  ) => {
    return (
      <InputWrapper>
        {label && <InputLabel>{label}</InputLabel>}
        <InputContainer hasError={!!error}>
          <input ref={ref} {...props} />
        </InputContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {helperText && !error && <HelperText>{helperText}</HelperText>}
      </InputWrapper>
    );
  }
);

Input.displayName = 'Input';

// Card Component
interface CardProps {
  variant?: 'standard' | 'elevated' | 'outlined' | 'gradient';
  children: React.ReactNode;
  clickable?: boolean;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
}

const CardContainer = styled.div<{
  variant: string;
  clickable: boolean;
  selected: boolean;
}>`
  border-radius: ${TOKENS.BORDER_RADIUS.lg};
  padding: 20px 24px;
  transition: all ${TOKENS.MOTION.EASE_OUT} ${TOKENS.MOTION.DURATION_STANDARD};
  cursor: ${props => (props.clickable ? 'pointer' : 'default')};

  ${props => {
    switch (props.variant) {
      case 'standard':
        return `
          background: rgba(30, 38, 55, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          
          &:hover {
            ${props.clickable ? `border-color: rgba(142, 72, 255, 0.3); box-shadow: 0 0 24px rgba(142, 72, 255, 0.2);` : ''}
          }
        `;
      case 'elevated':
        return `
          background: rgba(11, 15, 26, 0.8);
          border-radius: ${TOKENS.BORDER_RADIUS.xl};
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
        `;
      case 'outlined':
        return `
          background: transparent;
          border: 2px solid rgba(142, 72, 255, 0.3);
          
          &:hover {
            border-color: rgba(142, 72, 255, 0.6);
          }
        `;
      case 'gradient':
        return `
          background: linear-gradient(135deg, rgba(142, 72, 255, 0.2), rgba(54, 208, 255, 0.2));
          border: 1px solid rgba(142, 72, 255, 0.2);
          box-shadow: 0 8px 32px rgba(142, 72, 255, 0.2);
        `;
      default:
        return '';
    }
  }}

  ${props =>
    props.selected &&
    `
    border: 2px solid ${TOKENS.COLORS.purple.bright};
    box-shadow: 0 0 24px rgba(142, 72, 255, 0.3);
  `}

  &:active {
    ${props => props.clickable && `transform: scale(0.98);`}
  }
`;

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  children,
  clickable = false,
  selected = false,
  className,
  onClick,
}) => (
  <CardContainer
    variant={variant}
    clickable={clickable}
    selected={selected}
    className={className}
    onClick={onClick}
    role={clickable ? 'button' : undefined}
    tabIndex={clickable ? 0 : undefined}
  >
    {children}
  </CardContainer>
);

export default { Button, Input, Card, Spinner };
