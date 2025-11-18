# XEM System - Design System Documentation

**Version:** 3.5
**Style:** E-book Inspired Typography
**Theme:** Warm Gray & Black/White with Transparency & Lines

---

## 🎨 Design Philosophy

XEM 시스템의 디자인은 전자책(e-book)의 깔끔하고 읽기 쉬운 타이포그래피에서 영감을 받았습니다.
**핵심 원칙:**
- 가독성 최우선
- 미니멀리즘
- 계층적 정보 구조
- 부드러운 인터랙션

---

## 🎯 Color Palette

### Primary Colors (Warm Gray Scale)

```css
/* Background Tones */
--bg-primary: #FAFAF9        /* Warm White - 주 배경 */
--bg-secondary: #F5F5F4      /* Soft Gray - 카드 배경 */
--bg-tertiary: #E7E5E4       /* Light Gray - 보조 배경 */

/* Text Tones */
--text-primary: #1C1917      /* Rich Black - 주요 텍스트 */
--text-secondary: #57534E    /* Medium Gray - 보조 텍스트 */
--text-tertiary: #78716C     /* Light Gray - 부가 텍스트 */
--text-muted: #A8A29E        /* Muted Gray - 비활성 텍스트 */

/* Border & Lines */
--border-default: #E7E5E4    /* Light Border */
--border-medium: #D6D3D1     /* Medium Border */
--border-dark: #A8A29E       /* Dark Border */
--divider: rgba(231, 229, 228, 0.6)  /* Transparent Divider */
```

### Accent Colors (Minimal Usage)

```css
/* Status Colors - Desaturated */
--accent-success: #059669    /* Success - Green */
--accent-warning: #D97706    /* Warning - Amber */
--accent-danger: #DC2626     /* Danger - Red */
--accent-info: #0284C7       /* Info - Sky Blue */

/* Transparent Overlays */
--overlay-success: rgba(5, 150, 105, 0.08)
--overlay-warning: rgba(217, 119, 6, 0.08)
--overlay-danger: rgba(220, 38, 38, 0.08)
--overlay-info: rgba(2, 132, 199, 0.08)
```

### Transparency Layers

```css
/* Glass Effects */
--glass-light: rgba(255, 255, 255, 0.5)
--glass-medium: rgba(255, 255, 255, 0.8)
--glass-dark: rgba(28, 25, 23, 0.05)

/* Backdrop Blur */
--blur-sm: blur(4px)
--blur-md: blur(8px)
--blur-lg: blur(16px)
```

---

## ✍️ Typography

### Font Stack

```css
/* Primary Font - Korean & English */
font-family:
  'Pretendard Variable',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  'Apple SD Gothic Neo',
  sans-serif;

/* Monospace - Numbers & Code */
font-family:
  'JetBrains Mono',
  'SF Mono',
  'Consolas',
  monospace;
```

### Type Scale

```css
/* Headings */
--text-5xl: 3rem      /* 48px - Page Title */
--text-4xl: 2.25rem   /* 36px - Section Title */
--text-3xl: 1.875rem  /* 30px - Card Title */
--text-2xl: 1.5rem    /* 24px - Subsection */
--text-xl: 1.25rem    /* 20px - Large Text */

/* Body */
--text-lg: 1.125rem   /* 18px - Emphasized Body */
--text-base: 1rem     /* 16px - Default Body */
--text-sm: 0.875rem   /* 14px - Small Text */
--text-xs: 0.75rem    /* 12px - Caption */
```

### Font Weights

```css
--font-light: 300      /* Light - Subtle text */
--font-normal: 400     /* Regular - Body text */
--font-medium: 500     /* Medium - Emphasis */
--font-semibold: 600   /* Semi-bold - Headings */
--font-bold: 700       /* Bold - Strong emphasis */
```

### Line Heights

```css
--leading-tight: 1.25     /* Headings */
--leading-snug: 1.375     /* Subheadings */
--leading-normal: 1.5     /* Body text */
--leading-relaxed: 1.625  /* Comfortable reading */
--leading-loose: 2        /* Spacious paragraphs */
```

### Letter Spacing

```css
--tracking-tighter: -0.05em  /* Tight headings */
--tracking-tight: -0.025em   /* Headings */
--tracking-normal: 0         /* Body */
--tracking-wide: 0.025em     /* Emphasized */
--tracking-wider: 0.05em     /* All caps */
```

---

## 📐 Spacing System

```css
/* 4px base unit */
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
```

---

## 🔲 Layout Components

### Container

```css
.container {
  max-width: 1280px;        /* Desktop */
  margin: 0 auto;
  padding: 0 var(--space-6);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-4);
  }
}
```

### Grid System

```css
/* 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Common layouts */
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
```

---

## 🎴 Card Styles

### Base Card

```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow:
    0 1px 2px rgba(28, 25, 23, 0.04),
    0 4px 8px rgba(28, 25, 23, 0.02);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--border-medium);
  box-shadow:
    0 2px 4px rgba(28, 25, 23, 0.06),
    0 8px 16px rgba(28, 25, 23, 0.04);
}
```

### Glass Card

```css
.card-glass {
  background: var(--glass-medium);
  backdrop-filter: var(--blur-md);
  border: 1px solid rgba(231, 229, 228, 0.5);
  border-radius: 16px;
  padding: var(--space-8);
}
```

### Outlined Card

```css
.card-outlined {
  background: transparent;
  border: 2px solid var(--border-medium);
  border-radius: 12px;
  padding: var(--space-6);
}
```

---

## 📊 Data Visualization

### Chart Colors

```css
/* Neutral palette for charts */
--chart-1: #78716C    /* Warm Gray 500 */
--chart-2: #57534E    /* Warm Gray 600 */
--chart-3: #44403C    /* Warm Gray 700 */
--chart-4: #292524    /* Warm Gray 800 */

/* Accent for highlights */
--chart-accent-1: #0284C7   /* Sky 600 */
--chart-accent-2: #059669   /* Emerald 600 */
--chart-accent-3: #D97706   /* Amber 600 */
--chart-accent-4: #DC2626   /* Red 600 */
```

### Chart Styles

```css
.chart-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: var(--space-6);
}

.chart-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  letter-spacing: var(--tracking-tight);
}

.chart-legend {
  display: flex;
  gap: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
```

---

## 🔘 Buttons

### Primary Button

```css
.btn-primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  font-weight: var(--font-medium);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--text-secondary);
  transform: translateY(-1px);
}
```

### Secondary Button

```css
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  font-weight: var(--font-medium);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-dark);
}
```

### Ghost Button

```css
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  border: none;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

---

## 📝 Form Elements

### Input Fields

```css
.input {
  width: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(28, 25, 23, 0.05);
}

.input::placeholder {
  color: var(--text-muted);
}
```

### Labels

```css
.label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  letter-spacing: var(--tracking-wide);
}
```

---

## 📏 Borders & Dividers

### Line Styles

```css
/* Horizontal Divider */
.divider-h {
  width: 100%;
  height: 1px;
  background: var(--divider);
  margin: var(--space-6) 0;
}

/* Vertical Divider */
.divider-v {
  width: 1px;
  height: 100%;
  background: var(--divider);
  margin: 0 var(--space-4);
}

/* Thick Divider (Section separator) */
.divider-thick {
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--border-medium),
    transparent
  );
  margin: var(--space-8) 0;
}
```

### Border Styles

```css
.border-default { border: 1px solid var(--border-default); }
.border-medium { border: 1px solid var(--border-medium); }
.border-dark { border: 2px solid var(--border-dark); }

/* Directional borders */
.border-t { border-top: 1px solid var(--border-default); }
.border-b { border-bottom: 1px solid var(--border-default); }
.border-l { border-left: 1px solid var(--border-default); }
.border-r { border-right: 1px solid var(--border-default); }
```

---

## ✨ Effects & Transitions

### Shadows

```css
/* Subtle elevation */
--shadow-sm:
  0 1px 2px rgba(28, 25, 23, 0.04),
  0 2px 4px rgba(28, 25, 23, 0.02);

--shadow-md:
  0 2px 4px rgba(28, 25, 23, 0.06),
  0 4px 8px rgba(28, 25, 23, 0.04);

--shadow-lg:
  0 4px 8px rgba(28, 25, 23, 0.08),
  0 8px 16px rgba(28, 25, 23, 0.06);

/* Inner shadow for depth */
--shadow-inset:
  inset 0 2px 4px rgba(28, 25, 23, 0.04);
```

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

/* Smooth property transitions */
.transition-all {
  transition: all var(--transition-base);
}

.transition-colors {
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    color var(--transition-base);
}

.transition-transform {
  transition: transform var(--transition-fast);
}
```

### Hover States

```css
/* Lift effect */
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Scale effect */
.hover-scale:hover {
  transform: scale(1.02);
}

/* Glow effect */
.hover-glow:hover {
  box-shadow:
    0 0 0 4px rgba(28, 25, 23, 0.05),
    var(--shadow-md);
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
--screen-sm: 640px    /* Small devices */
--screen-md: 768px    /* Tablets */
--screen-lg: 1024px   /* Laptops */
--screen-xl: 1280px   /* Desktops */
--screen-2xl: 1536px  /* Large screens */
```

### Usage

```css
/* Mobile first */
.responsive-element {
  font-size: var(--text-sm);
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .responsive-element {
    font-size: var(--text-base);
    padding: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .responsive-element {
    font-size: var(--text-lg);
    padding: var(--space-8);
  }
}
```

---

## 🎭 Component Patterns

### Section Header

```css
.section-header {
  border-bottom: 1px solid var(--divider);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: var(--tracking-tight);
}

.section-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-2);
}
```

### Data Row

```css
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border-default);
  transition: background-color var(--transition-fast);
}

.data-row:hover {
  background-color: var(--bg-tertiary);
  padding-left: var(--space-4);
  padding-right: var(--space-4);
  margin-left: calc(var(--space-4) * -1);
  margin-right: calc(var(--space-4) * -1);
}

.data-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.data-value {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
}
```

### Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.badge-success {
  background: var(--overlay-success);
  color: var(--accent-success);
}

.badge-warning {
  background: var(--overlay-warning);
  color: var(--accent-warning);
}

.badge-danger {
  background: var(--overlay-danger);
  color: var(--accent-danger);
}
```

---

## 🌟 Special Effects

### Gradient Overlays

```css
.gradient-fade-top {
  background: linear-gradient(
    to bottom,
    var(--bg-primary),
    transparent
  );
}

.gradient-fade-bottom {
  background: linear-gradient(
    to top,
    var(--bg-primary),
    transparent
  );
}
```

### Line Decorations

```css
.decorated-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 1.2em;
  background: var(--text-primary);
  margin-right: var(--space-3);
  vertical-align: middle;
}

.underline-accent {
  position: relative;
  padding-bottom: var(--space-2);
}

.underline-accent::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--text-primary),
    transparent
  );
}
```

---

## 📖 Usage Examples

### Page Layout

```jsx
<div className="min-h-screen bg-[#FAFAF9]">
  <div className="container mx-auto py-8">
    {/* Section Header */}
    <div className="section-header">
      <h1 className="section-title decorated-title">
        시나리오 분석
      </h1>
      <p className="section-subtitle">
        다양한 시나리오를 분석하고 최적의 전략을 수립하세요
      </p>
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card hover-lift">
        {/* Card content */}
      </div>
    </div>
  </div>
</div>
```

### Data Display

```jsx
<div className="card">
  <h3 className="text-lg font-semibold text-stone-900 mb-4">
    재무 지표
  </h3>

  <div className="space-y-0">
    <div className="data-row">
      <span className="data-label">총 수입</span>
      <span className="data-value">₩ 150.5억</span>
    </div>
    <div className="data-row">
      <span className="data-label">총 지출</span>
      <span className="data-value">₩ 120.3억</span>
    </div>
    <div className="data-row border-b-0">
      <span className="data-label">예상 이익</span>
      <span className="data-value text-emerald-600">₩ 30.2억</span>
    </div>
  </div>
</div>
```

---

## 🎨 Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        stone: {
          // Warm gray palette
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
}
```

---

**디자인 원칙 요약:**
1. 타이포그래피가 주인공
2. 여백이 디자인의 일부
3. 색상은 최소한으로
4. 부드러운 전환
5. 명확한 계층 구조
