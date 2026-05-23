/**
 * GramMate Component Library Specifications
 * Production-grade component definitions with variants
 */

// ============================================================
// BUTTON COMPONENT SPEC
// ============================================================
/*
Component: Button
Location: src/components/ui/Button.tsx
Dependencies: tokens.ts

VARIANTS:
1. Primary Button
   - Background: Purple gradient (#8E48FF → #7038E5)
   - Text: White (#F8FAFF)
   - Border: None
   - Shadow: Glow shadow (#8E48FF 0.5 opacity)
   - Hover: Brightness +10%, shadow +20%
   - Active: Scale 0.98
   - Disabled: Opacity 0.5, no glow
   - Size: Height 44px, padding 0 16px
   - Border radius: 8px
   - Animation: cubic-bezier(0.16, 1, 0.3, 1) 200ms

2. Secondary Button
   - Background: transparent
   - Border: 1px solid rgba(142, 72, 255, 0.3)
   - Text: Purple (#8E48FF)
   - Hover: Background rgba(142, 72, 255, 0.1), border opacity +20%
   - Active: Background rgba(142, 72, 255, 0.2)

3. Ghost Button
   - Background: transparent
   - Text: Neon blue (#36D0FF)
   - Border: None
   - Hover: Background rgba(54, 208, 255, 0.1)
   - Icon-only variant available

4. Danger Button
   - Background: Linear gradient (#FF1744 → #D80040)
   - Text: White
   - Hover: Brightness +8%
   - Usage: Delete, ban, suspend actions

5. Size Variants
   - xs: 32px height, 12px font, 12px padding
   - sm: 36px height, 13px font, 14px padding
   - md: 44px height, 14px font, 16px padding (default)
   - lg: 52px height, 15px font, 20px padding
   - xl: 60px height, 16px font, 24px padding

6. Loading State
   - Icon: 16px spinner, rotating 1s linear
   - Text: Hidden
   - Pointer: not-allowed
   - Opacity: 0.7

7. Icon Button (Square)
   - Aspect ratio: 1:1
   - Size: 40px (md), 44px (lg)
   - Icon size: 20px

PROPS:
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  // ... standard HTML button props
}

USAGE:
<Button variant="primary" size="lg">
  Get Started
</Button>

<Button 
  variant="secondary" 
  icon={<UploadIcon />} 
  isLoading={isUploading}
>
  Upload Video
</Button>

<Button 
  variant="ghost" 
  size="sm" 
  icon={<HeartIcon />}
/>
*/

// ============================================================
// INPUT COMPONENT SPEC
// ============================================================
/*
Component: Input
Location: src/components/ui/Input.tsx
Dependencies: tokens.ts

VARIANTS:

1. Text Input
   - Height: 44px
   - Padding: 12px 16px
   - Border: 1px solid rgba(255, 255, 255, 0.1)
   - Background: rgba(255, 255, 255, 0.05)
   - Border radius: 8px
   - Focus: Border rgba(142, 72, 255, 0.6), glow shadow
   - Error: Border #FF1744, glow red
   - Success: Border #4CAF50, glow green
   - Placeholder: rgba(255, 255, 255, 0.4)
   - Font: 14px, Inter, white text
   - Transition: 150ms ease-out

2. Password Input
   - Same as text but with eye icon toggle
   - Icon: 20px, right padding 40px
   - Show/hide password on icon click

3. Search Input
   - Icon: Magnifying glass on left
   - Clear button (X) on right when has value
   - Minimal styling, more transparent

4. Number Input
   - With up/down buttons
   - Min/max validation
   - Format: currency or percentage variant

5. Textarea
   - Min height: 120px
   - Resizable: vertical only
   - Line height: 1.5
   - Max height: 400px
   - Character counter optional

SIZES:
- sm: 36px height, 13px font, 12px padding
- md: 44px height, 14px font, 16px padding (default)
- lg: 52px height, 15px font, 16px padding

STATES:

Focused:
- Border: rgba(142, 72, 255, 0.6)
- Box-shadow: 0 0 16px rgba(142, 72, 255, 0.2)
- Background: rgba(255, 255, 255, 0.08)

Disabled:
- Opacity: 0.5
- Cursor: not-allowed
- Background: rgba(0, 0, 0, 0.2)

Error:
- Border: #FF1744
- Box-shadow: 0 0 16px rgba(255, 23, 68, 0.2)
- Error message: 12px, red, below field

Success:
- Border: #4CAF50
- Checkmark icon on right

VALIDATION:
- Show error message immediately on invalid input
- Clear on valid input
- Required field indicator: * (red)
- Helper text below field (optional)

PROPS:
interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel';
  variant?: 'default' | 'search' | 'currency';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  // ... standard HTML input props
}

USAGE:
<Input 
  type="email" 
  placeholder="your@email.com"
  label="Email Address"
  required
  onChange={handleChange}
  error={emailError}
/>

<Input 
  type="password" 
  placeholder="••••••••"
  label="Password"
  helperText="Min 8 characters"
/>
*/

// ============================================================
// CARD COMPONENT SPEC
// ============================================================
/*
Component: Card
Location: src/components/ui/Card.tsx

VARIANTS:

1. Standard Card (Glass)
   - Background: rgba(30, 38, 55, 0.5)
   - Backdrop filter: blur(10px)
   - Border: 1px solid rgba(255, 255, 255, 0.1)
   - Border radius: 12px
   - Padding: 20px 24px
   - Shadow: 0 8px 32px rgba(0, 0, 0, 0.3)
   - Hover: Border opacity +20%, shadow +10%

2. Elevated Card
   - Background: rgba(11, 15, 26, 0.8)
   - Border radius: 16px
   - Shadow: 0 16px 48px rgba(0, 0, 0, 0.5)
   - Padding: 24px
   - Used for modals, overlays

3. Outlined Card
   - Background: transparent
   - Border: 2px solid rgba(142, 72, 255, 0.3)
   - Border radius: 12px
   - Hover: Border color opacity +40%

4. Gradient Card (Premium)
   - Background: Linear gradient (purple → blue)
   - Border: None
   - Shadow: Glow shadow with brand colors

INTERACTIVE STATES:

Hover:
- Scale: 1.02 (if clickable)
- Shadow increased
- Border opacity increased
- Cursor: pointer (if clickable)
- Transition: cubic-bezier(0.16, 1, 0.3, 1) 200ms

Active/Selected:
- Border: 2px solid #8E48FF
- Glow shadow: #8E48FF

Disabled:
- Opacity: 0.5
- Pointer: not-allowed

RESPONSIVE:
- Padding adjusts: 24px desktop, 16px tablet, 12px mobile
- Border radius adjusts: 16px desktop, 12px mobile

PROPS:
interface CardProps {
  variant?: 'standard' | 'elevated' | 'outlined' | 'gradient';
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

USAGE:
<Card variant="glass" clickable onClick={handleClick}>
  <h3>Profile Stats</h3>
  <p>245K followers</p>
</Card>

<Card variant="gradient" selected>
  Premium Content
</Card>
*/

// ============================================================
// MODAL / DIALOG COMPONENT SPEC
// ============================================================
/*
Component: Modal
Location: src/components/ui/Modal.tsx

STRUCTURE:
┌─────────────────────────────────────────┐
│ ✕ Header Text           [Close Button] │
├─────────────────────────────────────────┤
│                                         │
│ Modal Content Area                      │
│ (Scrollable if > viewport height)       │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ [Cancel Button]  [Action Button]        │
└─────────────────────────────────────────┘

BACKGROUND:
- Overlay: Background rgba(0, 0, 0, 0.7)
- Backdrop filter: blur(4px)
- Z-index: 1000

MODAL BOX:
- Background: Glass (rgba with blur)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border radius: 16px
- Width: 90vw (max 600px on desktop)
- Max height: 90vh
- Box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5)
- Padding: 24px
- Animation: Scale 0.95→1.0, fade-in (250ms ease-out)

HEADER:
- Font: 18px, bold, white
- Icon: Optional left icon
- Close button: Right aligned, 40px × 40px icon button
- Divider: Bottom border rgba(255, 255, 255, 0.1)

CONTENT:
- Scrollable if > 60% viewport height
- Scrollbar: Custom thin purple glow
- Padding: 16px top/bottom

FOOTER:
- Sticky at bottom if scrollable
- Divider: Top border
- Buttons: Right-aligned
- Gap: 12px between buttons
- Padding: 16px top/bottom

SIZES:
- sm: max-width 400px
- md: max-width 600px (default)
- lg: max-width 800px
- fullscreen: 95vw × 95vh

ACTIONS:

Open:
- Prevent body scroll
- Focus trap (keyboard nav loops within modal)
- Escape key closes
- Click outside closes (if dismissible)

Close:
- Animation: Scale 1.0→0.95, fade-out (200ms)
- Restore scroll position
- Return focus to trigger element

PROPS:
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  dismissible?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

USAGE:
const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>
  Open Settings
</Button>

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Settings"
  size="md"
>
  <SettingsForm onSave={() => setIsOpen(false)} />
</Modal>
*/

// ============================================================
// VIDEO CARD COMPONENT SPEC (Feed)
// ============================================================
/*
Component: VideoCard
Location: src/components/feed/VideoCard.tsx

LAYOUT (360px wide):
┌──────────────────────────────┐
│ ┌────────────────────────┐   │
│ │ Thumbnail Image        │   │ 202px height
│ │ Play Icon (overlay)    │   │
│ │ Duration Badge (BR)    │   │
│ └────────────────────────┘   │
│                              │
│ Creator Info Row:            │
│ [Avatar] Name | Verified     │ 12px gap
│         | @username          │
│                              │
│ Title: "Video Title Here"    │
│ (2 lines max, truncate)      │
│                              │
│ Stats Row (inline):          │
│ ❤️ 2.3K | 💬 234 | ⬆️ 567   │
│ Earned: $38.20 💰            │
│                              │
│ Progress Bar:                │
│ [████░░░] 65%                │
│                              │
│ [Save ♡] [Share ↗] [...]:   │ Bottom action bar
│                              │
└──────────────────────────────┘

COMPONENTS:

Thumbnail:
- Aspect ratio: 16:9 or 4:3
- Object-fit: cover
- Lazy loaded
- Blur placeholder
- Play button: 56px circle, centered
- Duration: Bottom right, "12:34" format
- Quality badge: "4K" or "HD" (top right)

Creator Info:
- Avatar: 32px circle
- Name: Bold, 14px
- Verified badge: 12px blue checkmark
- Username: Gray, 12px, @handle
- Follow button (optional): Right aligned

Engagement Stats:
- Heart: clickable, animates bounce on like
- Comments: tappable, opens comments
- Share: tappable, opens share menu
- Format: 2.3K (abbreviate large numbers)

Earned Badge:
- Purple glow background
- Format: "$38.20" or "Earned $38.20"
- Hidden if 0 or private creator

Progress Bar:
- Height: 4px
- Color: Neon blue (#36D0FF)
- Background: rgba(255, 255, 255, 0.1)
- Border radius: 2px
- Shows watch progress

INTERACTIVE STATES:

Hover (Desktop):
- Card border glow
- Thumbnail brightness -5%
- Title text becomes more visible

Tap (Mobile):
- Ripple effect
- Route to video or open mini player

Like Button:
- Double-tap on video
- Single-tap on icon
- Heart scale animation 0.8→1.2 (200ms)
- Red glow on active

RESPONSIVE:
- Desktop: 360px fixed width (4 per row on desktop)
- Tablet: 45vw width (2 per row)
- Mobile: 100% width (1 per row)

PROPS:
interface VideoCardProps {
  video: Video;
  onClick?: () => void;
  onLike?: (videoId: string) => void;
  onSave?: (videoId: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  showEarnings?: boolean;
  showProgress?: boolean;
}

LOADING STATE:
- Skeleton: Same dimensions, gray waves
- Duration: Skeleton bar
- Avatar: Gray circle
- Text lines: Gray bars

ERROR STATE:
- Gray background
- Broken image icon
- "Failed to load" message
- Retry button
*/

// ============================================================
// ENGAGEMENT OVERLAY COMPONENT SPEC
// ============================================================
/*
Component: EngagementOverlay
Location: src/components/feed/EngagementOverlay.tsx
Used on: Video hover/tap states

LAYOUT (Right side of video):
┌────────────┐
│            │
│   ❤️       │ Stacked vertically
│  2.3K      │ on right edge
│            │
│   💬       │
│   234      │
│            │
│   ↗️       │
│   567      │
│            │
│   🔖       │
│            │
└────────────┘

COMPONENTS:

Icon Button (40px × 40px):
- Background: Glass blur
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Icon: 20px white
- Border radius: 12px
- Hover: Border glow, background +10%

Count Label:
- Font: 12px, bold
- Color: White
- Centered below icon
- Margin: 4px top

Like Button (special):
- Active state: Icon turns red (#FF1744)
- Active count: Red text
- Animation: Icon scales 0.9→1.1 on click

Share Button:
- Opens share menu on click
- Menu: Copy link, social platforms

Save Button:
- Toggle bookmark state
- Bookmark icon when saved
- No count display

ANIMATION:
- Entrance: Slide in from right (150ms)
- Hover: Each button scales 1.05
- Click: Scale 0.95→1.05 (ripple effect)

MOBILE:
- Horizontal bar at bottom
- Overflow scrollable
- Same icon sizes
- Counts visible inline

PROPS:
interface EngagementOverlayProps {
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onCommentClick?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  earnings?: number;
  layout?: 'vertical' | 'horizontal';
}
*/

// ============================================================
// ADDITIONAL CRITICAL COMPONENTS
// ============================================================

/*
COMPONENT INVENTORY (30+ reusable components):

UI Foundations:
✓ Button (6 variants + sizes)
✓ Input (5 variants)
✓ Card (4 variants)
✓ Modal/Dialog (sizes)
✓ Drawer (from right/left)
✓ Tabs (with icons)
✓ Dropdown/Select
✓ Badge (7 types: status, role, alert)
✓ Avatar (with fallback, status)
✓ Spinner (multiple sizes)
✓ ProgressBar (linear + circular)
✓ Skeleton Loader
✓ Toast/Notification
✓ StatusIndicator (online/offline/busy)

Layout Components:
✓ Header (with navigation)
✓ Sidebar (collapsible)
✓ BottomNav (mobile)
✓ Breadcrumbs
✓ Pagination

Content Components:
✓ VideoCard (360px)
✓ CreatorCard (profile mini)
✓ TransactionRow
✓ CommentThread
✓ ReactionBubbles (like animation)
✓ EngagementOverlay
✓ CommentsDrawer (swipe-up modal)

Form Components:
✓ Form (wrapper with validation)
✓ FormField (label + input + error)
✓ Checkbox (custom styled)
✓ Radio (custom styled)
✓ Toggle/Switch
✓ DatePicker
✓ TimePicker
✓ FileUploader (drag-drop)

Data Components:
✓ Table (sortable, filterable)
✓ List (with infinite scroll)
✓ Grid (responsive)
✓ Chart (line/bar/pie via recharts)

Each component includes:
- TypeScript types/interfaces
- Accessibility (ARIA, keyboard nav)
- Responsive breakpoints
- Animation specs
- Loading/error/empty states
- Size variants
- Color variants
- Usage examples
- PropTypes or zod validation
*/
