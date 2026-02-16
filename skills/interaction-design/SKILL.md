---
name: interaction-design
description: UI interaction patterns for modals, forms, loading states, error handling, and notifications. Use when implementing modals, forms, loading states, error handling UX, or notification patterns in React components.
globs: "**/*.tsx,**/*.jsx"
---

# Interaction Design Patterns

Apply these patterns for consistent, accessible user interactions.

Detailed code implementations are in the reference directory:

- [reference/modals.md](reference/modals.md) - Modal, confirmation dialog, drawer, and dropdown implementations
- [reference/forms.md](reference/forms.md) - Form field hook, submit button states, multi-step stepper
- [reference/loading-states.md](reference/loading-states.md) - Skeleton loader, button loading, optimistic updates
- [reference/error-handling.md](reference/error-handling.md) - Inline errors, page errors, empty states, retry patterns
- [reference/notifications.md](reference/notifications.md) - Toast implementation, success with undo

---

## Modal/Dialog Patterns

### Requirements

- Focus trap - Tab cycles within modal only
- Escape key closes modal
- Click outside (backdrop) closes modal
- Focus restoration - Return focus to trigger element
- `aria-modal="true"` and `role="dialog"`
- Accessible close button with aria-label
- Prevent body scroll while open
- Render via `createPortal` into `document.body`

### Confirmation Dialog Guidelines

- Use `role="alertdialog"` for confirmations
- Focus Cancel button by default for destructive actions
- Make consequences clear in description
- Use destructive styling for dangerous actions

### Drawer/Side Panel

Same accessibility requirements as modals. Use `<aside>` element with backdrop overlay. Support `position` prop for left/right placement.

### Dropdown Menu Keyboard Support

| Key | Action |
|-----|--------|
| Enter / Space | Open menu, select item |
| Arrow Down / Up | Navigate items |
| Home / End | Jump to first / last item |
| Escape | Close menu |
| Type character | Jump to matching item |

Use `aria-haspopup="menu"` and `aria-expanded` on trigger. Use `role="menu"` on list, `role="menuitem"` on items. Manage `tabIndex` with roving focus (active = 0, others = -1).

Full implementations: [reference/modals.md](reference/modals.md)

---

## Form UX Patterns

### Validation Timing

| Event | Validate |
|-------|----------|
| Initial render | Never show errors |
| On change (while typing) | Only if already has error (clear as user fixes) |
| On blur | Required fields, format validation |
| On submit | All fields |

### Submit Button States

```tsx
type SubmitState = 'idle' | 'validating' | 'submitting' | 'success' | 'error';
```

- Disable button when `!isValid`, `submitting`, or `validating`
- Show spinner with `aria-busy` during submission
- Change label text to indicate progress

### Multi-Step Form Guidelines

- Show progress clearly with a stepper (`aria-label="Form progress"`)
- Allow going back to previous steps
- Save drafts between steps when possible
- Validate each step before proceeding

Full implementations: [reference/forms.md](reference/forms.md)

---

## Loading States

### When to Use Each Pattern

| Pattern | Use When |
|---------|----------|
| Skeleton | Content structure is known |
| Spinner | Content structure is unknown |
| Progress bar | Operation has known progress |
| Inline loading | Small component update |

### Accessibility Rules

- `aria-busy="true"` on loading containers
- `aria-label="Loading"` for skeleton placeholders
- `aria-live="polite"` for dynamic loading messages
- Disable buttons during loading with `disabled` + `aria-busy`

### Optimistic Updates

Apply updates immediately in the UI, rollback on failure. With React Query:

```tsx
const { mutate } = useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['items'] });
    const previousItems = queryClient.getQueryData(['items']);
    queryClient.setQueryData(['items'], (old) => [...old, newItem]);
    return { previousItems };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['items'], context.previousItems);
  },
});
```

Full implementations: [reference/loading-states.md](reference/loading-states.md)

---

## Error States

### Error Display Hierarchy

| Error Type | Pattern | ARIA Role |
|------------|---------|-----------|
| Field validation | Inline below input | `role="alert"` on error span |
| Form submission | Banner above form | `role="alert"` |
| Page-level | Full page error | `role="alert"` |
| Empty state | Centered illustration | `role="status"` |

### Accessibility Rules

- `aria-invalid` on inputs with errors
- `aria-describedby` linking input to error message
- Error messages use `role="alert"` for screen reader announcement
- Empty states use `role="status"` and provide actionable guidance

### Retry Patterns

- Automatic: React Query `retry: 3` with exponential backoff
- Manual: "Try again" button with clear error message

Full implementations: [reference/error-handling.md](reference/error-handling.md)

---

## Toast Notifications

### Types and Timing

| Type | Duration | Dismissible |
|------|----------|-------------|
| Success | 5s auto | Optional |
| Error | Persistent | Required |
| Warning | 8s auto | Optional |
| Info | 5s auto | Optional |

### Key Rules

- `aria-live="polite"` on the toast container
- Error toasts use `role="alert"`; others use `role="status"`
- All toasts must have a dismiss button with `aria-label="Dismiss notification"`
- For undoable actions, show countdown timer with undo button

Full implementations: [reference/notifications.md](reference/notifications.md)

---

## Checklist

- [ ] Modals trap focus and restore focus on close
- [ ] Forms validate on appropriate events (blur, submit)
- [ ] Loading states are accessible (aria-busy, aria-live)
- [ ] Errors are clearly communicated with role="alert"
- [ ] Success feedback is provided after actions
- [ ] Destructive actions require confirmation
- [ ] Toasts auto-dismiss appropriately or are dismissible
- [ ] Empty states guide users to take action
- [ ] Dropdowns support full keyboard navigation
- [ ] All interactive elements work with Enter/Space
