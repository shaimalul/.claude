---
name: storybook-story
description: Storybook story conventions with StorybookPage wrapper, interaction tests, and argTypes documentation. Use when writing Storybook stories, adding interaction tests, or documenting component argTypes.
globs: "**/*.stories.tsx"
user-invocable: false
---

# Storybook Story Conventions

## Ground Rules
- Every component should have a Storybook stories file
- Stories should be placed in the same directory as the component
- **Every story must include interaction tests using play functions**
- **All stories must use the StorybookPage component wrapper**
- Run `npm run test-storybook` before moving to next step
- Run `npm run lint` before moving to next step

## Story Structure

### 1. Imports and Meta Configuration
```typescript
import { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent } from '@storybook/test';
import React from 'react';
import { StorybookPage } from '../StorybookComponents/StorybookPage/StorybookPage';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: "DOMAIN/ComponentName", // DOMAIN: INTERNAL, ATOMS, MOLECULES, ORGANISMS, UTILS, HOOKS
  component: ComponentName,
  argTypes: {
    // Detailed prop definitions
  },
};

export default meta;
```

### 2. Story Title Formatting
- Format: `DOMAIN/COMPONENT_NAME`
- **Omit the design system prefix** in title (e.g., `DSButton` -> "ATOMS/Button")

### 3. ArgTypes Documentation
For each prop include:
- Default value
- Control type
- Description with dependencies
- Type info in table summary
- Required flag

```typescript
argTypes: {
  label: {
    defaultValue: 'Default Label',
    control: 'text',
    description: 'Label for the component.',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'undefined' },
    },
    required: true,
  },
}
```

### 4. Template Pattern
```typescript
type Story = StoryObj<typeof ComponentName>;

const Template: Story = {
  render: (args) => (
    <StorybookPage title="ComponentName" description="Description here">
      <ComponentName {...args} />
    </StorybookPage>
  ),
};
```

### 5. Play Functions (REQUIRED)
Every story must have interaction tests:
```typescript
export const Default: Story = {
  ...Template,
  args: { label: 'Default' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const component = canvas.getByRole('button');
    await expect(component).toBeInTheDocument();

    await userEvent.click(component);
  },
};
```

### 6. StorybookPage Props
- **title**: Component name (required)
- **subtitle**: Additional context
- **description**: Purpose and usage
- **isInternalComponent**: For internal components
- **contentBackground**: Background color
- **disablePadding**: Remove default padding

## Using Internal Components
Always use design system components in stories:
```tsx
// Good
import { Button, Flex } from '@your-design-system';

<Flex direction="column" gap="md">
  <YourComponent {...args} />
  <Button text="Action" onClick={() => {}} />
</Flex>

// Bad - avoid native HTML
<div className="flex-container">
  <button>Action</button>
</div>
```

## Testing Checklist
- [ ] Test component rendering
- [ ] Verify default props
- [ ] Check accessibility attributes
- [ ] Test user interactions
- [ ] Verify state changes
- [ ] Test keyboard navigation
- [ ] Test edge cases
